"""
Metrica Sports Tracking & Event Data Loader and Spatiotemporal Synchronizer.
Converts raw tracking CSV files into structured, metric-scaled, velocity-enriched data structures.
Optimized for sub-millisecond querying via row-bounded reads and in-memory sequence caching.
"""

import os
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from app.core.pitch import metrica_to_metric, compute_velocity, compute_kinematics, PITCH_DIMS


def load_metrica_events(events_path: str) -> pd.DataFrame:
    """
    Loads Metrica raw events CSV.
    """
    if not os.path.exists(events_path):
        raise FileNotFoundError(f"Events file not found at: {events_path}")

    df = pd.read_csv(events_path)
    if "Start X" in df.columns and "Start Y" in df.columns:
        sx_m, sy_m = metrica_to_metric(df["Start X"].values, df["Start Y"].values)
        df["Start X [m]"] = sx_m
        df["Start Y [m]"] = sy_m
    if "End X" in df.columns and "End Y" in df.columns:
        ex_m, ey_m = metrica_to_metric(df["End X"].values, df["End Y"].values)
        df["End X [m]"] = ex_m
        df["End Y [m]"] = ey_m

    return df


def _parse_metrica_tracking_header(tracking_path: str, team_prefix: str) -> Tuple[List[str], Dict[str, Tuple[str, str]]]:
    """
    Reads the 3-row header of a Metrica tracking file.
    """
    header_df = pd.read_csv(tracking_path, nrows=3, header=None)
    n_cols = header_df.shape[1]
    columns = ["Period", "Frame", "Time [s]"]
    player_map: Dict[str, Tuple[str, str]] = {}

    for i in range(3, n_cols, 2):
        r1 = str(header_df.iloc[1, i]).strip()
        r2 = str(header_df.iloc[2, i]).strip()
        if "ball" in r2.lower() or "ball" in r1.lower():
            col_x, col_y = "Ball_x", "Ball_y"
            columns.extend([col_x, col_y])
            player_map["Ball"] = (col_x, col_y)
        else:
            jersey = r1 if r1 != "nan" and r1 != "" else r2.replace("Player", "").strip()
            entity_id = f"{team_prefix}_{jersey}"
            col_x = f"{entity_id}_x"
            col_y = f"{entity_id}_y"
            columns.extend([col_x, col_y])
            player_map[entity_id] = (col_x, col_y)

    return columns, player_map


def load_metrica_tracking_slice(
    tracking_path: str,
    team_name: str,
    start_frame: int,
    end_frame: int,
    fps: float = 25.0
) -> Tuple[pd.DataFrame, Dict[str, Tuple[str, str]]]:
    """
    Loads a specific frame range from a Metrica tracking CSV using row-bounded fast parsing.
    """
    columns, player_map = _parse_metrica_tracking_header(tracking_path, team_name)

    buffer = 50
    skip_start = max(0, start_frame - buffer)

    if skip_start > 10:
        rows_to_skip = range(3, 3 + skip_start)
        nrows_to_read = (end_frame - start_frame) + (2 * buffer) + 50
        df = pd.read_csv(
            tracking_path,
            skiprows=rows_to_skip,
            header=None,
            names=columns,
            nrows=nrows_to_read
        )
    else:
        nrows_to_read = end_frame + buffer + 50
        df = pd.read_csv(
            tracking_path,
            skiprows=3,
            header=None,
            names=columns,
            nrows=nrows_to_read
        )

    # Ensure Frame column is numeric
    df["Frame"] = pd.to_numeric(df["Frame"], errors="coerce")
    mask = (df["Frame"] >= start_frame) & (df["Frame"] <= end_frame)
    slice_df = df[mask].copy().reset_index(drop=True)

    if slice_df.empty and skip_start > 10:
        # Robust fallback: read full file if row-bounded skip missed non-consecutive frames
        full_df = pd.read_csv(tracking_path, skiprows=3, header=None, names=columns)
        full_df["Frame"] = pd.to_numeric(full_df["Frame"], errors="coerce")
        mask = (full_df["Frame"] >= start_frame) & (full_df["Frame"] <= end_frame)
        slice_df = full_df[mask].copy().reset_index(drop=True)

    # Convert coordinates to metric meters [0, 105] x [0, 68]
    for entity_id, (col_x, col_y) in player_map.items():
        if col_x in slice_df.columns and col_y in slice_df.columns:
            slice_df[col_x] = pd.to_numeric(slice_df[col_x], errors="coerce")
            slice_df[col_y] = pd.to_numeric(slice_df[col_y], errors="coerce")
            xm, ym = metrica_to_metric(slice_df[col_x].values, slice_df[col_y].values)
            slice_df[f"{col_x}_m"] = xm
            slice_df[f"{col_y}_m"] = ym

            if not np.all(np.isnan(xm)):
                x_clean = pd.Series(xm).ffill().bfill().values
                y_clean = pd.Series(ym).ffill().bfill().values
                vx, vy, spd, ax, ay, acc = compute_kinematics(x_clean, y_clean, fps=fps)
                slice_df[f"{entity_id}_vx"] = vx
                slice_df[f"{entity_id}_vy"] = vy
                slice_df[f"{entity_id}_speed"] = spd
                slice_df[f"{entity_id}_ax"] = ax
                slice_df[f"{entity_id}_ay"] = ay
                slice_df[f"{entity_id}_accel"] = acc

    return slice_df, player_map


class MatchDataManager:
    """
    Manages loading, caching, and serving synchronized match tracking sequences.
    Supports multiple matches (e.g. metrica_game_1, metrica_game_2).
    """

    def __init__(self, data_dir: str, match_id: str = "metrica_game_1"):
        self.data_dir = data_dir
        self.match_id = match_id
        game_num = "2" if "2" in match_id else "1"
        self.events_path = os.path.join(data_dir, f"Sample_Game_{game_num}_RawEventsData.csv")
        self.home_tracking_path = os.path.join(data_dir, f"Sample_Game_{game_num}_RawTrackingData_Home_Team.csv")
        self.away_tracking_path = os.path.join(data_dir, f"Sample_Game_{game_num}_RawTrackingData_Away_Team.csv")

        self._events_df: Optional[pd.DataFrame] = None
        self._curated_sequences: Optional[List[Dict[str, Any]]] = None
        self._tracking_cache: Dict[Tuple[int, int, float], Dict[str, Any]] = {}

    @property
    def events(self) -> pd.DataFrame:
        if self._events_df is None:
            self._events_df = load_metrica_events(self.events_path)
        return self._events_df

    def get_curated_sequences(self) -> List[Dict[str, Any]]:
        if self._curated_sequences is not None:
            return self._curated_sequences

        if "2" in self.match_id:
            self._curated_sequences = [
                {
                    "sequence_id": "seq_g2_goal_home",
                    "title": "Game 2 — Goal 1: Home Central Cutback & Box Strike",
                    "match_id": "metrica_game_2",
                    "period": 1,
                    "start_frame": 12150,
                    "end_frame": 12250,
                    "start_time_s": 486.0,
                    "end_time_s": 490.0,
                    "duration_s": 4.0,
                    "attacking_team": "Home",
                    "defending_team": "Away",
                    "key_events": ["PASS (P5 -> P10)", "SHOT / GOAL (P10)"],
                    "tactical_theme": "Central cutback penetration into the penalty arc",
                    "decision_frames": [12180, 12200]
                },
                {
                    "sequence_id": "seq_g2_goal_away",
                    "title": "Game 2 — Goal 2: Away Counter-Attack & Overload Penetration",
                    "match_id": "metrica_game_2",
                    "period": 1,
                    "start_frame": 52980,
                    "end_frame": 53090,
                    "start_time_s": 2119.2,
                    "end_time_s": 2123.6,
                    "duration_s": 4.4,
                    "attacking_team": "Away",
                    "defending_team": "Home",
                    "key_events": ["RECOVERY", "PASS", "SHOT / GOAL (P24)"],
                    "tactical_theme": "Rapid transition exploiting high defensive line with diagonal run",
                    "decision_frames": [53010, 53040]
                },
                {
                    "sequence_id": "seq_g2_buildup_away",
                    "title": "Game 2 — Away Build-Up & Wing Combination",
                    "match_id": "metrica_game_2",
                    "period": 1,
                    "start_frame": 18450,
                    "end_frame": 18550,
                    "start_time_s": 738.0,
                    "end_time_s": 742.0,
                    "duration_s": 4.0,
                    "attacking_team": "Away",
                    "defending_team": "Home",
                    "key_events": ["PASS", "PASS", "BLOCKED SHOT"],
                    "tactical_theme": "Wide progression against organized mid-block",
                    "decision_frames": [18480, 18510]
                },
                {
                    "sequence_id": "seq_g2_header_home",
                    "title": "Game 2 — Second Half Direct Transition & Header Goal",
                    "match_id": "metrica_game_2",
                    "period": 2,
                    "start_frame": 73920,
                    "end_frame": 74020,
                    "start_time_s": 2956.8,
                    "end_time_s": 2960.8,
                    "duration_s": 4.0,
                    "attacking_team": "Home",
                    "defending_team": "Away",
                    "key_events": ["CROSS", "HEAD-ON TARGET-GOAL (P9)"],
                    "tactical_theme": "Cross into far post attacking vacated defensive gap",
                    "decision_frames": [73950, 73980]
                }
            ]
            return self._curated_sequences

        self._curated_sequences = [
            {
                "sequence_id": "seq_goal_1",
                "title": "Goal Sequence 1 — Vertical Penetration & Box Finishing",
                "match_id": "metrica_game_1",
                "period": 1,
                "start_frame": 2180,
                "end_frame": 2320,
                "start_time_s": 87.2,
                "end_time_s": 92.8,
                "duration_s": 5.6,
                "attacking_team": "Home",
                "defending_team": "Away",
                "key_events": ["PASS (P6 -> P10)", "PASS (P10 -> P9)", "SHOT / GOAL (P9)"],
                "tactical_theme": "Space creation via vertical run and decoy movement opening central lane",
                "decision_frames": [2235, 2260, 2289]
            },
            {
                "sequence_id": "seq_pressing_turnover",
                "title": "Counter-Pressing & High Midfield Duel",
                "match_id": "metrica_game_1",
                "period": 1,
                "start_frame": 360,
                "end_frame": 510,
                "start_time_s": 14.4,
                "end_time_s": 20.4,
                "duration_s": 6.0,
                "attacking_team": "Away",
                "defending_team": "Home",
                "key_events": ["BALL LOST", "RECOVERY", "INTERCEPTION"],
                "tactical_theme": "High pressing trap, cover shadow restriction and forced ball loss",
                "decision_frames": [378, 420, 452]
            },
            {
                "sequence_id": "seq_buildup_break",
                "title": "Build-up Under Defensive Block & Switch",
                "match_id": "metrica_game_1",
                "period": 1,
                "start_frame": 850,
                "end_frame": 1050,
                "start_time_s": 34.0,
                "end_time_s": 42.0,
                "duration_s": 8.0,
                "attacking_team": "Away",
                "defending_team": "Home",
                "key_events": ["PASS", "PASS", "PASS"],
                "tactical_theme": "Compact defensive low block, half-space overload, switch of play",
                "decision_frames": [880, 930, 990]
            },
            {
                "sequence_id": "seq_transitional_counter",
                "title": "Rapid Defensive Transition & Line-Breaking Run",
                "match_id": "metrica_game_1",
                "period": 1,
                "start_frame": 1110,
                "end_frame": 1260,
                "start_time_s": 44.4,
                "end_time_s": 50.4,
                "duration_s": 6.0,
                "attacking_team": "Home",
                "defending_team": "Away",
                "key_events": ["RECOVERY", "PASS", "TRANSITION"],
                "tactical_theme": "Off-ball blindside run dragging central defender out of position",
                "decision_frames": [1134, 1170, 1220]
            }
        ]
        return self._curated_sequences

    def get_sequence_tracking(
        self,
        start_frame: int,
        end_frame: int,
        fps: float = 25.0
    ) -> Dict[str, Any]:
        """
        Loads and synchronizes Home, Away, and Ball tracking with in-memory caching.
        """
        cache_key = (start_frame, end_frame, fps)
        if cache_key in self._tracking_cache:
            return self._tracking_cache[cache_key]

        home_df, home_map = load_metrica_tracking_slice(
            self.home_tracking_path, "Home", start_frame, end_frame, fps=fps
        )
        away_df, away_map = load_metrica_tracking_slice(
            self.away_tracking_path, "Away", start_frame, end_frame, fps=fps
        )

        frames_data = []
        frames_list = home_df["Frame"].values
        cumulative_distances: Dict[str, float] = {}
        last_positions: Dict[str, Tuple[float, float]] = {}

        for idx, frame_id in enumerate(frames_list):
            h_row = home_df.iloc[idx]
            a_matches = away_df[away_df["Frame"] == frame_id]
            if a_matches.empty:
                continue
            a_row = a_matches.iloc[0]

            time_s = float(h_row["Time [s]"])

            bx = h_row.get("Ball_x_m", np.nan)
            by = h_row.get("Ball_y_m", np.nan)
            bvx = h_row.get("Ball_vx", 0.0)
            bvy = h_row.get("Ball_vy", 0.0)

            home_players = []
            for entity_id, (col_x, col_y) in home_map.items():
                if entity_id == "Ball":
                    continue
                px = h_row.get(f"{col_x}_m", np.nan)
                py = h_row.get(f"{col_y}_m", np.nan)
                if pd.notna(px) and pd.notna(py):
                    # Update cumulative distance
                    fx, fy = float(px), float(py)
                    if entity_id in last_positions:
                        lx, ly = last_positions[entity_id]
                        step_d = float(np.hypot(fx - lx, fy - ly))
                        if step_d < 1.0: # filter teleports
                            cumulative_distances[entity_id] = cumulative_distances.get(entity_id, 0.0) + step_d
                    else:
                        cumulative_distances[entity_id] = 0.0
                    last_positions[entity_id] = (fx, fy)

                    pvx = float(h_row.get(f"{entity_id}_vx", 0.0))
                    pvy = float(h_row.get(f"{entity_id}_vy", 0.0))
                    pspd = float(h_row.get(f"{entity_id}_speed", 0.0))
                    pacc = float(h_row.get(f"{entity_id}_accel", 0.0))
                    jersey = entity_id.split("_")[-1]
                    home_players.append({
                        "player_id": entity_id,
                        "jersey_number": jersey,
                        "team": "Home",
                        "x": round(fx, 2),
                        "y": round(fy, 2),
                        "vx": round(pvx, 2),
                        "vy": round(pvy, 2),
                        "speed": round(pspd, 2),
                        "acceleration": round(pacc, 2),
                        "cumulative_distance_m": round(cumulative_distances[entity_id], 1)
                    })

            away_players = []
            for entity_id, (col_x, col_y) in away_map.items():
                if entity_id == "Ball":
                    continue
                px = a_row.get(f"{col_x}_m", np.nan)
                py = a_row.get(f"{col_y}_m", np.nan)
                if pd.notna(px) and pd.notna(py):
                    fx, fy = float(px), float(py)
                    if entity_id in last_positions:
                        lx, ly = last_positions[entity_id]
                        step_d = float(np.hypot(fx - lx, fy - ly))
                        if step_d < 1.0:
                            cumulative_distances[entity_id] = cumulative_distances.get(entity_id, 0.0) + step_d
                    else:
                        cumulative_distances[entity_id] = 0.0
                    last_positions[entity_id] = (fx, fy)

                    pvx = float(a_row.get(f"{entity_id}_vx", 0.0))
                    pvy = float(a_row.get(f"{entity_id}_vy", 0.0))
                    pspd = float(a_row.get(f"{entity_id}_speed", 0.0))
                    pacc = float(a_row.get(f"{entity_id}_accel", 0.0))
                    jersey = entity_id.split("_")[-1]
                    away_players.append({
                        "player_id": entity_id,
                        "jersey_number": jersey,
                        "team": "Away",
                        "x": round(fx, 2),
                        "y": round(fy, 2),
                        "vx": round(pvx, 2),
                        "vy": round(pvy, 2),
                        "speed": round(pspd, 2),
                        "acceleration": round(pacc, 2),
                        "cumulative_distance_m": round(cumulative_distances[entity_id], 1)
                    })

            frames_data.append({
                "frame": int(frame_id),
                "time_s": round(time_s, 2),
                "ball": {
                    "x": round(float(bx), 2) if pd.notna(bx) else None,
                    "y": round(float(by), 2) if pd.notna(by) else None,
                    "vx": round(float(bvx), 2) if pd.notna(bvx) else 0.0,
                    "vy": round(float(bvy), 2) if pd.notna(bvy) else 0.0,
                },
                "home_players": home_players,
                "away_players": away_players
            })

        events_df = self.events
        mask_ev = (events_df["Start Frame"] >= start_frame - 25) & (events_df["End Frame"] <= end_frame + 25)
        ev_slice = events_df[mask_ev].copy()
        events_list = []
        for _, ev_row in ev_slice.iterrows():
            events_list.append({
                "team": str(ev_row["Team"]),
                "type": str(ev_row["Type"]),
                "subtype": str(ev_row["Subtype"]) if pd.notna(ev_row["Subtype"]) else None,
                "start_frame": int(ev_row["Start Frame"]),
                "end_frame": int(ev_row["End Frame"]),
                "from_player": str(ev_row["From"]) if pd.notna(ev_row["From"]) else None,
                "to_player": str(ev_row["To"]) if pd.notna(ev_row["To"]) else None,
                "start_x_m": round(float(ev_row["Start X [m]"]), 2) if pd.notna(ev_row.get("Start X [m]")) else None,
                "start_y_m": round(float(ev_row["Start Y [m]"]), 2) if pd.notna(ev_row.get("Start Y [m]")) else None,
            })

        result = {
            "start_frame": start_frame,
            "end_frame": end_frame,
            "total_frames": len(frames_data),
            "fps": fps,
            "pitch_dimensions": {
                "length": PITCH_DIMS.length,
                "width": PITCH_DIMS.width
            },
            "events": events_list,
            "frames": frames_data
        }

        self._tracking_cache[cache_key] = result
        return result


_DATA_MANAGERS_REGISTRY: Dict[str, MatchDataManager] = {}


def get_match_data_manager(data_dir: str, match_id: str = "metrica_game_1") -> MatchDataManager:
    """
    Returns or instantiates a singleton MatchDataManager for the requested match_id.
    """
    key = f"{data_dir}_{match_id}"
    if key not in _DATA_MANAGERS_REGISTRY:
        _DATA_MANAGERS_REGISTRY[key] = MatchDataManager(data_dir, match_id=match_id)
    return _DATA_MANAGERS_REGISTRY[key]

