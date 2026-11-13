"""
Module 3: Pressing Intelligence.
Evaluates dynamic pressing intensity, closing vectors, time-to-contact,
cover shadows, passing lane restrictions, and pressing coordination.

Formulas & Analytical Methodology:
1. Dynamic Pressure Model (Strict adherence to Rules 7 & 9):
   - Closing Velocity:
     v_closing = (v_def . (p_carrier - p_def)) / ||p_carrier - p_def||
   - Time-to-Contact (TTC):
     TTC = distance / max(v_closing, 0.8)
   - Dynamic Pressure Score (0.0 to 1.0):
     PressureScore = DistanceDecay * (0.4 + 0.6 * ClosingRatio)
     Where DistanceDecay = exp(-distance / 4.5)
2. Geometric Cover Shadow:
   - A pressing defender obstructs a angular sector behind them from the perspective of the ball.
   - Angular half-span: theta = arctan(EffectiveWidth / distance)
   - Any teammate located within [angle - theta, angle + theta] is in the cover shadow.
3. Coordinated Pressing Trap:
   - Total Team Pressure = 1 - product(1 - p_i) for all active pressers within 9.0m.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np


@dataclass
class CoverShadow:
    defender_id: str
    jersey_number: str
    distance_to_ball_m: float
    center_angle_deg: float
    angular_width_deg: float
    blocked_teammate_ids: List[str]


class PressingIntelligenceAnalyzer:
    """
    Computes dynamic pressing scores, cover shadows, and coordinated pressing traps.
    """

    def __init__(
        self,
        max_press_distance: float = 9.0,
        effective_block_radius: float = 1.8,
        max_sprint_speed: float = 7.5
    ):
        self.max_press_distance = max_press_distance
        self.effective_block_radius = effective_block_radius
        self.max_sprint_speed = max_sprint_speed

    def evaluate_pressure_on_carrier(
        self,
        carrier_pos: Tuple[float, float],
        defending_players: List[Dict[str, Any]],
        carrier_velocity: Optional[Tuple[float, float]] = None
    ) -> Dict[str, Any]:
        """
        Evaluates multi-faceted pressure exerted on the ball carrier.
        
        Returns:
        - total_pressure_score: float in [0.0, 1.0]
        - primary_presser_id: Optional[str]
        - primary_closing_speed_mps: float
        - time_to_contact_s: float
        - is_coordinated_trap: bool (>= 2 players exerting pressure)
        - pressers_detail: List of individual pressing contributions
        """
        cx, cy = carrier_pos
        pressers_detail = []

        for d in defending_players:
            dx = d["x"]
            dy = d["y"]
            dist = np.hypot(dx - cx, dy - cy)

            if dist > self.max_press_distance:
                continue

            dvx = d.get("vx", 0.0)
            dvy = d.get("vy", 0.0)

            # Vector from defender towards carrier
            to_carrier_x = cx - dx
            to_carrier_y = cy - dy
            norm_to_c = dist if dist > 1e-4 else 1e-4
            dir_x = to_carrier_x / norm_to_c
            dir_y = to_carrier_y / norm_to_c

            # Closing speed: component of defender velocity along line to carrier
            closing_speed = dvx * dir_x + dvy * dir_y
            closing_ratio = np.clip(closing_speed / self.max_sprint_speed, 0.0, 1.0)

            # Time to contact
            effective_speed = max(closing_speed, 1.0)
            ttc = dist / effective_speed

            # Distance decay: exponential decay over 4.5 meters
            distance_factor = float(np.exp(-dist / 3.8))

            # Dynamic pressure score: combines distance, closing momentum, and speed
            # If defender is running AWAY (closing_speed < 0), pressure drops significantly
            if closing_speed < -0.5:
                direction_multiplier = 0.25
            else:
                direction_multiplier = 0.40 + 0.60 * closing_ratio

            individual_pressure = float(distance_factor * direction_multiplier)
            individual_pressure = min(1.0, max(0.0, individual_pressure))

            jersey = d.get("jersey_number", d["player_id"].split("_")[-1])

            pressers_detail.append({
                "defender_id": d["player_id"],
                "jersey_number": jersey,
                "distance_m": round(dist, 2),
                "closing_speed_mps": round(closing_speed, 2),
                "time_to_contact_s": round(ttc, 2),
                "pressure_score": round(individual_pressure, 3)
            })

        # Sort pressers by pressure score
        pressers_detail.sort(key=lambda x: x["pressure_score"], reverse=True)

        if not pressers_detail:
            return {
                "total_pressure_score": 0.0,
                "primary_presser_id": None,
                "primary_closing_speed_mps": 0.0,
                "time_to_contact_s": 99.0,
                "is_coordinated_trap": False,
                "pressers_count": 0,
                "pressers_detail": []
            }

        # Multi-agent combined pressure formulation:
        # P_total = 1 - prod(1 - P_i)
        unpressured_prob = 1.0
        for p in pressers_detail:
            unpressured_prob *= (1.0 - p["pressure_score"])
        total_pressure = min(1.0, max(0.0, 1.0 - unpressured_prob))

        primary = pressers_detail[0]
        # Coordinated trap if at least 2 pressers have pressure score >= 0.25
        active_trappers = [p for p in pressers_detail if p["pressure_score"] >= 0.25]
        is_trap = len(active_trappers) >= 2

        return {
            "total_pressure_score": round(total_pressure, 3),
            "primary_presser_id": primary["defender_id"],
            "primary_closing_speed_mps": primary["closing_speed_mps"],
            "time_to_contact_s": primary["time_to_contact_s"],
            "is_coordinated_trap": is_trap,
            "pressers_count": len(pressers_detail),
            "pressers_detail": pressers_detail
        }

    def compute_cover_shadows(
        self,
        ball_pos: Tuple[float, float],
        defending_players: List[Dict[str, Any]],
        teammate_options: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Computes geometric cover shadow cones cast by pressing defenders between the ball and teammate receivers.
        
        Formula:
        For a defender at (dx, dy) relative to ball (bx, by):
        angle = arctan2(dy - by, dx - bx)
        half_angle = arctan(effective_block_radius / dist)
        Shadow covers [angle - half_angle, angle + half_angle]
        """
        bx, by = ball_pos
        shadows = []

        for d in defending_players:
            dx = d["x"]
            dy = d["y"]
            dist = np.hypot(dx - bx, dy - by)

            # Only defenders close enough cast an active cover shadow (<= 14.0m)
            if dist > 14.0 or dist < 0.5:
                continue

            center_angle = np.arctan2(dy - by, dx - bx)
            half_angle = np.arctan(self.effective_block_radius / dist)

            blocked_teammates = []
            for t in teammate_options:
                tx = t["x"]
                ty = t["y"]
                t_dist = np.hypot(tx - bx, ty - by)

                # Teammate must be further from the ball than the defender to be in shadow
                if t_dist <= dist:
                    continue

                t_angle = np.arctan2(ty - by, tx - bx)
                # Angle difference normalized to [-pi, pi]
                angle_diff = np.arctan2(np.sin(t_angle - center_angle), np.cos(t_angle - center_angle))

                if abs(angle_diff) <= half_angle:
                    blocked_teammates.append(t["player_id"])

            jersey = d.get("jersey_number", d["player_id"].split("_")[-1])
            shadows.append({
                "defender_id": d["player_id"],
                "jersey_number": jersey,
                "distance_to_ball_m": round(dist, 2),
                "center_angle_deg": round(float(np.degrees(center_angle)), 1),
                "angular_width_deg": round(float(np.degrees(2 * half_angle)), 1),
                "blocked_teammates": blocked_teammates,
                "is_active_block": len(blocked_teammates) > 0
            })

        return shadows

    def analyze_pressing_frame(
        self,
        frame: Dict[str, Any],
        attacking_team: str,
        defending_team: str
    ) -> Dict[str, Any]:
        """
        Convenience evaluator for a complete tracking frame.
        """
        def_key = "home_players" if defending_team == "Home" else "away_players"
        att_key = "away_players" if defending_team == "Home" else "home_players"
        ball = frame.get("ball", {})
        bx = ball.get("x")
        by = ball.get("y")

        def_players = frame.get(def_key, [])
        att_players = frame.get(att_key, [])

        if bx is None or by is None or not att_players or not def_players:
            return {
                "ball_carrier": None,
                "pressure": {
                    "total_pressure_score": 0.0,
                    "primary_presser_id": None,
                    "primary_closing_speed_mps": 0.0,
                    "time_to_contact_s": 99.0,
                    "is_coordinated_trap": False,
                    "pressers_count": 0,
                    "pressers_detail": []
                },
                "cover_shadows": []
            }

        carrier = min(att_players, key=lambda p: np.hypot(p["x"] - bx, p["y"] - by))
        pressure = self.evaluate_pressure_on_carrier(
            carrier_pos=(carrier["x"], carrier["y"]),
            defending_players=def_players
        )
        shadows = self.compute_cover_shadows(
            ball_pos=(bx, by),
            defending_players=def_players,
            teammate_options=att_players
        )
        return {
            "ball_carrier": {
                "player_id": carrier["player_id"],
                "jersey_number": carrier.get("jersey_number"),
                "position": {"x": carrier["x"], "y": carrier["y"]}
            },
            "pressure": pressure,
            "cover_shadows": shadows
        }
