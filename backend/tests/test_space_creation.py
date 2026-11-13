"""
Unit tests for Module 1: Space Creation Intelligence.
"""

import os
import pytest
from app.core.dataloader import MatchDataManager
from app.modules.space_creation import SpaceCreationAnalyzer

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")


def test_space_creation_synthetic_run():
    analyzer = SpaceCreationAnalyzer()

    # Create synthetic 20-frame sequence (0.8s) of an off-ball run
    # Attacking Player 9 runs forward from x=60 to x=72 at 6 m/s
    # Defender 3 follows closely from x=62 to x=73
    frames = []
    for f in range(20):
        t = f / 25.0
        p9_x = 60.0 + 15.0 * t
        d3_x = 62.0 + 14.0 * t
        frames.append({
            "frame": 100 + f,
            "ball": {"x": 45.0, "y": 34.0, "vx": 0.0, "vy": 0.0},
            "home_players": [
                {"player_id": "Home_9", "jersey_number": "9", "team": "Home", "x": p9_x, "y": 34.0, "vx": 6.0, "vy": 0.0, "speed": 6.0},
                {"player_id": "Home_10", "jersey_number": "10", "team": "Home", "x": 45.0, "y": 34.0, "vx": 0.0, "vy": 0.0, "speed": 0.0}
            ],
            "away_players": [
                {"player_id": "Away_3", "jersey_number": "3", "team": "Away", "x": d3_x, "y": 34.0, "vx": 5.6, "vy": 0.0, "speed": 5.6}
            ]
        })

    runs = analyzer.identify_off_ball_runs(frames, attacking_team="Home", min_run_duration_frames=10)
    assert len(runs) >= 1
    run9 = next((r for r in runs if r["jersey_number"] == "9"), None)
    assert run9 is not None
    assert run9["run_type"] == "vertical_penetration"
    assert run9["dragged_defender_id"] == "Away_3"
    assert run9["marker_tracking_index"] > 0.5
    assert 0.0 <= run9["decoy_score"] <= 1.0


def test_space_creation_on_real_goal_sequence():
    mgr = MatchDataManager(DATA_DIR)
    # Goal Sequence 1: frames 2180 to 2320
    seq_data = mgr.get_sequence_tracking(start_frame=2220, end_frame=2290, fps=25.0)

    analyzer = SpaceCreationAnalyzer()
    runs = analyzer.identify_off_ball_runs(seq_data["frames"], attacking_team="Home")

    # In Goal sequence 1, there are real attacking off-ball runs into the box
    assert len(runs) > 0
    for r in runs:
        assert 0.0 <= r["decoy_score"] <= 1.0
        assert r["distance_m"] > 3.0
        assert len(r["explanation"]) > 20
