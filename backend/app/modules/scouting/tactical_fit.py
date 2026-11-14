"""
Tactical Fit & Recruitment Suitability Engine.
Evaluates player suitability against customizable tactical philosophies with normalized weighting,
evidence traceability, missing requirement flags, and sensitivity analysis.
Avoids universal 'overall ratings' — suitability is strictly system- and role-dependent.
"""

from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from app.modules.scouting.scouting_profile import PlayerScoutingProfile, ScoutingProfileEngine


class TacticalRequirement(BaseModel):
    requirement_name: str
    target_metric: str
    ideal_threshold: float
    importance_weight: float  # [0.0, 1.0]
    description: str


class RequirementAssessment(BaseModel):
    requirement_name: str
    target_metric: str
    measured_value: float
    ideal_threshold: float
    compatibility_pct: float  # [0, 100]
    weight_applied: float
    weighted_score: float
    supporting_evidence: str
    missing_evidence_or_gap: Optional[str] = None


class SensitivityShift(BaseModel):
    tested_priority: str
    rank_delta: int  # +/- position in squad ranking
    score_delta: float
    tactical_rationale: str


class PlayerTacticalFitResult(BaseModel):
    player_id: str
    player_role: str
    tactical_philosophy_name: str
    overall_fit_score: float  # [0, 100]
    confidence_tier: str      # HIGH, MEDIUM, DEVELOPING
    data_quality_score: float
    requirement_breakdown: List[RequirementAssessment]
    executive_summary: str
    coaching_takeaway: str
    sensitivity_analysis: List[SensitivityShift]
    analytical_disclaimers: str


class TacticalFitEngine:
    """
    Evaluates player profiles against distinct team tactical philosophies.
    """

    PRESET_PHILOSOPHIES: Dict[str, Dict[str, Any]] = {
        "HIGH_PRESS_HIGH_LINE": {
            "name": "Aggressive High Press & High Defensive Line",
            "description": "Requires rapid forward closing velocity, aggressive counterpressing engagement, and high recovery speed.",
            "requirements": [
                TacticalRequirement(
                    requirement_name="Pressing Engagement",
                    target_metric="pressing_engagement_pct",
                    ideal_threshold=75.0,
                    importance_weight=0.30,
                    description="Commitment to pressing duels in the opponent third."
                ),
                TacticalRequirement(
                    requirement_name="Peak Closing Velocity",
                    target_metric="peak_closing_velocity_mps",
                    ideal_threshold=6.5,
                    importance_weight=0.25,
                    description="Ability to sprint rapidly to ball carrier within 1.5s."
                ),
                TacticalRequirement(
                    requirement_name="Post-Turnover Recovery Speed",
                    target_metric="post_turnover_recovery_speed_mps",
                    ideal_threshold=5.5,
                    importance_weight=0.25,
                    description="Sustained recovery run pace if the initial press is bypassed."
                ),
                TacticalRequirement(
                    requirement_name="Cover-Shadow Efficiency",
                    target_metric="cover_shadow_efficiency_pct",
                    ideal_threshold=70.0,
                    importance_weight=0.20,
                    description="Obstructing return passing lanes while applying pressure."
                )
            ]
        },
        "POSSESSION_BUILDUP": {
            "name": "Positional Possession & Half-Space Infiltration",
            "description": "Demands spatial intelligence, third-man support positioning, passing-lane creation, and rest-defense discipline.",
            "requirements": [
                TacticalRequirement(
                    requirement_name="Half-Space Occupation",
                    target_metric="half_space_occupation_pct",
                    ideal_threshold=45.0,
                    importance_weight=0.30,
                    description="Operating inside the vital intermediate channels."
                ),
                TacticalRequirement(
                    requirement_name="Passing Lane Creation",
                    target_metric="passing_lane_creation_count",
                    ideal_threshold=20.0,
                    importance_weight=0.25,
                    description="Continuous movement to present forward passing options."
                ),
                TacticalRequirement(
                    requirement_name="Space Creation Rating",
                    target_metric="space_creation_rating",
                    ideal_threshold=80.0,
                    importance_weight=0.25,
                    description="Displacing markers to liberate room for teammates."
                ),
                TacticalRequirement(
                    requirement_name="Rest Defense Index",
                    target_metric="defensive_rest_structure_index",
                    ideal_threshold=70.0,
                    importance_weight=0.20,
                    description="Positional discipline to prevent central counterattacks."
                )
            ]
        },
        "DIRECT_COUNTERATTACK": {
            "name": "Direct Vertical Counterattack & Transitional Surge",
            "description": "Emphasizes explosive top sprint speed, blindside runs behind defensive lines, and fast transition space occupation.",
            "requirements": [
                TacticalRequirement(
                    requirement_name="Counterattack Release Speed",
                    target_metric="counterattack_release_speed_mps",
                    ideal_threshold=6.5,
                    importance_weight=0.35,
                    description="Instant acceleration the moment possession is won."
                ),
                TacticalRequirement(
                    requirement_name="Runs Behind Defensive Line",
                    target_metric="runs_behind_line_count",
                    ideal_threshold=6.0,
                    importance_weight=0.30,
                    description="Diagonal and vertical sprints attacking vacated depth."
                ),
                TacticalRequirement(
                    requirement_name="Forward Progression",
                    target_metric="forward_progression_m",
                    ideal_threshold=40.0,
                    importance_weight=0.20,
                    description="Net positive meterage gained per sequence."
                ),
                TacticalRequirement(
                    requirement_name="Space Created",
                    target_metric="space_creation_rating",
                    ideal_threshold=75.0,
                    importance_weight=0.15,
                    description="Dragging markers during sprint surges."
                )
            ]
        },
        "COMPACT_LOW_BLOCK": {
            "name": "Compact Low-Block & Box Defense",
            "description": "Requires tight defensive line height, central space protection, and rigorous defensive coordination.",
            "requirements": [
                TacticalRequirement(
                    requirement_name="Space Protection Rating",
                    target_metric="space_protection_rating",
                    ideal_threshold=80.0,
                    importance_weight=0.35,
                    description="Denying opposition pitch control in the box."
                ),
                TacticalRequirement(
                    requirement_name="Defensive Line Coordination",
                    target_metric="defensive_line_coordination_m",
                    ideal_threshold=3.0,
                    importance_weight=0.25,
                    description="Maintaining tight depth synchronization with backline unit."
                ),
                TacticalRequirement(
                    requirement_name="Compactness Contribution",
                    target_metric="compactness_contribution_m2",
                    ideal_threshold=80.0,
                    importance_weight=0.25,
                    description="Reducing the team's defensive convex hull area."
                ),
                TacticalRequirement(
                    requirement_name="Recovery Velocity",
                    target_metric="recovery_velocity_mps",
                    ideal_threshold=5.2,
                    importance_weight=0.15,
                    description="Speed of tracking back when defensive block is breached."
                )
            ]
        }
    }

    def __init__(self, profile_engine: ScoutingProfileEngine):
        self._profile_engine = profile_engine

    def evaluate_tactical_fit(
        self,
        player_id: str,
        philosophy_key: str = "HIGH_PRESS_HIGH_LINE",
        custom_weights: Optional[Dict[str, float]] = None
    ) -> PlayerTacticalFitResult:
        """
        Evaluates a player against a specific tactical philosophy, supporting custom weights.
        """
        profile = self._profile_engine.get_player_profile(player_id)
        if not profile:
            raise ValueError(f"Player '{player_id}' not found.")

        phil_data = self.PRESET_PHILOSOPHIES.get(philosophy_key, self.PRESET_PHILOSOPHIES["HIGH_PRESS_HIGH_LINE"])
        reqs: List[TacticalRequirement] = phil_data["requirements"]

        # Normalize weights so sum == 1.0
        raw_weights: Dict[str, float] = {}
        for r in reqs:
            if custom_weights and r.requirement_name in custom_weights:
                raw_weights[r.requirement_name] = max(0.01, float(custom_weights[r.requirement_name]))
            else:
                raw_weights[r.requirement_name] = r.importance_weight

        total_w = sum(raw_weights.values())
        norm_weights = {k: v / total_w for k, v in raw_weights.items()}

        assessments: List[RequirementAssessment] = []
        overall_fit = 0.0
        missing_metric_count = 0

        for r in reqs:
            w = norm_weights[r.requirement_name]
            val, is_present = self._extract_metric_value(profile, r.target_metric)
            
            if not is_present:
                missing_metric_count += 1
                compat = 0.0
                evidence = f"Metric '{r.target_metric}' missing from empirical profile. Penalty of 0.0% applied."
                gap = f"Missing data for required metric '{r.target_metric}'. Cannot establish tactical competency."
            else:
                # For metrics where lower is better (e.g. line coordination disparity)
                if "coordination" in r.target_metric.lower():
                    compat = max(0.0, min(100.0, (1.0 - (val - r.ideal_threshold) / max(1.0, r.ideal_threshold)) * 100.0))
                else:
                    compat = min(100.0, max(0.0, (val / max(0.1, r.ideal_threshold)) * 100.0))

                # Traceable evidence & gap identification
                if compat >= 85.0:
                    evidence = f"Measured {val} exceeds the ideal threshold of {r.ideal_threshold}; strong tactical execution."
                    gap = None
                elif compat >= 65.0:
                    evidence = f"Measured {val} meets satisfactory baseline ({r.ideal_threshold} target)."
                    gap = f"Opportunity to increase output by {round(r.ideal_threshold - val, 1)} to reach elite threshold."
                else:
                    evidence = f"Measured {val} is below the tactical requirement threshold ({r.ideal_threshold})."
                    gap = f"Deficit of {round(r.ideal_threshold - val, 1)} in this operational requirement."

            weighted = round(compat * w, 2)
            overall_fit += weighted

            assessments.append(RequirementAssessment(
                requirement_name=r.requirement_name,
                target_metric=r.target_metric,
                measured_value=round(val, 2),
                ideal_threshold=r.ideal_threshold,
                compatibility_pct=round(compat, 1),
                weight_applied=round(w, 4),
                weighted_score=weighted,
                supporting_evidence=evidence,
                missing_evidence_or_gap=gap
            ))

        overall_fit = round(overall_fit, 1)

        # Sensitivity Analysis: Simulate how score changes if each requirement's weight is doubled
        sensitivity: List[SensitivityShift] = []
        for r in reqs:
            alt_weights = norm_weights.copy()
            alt_weights[r.requirement_name] *= 2.0
            sum_alt = sum(alt_weights.values())
            alt_norm = {k: v / sum_alt for k, v in alt_weights.items()}
            
            alt_score = 0.0
            for a in assessments:
                alt_score += a.compatibility_pct * alt_norm[a.requirement_name]
            
            diff = round(alt_score - overall_fit, 1)
            rank_d = 1 if diff > 1.5 else (-1 if diff < -1.5 else 0)
            
            sensitivity.append(SensitivityShift(
                tested_priority=f"Prioritize {r.requirement_name} (+100% Weight)",
                rank_delta=rank_d,
                score_delta=diff,
                tactical_rationale=f"Fit score shifts by {diff:+} points if tactical system demands elevated emphasis on {r.requirement_name}."
            ))

        if missing_metric_count > 0:
            confidence_tier = "DEVELOPING"
        elif profile.data_quality.overall_quality_score >= 95.0:
            confidence_tier = "HIGH"
        else:
            confidence_tier = "MEDIUM"

        summary = f"{player_id} achieves an explainable tactical fit score of {overall_fit}/100 within {phil_data['name']}, led by strong performance in {assessments[0].requirement_name}."
        cue = f"To maximize tactical integration, structure drills that emphasize {assessments[-1].requirement_name} where a {assessments[-1].compatibility_pct}% rating was measured."

        disclaimer = "Tactical fit ratings reflect observed behaviors within sample match datasets and do not guarantee future performance in distinct coaching systems."
        if missing_metric_count > 0:
            disclaimer += f" Warning: {missing_metric_count} required metric(s) were missing and scored at 0.0%, reducing overall fit confidence."

        return PlayerTacticalFitResult(
            player_id=player_id,
            player_role=profile.primary_role,
            tactical_philosophy_name=phil_data["name"],
            overall_fit_score=overall_fit,
            confidence_tier=confidence_tier,
            data_quality_score=profile.data_quality.overall_quality_score,
            requirement_breakdown=assessments,
            executive_summary=summary,
            coaching_takeaway=cue,
            sensitivity_analysis=sensitivity,
            analytical_disclaimers=disclaimer
        )

    def _extract_metric_value(self, profile: PlayerScoutingProfile, metric_name: str) -> Tuple[float, bool]:
        """
        Extracts a metric value from the tactical profile by name.
        Returns (value, is_present: bool).
        If the metric is missing from the empirical profile, returns (0.0, False)
        to prevent unearned score inflation from arbitrary defaults.
        """
        t = profile.tactical_profile
        for domain in [t.attacking, t.defensive, t.pressing, t.transition]:
            if hasattr(domain, metric_name):
                return float(getattr(domain, metric_name)), True
        return 0.0, False
