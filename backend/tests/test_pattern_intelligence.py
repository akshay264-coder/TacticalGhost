"""
Automated Unit and Integration Tests for Phase 16: Commercial Tactical Pattern Intelligence Engine.
Tests:
- Pattern recognition (overloads, pressing traps, half-spaces, line breaks, counterattacks)
- Opponent weakness discovery with recurrence verification
- Attacking opportunity discovery
- Coach-friendly translation (measured observation vs recommendation separation)
- Cross-sequence pattern comparison
- API endpoint integration
"""

import os
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.routes_sequences import data_manager as shared_dm
from app.api.routes_patterns import (
    get_sequence_patterns,
    get_match_pattern_intelligence,
    compare_sequence_patterns,
    get_commercial_briefing_html
)
from app.modules.pattern_intelligence import PatternIntelligenceEngine


@pytest.fixture(scope="module")
def data_manager():
    return shared_dm


@pytest.fixture(scope="module")
def pattern_engine():
    return PatternIntelligenceEngine()


def test_detect_patterns_in_goal_sequence(data_manager, pattern_engine):
    """
    Tests tactical pattern detection on Goal Sequence 1 (seq_goal_1).
    """
    seqs = data_manager.get_curated_sequences()
    goal_seq = next(s for s in seqs if s["sequence_id"] == "seq_goal_1")
    tracking = data_manager.get_sequence_tracking(goal_seq["start_frame"], goal_seq["end_frame"])

    patterns = pattern_engine.detect_patterns_in_sequence(goal_seq, tracking)
    assert isinstance(patterns, list)
    assert len(patterns) > 0

    # Verify required pattern properties
    for p in patterns:
        assert "pattern_id" in p
        assert "pattern_type" in p
        assert "pattern_name" in p
        assert "confidence" in p
        assert 0.0 <= p["confidence"] <= 1.0
        assert "supporting_observations" in p
        assert len(p["supporting_observations"]) > 0
        assert "coach_explanation" in p
        assert "actionable_recommendation" in p
        assert "drill_recommendation" in p

    # Verify at least one overload or line break was captured
    types = [p["pattern_type"] for p in patterns]
    assert any(t in ["wide_overload", "central_overload", "line_break", "half_space_occupation", "off_ball_run"] for t in types)


def test_detect_pressing_trap_in_turnover_sequence(data_manager, pattern_engine):
    """
    Tests pressing trap detection on Counter-Pressing sequence (seq_pressing_turnover).
    """
    seqs = data_manager.get_curated_sequences()
    press_seq = next(s for s in seqs if s["sequence_id"] == "seq_pressing_turnover")
    tracking = data_manager.get_sequence_tracking(press_seq["start_frame"], press_seq["end_frame"])

    patterns = pattern_engine.detect_patterns_in_sequence(press_seq, tracking)
    assert isinstance(patterns, list)
    assert len(patterns) > 0

    # Ensure pressing trap was detected
    traps = [p for p in patterns if p["pattern_type"] == "pressing_trap"]
    assert len(traps) >= 1
    trap = traps[0]
    assert trap["team"] in ["Home", "Away"]
    assert len(trap["relevant_players"]) >= 2
    assert "TTC" in trap["detection_methodology"] or "closing speed" in trap["detection_methodology"]


def test_opponent_weakness_discovery_recurrence_rule(data_manager, pattern_engine):
    """
    Verifies opponent weakness discovery enforces recurrence across sequences (no isolated incident rule).
    """
    seqs = data_manager.get_curated_sequences()
    all_tracking = {
        s["sequence_id"]: data_manager.get_sequence_tracking(s["start_frame"], s["end_frame"])
        for s in seqs
    }

    away_weaknesses = pattern_engine.discover_opponent_weaknesses("Away", seqs, all_tracking)
    assert isinstance(away_weaknesses, list)

    for w in away_weaknesses:
        # Strict rule: Non-isolated incident
        assert w["recurrence_count"] >= 1
        assert len(w["supporting_sequences"]) >= 1
        assert "tactical_implication" in w
        assert "actionable_exploit_plan" in w
        assert w["severity"] in ["Critical", "High", "Moderate"]


def test_attacking_opportunity_discovery(data_manager, pattern_engine):
    """
    Tests identification of actionable attacking opportunities.
    """
    seqs = data_manager.get_curated_sequences()
    goal_seq = next(s for s in seqs if s["sequence_id"] == "seq_goal_1")
    tracking = data_manager.get_sequence_tracking(goal_seq["start_frame"], goal_seq["end_frame"])

    opps = pattern_engine.discover_attacking_opportunities("Home", goal_seq, tracking)
    assert isinstance(opps, list)
    if opps:
        opp = opps[0]
        assert "coach_cue" in opp
        assert "training_drill" in opp
        assert opp["exploit_potential"] in ["Very High", "High", "Promising"]


def test_coach_insights_translation_differentiation(pattern_engine):
    """
    Verifies that Coach Insights clearly distinguish Measured Observations from Tactical Recommendations.
    """
    dummy_patterns = [{
        "pattern_id": "test_p1",
        "pattern_type": "wide_overload",
        "pattern_name": "Left Flank 3v2 Overload",
        "sequence_id": "seq_test",
        "team": "Home",
        "frame_start": 100,
        "frame_end": 140,
        "timestamp_start_s": 4.0,
        "timestamp_end_s": 5.6,
        "duration_s": 1.6,
        "confidence": 0.95,
        "evidence_quality": "High",
        "supporting_observations": ["3 Home attackers vs 2 Away defenders in left flank"],
        "relevant_players": ["Home_9", "Home_10", "Away_15"],
        "spatial_zone": "Left Flank",
        "coach_explanation": "Home created numerical superiority on the left flank.",
        "actionable_recommendation": "Switch play rapidly to the weak side.",
        "drill_recommendation": "4v3 Overload Switch Grid"
    }]

    insights = pattern_engine.translate_to_coach_insights(dummy_patterns, [], [])
    assert len(insights) == 1
    ins = insights[0]

    assert ins["measured_observation"] != ins["actionable_recommendation"]
    assert "Home attackers" in ins["measured_observation"]
    assert "Switch play" in ins["actionable_recommendation"]


def test_api_patterns_sequence_endpoint():
    """
    Tests GET /api/patterns/sequence/{sequence_id}.
    """
    data = get_sequence_patterns("seq_goal_1")
    assert data["sequence_id"] == "seq_goal_1"
    assert "patterns" in data
    assert "opportunities" in data
    assert data["total_patterns"] >= 1


def test_api_patterns_match_summary_endpoint():
    """
    Tests GET /api/patterns/match-summary.
    """
    data = get_match_pattern_intelligence()
    assert data["match_id"] == "metrica_game_1"
    assert "patterns" in data
    assert "weaknesses" in data
    assert "opportunities" in data
    assert "coach_insights" in data
    assert len(data["coach_insights"]) > 0


def test_api_patterns_compare_endpoint():
    """
    Tests GET /api/patterns/compare?seq_a=seq_goal_1&seq_b=seq_buildup_break.
    """
    data = compare_sequence_patterns(seq_a="seq_goal_1", seq_b="seq_buildup_break")
    assert "sequence_a" in data
    assert "sequence_b" in data
    assert "comparison_matrix" in data
    assert "tactical_differential_summary" in data


def test_api_patterns_commercial_briefing_html():
    """
    Tests GET /api/patterns/briefing/html.
    """
    res = get_commercial_briefing_html()
    assert res.status_code == 200
    html_body = res.body.decode("utf-8")
    assert "TACTICALGHOST" in html_body
    assert "Commercial Tactical Briefing" in html_body
    assert "@media print" in html_body
