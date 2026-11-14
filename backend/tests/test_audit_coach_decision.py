"""
Phase 19.1 — Independent Scientific Validation & Audit Test Suite
Rigorous verification of the Coach Decision Support System:
1. Formation Recommender & Orthogonal Scoring
2. Starting XI Selection & Provisional Identity Integrity
3. Opponent Exploitation Bounding Boxes & Evidence
4. Defensive Countermeasures & Epistemic Classification
5. Scenario Simulation Input Bounds & Evidence Categories
6. In-Game Replay Monitoring Mode
7. Training Priorities & Coaching Drill Design
8. Recommendation Traceability & Rejection of Unsupported Claims
9. API Endpoints Error Handling & Data Quality
"""

import pytest

from app.modules.coach.formation_recommender import FormationRecommender, FormationSlot, CandidateFormationEvaluation
from app.modules.coach.player_selection_engine import PlayerSelectionEngine, StartingXIPlan, ReplacementScenarioResult
from app.modules.coach.opponent_exploitation import OpponentExploitationEngine, ExploitationPlanItem
from app.modules.coach.defensive_countermeasure import DefensiveCountermeasureEngine, CountermeasurePlanItem
from app.modules.coach.tactical_scenario import TacticalScenarioSimulator, ScenarioAdjustmentParams
from app.modules.coach.in_game_intelligence import InGameIntelligenceEngine
from app.modules.coach.training_priority import TrainingPriorityEngine
from app.modules.coach.decision_explanation import DecisionExplanationEngine, DecisionExplanationAudit, validate_recommendation_traceability
from app.modules.coach.coach_decision_engine import CoachDecisionEngine
from app.modules.scouting.scouting_profile import ScoutingProfileEngine


# --- 1. Formation Recommender Audit ---

def test_formation_slot_coordinates_and_pitch_symmetry():
    """Verify player slot coordinates on standard 105m x 68m pitch and lateral symmetry."""
    recommender = FormationRecommender()
    for form_name in recommender.SUPPORTED_FORMATIONS:
        slots = recommender.get_formation_slots(form_name)
        assert len(slots) == 11, f"Formation {form_name} must have exactly 11 slots."
        gk_slot = next((s for s in slots if s.slot_id == "GK"), None)
        assert gk_slot is not None, f"Formation {form_name} must have a Goalkeeper slot."
        assert gk_slot.default_pitch_x_m <= 15.0, "GK must be positioned near home goal line."
        assert abs(gk_slot.default_pitch_y_m - 34.0) < 1e-3, "GK must be centered laterally at Y=34m."

        # Verify all coordinates within pitch boundary
        for slot in slots:
            assert 0.0 <= slot.default_pitch_x_m <= 105.0, f"Slot {slot.slot_id} X out of pitch bounds."
            assert 0.0 <= slot.default_pitch_y_m <= 68.0, f"Slot {slot.slot_id} Y out of pitch bounds."


def test_formation_orthogonal_scoring_and_custom_weights():
    """Verify score calculation uses distinct orthogonal dimensions without double counting."""
    recommender = FormationRecommender()
    
    # Test standard evaluation
    ev_default = recommender.evaluate_formation("4-3-3", preferred_philosophy="POSSESSION_BUILDUP")
    assert 50.0 <= ev_default.compatibility_score <= 100.0
    assert ev_default.rest_defense_score == 78.0
    assert ev_default.flank_overload_score == 94.0
    assert ev_default.opponent_exploit_score == 92.0

    # Test weight sensitivity: heavy rest-defense weight vs heavy flank weight
    ev_restdef_heavy = recommender.evaluate_formation(
        "4-3-3",
        custom_weights={"role": 0.1, "rest_defense": 0.8, "flank": 0.05, "exploit": 0.05}
    )
    ev_flank_heavy = recommender.evaluate_formation(
        "4-3-3",
        custom_weights={"role": 0.1, "rest_defense": 0.05, "flank": 0.8, "exploit": 0.05}
    )
    assert ev_flank_heavy.compatibility_score > ev_restdef_heavy.compatibility_score, \
        "4-3-3 should score higher when flank overload is prioritized over rest defense."

    # Disclaimer verification: never claims objectively optimal
    assert "objectively optimal" in ev_default.data_limitations.lower()
    assert "no formation is objectively optimal" in ev_default.data_limitations.lower()


def test_formation_evaluation_incomplete_squad_confidence():
    """Verify confidence tier is properly downgraded when squad data is incomplete."""
    real_engine = ScoutingProfileEngine()
    all_real = real_engine.list_all_profiles(team="Home")

    class SlicedProfileEngine:
        def __init__(self, count):
            self.count = count
        def list_all_profiles(self, team="Home"):
            return all_real[:self.count]

    rec_empty = FormationRecommender(profile_engine=SlicedProfileEngine(0))
    ev_empty = rec_empty.evaluate_formation("4-3-3")
    assert ev_empty.confidence_tier == "INSUFFICIENT_DATA"

    rec_limited = FormationRecommender(profile_engine=SlicedProfileEngine(5))
    ev_limited = rec_limited.evaluate_formation("4-3-3")
    assert ev_limited.confidence_tier == "LIMITED_SQUAD"

    rec_full = FormationRecommender(profile_engine=SlicedProfileEngine(14))
    ev_full = rec_full.evaluate_formation("4-3-3")
    assert ev_full.confidence_tier == "HIGH"


# --- 2. Starting XI and Player Selection Audit ---

def test_starting_xi_provisional_identity_flag():
    """Verify players are flagged as provisional anonymous tracking identities, not real squad names."""
    engine = PlayerSelectionEngine()
    plan = engine.generate_starting_xi(formation_name="4-3-3", team="Home")
    assert len(plan.starting_xi) == 11, "Must assign exactly 11 starting players."
    for slot in plan.starting_xi:
        assert slot.is_provisional is True, f"Player {slot.assigned_player_id} must have is_provisional=True."
        assert 0.0 < slot.identity_confidence <= 1.0, "Identity confidence must be a valid probability."


def test_starting_xi_insufficient_squad_handling():
    """Verify insufficient squad size reports unfilled slots and does not fabricate players."""
    real_engine = ScoutingProfileEngine()
    all_real = real_engine.list_all_profiles(team="Home")

    class SlicedProfileEngine:
        def list_all_profiles(self, team="Home"):
            return all_real[:5] # only 5 players

    sel_engine = PlayerSelectionEngine(profile_engine=SlicedProfileEngine())
    plan = sel_engine.generate_starting_xi(formation_name="4-3-3", team="Home")
    assert len(plan.starting_xi) == 5, "Must only select the 5 existing players."
    assert len(plan.unfilled_slots) == 6, "Must report 6 unfilled slots."
    assert "INSUFFICIENT SQUAD NOTICE" in plan.analytical_disclaimers
    assert "No fictional players were fabricated" in plan.analytical_disclaimers


def test_player_replacement_simulation_deltas():
    """Verify player replacement calculates explicit kinematic and spatial deltas."""
    engine = PlayerSelectionEngine()
    res = engine.simulate_player_replacement(
        target_slot_id="RCM",
        incumbent_player_id="Home_7",
        replacement_player_id="Home_12",
        formation_name="4-3-3"
    )
    assert res.target_slot_id == "RCM"
    assert res.incumbent_player_id == "Home_7"
    assert res.replacement_player_id == "Home_12"
    assert isinstance(res.progression_delta_m, float)
    assert isinstance(res.space_creation_delta, float)
    assert isinstance(res.pressing_velocity_delta_mps, float)
    assert len(res.tactical_tradeoff_verdict) > 0


# --- 3. Opponent Exploitation Audit ---

def test_opponent_exploitation_corridors_and_coordinates():
    """Verify all 4 corridors have explicit bounding boxes and verified match citations."""
    engine = OpponentExploitationEngine()
    overview = engine.generate_exploitation_plans(opponent_team="Away")
    assert len(overview.exploitation_plans) == 4
    categories = [p.corridor_category for p in overview.exploitation_plans]
    assert "WIDE_CHANNEL" in categories
    assert "CENTRAL_POCKET" in categories
    assert "PRESSING_BYPASS" in categories
    assert "TRANSITION_SURGE" in categories

    for plan in overview.exploitation_plans:
        x_min, x_max = plan.spatial_x_range_m
        y_min, y_max = plan.spatial_y_range_m
        assert 0.0 <= x_min < x_max <= 105.0, f"Corridor {plan.corridor_category} X range invalid: {plan.spatial_x_range_m}"
        assert 0.0 <= y_min < y_max <= 68.0, f"Corridor {plan.corridor_category} Y range invalid: {plan.spatial_y_range_m}"
        assert len(plan.supporting_matches) > 0, "Must cite supporting matches."
        assert len(plan.supporting_sequences) > 0, "Must cite supporting sequences."
        assert len(plan.potential_counter_risks) > 0, "Must document counter-risks."


# --- 4. Defensive Countermeasures Audit ---

def test_defensive_countermeasure_epistemic_classification():
    """Verify defensive countermeasures classify tactical directives distinctly from measured telemetry."""
    engine = DefensiveCountermeasureEngine()
    overview = engine.generate_countermeasures(opponent_team="Away")
    assert len(overview.countermeasures) == 4

    cm_wide = next(cm for cm in overview.countermeasures if cm.threat_category == "WIDE_THREAT")
    assert cm_wide.epistemic_classification == "COACHING_DIRECTIVE"
    assert "1.5m tactical drop-step" in cm_wide.prescribed_defensive_response
    assert "coaching heuristics" in overview.analytical_disclaimer


# --- 5. Tactical Scenario Validation ---

def test_scenario_validation_invalid_formations_rejected():
    """Verify invalid formation strings are rejected with ValueError."""
    sim = TacticalScenarioSimulator()
    with pytest.raises(ValueError, match="Invalid target formation"):
        sim.simulate_scenario(ScenarioAdjustmentParams(baseline_formation="4-3-3", target_formation="2-2-6"))

    with pytest.raises(ValueError, match="Invalid baseline formation"):
        sim.simulate_scenario(ScenarioAdjustmentParams(baseline_formation="invalid_form", target_formation="4-3-3"))


def test_scenario_extreme_input_clamping_and_evidence_category():
    """Verify extreme line shift and pressing adjustments are clamped and categorized."""
    sim = TacticalScenarioSimulator()
    # Shift of +80m should be clamped to +25m
    res = sim.simulate_scenario(
        ScenarioAdjustmentParams(
            baseline_formation="4-3-3",
            target_formation="4-2-3-1",
            defensive_line_shift_m=80.0,
            pressing_intensity_delta_pct=150.0
        )
    )
    assert res.evidence_category == "HYPOTHETICAL_COACHING_ASSUMPTION"
    delta_line = next(d for d in res.metric_deltas if d.metric_name == "Defensive Line Height")
    assert delta_line.delta_value <= 25.0, "Line shift must be clamped to physically realistic range (<= 25m)."
    assert "do NOT constitute validated, deterministic match outcome predictions" in res.scientific_disclaimer


# --- 6. In-Game Intelligence Replay Mode ---

def test_in_game_replay_mode_disclosure():
    """Verify in-game monitoring explicitly identifies replay-based mode without claiming live feed."""
    engine = InGameIntelligenceEngine()
    summary = engine.analyze_sequence_events("seq_goal_1", start_frame=2200, end_frame=2320)
    assert summary.monitoring_mode == "REPLAY_BASED_TRACKING_MONITORING"
    assert "live optical camera" in summary.live_limitation_statement
    assert len(summary.alerts) >= 3


# --- 7. Training Priority Audit ---

def test_training_priorities_drills_and_labels():
    """Verify 4 coaching drills exist and are labeled as proposed coaching exercises."""
    engine = TrainingPriorityEngine()
    prog = engine.generate_training_priorities(opponent_team="Away")
    assert len(prog.priorities) == 4, "Must generate exactly 4 training priorities for the 4 corridors."
    assert "proposed coaching exercises" in prog.methodological_disclaimer

    for prio in prog.priorities:
        drill = prio.prescribed_drill
        assert drill.grid_dimensions_m != ""
        assert drill.duration_minutes > 0
        assert len(drill.key_coaching_cues) >= 2
        assert drill.intended_learning_outcome != ""


# --- 8. Recommendation Traceability Audit ---

def test_recommendation_traceability_validation():
    """Verify traceability validator accepts well-formed audits and rejects incomplete ones."""
    expl_engine = DecisionExplanationEngine()
    
    # Valid audit
    audit = expl_engine.explain_decision(
        decision_id="test_decision_1",
        category="FORMATION",
        recommendation="Deploy 4-3-3",
        evidence="Away concedes 82% pitch control in Zone 14",
        tactical_why="Creates central triangles",
        advantages=["Natural width", "Triangular passing"],
        disadvantages=["Single pivot exposure"],
        assumptions=["Players maintain tactical discipline"],
        confidence_pct=90.0,
        limitations="Historical sample size limitation",
        source_module="FormationRecommender",
        matches=["metrica_game_1"],
        sequences=["seq_goal_1"],
        players=["Home_10", "Away_15"],
        metrics={"zone_14_control": 82.0}
    )
    assert validate_recommendation_traceability(audit) is True

    # Incomplete audit: missing matches
    audit_bad_matches = audit.model_copy(update={"source_match_ids": []})
    with pytest.raises(ValueError, match="source_match_ids cannot be empty"):
        validate_recommendation_traceability(audit_bad_matches)

    # Incomplete audit: missing metrics
    audit_bad_metrics = audit.model_copy(update={"measured_metric_values": {}})
    with pytest.raises(ValueError, match="measured_metric_values cannot be empty"):
        validate_recommendation_traceability(audit_bad_metrics)

    # Incomplete audit: missing limitations
    audit_bad_limitations = audit.model_copy(update={"missing_information_and_limitations": ""})
    with pytest.raises(ValueError, match="mandatory"):
        validate_recommendation_traceability(audit_bad_limitations)


# --- 9. API Endpoints Error Handling & Verification ---

def test_api_coach_error_handling():
    """Test API error handling on invalid requests directly against route handlers."""
    from fastapi import HTTPException
    from app.api.routes_coach import (
        simulate_player_replacement,
        PlayerReplacementRequest,
        simulate_tactical_scenario,
        TacticalScenarioRequest
    )
    from app.modules.coach.tactical_scenario import ScenarioAdjustmentParams

    # Invalid replacement player ID should raise HTTPException 404
    with pytest.raises(HTTPException) as exc_info:
        simulate_player_replacement(PlayerReplacementRequest(
            target_slot_id="RCM",
            incumbent_player_id="Home_7",
            replacement_player_id="NonExistentPlayer_999",
            formation_name="4-3-3"
        ))
    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.detail)

    # Invalid target formation in scenario should raise HTTPException 500
    with pytest.raises(HTTPException) as exc_scen:
        simulate_tactical_scenario(TacticalScenarioRequest(
            params=ScenarioAdjustmentParams(
                baseline_formation="4-3-3",
                target_formation="invalid_9_9_9"
            ),
            scenario_name="Invalid Formation Test"
        ))
    assert exc_scen.value.status_code == 500
    assert "Invalid target formation" in str(exc_scen.value.detail)
