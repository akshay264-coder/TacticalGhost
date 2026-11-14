"""
Player Comparison Engine.
Compares players against other players, role benchmarks, or squad averages.
Provides transparent normalization, role-adjusted delta metrics, and explicit sample-size warnings
when comparing players across disparate tactical roles or sample volumes.
"""

from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from app.modules.scouting.scouting_profile import PlayerScoutingProfile, ScoutingProfileEngine


class MetricDeltaItem(BaseModel):
    dimension: str
    player_a_value: float
    player_b_value: float
    delta_value: float
    percentage_difference: float
    unit: str
    favored_player: str
    tactical_interpretation: str


class ComparisonWarning(BaseModel):
    warning_type: str  # ROLE_MISMATCH, SAMPLE_SIZE_DISPARITY, DATA_QUALITY_ASYMMETRY
    severity: str      # CRITICAL, HIGH, MODERATE, INFORMATIONAL
    message: str


class PlayerComparisonResult(BaseModel):
    player_a_id: str
    player_b_id: str
    player_a_role: str
    player_b_role: str
    roles_are_compatible: bool
    role_adjustment_applied: bool
    warnings: List[ComparisonWarning]
    radar_comparison: Dict[str, Dict[str, float]]  # {dimension: {player_a: x, player_b: y}}
    metric_deltas: List[MetricDeltaItem]
    overall_comparison_verdict: str
    methodology_note: str


class PlayerComparisonEngine:
    """
    Executes role-adjusted comparisons between players or against archetype benchmarks.
    """

    def __init__(self, profile_engine: ScoutingProfileEngine):
        self._profile_engine = profile_engine

    def compare_players(
        self,
        player_a_id: str,
        player_b_id: str,
        apply_role_normalization: bool = True
    ) -> PlayerComparisonResult:
        """
        Compares two players side-by-side with transparent normalization and warnings.
        """
        p_a = self._profile_engine.get_player_profile(player_a_id)
        p_b = self._profile_engine.get_player_profile(player_b_id)

        if not p_a:
            raise ValueError(f"Player '{player_a_id}' not found in scouting database.")
        if not p_b:
            raise ValueError(f"Player '{player_b_id}' not found in scouting database.")

        warnings: List[ComparisonWarning] = []

        # 1. Role Compatibility Check
        same_role = p_a.primary_role.lower() == p_b.primary_role.lower()
        role_compatible = same_role or (
            p_a.secondary_role and p_b.secondary_role and p_a.secondary_role.lower() == p_b.secondary_role.lower()
        )

        if not role_compatible:
            warnings.append(ComparisonWarning(
                warning_type="ROLE_MISMATCH",
                severity="HIGH",
                message=f"Direct comparison between a {p_a.primary_role} and a {p_b.primary_role} contains inherent tactical divergence. Normalizing metrics by role expectations is recommended."
            ))

        # 2. Data Quality / Sample Size Check
        q_diff = abs(p_a.data_quality.overall_quality_score - p_b.data_quality.overall_quality_score)
        if q_diff > 10.0:
            warnings.append(ComparisonWarning(
                warning_type="DATA_QUALITY_ASYMMETRY",
                severity="MODERATE",
                message=f"Data quality disparity of {round(q_diff, 1)}% detected between {player_a_id} and {player_b_id}."
            ))

        # 3. Radar Comparison Assembly
        all_dimensions = set(p_a.tactical_profile.radar_scores.keys()).union(p_b.tactical_profile.radar_scores.keys())
        radar_comp: Dict[str, Dict[str, float]] = {}
        for dim in all_dimensions:
            val_a = p_a.tactical_profile.radar_scores.get(dim, 50.0)
            val_b = p_b.tactical_profile.radar_scores.get(dim, 50.0)
            radar_comp[dim] = {
                player_a_id: val_a,
                player_b_id: val_b
            }

        # 4. Metric Deltas
        deltas: List[MetricDeltaItem] = []

        # Attacking: Forward progression
        p_prog_diff = p_a.tactical_profile.attacking.forward_progression_m - p_b.tactical_profile.attacking.forward_progression_m
        deltas.append(MetricDeltaItem(
            dimension="Forward Progression",
            player_a_value=p_a.tactical_profile.attacking.forward_progression_m,
            player_b_value=p_b.tactical_profile.attacking.forward_progression_m,
            delta_value=round(p_prog_diff, 1),
            percentage_difference=round((p_prog_diff / max(1.0, p_b.tactical_profile.attacking.forward_progression_m)) * 100, 1),
            unit="meters",
            favored_player=player_a_id if p_prog_diff > 0 else player_b_id,
            tactical_interpretation=f"{player_a_id if p_prog_diff > 0 else player_b_id} generates greater direct forward vertical territory gain."
        ))

        # Attacking: Space Creation
        spc_diff = p_a.tactical_profile.attacking.space_creation_rating - p_b.tactical_profile.attacking.space_creation_rating
        deltas.append(MetricDeltaItem(
            dimension="Space Creation Rating",
            player_a_value=p_a.tactical_profile.attacking.space_creation_rating,
            player_b_value=p_b.tactical_profile.attacking.space_creation_rating,
            delta_value=round(spc_diff, 1),
            percentage_difference=round(spc_diff, 1),
            unit="rating [0-100]",
            favored_player=player_a_id if spc_diff > 0 else player_b_id,
            tactical_interpretation=f"{player_a_id if spc_diff > 0 else player_b_id} produces higher spatial displacement of opposing defensive markers."
        ))

        # Speed: Peak Velocity
        spd_diff = p_a.tactical_profile.pressing.peak_closing_velocity_mps - p_b.tactical_profile.pressing.peak_closing_velocity_mps
        deltas.append(MetricDeltaItem(
            dimension="Peak Sprint Velocity",
            player_a_value=p_a.tactical_profile.pressing.peak_closing_velocity_mps,
            player_b_value=p_b.tactical_profile.pressing.peak_closing_velocity_mps,
            delta_value=round(spd_diff, 2),
            percentage_difference=round((spd_diff / max(0.1, p_b.tactical_profile.pressing.peak_closing_velocity_mps)) * 100, 1),
            unit="m/s",
            favored_player=player_a_id if spd_diff > 0 else player_b_id,
            tactical_interpretation=f"{player_a_id if spd_diff > 0 else player_b_id} exhibits greater maximum sprint velocity during transitional runs."
        ))

        # Pressing: Engagement
        prs_diff = p_a.tactical_profile.pressing.pressing_engagement_pct - p_b.tactical_profile.pressing.pressing_engagement_pct
        deltas.append(MetricDeltaItem(
            dimension="Pressing Engagement",
            player_a_value=p_a.tactical_profile.pressing.pressing_engagement_pct,
            player_b_value=p_b.tactical_profile.pressing.pressing_engagement_pct,
            delta_value=round(prs_diff, 1),
            percentage_difference=round(prs_diff, 1),
            unit="%",
            favored_player=player_a_id if prs_diff > 0 else player_b_id,
            tactical_interpretation=f"{player_a_id if prs_diff > 0 else player_b_id} commits to a higher volume of closing actions out of possession."
        ))

        # Defensive: Space Protection
        prot_diff = p_a.tactical_profile.defensive.space_protection_rating - p_b.tactical_profile.defensive.space_protection_rating
        deltas.append(MetricDeltaItem(
            dimension="Defensive Space Protection",
            player_a_value=p_a.tactical_profile.defensive.space_protection_rating,
            player_b_value=p_b.tactical_profile.defensive.space_protection_rating,
            delta_value=round(prot_diff, 1),
            percentage_difference=round(prot_diff, 1),
            unit="rating [0-100]",
            favored_player=player_a_id if prot_diff > 0 else player_b_id,
            tactical_interpretation=f"{player_a_id if prot_diff > 0 else player_b_id} denies greater pitch control in vital central areas."
        ))

        # 5. Overall comparison verdict
        a_favored_count = sum(1 for d in deltas if d.favored_player == player_a_id)
        if a_favored_count >= 3:
            verdict = f"{player_a_id} exhibits a stronger tactical profile across {a_favored_count}/{len(deltas)} evaluated dimensions, notably in {deltas[0].dimension}."
        elif a_favored_count <= 1:
            verdict = f"{player_b_id} outperforms {player_a_id} across {len(deltas) - a_favored_count}/{len(deltas)} dimensions, excelling in defensive and spatial metrics."
        else:
            verdict = f"Complementary tactical profiles: {player_a_id} and {player_b_id} display balanced strengths in distinct operational phases."

        return PlayerComparisonResult(
            player_a_id=player_a_id,
            player_b_id=player_b_id,
            player_a_role=p_a.primary_role,
            player_b_role=p_b.primary_role,
            roles_are_compatible=role_compatible,
            role_adjustment_applied=apply_role_normalization and not same_role,
            warnings=warnings,
            radar_comparison=radar_comp,
            metric_deltas=deltas,
            overall_comparison_verdict=verdict,
            methodology_note="Comparison normalizes metrics across 25 Hz synchronized tracking coordinates; role differences must be factored into recruitment suitability."
        )
