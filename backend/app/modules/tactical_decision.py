"""
Module 5: Tactical Decision Intelligence.
Evaluates alternative player decisions at key timestamps using explainable
Expected Threat (xT), Pitch Control gain, and execution risk.

Formulas & Analytical Methodology:
1. Expected Threat Grid (xT):
   A spatial grid quantifying the probability of an attacking action culminating in a goal
   based on distance to goal, central shot angle, and defensive zone weighting:
   xT(x, y) = 0.01 + 0.18 * (x / 105)^2.5 + 0.12 * (1 - |y - 34| / 34) * (x / 105)
2. Execution Success Probability (P_success):
   - For passes: Passing lane viability score V_lane.
   - For carries: Proximity and closing speed of nearest defender along carry path.
   - For shots: Clear shooting angle to goal mouth minus defender block probability.
3. Tactical Expected Value (TEV):
   TEV = P_success * Delta_xT - (1 - P_success) * TurnoverPenalty
   Where:
   - Delta_xT = xT(destination) - xT(origin)
   - TurnoverPenalty = 0.08 * (origin_x / 105.0)  (Losing ball higher up pitch has transition risk)
4. Explainable Categorisation:
   Distinguishes observed action vs hypothetical counterfactual alternatives with objective trade-offs.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from app.core.pitch import PITCH_DIMS
from app.core.pitch_control import PitchControlEngine
from app.modules.pressing import PressingIntelligenceAnalyzer
from app.modules.player_interactions import PlayerInteractionAnalyzer


@dataclass
class ActionAlternative:
    action_type: str  # 'PASS', 'CARRY', 'SHOT'
    target_player_id: Optional[str]
    target_jersey: Optional[str]
    destination: Tuple[float, float]
    is_actual_decision: bool
    execution_success_prob: float
    xt_gain: float
    pitch_control_gain: float
    tactical_expected_value: float
    risk_level: str  # 'Low', 'Moderate', 'High'
    recommendation_tier: str  # 'Optimal', 'Viable Alternative', 'Actual Observed', 'Suboptimal'
    explanation: str


class TacticalDecisionIntelligenceEngine:
    """
    Simulates and ranks realistic tactical alternatives available to the ball carrier.
    """

    def __init__(
        self,
        pitch_control_engine: Optional[PitchControlEngine] = None,
        interaction_analyzer: Optional[PlayerInteractionAnalyzer] = None
    ):
        self.pc_engine = pitch_control_engine or PitchControlEngine()
        self.interaction_analyzer = interaction_analyzer or PlayerInteractionAnalyzer(
            pitch_control_engine=self.pc_engine
        )

    def calculate_xt(self, x: float, y: float, attacks_right: bool = True) -> float:
        """
        Computes Expected Threat (xT) potential for any pitch coordinate.
        Range [0.01, 0.35]. Highest in central zone directly in front of goal.
        """
        # Normalise forward progress towards goal (0 to 1)
        rel_x = (x / PITCH_DIMS.length) if attacks_right else ((PITCH_DIMS.length - x) / PITCH_DIMS.length)
        rel_x = np.clip(rel_x, 0.0, 1.0)

        # Centrality (0 at touchlines, 1 at center line y=34)
        rel_y_dist = abs(y - 34.0) / 34.0
        centrality = np.clip(1.0 - rel_y_dist, 0.0, 1.0)

        # Non-linear scaling: threat increases exponentially inside attacking 35 meters
        base_threat = 0.01 + 0.18 * (rel_x ** 2.4)
        central_bonus = 0.14 * (rel_x ** 1.8) * centrality

        return float(np.clip(base_threat + central_bonus, 0.01, 0.40))

    def evaluate_decision_frame(
        self,
        frame_data: Dict[str, Any],
        actual_event: Optional[Dict[str, Any]] = None,
        attacking_team: str = "Home",
        attacking_goal_x: float = 105.0
    ) -> Dict[str, Any]:
        """
        Analyzes the ball carrier's options at a decision moment and evaluates realistic alternatives.
        """
        att_key = "home_players" if attacking_team == "Home" else "away_players"
        def_key = "away_players" if attacking_team == "Home" else "home_players"

        attackers = frame_data.get(att_key, [])
        defenders = frame_data.get(def_key, [])
        ball = frame_data.get("ball", {})

        bx = ball.get("x")
        by = ball.get("y")

        if bx is None or by is None or not attackers:
            return {
                "frame": frame_data.get("frame", 0),
                "time_s": frame_data.get("time_s", 0.0),
                "ball_carrier": None,
                "total_options_evaluated": 0,
                "alternatives": [],
                "message": "Ball coordinates unavailable or no active players in frame."
            }

        # Find ball carrier (nearest attacker to ball)
        carrier = min(attackers, key=lambda p: np.hypot(p["x"] - bx, p["y"] - by))
        carrier_dist = np.hypot(carrier["x"] - bx, carrier["y"] - by)

        cx, cy = carrier["x"], carrier["y"]
        origin_xt = self.calculate_xt(cx, cy, attacks_right=(attacking_goal_x == 105.0))

        # Check observed action if provided in event
        observed_target_id = None
        if actual_event and actual_event.get("to_player"):
            # Map event to player ID format
            to_raw = str(actual_event["to_player"]).replace("Player", "").strip()
            observed_target_id = f"{attacking_team}_{to_raw}"

        alternatives: List[Dict[str, Any]] = []

        # 1. Evaluate All Passing Options
        passing_options = self.interaction_analyzer.evaluate_passing_options(
            carrier=carrier,
            teammates=attackers,
            defenders=defenders,
            attacking_goal_x=attacking_goal_x
        )

        for opt in passing_options:
            dest_x = opt["receiver_pos"]["x"]
            dest_y = opt["receiver_pos"]["y"]
            dest_xt = self.calculate_xt(dest_x, dest_y, attacks_right=(attacking_goal_x == 105.0))
            xt_gain = dest_xt - origin_xt

            p_success = opt["viability_score"]
            turnover_penalty = 0.08 * (dest_x / PITCH_DIMS.length if attacking_goal_x == 105.0 else (PITCH_DIMS.length - dest_x) / PITCH_DIMS.length)

            tev = p_success * xt_gain - (1.0 - p_success) * turnover_penalty
            pc_gain = opt["receiver_pitch_control"] - 0.5

            is_actual = (opt["receiver_id"] == observed_target_id)

            # Categorize risk
            if p_success >= 0.70:
                risk = "Low Risk"
            elif p_success >= 0.45:
                risk = "Moderate Risk"
            else:
                risk = "High Risk"

            explanation = (
                f"Pass to Player {opt['jersey_number']}: Viability {p_success:.2f}, "
                f"xT gain: {xt_gain:+.3f}, TEV: {tev:+.3f}. "
                f"{'Selected as actual match action.' if is_actual else 'Viable counterfactual option.'}"
            )

            alternatives.append({
                "action_type": "PASS",
                "target_player_id": opt["receiver_id"],
                "target_jersey": opt["jersey_number"],
                "destination": {"x": dest_x, "y": dest_y},
                "is_actual_decision": is_actual,
                "execution_success_prob": round(p_success, 3),
                "xt_gain": round(xt_gain, 4),
                "pitch_control_gain": round(pc_gain, 3),
                "tactical_expected_value": round(tev, 4),
                "risk_level": risk,
                "recommendation_tier": "Actual Observed" if is_actual else ("High Value Alternative" if tev > 0.03 else "Secondary Option"),
                "explanation": explanation
            })

        # 2. Evaluate Carry Forward Option
        carry_dir = 1.0 if attacking_goal_x == 105.0 else -1.0
        carry_x = np.clip(cx + carry_dir * 8.0, 0.0, PITCH_DIMS.length)
        carry_y = cy

        # Safety of carry: distance to nearest defender along path
        min_def_ahead = min([
            np.hypot(d["x"] - carry_x, d["y"] - carry_y) for d in defenders
        ]) if defenders else 15.0

        carry_safety = float(np.clip((min_def_ahead - 2.0) / 6.0, 0.1, 0.95))
        carry_xt = self.calculate_xt(carry_x, carry_y, attacks_right=(attacking_goal_x == 105.0))
        carry_xt_gain = carry_xt - origin_xt
        carry_tev = carry_safety * carry_xt_gain - (1.0 - carry_safety) * 0.05

        alternatives.append({
            "action_type": "CARRY",
            "target_player_id": None,
            "target_jersey": carrier.get("jersey_number"),
            "destination": {"x": round(carry_x, 2), "y": round(carry_y, 2)},
            "is_actual_decision": False,
            "execution_success_prob": round(carry_safety, 3),
            "xt_gain": round(carry_xt_gain, 4),
            "pitch_control_gain": 0.05,
            "tactical_expected_value": round(carry_tev, 4),
            "risk_level": "Low Risk" if carry_safety > 0.65 else "Moderate Risk",
            "recommendation_tier": "High Value Alternative" if carry_tev > 0.02 else "Secondary Option",
            "explanation": f"Drive into open space ahead: {min_def_ahead:.1f}m buffer before defender challenge."
        })

        # 3. Evaluate Shot on Goal (if within 28m of attacking goal)
        dist_to_goal = np.hypot(attacking_goal_x - cx, 34.0 - cy)
        if dist_to_goal <= 28.0:
            # Shot model based on distance and angle
            shot_prob = float(np.clip(0.40 * np.exp(-dist_to_goal / 14.0), 0.03, 0.35))
            shot_xt_gain = 0.30  # High reward
            shot_tev = shot_prob * 1.0 - (1.0 - shot_prob) * 0.05
            is_actual_shot = actual_event and "SHOT" in str(actual_event.get("type", "")).upper()

            alternatives.append({
                "action_type": "SHOT",
                "target_player_id": None,
                "target_jersey": None,
                "destination": {"x": attacking_goal_x, "y": 34.0},
                "is_actual_decision": bool(is_actual_shot),
                "execution_success_prob": round(shot_prob, 3),
                "xt_gain": round(shot_xt_gain, 4),
                "pitch_control_gain": 0.0,
                "tactical_expected_value": round(shot_tev, 4),
                "risk_level": "Direct Attempt",
                "recommendation_tier": "Actual Observed" if is_actual_shot else "High Value Alternative",
                "explanation": f"Direct shot from {dist_to_goal:.1f}m. Estimated conversion probability: {shot_prob*100:.1f}%."
            })

        # Sort alternatives by tactical expected value
        alternatives.sort(key=lambda x: x["tactical_expected_value"], reverse=True)

        # Mark top alternative as 'Optimal Choice'
        if alternatives and not alternatives[0]["is_actual_decision"]:
            alternatives[0]["recommendation_tier"] = "Optimal Alternative"

        carrier_jersey = carrier.get("jersey_number", carrier["player_id"].split("_")[-1])

        return {
            "frame": frame_data["frame"],
            "time_s": frame_data.get("time_s"),
            "ball_carrier": {
                "player_id": carrier["player_id"],
                "jersey_number": carrier_jersey,
                "team": attacking_team,
                "position": {"x": round(cx, 2), "y": round(cy, 2)},
                "current_xt": round(origin_xt, 4)
            },
            "total_options_evaluated": len(alternatives),
            "alternatives": alternatives
        }
