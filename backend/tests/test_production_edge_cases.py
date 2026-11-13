"""
Production Readiness & Edge-Case Integration Tests.
Validates:
- Invalid sequence ID error handling (404)
- Out-of-bound frame error handling (404)
- Missing ball coordinates & empty player frames (no 500 crashes)
- In-memory sequence caching performance (sub-millisecond retrieval)
- Period 2 frame range indexing
"""

import os
import time
import pytest
from fastapi import HTTPException
from app.api.routes_sequences import list_sequences, get_sequence_details, get_sequence_tracking_data
from app.api.routes_analytics import (
    get_sequence_space_creation,
    get_sequence_defensive_vulnerability,
    get_sequence_pressing,
    get_sequence_interactions,
    get_sequence_decisions
)
from app.core.dataloader import MatchDataManager, load_metrica_tracking_slice

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")
from app.modules.tactical_decision import TacticalDecisionIntelligenceEngine
from app.modules.defensive_vulnerability import DefensiveVulnerabilityDetector


def test_invalid_sequence_id_handling():
    """All endpoints must raise 404 on non-existent sequence IDs."""
    invalid_id = "non_existent_seq_123"

    with pytest.raises(HTTPException) as exc:
        get_sequence_details(invalid_id)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_tracking_data(invalid_id)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_space_creation(invalid_id)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_defensive_vulnerability(invalid_id)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_pressing(invalid_id)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_interactions(invalid_id, frame=2240)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_decisions(invalid_id)
    assert exc.value.status_code == 404


def test_out_of_bounds_frame_handling():
    """Frame-level endpoints must raise 404 when requested frame is not in sequence."""
    seq_id = "seq_goal_1"
    invalid_frame = 999999

    with pytest.raises(HTTPException) as exc:
        get_sequence_defensive_vulnerability(seq_id, frame=invalid_frame)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_pressing(seq_id, frame=invalid_frame)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_interactions(seq_id, frame=invalid_frame)
    assert exc.value.status_code == 404

    with pytest.raises(HTTPException) as exc:
        get_sequence_decisions(seq_id, frame=invalid_frame)
    assert exc.value.status_code == 404


def test_missing_ball_coordinates_graceful_handling():
    """When ball coordinates are None (out of bounds/hidden), endpoints must return graceful fallbacks without 500 error."""
    from app.api.routes_analytics import data_manager as analytics_data_manager
    tracking = analytics_data_manager.get_sequence_tracking(2180, 2320)
    frame_obj = tracking["frames"][0]
    frame_num = frame_obj["frame"]

    # Temporarily set ball to None in the active cached tracking frame
    orig_ball_x = frame_obj["ball"]["x"]
    orig_ball_y = frame_obj["ball"]["y"]
    frame_obj["ball"]["x"] = None
    frame_obj["ball"]["y"] = None

    try:
        res = get_sequence_interactions("seq_goal_1", frame=frame_num)
        assert res["ball_carrier"] is None
        assert res["passing_options"] == []
        assert res["passing_network"]["viable_lanes_count"] == 0
    finally:
        frame_obj["ball"]["x"] = orig_ball_x
        frame_obj["ball"]["y"] = orig_ball_y

    # 2. Tactical decision engine with missing ball
    engine = TacticalDecisionIntelligenceEngine()
    empty_frame = {
        "frame": 500,
        "time_s": 20.0,
        "ball": {"x": None, "y": None},
        "home_players": [{"player_id": "Home_1", "x": 10, "y": 10}],
        "away_players": [{"player_id": "Away_1", "x": 20, "y": 20}]
    }
    dec_res = engine.evaluate_decision_frame(empty_frame, attacking_team="Home")
    assert dec_res["ball_carrier"] is None
    assert dec_res["alternatives"] == []
    assert dec_res["total_options_evaluated"] == 0


def test_insufficient_defenders_graceful_handling():
    """Defensive detector must return a valid default structure if < 3 defenders exist."""
    detector = DefensiveVulnerabilityDetector()
    res = detector.analyze_defensive_frame(
        defending_players=[{"player_id": "Away_1", "x": 50, "y": 34}],  # only 1 defender
        attacking_players=[],
        ball_pos={"x": 50, "y": 34}
    )
    assert "convex_hull_area_m2" in res
    assert res["convex_hull_area_m2"] == 0.0
    assert res["is_broken_line"] is False
    assert res["vulnerabilities"] == []


def test_sequence_tracking_cache_performance():
    """Second retrieval of sequence tracking must be served from cache in under 5 milliseconds."""
    mgr = MatchDataManager(DATA_DIR)
    # First call (reads from file and populates cache)
    _ = mgr.get_sequence_tracking(start_frame=2180, end_frame=2250)

    # Second call (must be served from in-memory cache)
    t0 = time.perf_counter()
    cached_res = mgr.get_sequence_tracking(start_frame=2180, end_frame=2250)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    assert cached_res["total_frames"] == 71
    assert elapsed_ms < 5.0, f"Cache retrieval took too long: {elapsed_ms:.2f}ms"


def test_second_half_period_2_frame_loading():
    """Verifies that frame numbers in the second half (Period 2, frames > 71268) load correctly."""
    mgr = MatchDataManager(DATA_DIR)
    # Frame 89800 is during the second half of Game 1
    p2_slice = mgr.get_sequence_tracking(start_frame=89800, end_frame=89825)
    assert p2_slice["total_frames"] == 26
    f0 = p2_slice["frames"][0]
    assert f0["frame"] == 89800
    assert len(f0["home_players"]) > 0
    assert len(f0["away_players"]) > 0
