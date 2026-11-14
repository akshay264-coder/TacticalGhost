"""
Phase 18 — Player Scouting & Recruitment Intelligence Test Suite.
Tests:
1. Player profile creation, data quality scoring, and anonymous identity provenance.
2. Off-ball contribution discovery (decoy runs, space creation, defender displacement).
3. 9-archetype role classification, hybrid roles, and explainable rationales.
4. Player pairwise comparisons, role compatibility checks, and metric deltas.
5. Tactical fit evaluation, custom weight sum-normalization, and sensitivity shifts.
6. Shortlist candidate management, qualitative note updates, and export.
7. 18-section scouting dossier report generator (JSON & HTML).
8. API endpoints verification.
"""

import pytest
from app.modules.scouting.scouting_profile import ScoutingProfileEngine
from app.modules.scouting.off_ball_contribution import OffBallContributionEngine
from app.modules.scouting.player_role_classifier import PlayerRoleClassifier
from app.modules.scouting.player_comparison import PlayerComparisonEngine
from app.modules.scouting.tactical_fit import TacticalFitEngine
from app.modules.scouting.shortlist_manager import ShortlistManager
from app.modules.scouting.scouting_report import ScoutingReportGenerator
from app.api.routes_scouting import (
    list_scouted_players,
    get_player_profile,
    get_player_off_ball,
    get_player_role_classification,
    compare_players,
    evaluate_tactical_fit,
    get_shortlist,
    add_to_shortlist,
    update_shortlist_notes,
    remove_from_shortlist,
    export_shortlist,
    get_scouting_report_json,
    get_scouting_report_html,
    CompareRequest,
    TacticalFitRequest,
    ShortlistAddRequest,
    ShortlistNotesRequest
)


def test_player_scouting_profile_retrieval():
    """Verify player profile attributes, quality scores, and identity provenance."""
    engine = ScoutingProfileEngine()
    profiles = engine.list_all_profiles()
    assert len(profiles) >= 8

    # Check Away_24
    p24 = engine.get_player_profile("Away_24")
    assert p24 is not None
    assert p24.identity.player_id == "Away_24"
    assert p24.identity.team == "Away"
    assert p24.identity.identity_confidence_tier == "PROVISIONAL_ANONYMOUS_TAG"
    assert "Metrica Sports Open Tracking Dataset" in p24.identity.mapping_provenance
    assert p24.data_quality.overall_quality_score >= 95.0
    assert p24.tactical_profile.pressing.peak_closing_velocity_mps == 7.24
    assert p24.primary_role == "Winger"

    # Check Home_10
    h10 = engine.get_player_profile("Home_10")
    assert h10 is not None
    assert h10.primary_role == "Attacking midfielder"
    assert h10.tactical_profile.attacking.space_creation_rating >= 90.0
    assert len(h10.tactical_profile.tactical_strengths) >= 2


def test_off_ball_contributions_detection():
    """Verify off-ball contributions (decoy runs, space creation) have established tactical value."""
    engine = OffBallContributionEngine()
    
    # Check Home_10 decoy run in Goal 1
    h10_runs = engine.get_player_off_ball_contributions("Home_10")
    assert len(h10_runs) >= 2
    decoy = next((r for r in h10_runs if r.movement_type == "DECOY_RUN"), None)
    assert decoy is not None
    assert decoy.sequence_id == "seq_goal_1"
    assert decoy.space_created_m2 > 30.0
    assert decoy.pitch_control_delta_pct > 20.0
    assert "Away_15" in decoy.displaced_defenders or "Away_16" in decoy.displaced_defenders
    assert decoy.tactical_value_established is True
    assert decoy.confidence_level == "HIGH"

    # Check Away_24 transitional run
    a24_runs = engine.get_player_off_ball_contributions("Away_24")
    assert len(a24_runs) >= 1
    counter_run = a24_runs[0]
    assert counter_run.peak_speed_mps > 7.0
    assert counter_run.defensive_line_displacement_m > 5.0
    assert counter_run.tactical_value_established is True


def test_role_classification_archetypes():
    """Verify multi-metric classification across distinct tactical archetypes."""
    classifier = PlayerRoleClassifier()

    # Centre-back profile: deep X=26m, central offset=4m, low progression, low peak speed
    cb_res = classifier.classify_player(
        player_id="Test_CB",
        mean_x_m=26.0,
        mean_y_m=32.0,  # offset = 2m
        progression_m=16.0,
        pressing_engagement=48.0,
        peak_speed_mps=6.1
    )
    assert cb_res.primary_role == "Centre-back"
    assert cb_res.role_confidence > 70.0
    assert len(cb_res.explainable_rationale) >= 3

    # Winger profile: high X=68m, wide touchline Y=58m (offset=24m), high speed=7.4 m/s
    w_res = classifier.classify_player(
        player_id="Test_Winger",
        mean_x_m=68.0,
        mean_y_m=58.0,
        progression_m=52.0,
        pressing_engagement=66.0,
        peak_speed_mps=7.4
    )
    assert w_res.primary_role == "Winger"
    assert "Touchline" in w_res.positional_zone

    # Central midfielder: intermediate X=54m, central Y=33m
    cm_res = classifier.classify_player(
        player_id="Test_CM",
        mean_x_m=54.0,
        mean_y_m=33.0,
        progression_m=42.0,
        pressing_engagement=78.0,
        peak_speed_mps=6.3
    )
    assert cm_res.primary_role in ["Central midfielder", "Defensive midfielder", "Attacking midfielder"]


def test_player_comparison_engine():
    """Verify pairwise player comparison and role mismatch warnings."""
    profile_engine = ScoutingProfileEngine()
    comp_engine = PlayerComparisonEngine(profile_engine)

    # 1. Compatible Comparison: Home_10 vs Away_20 (both playmakers)
    res_compat = comp_engine.compare_players("Home_10", "Away_20")
    assert res_compat.player_a_id == "Home_10"
    assert res_compat.player_b_id == "Away_20"
    assert len(res_compat.metric_deltas) >= 5
    assert "Space Creation Rating" in [d.dimension for d in res_compat.metric_deltas]

    # 2. Incompatible Roles: Home_10 (Attacking midfielder) vs Away_15 (Centre-back)
    res_incompat = comp_engine.compare_players("Home_10", "Away_15")
    assert res_incompat.roles_are_compatible is False
    warning_types = [w.warning_type for w in res_incompat.warnings]
    assert "ROLE_MISMATCH" in warning_types


def test_tactical_fit_and_weight_normalization():
    """Verify tactical fit calculation, weight sum-normalization, and sensitivity shifts."""
    profile_engine = ScoutingProfileEngine()
    fit_engine = TacticalFitEngine(profile_engine)

    # Test preset philosophy
    res = fit_engine.evaluate_tactical_fit("Home_10", philosophy_key="POSSESSION_BUILDUP")
    assert 0.0 <= res.overall_fit_score <= 100.0
    assert res.overall_fit_score >= 80.0
    assert len(res.requirement_breakdown) >= 4
    assert len(res.sensitivity_analysis) >= 4

    # Test custom bloated weights (summing to 10.0); verify sum-normalization prevents score overflow
    custom_w = {
        "Half-Space Occupation": 5.0,
        "Passing Lane Creation": 5.0
    }
    res_custom = fit_engine.evaluate_tactical_fit("Home_10", philosophy_key="POSSESSION_BUILDUP", custom_weights=custom_w)
    assert 0.0 <= res_custom.overall_fit_score <= 100.0
    total_weights = sum(r.weight_applied for r in res_custom.requirement_breakdown)
    assert round(total_weights, 2) == 1.0


def test_shortlist_crud_and_export():
    """Verify adding, updating notes, removing, and exporting shortlist candidates."""
    profile_engine = ScoutingProfileEngine()
    mgr = ShortlistManager(profile_engine)

    # Check default items
    initial_list = mgr.get_shortlist()
    assert len(initial_list) >= 2

    # Add candidate Home_9
    added = mgr.add_candidate(
        player_id="Home_9",
        notes="Finisher with superb blindside box movement.",
        tags=["Finisher", "Poacher"],
        target_philosophy="DIRECT_COUNTERATTACK",
        fit_score=88.0
    )
    assert added.player_id == "Home_9"
    assert len(mgr.get_shortlist()) == len(initial_list) + 1

    # Update notes
    updated = mgr.update_notes("Home_9", "Updated: priority target for goalscoring support.", ["Priority"])
    assert updated.scouting_notes == "Updated: priority target for goalscoring support."
    assert "Priority" in updated.tags

    # Export payload
    export_data = mgr.export_shortlist()
    assert export_data["total_candidates"] == len(mgr.get_shortlist())
    assert "candidates" in export_data

    # Remove candidate
    removed = mgr.remove_candidate("Home_9")
    assert removed is True
    assert len(mgr.get_shortlist()) == len(initial_list)


def test_scouting_dossier_report_generation():
    """Verify generation of full 18-section structured JSON and HTML dossier."""
    profile_engine = ScoutingProfileEngine()
    off_ball_engine = OffBallContributionEngine()
    role_classifier = PlayerRoleClassifier()
    fit_engine = TacticalFitEngine(profile_engine)

    rep_gen = ScoutingReportGenerator(profile_engine, off_ball_engine, role_classifier, fit_engine)

    # JSON Dossier Verification
    dossier = rep_gen.generate_dossier_json("Home_10")
    for sec_num in range(1, 19):
        key = f"section_{sec_num}_"
        matching_keys = [k for k in dossier.keys() if k.startswith(key)]
        assert len(matching_keys) == 1, f"Missing {key} in scouting dossier"

    assert dossier["section_1_player_identity"]["player_id"] == "Home_10"
    assert dossier["section_4_role_classification"]["primary_role"] == "Attacking midfielder"

    # HTML Dossier Verification
    html = rep_gen.generate_html_report("Home_10")
    assert "<!DOCTYPE html>" in html
    assert "Home_10" in html
    assert "TACTICALGHOST — PLAYER RECRUITMENT DOSSIER" in html
    assert "Verified Off-Ball Contributions" in html
    assert "Scientific & Ethical Methodology Note" in html


def test_api_scouting_endpoints():
    """Verify direct invocation of FastAPI route handler functions."""
    # 1. List players
    players = list_scouted_players(team=None, role=None, min_quality=0.0)
    assert len(players) >= 8

    # 2. Get profile
    p = get_player_profile("Away_24")
    assert p.identity.player_id == "Away_24"

    # 3. Off-ball contributions
    ob = get_player_off_ball("Home_10")
    assert len(ob) >= 2

    # 4. Role classification
    rc = get_player_role_classification("Home_10")
    assert rc.primary_role == "Attacking midfielder"

    # 5. Compare
    comp = compare_players(CompareRequest(player_a_id="Home_10", player_b_id="Away_20"))
    assert comp.player_a_id == "Home_10"

    # 6. Tactical fit
    tf = evaluate_tactical_fit(TacticalFitRequest(player_id="Home_10", philosophy_key="POSSESSION_BUILDUP"))
    assert tf.overall_fit_score > 0

    # 7. Shortlist
    sl = get_shortlist()
    assert len(sl) >= 2

    # 8. Report JSON & HTML
    r_json = get_scouting_report_json("Away_24")
    assert "section_1_player_identity" in r_json

    r_html = get_scouting_report_html("Away_24")
    assert r_html.status_code == 200
    assert "Away_24" in r_html.body.decode("utf-8")
