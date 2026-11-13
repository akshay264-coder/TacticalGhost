"""
Integration tests for FastAPI Route handlers and TacticalGhost API endpoints.
"""

import pytest
from app.api.routes_sequences import list_sequences, get_sequence_details, get_sequence_tracking_data
from app.api.routes_analytics import (
    get_sequence_space_creation,
    get_sequence_defensive_vulnerability,
    get_sequence_pressing,
    get_sequence_interactions,
    get_sequence_decisions,
    compute_custom_pitch_control,
    PitchControlRequest
)
from app.main import health_check


def test_api_health():
    res = health_check()
    assert res["status"] == "healthy"
    assert "modules" in res
    assert len(res["modules"]) == 5


def test_api_sequences():
    seqs = list_sequences()
    assert len(seqs) >= 4
    goal_seq = next((s for s in seqs if s["sequence_id"] == "seq_goal_1"), None)
    assert goal_seq is not None

    details = get_sequence_details("seq_goal_1")
    assert details["sequence_id"] == "seq_goal_1"

    tracking_res = get_sequence_tracking_data("seq_goal_1")
    assert "tracking" in tracking_res
    assert len(tracking_res["tracking"]["frames"]) > 100


def test_api_space_creation():
    sc = get_sequence_space_creation("seq_goal_1")
    assert sc["sequence_id"] == "seq_goal_1"
    assert sc["total_runs_detected"] >= 1
    assert "runs" in sc
    run0 = sc["runs"][0]
    assert "decoy_score" in run0
    assert "space_created_m2" in run0


def test_api_defensive_vulnerability():
    dv = get_sequence_defensive_vulnerability("seq_goal_1", frame=2240)
    assert dv["frame"] == 2240
    assert "analysis" in dv
    analysis = dv["analysis"]
    assert "convex_hull_area_m2" in analysis
    assert "stretch_index_m" in analysis
    assert "defensive_line_height_m" in analysis


def test_api_pressing():
    pr = get_sequence_pressing("seq_goal_1", frame=2240)
    assert pr["frame"] == 2240
    assert "pressure" in pr
    assert "cover_shadows" in pr
    assert 0.0 <= pr["pressure"]["total_pressure_score"] <= 1.0


def test_api_player_interactions():
    pi = get_sequence_interactions("seq_goal_1", frame=2240)
    assert pi["frame"] == 2240
    assert "passing_options" in pi
    assert len(pi["passing_options"]) > 0
    opt0 = pi["passing_options"][0]
    assert 0.0 <= opt0["viability_score"] <= 1.0
    assert "interception_risk" in opt0


def test_api_decisions():
    dc = get_sequence_decisions("seq_goal_1", frame=2235)
    assert len(dc["decision_evaluations"]) >= 1
    eval0 = dc["decision_evaluations"][0]["evaluation"]
    assert "alternatives" in eval0
    assert len(eval0["alternatives"]) >= 2
    for alt in eval0["alternatives"]:
        assert "tactical_expected_value" in alt
        assert "execution_success_prob" in alt


def test_api_pitch_control_post():
    req = PitchControlRequest(
        home_players=[{"x": 50.0, "y": 34.0, "vx": 1.0, "vy": 0.0}],
        away_players=[{"x": 70.0, "y": 34.0, "vx": -1.0, "vy": 0.0}],
        grid_cells_x=20,
        grid_cells_y=14
    )
    pc = compute_custom_pitch_control(req)
    assert "pitch_control_home" in pc
    assert "pitch_control_away" in pc
    assert pc["home_controlled_area_m2"] > 0
