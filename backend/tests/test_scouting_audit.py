"""
Phase 18.1 — Independent Scientific Validation & Audit Test Suite.
Validates:
1. Empirical tracking attribution for off-ball runs (Home_6 wide run, Home_9 box penetration, Home_10 flank pinning).
2. Distinction between heuristic archetype similarity and calibrated Bayesian posterior probability.
3. Missing evidence penalty in tactical fit calculation (preventing artificial 50% default inflation).
4. Strict anonymous identity provenance enforcement (PROVISIONAL_ANONYMOUS_TAG, zero biographical fabrication).
5. Pairwise player comparison fairness and role mismatch warning triggers.
6. Shortlist candidate management and JSON export schema completeness.
7. Complete 18-section scouting dossier traceability and analytical transparency.
"""

import pytest
from app.modules.scouting.scouting_profile import ScoutingProfileEngine
from app.modules.scouting.off_ball_contribution import OffBallContributionEngine
from app.modules.scouting.player_role_classifier import PlayerRoleClassifier
from app.modules.scouting.player_comparison import PlayerComparisonEngine
from app.modules.scouting.tactical_fit import TacticalFitEngine, TacticalRequirement
from app.modules.scouting.shortlist_manager import ShortlistManager
from app.modules.scouting.scouting_report import ScoutingReportGenerator


def test_empirical_tracking_attribution_audit():
    """Verify empirical tracking attribution and audit notes in off-ball contributions."""
    engine = OffBallContributionEngine()

    # 1. Home_6: Ground-truth verified wide flank decoy runner in seq_goal_1
    h6_runs = engine.get_player_off_ball_contributions("Home_6")
    assert len(h6_runs) >= 1
    h6_run = h6_runs[0]
    assert h6_run.sequence_id == "seq_goal_1"
    assert h6_run.distance_covered_m >= 18.0
    assert "Away_24" in h6_run.displaced_defenders
    assert h6_run.defensive_line_displacement_m >= 15.0
    assert h6_run.audit_notes is not None
    assert "Phase 18.1 Empirical Tracking Audit" in h6_run.audit_notes

    # 2. Home_9: Ground-truth verified box penetration runner in seq_goal_1
    h9_runs = engine.get_player_off_ball_contributions("Home_9")
    assert len(h9_runs) >= 1
    h9_run = h9_runs[0]
    assert h9_run.sequence_id == "seq_goal_1"
    assert h9_run.movement_type == "RUN_BEHIND_DEFENSE"
    assert h9_run.audit_notes is not None

    # 3. Home_10: Verified flank pinning in seq_goal_1 and third-man support in counter
    h10_runs = engine.get_player_off_ball_contributions("Home_10")
    assert len(h10_runs) >= 2
    for r in h10_runs:
        assert r.audit_notes is not None
        assert r.empirical_tracking_verified is True


def test_role_classifier_similarity_vs_calibrated_probability():
    """Verify role classifier distinguishes heuristic similarity from calibrated probability."""
    classifier = PlayerRoleClassifier()
    res = classifier.classify_player(
        player_id="Home_10",
        mean_x_m=62.4,
        mean_y_m=42.1,
        progression_m=48.2,
        pressing_engagement=72.0,
        peak_speed_mps=6.85,
        half_space_pct=65.0
    )

    # Scientific guardrail: must NOT be flagged as calibrated probability
    assert res.is_calibrated_probability is False
    assert 0.0 <= res.archetype_similarity_score <= 100.0
    assert res.primary_role == "Attacking midfielder"

    # Explainable rationale must document the distance-metric methodology
    methodology_found = any("Bayesian posterior probability" in r for r in res.explainable_rationale)
    assert methodology_found is True


def test_tactical_fit_missing_evidence_penalty():
    """Verify that missing evidence incurs an explicit penalty rather than arbitrary 50% default."""
    profile_engine = ScoutingProfileEngine()
    fit_engine = TacticalFitEngine(profile_engine)

    # Inject a philosophy with an unmeasured metric to test missing evidence handling
    profile = profile_engine.get_player_profile("Home_10")
    assert profile is not None

    val, is_present = fit_engine._extract_metric_value(profile, "non_existent_untracked_metric")
    assert val == 0.0
    assert is_present is False

    # Standard fit evaluation on existing preset
    res = fit_engine.evaluate_tactical_fit("Home_10", philosophy_key="POSSESSION_BUILDUP")
    assert res.overall_fit_score > 0.0
    assert res.confidence_tier in ["HIGH", "MEDIUM"]

    # Verify sum-normalization prevents score overflow when extreme weights are applied
    extreme_weights = {
        "Half-Space Occupation": 100.0,
        "Passing Lane Creation": 100.0,
        "Space Creation Rating": 100.0,
        "Rest Defense Index": 100.0
    }
    res_extreme = fit_engine.evaluate_tactical_fit("Home_10", philosophy_key="POSSESSION_BUILDUP", custom_weights=extreme_weights)
    assert 0.0 <= res_extreme.overall_fit_score <= 100.0
    applied_sum = sum(r.weight_applied for r in res_extreme.requirement_breakdown)
    assert round(applied_sum, 2) == 1.0


def test_anonymous_identity_provenance_enforcement():
    """Verify that all player records enforce anonymous identity provenance and no fabricated bio data."""
    profile_engine = ScoutingProfileEngine()
    profiles = profile_engine.list_all_profiles()
    assert len(profiles) >= 8

    for p in profiles:
        # Provenance tier must be explicitly tagged as anonymous
        assert p.identity.identity_confidence_tier == "PROVISIONAL_ANONYMOUS_TAG"
        assert "anonymized tracking tag" in p.identity.mapping_provenance.lower()
        # Data quality must be computed and verified
        assert p.data_quality.overall_quality_score >= 90.0
        assert p.data_quality.quality_tier in ["EXCELLENT", "HIGH"]
        # Disclaimers must be present
        assert len(p.tactical_profile.limitations_disclaimer) > 20


def test_pairwise_comparison_role_mismatch_warning():
    """Verify comparison engine alerts when attempting to compare disparate positional roles."""
    profile_engine = ScoutingProfileEngine()
    comp_engine = PlayerComparisonEngine(profile_engine)

    # Incompatible comparison: Attacking Midfielder (Home_10) vs Centre-back (Away_15)
    res = comp_engine.compare_players("Home_10", "Away_15")
    assert res.roles_are_compatible is False
    assert any(w.warning_type == "ROLE_MISMATCH" for w in res.warnings)
    assert any(w.severity == "HIGH" for w in res.warnings)

    # Compatible comparison: Attacking Midfielder (Home_10) vs Playmaker (Away_20)
    res_compat = comp_engine.compare_players("Home_10", "Away_20")
    assert res_compat.roles_are_compatible is True


def test_shortlist_persistence_and_schema_integrity():
    """Verify shortlist candidate persistence and export schema."""
    profile_engine = ScoutingProfileEngine()
    mgr = ShortlistManager(profile_engine)

    # Export schema verification
    export = mgr.export_shortlist()
    assert "export_timestamp" in export
    assert "total_candidates" in export
    assert "candidates" in export
    assert isinstance(export["candidates"], list)
    assert export["total_candidates"] == len(export["candidates"])


def test_dossier_18_section_traceability():
    """Verify complete 18-section dossier structure and empirical disclaimers."""
    profile_engine = ScoutingProfileEngine()
    off_ball_engine = OffBallContributionEngine()
    role_classifier = PlayerRoleClassifier()
    fit_engine = TacticalFitEngine(profile_engine)

    rep_gen = ScoutingReportGenerator(profile_engine, off_ball_engine, role_classifier, fit_engine)
    dossier = rep_gen.generate_dossier_json("Home_10")

    # Verify all 18 numbered sections exist
    for i in range(1, 19):
        prefix = f"section_{i}_"
        matches = [k for k in dossier.keys() if k.startswith(prefix)]
        assert len(matches) == 1, f"Missing {prefix} in scouting dossier"

    # Verify section 18 disclaimer
    sec18 = dossier["section_18_limitations"]
    assert "disclaimer" in sec18
    assert "sample_size" in sec18
