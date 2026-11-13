"""
Module 1: Space Creation Intelligence.
Analyzes off-ball player movements, space generation, decoy runs, and pitch control differentials.

Formulas & Analytical Methodology:
1. Off-Ball Movement Identification:
   - Evaluates non-ball carriers (distance to ball > 3.5m).
   - Identifies active runs where sustained speed >= 3.5 m/s or acceleration >= 1.5 m/s² over >= 0.5s.
2. Space Occupied vs Space Opened:
   - Space Occupied: Pitch control area surrounding the runner's destination.
   - Space Opened: Area previously defended that becomes vacated due to marker tracking/dragging.
3. Decoy Run Score (0.0 to 1.0):
   DecoyScore = min(1.0, 0.40 * MarkerTrackingIndex + 0.35 * TeammateSpaceGain + 0.25 * StrategicZoneWeight)
   - MarkerTrackingIndex: Correlation between runner velocity and nearest defender velocity vector.
   - TeammateSpaceGain: Change in teammate pitch control in the vacated corridor.
   - StrategicZoneWeight: Proximity of vacated space to Zone 14 / Half-spaces / Penalty Box.

Documented Assumptions:
- Tactical state is estimated from tracking kinematics and relative spatial trajectories.
- Coordinate analysis does not claim psychological intention; it quantifies observed spatial consequences.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from app.core.pitch import PITCH_DIMS, get_tactical_zones
from app.core.pitch_control import PitchControlEngine, PitchControlConfig


@dataclass
class OffBallRun:
    player_id: str
    jersey_number: str
    team: str
    start_frame: int
    end_frame: int
    duration_s: float
    start_pos: Tuple[float, float]
    end_pos: Tuple[float, float]
    avg_speed: float
    peak_speed: float
    distance_covered: float
    run_type: str  # 'penetration', 'overlap_underlap', 'channel_pull', 'blindside'
    space_created_m2: float
    decoy_score: float
    primary_dragged_defender: Optional[str]
    explanation: str


class SpaceCreationAnalyzer:
    """
    Detects and quantifies off-ball space creation, runs, and decoy effects.
    """

    def __init__(self, pitch_control_engine: Optional[PitchControlEngine] = None):
        self.pc_engine = pitch_control_engine or PitchControlEngine()
        self.zones = get_tactical_zones()

    def identify_off_ball_runs(
        self,
        frames: List[Dict[str, Any]],
        attacking_team: str = "Home",
        min_run_duration_frames: int = 10,  # 0.4 seconds at 25 fps
        min_speed_threshold: float = 3.5    # m/s
    ) -> List[Dict[str, Any]]:
        """
        Scans a sequence of frames to identify all off-ball runs made by attacking team players.
        Returns a list of detected off-ball runs with metrics and tactical explanations.
        """
        if len(frames) < min_run_duration_frames:
            return []

        runs_detected: List[Dict[str, Any]] = []

        # Extract player IDs from first frame
        first_frame = frames[0]
        att_key = "home_players" if attacking_team == "Home" else "away_players"
        def_key = "away_players" if attacking_team == "Home" else "home_players"

        players_list = [p["player_id"] for p in first_frame.get(att_key, [])]

        for pid in players_list:
            in_run = False
            run_start_idx = 0
            speeds: List[float] = []

            for idx, f in enumerate(frames):
                # Check player position
                p_match = next((p for p in f[att_key] if p["player_id"] == pid), None)
                if not p_match:
                    if in_run and (idx - run_start_idx >= min_run_duration_frames):
                        run_info = self._compile_run(
                            frames, pid, run_start_idx, idx - 1, att_key, def_key
                        )
                        if run_info:
                            runs_detected.append(run_info)
                    in_run = False
                    continue

                ball = f.get("ball", {})
                ball_x = ball.get("x")
                ball_y = ball.get("y")

                # Distance to ball: must be off-ball (> 3.5m)
                is_off_ball = True
                if ball_x is not None and ball_y is not None:
                    dist_to_ball = np.hypot(p_match["x"] - ball_x, p_match["y"] - ball_y)
                    if dist_to_ball < 3.5:
                        is_off_ball = False

                speed = p_match.get("speed", 0.0)
                is_fast = speed >= min_speed_threshold

                if is_off_ball and is_fast:
                    if not in_run:
                        in_run = True
                        run_start_idx = idx
                        speeds = [speed]
                    else:
                        speeds.append(speed)
                else:
                    if in_run:
                        if idx - run_start_idx >= min_run_duration_frames:
                            run_info = self._compile_run(
                                frames, pid, run_start_idx, idx - 1, att_key, def_key
                            )
                            if run_info:
                                runs_detected.append(run_info)
                        in_run = False
                        speeds = []

            # Handle run active until final frame
            if in_run and (len(frames) - run_start_idx >= min_run_duration_frames):
                run_info = self._compile_run(
                    frames, pid, run_start_idx, len(frames) - 1, att_key, def_key
                )
                if run_info:
                    runs_detected.append(run_info)

        return runs_detected

    def _compile_run(
        self,
        frames: List[Dict[str, Any]],
        player_id: str,
        start_idx: int,
        end_idx: int,
        att_key: str,
        def_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Compiles run statistics, dragged defender analysis, and space created.
        """
        start_frame_data = frames[start_idx]
        end_frame_data = frames[end_idx]

        p_start = next((p for p in start_frame_data[att_key] if p["player_id"] == player_id), None)
        p_end = next((p for p in end_frame_data[att_key] if p["player_id"] == player_id), None)

        if not p_start or not p_end:
            return None

        sx, sy = p_start["x"], p_start["y"]
        ex, ey = p_end["x"], p_end["y"]
        dx, dy = ex - sx, ey - sy
        dist_covered = np.hypot(dx, dy)

        if dist_covered < 4.0:
            return None  # Negligible net movement

        duration_s = round((end_frame_data["frame"] - start_frame_data["frame"]) / 25.0, 2)
        if duration_s <= 0.0:
            return None

        avg_speed = round(dist_covered / duration_s, 2)

        # Classify run direction and type
        run_type = self._classify_run_type(sx, sy, ex, ey, att_key == "home_players")

        # Analyze marker response (dragged defender)
        dragged_def, tracking_index = self._find_dragged_defender(
            frames, start_idx, end_idx, player_id, att_key, def_key
        )

        # Calculate space created/opened in vacated region
        space_created_m2, space_gain = self._calculate_vacated_space_gain(
            sx, sy, frames[start_idx], frames[end_idx], att_key, def_key
        )

        # Strategic zone weighting
        zone_weight = self._evaluate_zone_danger(sx, sy, ex, ey)

        # Decoy score calculation (Formula documented in module header)
        decoy_score = round(
            min(1.0, 0.40 * tracking_index + 0.35 * space_gain + 0.25 * zone_weight), 2
        )

        jersey = player_id.split("_")[-1]
        team_name = "Home" if att_key == "home_players" else "Away"

        explanation = (
            f"Player {jersey} ({team_name}) executed a {run_type.replace('_', ' ')} covering "
            f"{dist_covered:.1f}m at {avg_speed:.1f} m/s. "
        )
        if dragged_def:
            def_jersey = dragged_def.split("_")[-1]
            explanation += (
                f"Successfully dragged defender {def_jersey} (tracking index: {tracking_index:.2f}), "
                f"opening {space_created_m2:.1f}m² of playable space in the vacated channel."
            )
        else:
            explanation += (
                f"Made an untracked movement into attacking space, opening {space_created_m2:.1f}m² "
                f"without drawing immediate man-marking."
            )

        return {
            "run_id": f"run_{player_id}_{start_frame_data['frame']}_{end_frame_data['frame']}",
            "player_id": player_id,
            "jersey_number": jersey,
            "team": team_name,
            "start_frame": start_frame_data["frame"],
            "end_frame": end_frame_data["frame"],
            "duration_s": duration_s,
            "start_position": {"x": round(sx, 2), "y": round(sy, 2)},
            "end_position": {"x": round(ex, 2), "y": round(ey, 2)},
            "distance_m": round(dist_covered, 2),
            "avg_speed_mps": avg_speed,
            "run_type": run_type,
            "dragged_defender_id": dragged_def,
            "marker_tracking_index": round(tracking_index, 2),
            "space_created_m2": round(space_created_m2, 1),
            "decoy_score": decoy_score,
            "explanation": explanation
        }

    def _classify_run_type(
        self,
        sx: float,
        sy: float,
        ex: float,
        ey: float,
        attacks_right: bool
    ) -> str:
        """
        Classifies the tactical nature of the run based on trajectory and pitch geometry.
        """
        dx = ex - sx
        dy = ey - sy

        forward_progress = dx if attacks_right else -dx
        lateral_abs = abs(dy)

        if forward_progress > 6.0 and lateral_abs < 4.0:
            return "vertical_penetration"
        elif forward_progress > 4.0 and lateral_abs >= 4.0:
            return "diagonal_blindside"
        elif forward_progress < 2.0 and lateral_abs > 5.0:
            return "channel_pull"
        elif forward_progress > 2.0 and (ey > 45.0 or ey < 23.0):
            return "wide_overlap"
        else:
            return "support_run"

    def _find_dragged_defender(
        self,
        frames: List[Dict[str, Any]],
        start_idx: int,
        end_idx: int,
        runner_id: str,
        att_key: str,
        def_key: str
    ) -> Tuple[Optional[str], float]:
        """
        Identifies if an opponent defender tracked the runner's movement.
        Formula:
        Computes velocity correlation and proximity between runner and defenders over run window.
        """
        runner_start = next((p for p in frames[start_idx][att_key] if p["player_id"] == runner_id), None)
        runner_end = next((p for p in frames[end_idx][att_key] if p["player_id"] == runner_id), None)
        if not runner_start or not runner_end:
            return None, 0.0

        r_vec = np.array([runner_end["x"] - runner_start["x"], runner_end["y"] - runner_start["y"]])
        r_norm = np.linalg.norm(r_vec)
        if r_norm < 1e-4:
            return None, 0.0

        defenders = frames[start_idx][def_key]
        best_def = None
        best_score = 0.0

        for d in defenders:
            d_id = d["player_id"]
            d_end = next((p for p in frames[end_idx][def_key] if p["player_id"] == d_id), None)
            if not d_end:
                continue

            # Initial distance between runner and defender
            init_dist = np.hypot(d["x"] - runner_start["x"], d["y"] - runner_start["y"])
            if init_dist > 9.0:
                continue  # Too far to be marking

            d_vec = np.array([d_end["x"] - d["x"], d_end["y"] - d["y"]])
            d_norm = np.linalg.norm(d_vec)
            if d_norm < 1.5:
                continue  # Defender remained stationary

            # Directional alignment: cosine similarity
            cos_sim = np.dot(r_vec, d_vec) / (r_norm * d_norm)
            if cos_sim <= 0.3:
                continue  # Moving in opposite/perpendicular directions

            # Proximity factor: closer initial marking gives higher confidence
            prox_weight = max(0.0, 1.0 - (init_dist / 9.0))
            tracking_score = float(cos_sim * 0.6 + prox_weight * 0.4)

            if tracking_score > best_score:
                best_score = tracking_score
                best_def = d_id

        return best_def, best_score

    def _calculate_vacated_space_gain(
        self,
        orig_x: float,
        orig_y: float,
        start_frame: Dict[str, Any],
        end_frame: Dict[str, Any],
        att_key: str,
        def_key: str
    ) -> Tuple[float, float]:
        """
        Calculates teammate pitch control change in a 6-meter radius around the runner's original location.
        """
        # Local evaluation in vacated circle
        sample_x = np.linspace(max(0.0, orig_x - 5.0), min(PITCH_DIMS.length, orig_x + 5.0), 5)
        sample_y = np.linspace(max(0.0, orig_y - 5.0), min(PITCH_DIMS.width, orig_y + 5.0), 5)

        start_att_ctrls = []
        end_att_ctrls = []

        for px in sample_x:
            for py in sample_y:
                c_start = self.pc_engine.evaluate_location_control(
                    px, py, start_frame[att_key], start_frame[def_key]
                )
                c_end = self.pc_engine.evaluate_location_control(
                    px, py, end_frame[att_key], end_frame[def_key]
                )
                start_att_ctrls.append(c_start["attacking_prob"])
                end_att_ctrls.append(c_end["attacking_prob"])

        avg_start = float(np.mean(start_att_ctrls))
        avg_end = float(np.mean(end_att_ctrls))
        gain = max(0.0, avg_end - avg_start)

        # Estimated area vacated (circle of radius ~5m = ~78m² scaled by gain)
        vacated_area = float(np.pi * (5.0**2) * min(1.0, avg_end))
        return vacated_area, gain

    def _evaluate_zone_danger(self, sx: float, sy: float, ex: float, ey: float) -> float:
        """
        Weights space creation higher if it impacts high-value tactical regions (Zone 14, Half-spaces, Box).
        """
        mid_x = (sx + ex) / 2.0
        mid_y = (sy + ey) / 2.0

        # Zone 14 attacking right: [70.0, 88.5] x [20.4, 47.6]
        if (70.0 <= mid_x <= 88.5) and (20.4 <= mid_y <= 47.6):
            return 1.0
        # Attacking box: x > 88.5
        elif mid_x > 88.5 and (13.84 <= mid_y <= 54.16):
            return 0.95
        # Attacking half-spaces: [52.5, 88.5]
        elif (52.5 <= mid_x <= 88.5) and ((13.6 <= mid_y <= 27.2) or (40.8 <= mid_y <= 54.4)):
            return 0.85
        # Attacking half
        elif mid_x > 52.5:
            return 0.60
        else:
            return 0.30
