import pytest
import os
from app.core.dataloader import MatchDataManager
from app.api.routes_comparison import comparison_engine, compare_sequences, validate_sequences, ValidationRequest

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")

def test_sequence_data_validation():
    dm = MatchDataManager(DATA_DIR)
    curated = dm.get_curated_sequences()
    seq_1 = curated[0]
    tracking_1 = dm.get_sequence_tracking(seq_1["start_frame"], seq_1["end_frame"])

    val_res = comparison_engine.validate_sequence_data(seq_1, tracking_1)
    assert val_res["is_valid"] is True
    assert val_res["ball_coverage_pct"] > 80.0
    assert val_res["player_coverage_pct"] > 80.0
    assert val_res["total_frames"] > 50

    # Test synthetic invalid empty tracking
    invalid_val = comparison_engine.validate_sequence_data(seq_1, {"frames": []})
    assert invalid_val["is_valid"] is False
    assert len(invalid_val["errors"]) > 0

def test_spatial_comparison_calculation():
    dm = MatchDataManager(DATA_DIR)
    curated = dm.get_curated_sequences()
    seq_a = curated[0] # Goal 1 (attacking: Home, defending: Away)
    seq_b = curated[2] # Buildup break (attacking: Away, defending: Home)

    track_a = dm.get_sequence_tracking(seq_a["start_frame"], seq_a["end_frame"])
    track_b = dm.get_sequence_tracking(seq_b["start_frame"], seq_b["end_frame"])

    spatial_a = comparison_engine.compute_spatial_summary(track_a, seq_a["attacking_team"], seq_a["defending_team"])
    spatial_b = comparison_engine.compute_spatial_summary(track_b, seq_b["attacking_team"], seq_b["defending_team"])

    assert spatial_a["avg_convex_hull_area_m2"] > 0
    assert spatial_b["avg_convex_hull_area_m2"] > 0
    assert 0.0 <= spatial_a["mid_pitch_control_attacking_pct"] <= 100.0
    assert 0.0 <= spatial_b["mid_pitch_control_attacking_pct"] <= 100.0
    assert spatial_a["avg_defensive_line_height_m"] > 0

def test_pressing_and_attacking_comparison():
    dm = MatchDataManager(DATA_DIR)
    curated = dm.get_curated_sequences()
    seq_a = curated[0]
    track_a = dm.get_sequence_tracking(seq_a["start_frame"], seq_a["end_frame"])

    pressing_a = comparison_engine.compute_pressing_summary(track_a, seq_a["attacking_team"], seq_a["defending_team"])
    assert "avg_pressure_score" in pressing_a
    assert "peak_closing_speed_mps" in pressing_a
    assert pressing_a["avg_pressure_score"] >= 0.0

    attacking_a = comparison_engine.compute_attacking_summary(
        track_a, track_a.get("events", []), seq_a["attacking_team"], seq_a["defending_team"]
    )
    assert attacking_a["total_off_ball_runs"] >= 0
    assert attacking_a["total_space_created_m2"] >= 0.0

def test_full_comparison_and_html_report_generation():
    # Test comparing Goal 1 vs Counter-Pressing Turnover
    res = compare_sequences(seq_a="seq_goal_1", seq_b="seq_pressing_turnover")
    assert "sequence_a" in res
    assert "sequence_b" in res
    assert "comparative_deltas" in res
    assert "comparative_findings" in res
    assert len(res["comparative_findings"]) > 0

    # HTML report generation
    html = comparison_engine.generate_html_report(res)
    assert "<!DOCTYPE html>" in html
    assert "TacticalGhost" in html
    assert "Goal Sequence 1" in html
    assert "Methodology & Validation" in html

def test_api_comparison_validation_endpoint():
    req = ValidationRequest(sequence_ids=["seq_goal_1", "seq_pressing_turnover"])
    val_out = validate_sequences(req)
    assert val_out["is_all_valid"] is True
    assert "seq_goal_1" in val_out["sequences"]
    assert "seq_pressing_turnover" in val_out["sequences"]
