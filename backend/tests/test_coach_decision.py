"""
Phase 19 — Coach Decision Support System Test Suite.
Tests:
1. 7-formation evaluation across multi-criteria scoring and pitch coordinate integrity.
2. Starting XI player selection, tactical bench planning, and replacement simulations.
3. Opponent exploitation planning across 4 strategic corridors with evidence traceability.
4. Defensive countermeasure planning against opponent strengths and tactical trade-offs.
5. Tactical scenario simulation with scientific separation of facts, estimates, and assumptions.
6. Replay-based in-game monitoring and structural change alerts.
7. Training priority and coaching drill generation.
8. Complete 18-section commercial match strategy report generation (JSON & HTML).
9. Direct API route verification for all coach decision endpoints.
"""

import pytest
from app.modules.coach.coach_decision_engine import CoachDecisionEngine
from app.modules.coach.formation_recommender import FormationRecommender
from app.modules.coach.player_selection_engine import PlayerSelectionEngine
from app.modules.coach.opponent_exploitation import OpponentExploitationEngine
from app.modules.coach.defensive_countermeasure import DefensiveCountermeasureEngine
from app.modules.coach.tactical_scenario import TacticalScenarioSimulator, ScenarioAdjustmentParams
from app.modules.coach.in_game_intelligence import InGameIntelligenceEngine
from app.modules.coach.training_priority import TrainingPriorityEngine
from app.modules.coach.match_strategy_report import MatchStrategyReportGenerator
from app.api.routes_coach import (
    get_coach_system_status,
    generate_match_preparation,
    evaluate_formations,
    plan_player_selection,
    simulate_player_replacement,
    plan_opponent_exploitation,
    plan_defensive_countermeasures,
    simulate_tactical_scenario,
    monitor_in_game_replay,
    plan_training_priorities,
    get_match_strategy_report_json,
    get_match_strategy_report_html,
    MatchPreparationRequest,
    FormationEvaluationRequest,
    PlayerSelectionRequest,
    PlayerReplacementRequest,
    OpponentExploitationRequest,
    DefensiveCountermeasureRequest,
    TacticalScenarioRequest,
    TrainingPriorityRequest,
    MatchReportRequest
)


def test_formation_recommender_seven_formations():
    """Verify evaluation and pitch coordinate integrity of all 7 supported formations."""
    recommender = FormationRecommender()
    evaluations = recommender.evaluate_all_formations(opponent_team="Away", preferred_philosophy="POSSESSION_BUILDUP")
    
    assert len(evaluations) == 7
    formation_names = [e.formation_name for e in evaluations]
    for required in ["4-3-3", "4-2-3-1", "4-4-2", "3-4-3", "3-5-2", "4-1-4-1", "5-3-2"]:
        assert required in formation_names

    for ev in evaluations:
        assert 0.0 <= ev.compatibility_score <= 100.0
        assert len(ev.slots) == 11
        assert len(ev.strengths) >= 2
        assert len(ev.weaknesses) >= 1
        assert len(ev.opponent_specific_advantages) >= 1
        assert len(ev.defensive_risks) >= 1
        assert ev.confidence_tier in ["HIGH", "MEDIUM", "DEVELOPING"]
        
        # Verify pitch coordinates within 105m x 68m bounds
        for slot in ev.slots:
            assert 0.0 <= slot.default_pitch_x_m <= 105.0
            assert 0.0 <= slot.default_pitch_y_m <= 68.0


def test_player_selection_starting_xi_and_bench():
    """Verify Starting XI selection, bench planning, and replacement scenario deltas."""
    engine = PlayerSelectionEngine()
    plan = engine.generate_starting_xi(formation_name="4-3-3", team="Home")

    assert plan.formation_name == "4-3-3"
    assert len(plan.starting_xi) == 11
    assert plan.squad_tactical_balance_score >= 80.0

    # Verify no duplicate players in starting XI
    selected_ids = [s.assigned_player_id for s in plan.starting_xi]
    assert len(selected_ids) == len(set(selected_ids))

    # Verify bench candidates exist
    assert len(plan.bench) >= 1

    # Verify replacement simulation
    rep = engine.simulate_player_replacement(
        target_slot_id="LCM",
        incumbent_player_id="Home_6",
        replacement_player_id="Home_8",
        formation_name="4-3-3"
    )
    assert rep.incumbent_player_id == "Home_6"
    assert rep.replacement_player_id == "Home_8"
    assert isinstance(rep.progression_delta_m, float)
    assert isinstance(rep.space_creation_delta, float)
    assert len(rep.tactical_tradeoff_verdict) > 10


def test_opponent_exploitation_four_corridors():
    """Verify exploitation planning across all 4 strategic corridors with evidence traceability."""
    engine = OpponentExploitationEngine()
    overview = engine.generate_exploitation_plans(opponent_team="Away")

    assert len(overview.exploitation_plans) == 4
    corridors = [p.corridor_category for p in overview.exploitation_plans]
    assert "WIDE_CHANNEL" in corridors
    assert "CENTRAL_POCKET" in corridors
    assert "PRESSING_BYPASS" in corridors
    assert "TRANSITION_SURGE" in corridors

    for p in overview.exploitation_plans:
        assert len(p.supporting_matches) >= 1
        assert len(p.supporting_sequences) >= 1
        assert len(p.potential_counter_risks) >= 1
        assert len(p.key_player_targets) >= 1
        assert len(p.drill_recommendation) > 5


def test_defensive_countermeasures_and_tradeoffs():
    """Verify defensive countermeasures against opponent strengths with transparent trade-offs."""
    engine = DefensiveCountermeasureEngine()
    overview = engine.generate_countermeasures(opponent_team="Away")

    assert len(overview.countermeasures) >= 3
    for cm in overview.countermeasures:
        assert len(cm.tactical_tradeoffs) >= 1
        assert len(cm.alternative_tactical_approach) > 10
        assert len(cm.key_opponent_threat_actors) >= 1
        assert len(cm.assigned_defensive_duties) > 5
        assert cm.confidence_tier == "HIGH"


def test_tactical_scenario_simulation_honesty_separation():
    """Verify scenario simulation strictly separates observed facts, model estimates, and assumptions."""
    simulator = TacticalScenarioSimulator()
    params = ScenarioAdjustmentParams(
        baseline_formation="4-3-3",
        target_formation="4-2-3-1",
        defensive_line_shift_m=+4.0,
        pressing_intensity_delta_pct=+15.0,
        attacking_width_mode="WIDE",
        midfield_pivot_structure="DOUBLE_PIVOT"
    )
    res = simulator.simulate_scenario(params, scenario_name="High-Line Pressing Shift")

    assert res.params.target_formation == "4-2-3-1"
    assert len(res.metric_deltas) == 6
    assert len(res.observed_match_facts) >= 1
    assert len(res.model_derived_estimates) >= 1
    assert len(res.hypothetical_scenario_assumptions) >= 1
    assert len(res.tactical_tradeoffs) >= 1
    assert res.uncertainty_level in ["LOW", "MODERATE", "HIGH"]
    assert 0.0 <= res.confidence_score_pct <= 100.0


def test_in_game_replay_monitoring():
    """Verify replay-based monitoring detects structural changes and provides live adjustment cues."""
    engine = InGameIntelligenceEngine()
    summary = engine.analyze_sequence_events("seq_goal_1", start_frame=2200, end_frame=2320)

    assert summary.monitoring_mode == "REPLAY_BASED_TRACKING_MONITORING"
    assert summary.total_alerts_detected >= 2
    assert "replay monitoring mode" in summary.live_limitation_statement.lower()

    for alert in summary.alerts:
        assert alert.frame_number >= 2200
        assert len(alert.recommended_adjustment) > 10
        assert len(alert.target_player_roles) >= 1


def test_training_priorities_generator():
    """Verify evidence-linked weekly coaching drill priorities."""
    engine = TrainingPriorityEngine()
    overview = engine.generate_training_priorities("Away")

    assert overview.total_priorities >= 3
    for p in overview.priorities:
        assert p.rank >= 1
        assert len(p.prescribed_drill.key_coaching_cues) >= 2
        assert p.prescribed_drill.duration_minutes > 0
        assert "proposed coaching exercises" in overview.methodological_disclaimer.lower()


def test_match_strategy_report_18_sections():
    """Verify full 18-section commercial match strategy report generation in JSON and HTML."""
    generator = MatchStrategyReportGenerator()

    # JSON Dossier Verification
    dossier = generator.generate_report_json("Away", preferred_formation="4-3-3", tactical_philosophy="POSSESSION_BUILDUP")
    for i in range(1, 19):
        prefix = f"section_{i}_"
        matches = [k for k in dossier.keys() if k.startswith(prefix)]
        assert len(matches) == 1, f"Missing {prefix} in match strategy dossier"

    # HTML Dossier Verification
    html = generator.generate_html_report("Away", preferred_formation="4-3-3", tactical_philosophy="POSSESSION_BUILDUP")
    assert "<!DOCTYPE html>" in html
    assert "TACTICALGHOST — MATCH STRATEGY DOSSIER" in html
    assert "Proposed Starting XI & Tactical Roles" in html
    assert "Strategic Opponent Exploitation Plan" in html
    assert "Scientific Integrity Charter" in html


def test_api_coach_endpoints():
    """Verify direct invocation of FastAPI route handlers for coach decision support."""
    # 1. Status
    status = get_coach_system_status()
    assert status["status"] == "operational"
    assert "4-3-3" in status["supported_formations"]

    # 2. Preparation report
    prep = generate_match_preparation(MatchPreparationRequest(opponent_team="Away", preferred_formation="4-3-3"))
    assert prep.opponent_team == "Away"
    assert prep.section_10_recommended_tactical_approach.tactical_compatibility_score > 80.0

    # 3. Formation evaluation
    forms = evaluate_formations(FormationEvaluationRequest(opponent_team="Away", preferred_philosophy="POSSESSION_BUILDUP"))
    assert len(forms) >= 7

    # 4. Player selection
    sel = plan_player_selection(PlayerSelectionRequest(formation_name="4-3-3", team="Home"))
    assert len(sel.starting_xi) == 11

    # 5. Replacement
    rep = simulate_player_replacement(PlayerReplacementRequest(
        target_slot_id="CF",
        incumbent_player_id="Home_9",
        replacement_player_id="Home_10"
    ))
    assert rep.incumbent_player_id == "Home_9"

    # 6. Exploitation
    exp = plan_opponent_exploitation(OpponentExploitationRequest(opponent_team="Away"))
    assert len(exp.exploitation_plans) == 4

    # 7. Countermeasures
    cm = plan_defensive_countermeasures(DefensiveCountermeasureRequest(opponent_team="Away"))
    assert len(cm.countermeasures) >= 3

    # 8. Scenario simulation
    scen = simulate_tactical_scenario(TacticalScenarioRequest(
        params=ScenarioAdjustmentParams(baseline_formation="4-3-3", target_formation="4-2-3-1"),
        scenario_name="Test Scenario"
    ))
    assert len(scen.metric_deltas) == 6

    # 9. In-game replay monitor
    mon = monitor_in_game_replay("seq_goal_1", 2200, 2320)
    assert mon.monitoring_mode == "REPLAY_BASED_TRACKING_MONITORING"

    # 10. Training priorities
    trn = plan_training_priorities(TrainingPriorityRequest(opponent_team="Away"))
    assert len(trn.priorities) >= 3

    # 11. Report JSON & HTML
    rep_req = MatchReportRequest(opponent_team="Away", preferred_formation="4-3-3")
    r_json = get_match_strategy_report_json(rep_req)
    assert "section_1_match_overview" in r_json

    r_html = get_match_strategy_report_html(rep_req)
    assert r_html.status_code == 200
    assert "TACTICALGHOST — MATCH STRATEGY DOSSIER" in r_html.body.decode("utf-8")
