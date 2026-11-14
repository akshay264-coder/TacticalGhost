"""
Phase 17.1 — Independent Validation & Scientific Audit Test Suite
-----------------------------------------------------------------
Comprehensive mathematical, statistical, and empirical audit tests covering:
1. Multi-match data integrity (hash separation, frame rate, continuous timestamps).
2. Compatibility score bounds (failing dimensions, zero-team penalty, dynamic player overlap).
3. Cross-match pattern recurrence (thresholds, single-match downgrade to DEVELOPING).
4. Vulnerability & strength scoring (weight sum-normalization, breadth scaling, no overflow).
5. Tactical evolution statistical nomenclature (practical shift vs minor variation, N=2 documentation).
6. Recommendation traceability (supporting sequences and metric values present in all plans).
7. Player identity mapping verification (provisional anonymous tag tiers).
"""

import hashlib
import os
import pytest
from app.modules.multi_match.match_registry import (
    MatchRegistryService,
    MatchCompatibilityScore,
    MatchMetadata,
    DataQualityReport,
)
from app.modules.multi_match.opponent_patterns import CrossMatchPatternEngine
from app.modules.multi_match.opponent_weakness import OpponentVulnerabilityAndStrengthEngine
from app.modules.multi_match.tactical_evolution import TacticalEvolutionEngine
from app.modules.multi_match.player_intelligence import OpponentPlayerIntelligenceEngine
from app.modules.multi_match.recommendations import OpponentPreparationEngine


def test_audit_multi_match_data_integrity():
    """Verify that Game 1 and Game 2 event files are distinct files with distinct SHA-256 hashes."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    g1_path = os.path.join(base_dir, "data", "metrica_sample", "Sample_Game_1_RawEventsData.csv")
    g2_path = os.path.join(base_dir, "data", "metrica_sample", "Sample_Game_2_RawEventsData.csv")

    assert os.path.exists(g1_path), f"Game 1 event dataset missing at {g1_path}"
    assert os.path.exists(g2_path), f"Game 2 event dataset missing at {g2_path}"

    with open(g1_path, "rb") as f1, open(g2_path, "rb") as f2:
        h1 = hashlib.sha256(f1.read()).hexdigest()
        h2 = hashlib.sha256(f2.read()).hexdigest()

    assert h1 != h2, "Game 1 and Game 2 must have distinct SHA-256 hashes"
    
    registry = MatchRegistryService()
    m1 = registry.get_match("metrica_game_1")
    m2 = registry.get_match("metrica_game_2")

    assert m1 is not None and m2 is not None
    assert m1.match_id != m2.match_id
    assert m1.tracking_fps == 25.0 and m2.tracking_fps == 25.0
    assert "105.0m x 68.0m" in m1.data_quality_report.pitch_dimensions
    assert "105.0m x 68.0m" in m2.data_quality_report.pitch_dimensions


def test_audit_compatibility_dynamic_player_overlap():
    """Verify that player overlap is dynamically calculated (92.9%), NOT hardcoded 95.0%."""
    registry = MatchRegistryService()
    assessment = registry.validate_compatibility(["metrica_game_1", "metrica_game_2"])

    comp_dict = {c.name: c.score for c in assessment.components}
    assert comp_dict["Sampling Frequency Consistency"] == 100.0
    assert comp_dict["Pitch Dimensions & Coordinates"] == 100.0
    assert comp_dict["Team Identity Continuity"] == 100.0
    
    # 26 shared players out of 28 unique across squads: (14+12)/28 = 92.86% -> 92.9%
    player_score = comp_dict["Squad & Player Overlap"]
    assert player_score == 92.9, f"Expected dynamic player overlap 92.9%, got {player_score}"
    assert assessment.overall_score == 98.9, f"Expected overall score 98.9%, got {assessment.overall_score}"
    assert assessment.is_compatible is True


def test_audit_compatibility_failing_dimension_penalty():
    """Verify that when teams do not overlap, score is penalised to <= 45% and marked incompatible."""
    registry = MatchRegistryService()
    
    # Register an artificial disjoint match with no common teams
    disjoint_meta = MatchMetadata(
        match_id="disjoint_game",
        competition="Foreign League",
        season="2022",
        match_date="2022-01-01",
        home_team="Team Alpha",
        away_team="Team Beta",
        final_score="0 - 0",
        data_source="Custom",
        tracking_fps=25.0,
        total_frames=50000,
        periods=2,
        tactical_summary="Disjoint team match",
        data_quality_report=DataQualityReport(
            match_id="disjoint_game",
            completeness_pct=99.0,
            missing_tracking_frames=0,
            missing_ball_frames=0,
            coordinate_system="Normalized [0, 1] to Metric [105m x 68m]",
            tracking_hz=25.0,
            pitch_dimensions="105.0m x 68.0m",
            quality_tier="EXCELLENT",
            validation_timestamp="2026-11-14T00:00:00Z"
        )
    )
    registry._registry["disjoint_game"] = disjoint_meta

    assessment = registry.validate_compatibility(["metrica_game_1", "disjoint_game"])
    comp_dict = {c.name: c.score for c in assessment.components}
    assert comp_dict["Team Identity Continuity"] == 0.0
    assert comp_dict["Squad & Player Overlap"] == 0.0
    assert assessment.is_compatible is False
    assert assessment.overall_score <= 45.0, f"Expected penalty <= 45%, got {assessment.overall_score}"


def test_audit_pattern_recurrence_single_match_downgrade():
    """Verify that patterns evaluated against only 1 match are downgraded to DEVELOPING."""
    engine = CrossMatchPatternEngine()
    
    # Evaluate across both matches (Game 1 and Game 2)
    patterns_both = engine.get_cross_match_patterns(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(patterns_both) > 0
    high_confidence_found = any(p.confidence_level in ["HIGH", "VERIFIED"] for p in patterns_both)
    assert high_confidence_found, "Cross-match recurring patterns across 2 matches should have HIGH or VERIFIED confidence"

    # Evaluate against single match
    patterns_single = engine.get_cross_match_patterns(opponent_team="Away", match_ids=["metrica_game_1"])
    for p in patterns_single:
        assert p.confidence_level == "DEVELOPING", (
            f"Pattern {p.pattern_id} in single match evaluation must be downgraded to DEVELOPING, got {p.confidence_level}"
        )
        assert len(p.matches_present) <= 1


def test_audit_vulnerability_weight_normalization_and_breadth():
    """Verify custom weights are normalized to sum to 1.0, avoiding score inflation > 100."""
    engine = OpponentVulnerabilityAndStrengthEngine()

    # Pass bloated weights summing to 4.0
    bloated_weights = {
        "severity": 1.0,
        "recurrence": 1.0,
        "exploitability": 1.0,
        "match_breadth": 1.0
    }
    vulns_bloated = engine.discover_weaknesses(
        opponent_team="Away",
        match_ids=["metrica_game_1", "metrica_game_2"],
        weights=bloated_weights
    )

    for v in vulns_bloated:
        assert 0.0 <= v.vulnerability_score <= 100.0, f"Score {v.vulnerability_score} exceeded [0, 100]"

    # Test single-match breadth factor
    vulns_single = engine.discover_weaknesses(
        opponent_team="Away",
        match_ids=["metrica_game_1"]
    )
    for v in vulns_single:
        assert v.scoring_breakdown["match_breadth"] == 50.0, (
            f"Single-match breadth factor should be 50.0, got {v.scoring_breakdown['match_breadth']}"
        )


def test_audit_tactical_evolution_statistical_classification():
    """Verify that N=2 differences are classified as Practical Shifts or Minor Variations without p-value claims."""
    engine = TacticalEvolutionEngine()
    report = engine.analyze_tactical_evolution(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])

    assert len(report.metric_deltas) > 0
    for delta in report.metric_deltas:
        assert delta.statistical_classification in [
            "Practical Shift (|Δ| ≥ 5%)",
            "Minor Variation (< 5%)"
        ], f"Unexpected classification: {delta.statistical_classification}"
        
        if abs(delta.percentage_change) >= 5.0:
            assert delta.statistical_classification == "Practical Shift (|Δ| ≥ 5%)"
            assert delta.is_statistically_significant is True
        else:
            assert delta.statistical_classification == "Minor Variation (< 5%)"
            assert delta.is_statistically_significant is False

        assert "2 full tracking matches" in delta.sample_size_description


def test_audit_player_identity_provisional_tagging():
    """Verify all player profiles are explicitly tagged with PROVISIONAL_ANONYMOUS_TAG."""
    engine = OpponentPlayerIntelligenceEngine()
    squad = engine.get_opponent_squad_intelligence(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])

    assert len(squad.all_players) > 0
    for p in squad.all_players:
        assert p.identity_confidence_tier == "PROVISIONAL_ANONYMOUS_TAG"
        assert "anonymizes player names" in p.mapping_notes


def test_audit_recommendation_traceability():
    """Verify that all preparation recommendations contain supporting sequence IDs and metric values."""
    engine = OpponentPreparationEngine()
    strategy = engine.generate_preparation_strategy(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])

    all_plans = strategy.primary_attacking_exploits + strategy.primary_defensive_countermeasures
    assert len(all_plans) >= 4, "Expected at least 4 tactical plans"

    for plan in all_plans:
        assert plan.supporting_sequence_ids is not None and len(plan.supporting_sequence_ids) > 0, (
            f"Plan {plan.recommendation_id} missing supporting sequence IDs"
        )
        assert plan.supporting_metric_value is not None and len(plan.supporting_metric_value) > 0, (
            f"Plan {plan.recommendation_id} missing supporting metric value"
        )
        assert len(plan.supporting_matches) >= 1
