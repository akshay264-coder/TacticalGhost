"""
Pitch Control Intelligence Engine.
Based on spatiotemporal potential fields and time-to-intercept (TTI) models:
- Spearman (2018): "Beyond Expected Goals", MIT Sloan Sports Analytics Conference
- Fernandez & Bornn (2018): "Wide Open Spaces: A synthetic approach to player tracking data"

Key concepts:
1. Time-to-Intercept (TTI):
   Considers player reaction time (T_react), current momentum, and maximum sprint velocity.
2. Spearman Logistic Surface:
   Calculates probability of controlling any (x, y) pitch cell as a logistic function
   of arrival time difference between attacking and defending teams:
   P_home(x, y) = 1 / (1 + exp((t_home_min - t_away_min) / time_variance))
   P_away(x, y) = 1 - P_home(x, y)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np


@dataclass
class PitchControlConfig:
    reaction_time: float = 0.5        # Reaction delay in seconds before turning
    max_player_speed: float = 7.5     # Maximum sprint speed in m/s
    ball_speed: float = 14.0          # Average ground pass speed in m/s
    time_variance: float = 0.45       # Arrival time variance scale (Spearman sigma)


class PitchControlEngine:
    """
    Computes continuous pitch control probability fields and point-wise control queries.
    """

    def __init__(self, config: Optional[PitchControlConfig] = None):
        self.cfg = config or PitchControlConfig()

    def compute_player_tti_grid(
        self,
        player_x: float,
        player_y: float,
        vx: float,
        vy: float,
        gx: np.ndarray,
        gy: np.ndarray
    ) -> np.ndarray:
        """
        Vectorized Time-to-Intercept for a single player over a 2D grid.
        rx = p_x + vx * T_react
        ry = p_y + vy * T_react
        dist = sqrt((gx - rx)^2 + (gy - ry)^2)
        tti = T_react + dist / max_speed
        """
        rx = player_x + vx * self.cfg.reaction_time
        ry = player_y + vy * self.cfg.reaction_time
        dist = np.hypot(gx - rx, gy - ry)
        return self.cfg.reaction_time + (dist / self.cfg.max_player_speed)

    def calculate_pitch_control_surface(
        self,
        home_players: List[Dict[str, float]],
        away_players: List[Dict[str, float]],
        ball_pos: Optional[Dict[str, float]] = None,
        grid_cells_x: int = 50,
        grid_cells_y: int = 32,
        pitch_length: float = 105.0,
        pitch_width: float = 68.0
    ) -> Dict[str, object]:
        """
        Calculates pitch control probability grid for the entire pitch using Spearman TTI formulation.
        
        Returns:
        - x_coords: 1D array of x coordinates
        - y_coords: 1D array of y coordinates
        - pitch_control_home: 2D array [ny, nx] of Home control probability [0.0, 1.0]
        - pitch_control_away: 2D array [ny, nx] of Away control probability [0.0, 1.0]
        - home_controlled_area_m2: total pitch surface area (m²) controlled by Home
        - away_controlled_area_m2: total pitch surface area (m²) controlled by Away
        - home_pitch_control_pct: percentage of pitch controlled by Home (0-100%)
        - away_pitch_control_pct: percentage of pitch controlled by Away (0-100%)
        """
        x_lin = np.linspace(0.0, pitch_length, grid_cells_x)
        y_lin = np.linspace(0.0, pitch_width, grid_cells_y)
        gx, gy = np.meshgrid(x_lin, y_lin)

        if not home_players:
            pc_home = np.zeros_like(gx)
            pc_away = np.ones_like(gx)
        elif not away_players:
            pc_home = np.ones_like(gx)
            pc_away = np.zeros_like(gx)
        else:
            # Stack TTIs for all home players: shape [N_home, ny, nx]
            home_ttis = np.stack([
                self.compute_player_tti_grid(
                    p["x"], p["y"], p.get("vx", 0.0), p.get("vy", 0.0), gx, gy
                ) for p in home_players
            ], axis=0)
            min_home_tti = np.min(home_ttis, axis=0)

            # Stack TTIs for away players: shape [N_away, ny, nx]
            away_ttis = np.stack([
                self.compute_player_tti_grid(
                    p["x"], p["y"], p.get("vx", 0.0), p.get("vy", 0.0), gx, gy
                ) for p in away_players
            ], axis=0)
            min_away_tti = np.min(away_ttis, axis=0)

            # Spearman logistic model: difference in arrival times
            time_diff = (min_away_tti - min_home_tti) / self.cfg.time_variance
            # Numerical stability clip
            time_diff_clipped = np.clip(time_diff, -20.0, 20.0)
            pc_home = 1.0 / (1.0 + np.exp(-time_diff_clipped))
            pc_away = 1.0 - pc_home

        pitch_area = pitch_length * pitch_width
        home_area = float(np.mean(pc_home) * pitch_area)
        away_area = float(np.mean(pc_away) * pitch_area)

        return {
            "x_coords": x_lin.tolist(),
            "y_coords": y_lin.tolist(),
            "pitch_control_home": [[round(float(val), 3) for val in row] for row in pc_home],
            "pitch_control_away": [[round(float(val), 3) for val in row] for row in pc_away],
            "home_controlled_area_m2": round(home_area, 1),
            "away_controlled_area_m2": round(away_area, 1),
            "home_pitch_control_pct": round(float(np.mean(pc_home)) * 100.0, 1),
            "away_pitch_control_pct": round(float(np.mean(pc_away)) * 100.0, 1)
        }

    def compute_point_time_to_intercept(
        self,
        player_x: float,
        player_y: float,
        vx: float,
        vy: float,
        target_x: float,
        target_y: float
    ) -> float:
        """
        Calculates time required for a player to reach target point (target_x, target_y).
        Formula:
        r = p + v * T_react
        dist = || target - r ||
        tti = T_react + dist / max_player_speed
        """
        rx = player_x + vx * self.cfg.reaction_time
        ry = player_y + vy * self.cfg.reaction_time
        dist = np.hypot(target_x - rx, target_y - ry)
        tti = self.cfg.reaction_time + (dist / self.cfg.max_player_speed)
        return float(tti)

    def evaluate_location_control(
        self,
        target_x: float,
        target_y: float,
        attacking_players: List[Dict[str, float]],
        defending_players: List[Dict[str, float]]
    ) -> Dict[str, float]:
        """
        Evaluates control probability at a specific target location using Spearman TTI logistic formulation.
        """
        if not attacking_players or not defending_players:
            return {"attacking_prob": 0.5, "defending_prob": 0.5, "t_att_min": 0.0, "t_def_min": 0.0}

        att_ttis = [
            self.compute_point_time_to_intercept(
                p["x"], p["y"], p.get("vx", 0.0), p.get("vy", 0.0), target_x, target_y
            ) for p in attacking_players
        ]
        def_ttis = [
            self.compute_point_time_to_intercept(
                p["x"], p["y"], p.get("vx", 0.0), p.get("vy", 0.0), target_x, target_y
            ) for p in defending_players
        ]

        min_att = min(att_ttis)
        min_def = min(def_ttis)

        margin = (min_def - min_att) / self.cfg.time_variance
        margin_clipped = np.clip(margin, -15.0, 15.0)
        p_att = 1.0 / (1.0 + np.exp(-margin_clipped))

        return {
            "attacking_prob": float(p_att),
            "defending_prob": float(1.0 - p_att),
            "t_att_min": round(min_att, 2),
            "t_def_min": round(min_def, 2),
            "arrival_advantage_sec": round(min_def - min_att, 2)
        }
