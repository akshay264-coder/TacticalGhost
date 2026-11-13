"""
Module 4: Player Interaction Analysis.
Evaluates passing lane viability, passing network graphs, dyadic spatial synergy,
and third-man combination structures.

Formulas & Analytical Methodology:
1. Passing Lane Viability (0.0 to 1.0):
   Viability = ReceiverPitchControl * (1 - InterceptionRisk) * (1 - 0.7 * CoverShadowBlocked) * DistanceFactor
   Where:
   - ReceiverPitchControl: Evaluated at receiver coordinate using Spearman model.
   - InterceptionRisk: Minimum distance of any defender to the passing segment,
     weighted by defender arrival time vs ball travel time.
   - CoverShadowBlocked: 1.0 if inside defender cover shadow cone, 0.0 otherwise.
   - DistanceFactor: Optimum around 12m - 28m, decays above 38m.
2. Triadic Synergy (Third-Man Support):
   Evaluates support triangles formed by (Carrier, Support Teammate, Third-Man Runner).
   Optimal angles between 30° and 75° avoid flat square passes and linear interception traps.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import networkx as nx
from app.core.pitch import PITCH_DIMS
from app.core.pitch_control import PitchControlEngine
from app.modules.pressing import PressingIntelligenceAnalyzer


@dataclass
class PassingOption:
    receiver_id: str
    jersey_number: str
    receiver_pos: Tuple[float, float]
    distance_m: float
    angle_deg: float
    receiver_pitch_control: float
    interception_risk: float
    is_in_cover_shadow: bool
    viability_score: float
    tactical_category: str  # 'progressive_break', 'support_retention', 'switch_play', 'risky_pocket'
    explanation: str


class PlayerInteractionAnalyzer:
    """
    Computes passing lane viability, passing networks, and triadic support structures.
    """

    def __init__(
        self,
        pitch_control_engine: Optional[PitchControlEngine] = None,
        pressing_analyzer: Optional[PressingIntelligenceAnalyzer] = None,
        ball_speed: float = 14.0
    ):
        self.pc_engine = pitch_control_engine or PitchControlEngine()
        self.press_analyzer = pressing_analyzer or PressingIntelligenceAnalyzer()
        self.ball_speed = ball_speed

    def evaluate_passing_options(
        self,
        carrier: Dict[str, Any],
        teammates: List[Dict[str, Any]],
        defenders: List[Dict[str, Any]],
        attacking_goal_x: float = 105.0
    ) -> List[Dict[str, Any]]:
        """
        Evaluates all passing lanes from the ball carrier to outfield teammates.
        """
        cx, cy = carrier["x"], carrier["y"]
        ball_pos = (cx, cy)

        # Compute cover shadows from defenders
        shadows = self.press_analyzer.compute_cover_shadows(ball_pos, defenders, teammates)
        blocked_ids = set()
        for sh in shadows:
            for bid in sh.get("blocked_teammates", []):
                blocked_ids.add(bid)

        options: List[Dict[str, Any]] = []

        for tm in teammates:
            if tm["player_id"] == carrier["player_id"]:
                continue

            tx, ty = tm["x"], tm["y"]
            dx = tx - cx
            dy = ty - cy
            dist = np.hypot(dx, dy)

            if dist < 3.0 or dist > 55.0:
                continue  # Out of realistic passing range

            angle_rad = np.arctan2(dy, dx)
            angle_deg = float(np.degrees(angle_rad))

            # 1. Receiver pitch control
            rc_eval = self.pc_engine.evaluate_location_control(
                target_x=tx,
                target_y=ty,
                attacking_players=[carrier] + teammates,
                defending_players=defenders
            )
            rec_pc = rc_eval["attacking_prob"]

            # 2. Interception risk along passing segment
            interception_risk, closest_def_dist = self._compute_lane_interception_risk(
                (cx, cy), (tx, ty), defenders
            )

            # 3. Cover shadow status
            in_shadow = tm["player_id"] in blocked_ids

            # 4. Distance factor (sweet spot: 10m - 32m)
            if dist <= 28.0:
                dist_factor = 1.0
            else:
                dist_factor = max(0.2, 1.0 - ((dist - 28.0) / 27.0))

            # Viability score formula
            shadow_penalty = 0.50 if in_shadow else 0.0
            viability = rec_pc * (1.0 - interception_risk) * (1.0 - shadow_penalty) * dist_factor
            viability = float(np.clip(viability, 0.0, 1.0))

            # Forward progression check
            forward_progression = (tx - cx) if attacking_goal_x == 105.0 else (cx - tx)
            lateral_spread = abs(ty - cy)

            if forward_progression > 10.0 and viability > 0.55:
                cat = "progressive_break"
            elif forward_progression > 8.0 and viability <= 0.55:
                cat = "risky_pocket"
            elif lateral_spread > 22.0:
                cat = "switch_play"
            elif forward_progression < 0.0:
                cat = "backward_reset"
            else:
                cat = "support_retention"

            jersey = tm.get("jersey_number", tm["player_id"].split("_")[-1])

            explanation = (
                f"Lane to Player {jersey}: viability {viability:.2f}, distance {dist:.1f}m. "
                f"Receiver pitch control: {rec_pc:.2f}, intercept risk: {interception_risk:.2f}. "
            )
            if in_shadow:
                explanation += "Option is inside an active opponent cover shadow."

            options.append({
                "receiver_id": tm["player_id"],
                "jersey_number": jersey,
                "receiver_pos": {"x": round(tx, 2), "y": round(ty, 2)},
                "distance_m": round(dist, 1),
                "angle_deg": round(angle_deg, 1),
                "forward_progression_m": round(forward_progression, 1),
                "receiver_pitch_control": round(rec_pc, 2),
                "interception_risk": round(interception_risk, 2),
                "is_in_cover_shadow": in_shadow,
                "viability_score": round(viability, 3),
                "tactical_category": cat,
                "explanation": explanation
            })

        options.sort(key=lambda x: x["viability_score"], reverse=True)
        return options

    def _compute_lane_interception_risk(
        self,
        p_carrier: Tuple[float, float],
        p_receiver: Tuple[float, float],
        defenders: List[Dict[str, Any]]
    ) -> Tuple[float, float]:
        """
        Computes the probability of pass interception by calculating the perpendicular distance
        of each defender to the passing corridor and comparing arrival times.
        """
        cx, cy = p_carrier
        rx, ry = p_receiver

        pass_vec = np.array([rx - cx, ry - cy])
        pass_len = np.linalg.norm(pass_vec)
        if pass_len < 1e-4:
            return 1.0, 0.0

        u = pass_vec / pass_len
        ball_time = pass_len / self.ball_speed

        max_risk = 0.0
        min_dist_to_segment = 99.0

        for d in defenders:
            dx = d["x"]
            dy = d["y"]
            d_pos = np.array([dx, cy])

            # Projection of defender onto pass segment
            to_d = np.array([dx - cx, dy - cy])
            proj = np.dot(to_d, u)

            # Only consider defenders located between carrier and receiver
            if 0.5 <= proj <= pass_len - 0.5:
                # Perpendicular point on segment
                perp_point = np.array([cx, cy]) + proj * u
                dist_to_line = np.linalg.norm(np.array([dx, dy]) - perp_point)
                min_dist_to_segment = min(min_dist_to_segment, dist_to_line)

                # Defender arrival time to that point
                def_tti = self.pc_engine.compute_point_time_to_intercept(
                    dx, dy, d.get("vx", 0.0), d.get("vy", 0.0), perp_point[0], perp_point[1]
                )
                ball_arrive_time = proj / self.ball_speed

                # If defender can intercept before or at ball arrival
                if def_tti <= ball_arrive_time + 0.35:
                    risk = max(0.0, 1.0 - (dist_to_line / 4.0))
                else:
                    risk = max(0.0, 1.0 - (dist_to_line / 2.5)) * 0.5

                if risk > max_risk:
                    max_risk = risk

        return float(np.clip(max_risk, 0.0, 1.0)), float(min_dist_to_segment)

    def build_passing_synergy_network(
        self,
        players: List[Dict[str, Any]],
        defenders: List[Dict[str, Any]],
        team_name: str = "Home"
    ) -> Dict[str, Any]:
        """
        Builds a NetworkX graph of passing viability among all teammates for the frame.
        Identifies passing triangles and network density.
        """
        G = nx.DiGraph()
        for p in players:
            G.add_node(p["player_id"], jersey=p.get("jersey_number", ""), pos=(p["x"], p["y"]))

        edges = []
        for p1 in players:
            opts = self.evaluate_passing_options(p1, players, defenders)
            for opt in opts:
                if opt["viability_score"] >= 0.40:
                    G.add_edge(
                        p1["player_id"],
                        opt["receiver_id"],
                        weight=opt["viability_score"],
                        distance=opt["distance_m"]
                    )
                    edges.append({
                        "from": p1["player_id"],
                        "to": opt["receiver_id"],
                        "weight": opt["viability_score"],
                        "category": opt["tactical_category"]
                    })

        density = nx.density(G) if len(G.nodes) > 1 else 0.0

        return {
            "team": team_name,
            "nodes_count": len(G.nodes),
            "viable_lanes_count": len(edges),
            "network_density": round(float(density), 3),
            "viable_edges": edges
        }
