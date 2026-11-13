"""
Test Metrica Sports real data loader and sequence extraction.
"""

import os
import pytest
from app.core.dataloader import MatchDataManager, PITCH_DIMS

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")


def test_match_data_manager_initialization():
    mgr = MatchDataManager(DATA_DIR)
    assert os.path.exists(mgr.events_path)
    assert os.path.exists(mgr.home_tracking_path)
    assert os.path.exists(mgr.away_tracking_path)


def test_load_events():
    mgr = MatchDataManager(DATA_DIR)
    ev = mgr.events
    assert len(ev) > 1000
    assert "Start Frame" in ev.columns
    assert "Start X [m]" in ev.columns
    assert "Start Y [m]" in ev.columns
    # Check metric coordinate boundaries
    valid_x = ev["Start X [m]"].dropna()
    assert valid_x.min() >= -5.0
    assert valid_x.max() <= PITCH_DIMS.length + 5.0


def test_curated_sequences():
    mgr = MatchDataManager(DATA_DIR)
    seqs = mgr.get_curated_sequences()
    assert len(seqs) >= 4
    goal_seq = seqs[0]
    assert goal_seq["sequence_id"] == "seq_goal_1"
    assert goal_seq["start_frame"] == 2180
    assert goal_seq["end_frame"] == 2320


def test_get_sequence_tracking():
    mgr = MatchDataManager(DATA_DIR)
    # Test loading a short 25-frame window (1 second) of Goal Sequence 1
    seq_data = mgr.get_sequence_tracking(start_frame=2240, end_frame=2265, fps=25.0)

    assert seq_data["total_frames"] == 26
    assert len(seq_data["frames"]) == 26
    frame_0 = seq_data["frames"][0]
    assert "ball" in frame_0
    assert "home_players" in frame_0
    assert "away_players" in frame_0
    assert len(frame_0["home_players"]) > 0
    assert len(frame_0["away_players"]) > 0

    # Verify player fields
    p0 = frame_0["home_players"][0]
    assert "x" in p0
    assert "y" in p0
    assert "vx" in p0
    assert "vy" in p0
    assert "speed" in p0
    assert 0.0 <= p0["x"] <= PITCH_DIMS.length
    assert 0.0 <= p0["y"] <= PITCH_DIMS.width
