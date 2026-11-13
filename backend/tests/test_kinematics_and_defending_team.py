import pytest
import numpy as np
from app.core.pitch import compute_kinematics
from app.core.dataloader import MatchDataManager
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")

def test_compute_kinematics_derivatives():
    # 25 frames, moving linearly with constant acceleration: x(t) = 0.5 * a * t^2
    fps = 25.0
    t = np.linspace(0, 1.0, 25)
    accel_const = 3.0  # 3 m/s^2
    x = 0.5 * accel_const * (t ** 2)
    y = np.zeros_like(x)
    
    vx, vy, spd, ax, ay, acc = compute_kinematics(x, y, fps=fps)
    assert len(vx) == 25
    assert len(ax) == 25
    # Velocity at t=1s should be approx 3.0 m/s
    assert np.isclose(spd[-1], 3.0, atol=0.5)
    # Tangential acceleration should be positive around 3.0 m/s^2
    assert np.all(acc > 0.0)

def test_sequence_tracking_acceleration_and_distance():
    dm = MatchDataManager(DATA_DIR)
    tracking = dm.get_sequence_tracking(start_frame=2180, end_frame=2220)
    frames = tracking["frames"]
    assert len(frames) > 0
    first_frame = frames[0]
    last_frame = frames[-1]
    
    # Check that players have acceleration and cumulative_distance_m
    home_p = first_frame["home_players"][0]
    assert "acceleration" in home_p
    assert "cumulative_distance_m" in home_p
    assert isinstance(home_p["acceleration"], (int, float))
    
    # Last frame cumulative distance should be >= first frame
    last_p = next((p for p in last_frame["home_players"] if p["player_id"] == home_p["player_id"]), None)
    if last_p:
        assert last_p["cumulative_distance_m"] >= home_p["cumulative_distance_m"]

def test_defensive_vulnerability_team_switch():
    from app.api.routes_analytics import get_sequence_defensive_vulnerability
    # Sequence 1 default defending team is Away
    res_away = get_sequence_defensive_vulnerability(sequence_id="seq_goal_1", frame=2235, defending_team="Away")
    assert res_away["analysis"]["defending_team"] == "Away"
    
    # Switch defending team to Home
    res_home = get_sequence_defensive_vulnerability(sequence_id="seq_goal_1", frame=2235, defending_team="Home")
    assert res_home["analysis"]["defending_team"] == "Home"
