"""
Tests for Pitch coordinate calculations, kinematics, and Pitch Control Engine.
"""

import numpy as np
import pytest
from app.core.pitch import metrica_to_metric, metric_to_centered, compute_velocity, PITCH_DIMS
from app.core.pitch_control import PitchControlEngine, PitchControlConfig


def test_pitch_dimensions():
    assert PITCH_DIMS.length == 105.0
    assert PITCH_DIMS.width == 68.0
    assert PITCH_DIMS.center_circle_radius == 9.15


def test_coordinate_transforms():
    # Center spot in Metrica is (0.5, 0.5)
    xm, ym = metrica_to_metric(0.5, 0.5)
    assert pytest.approx(xm, 0.01) == 52.5
    assert pytest.approx(ym, 0.01) == 34.0

    # Origin (0.0, 0.0) in Metrica (top-left) with inverted Y should map to (0, 68)
    xm0, ym0 = metrica_to_metric(0.0, 0.0)
    assert pytest.approx(xm0, 0.01) == 0.0
    assert pytest.approx(ym0, 0.01) == 68.0

    # Centered transform
    xc, yc = metric_to_centered(xm, ym)
    assert pytest.approx(xc, 0.01) == 0.0
    assert pytest.approx(yc, 0.01) == 0.0


def test_velocity_computation():
    # 25 fps, moving 2.5 meters in 1 second (25 frames) along X -> speed = 2.5 m/s
    t = np.linspace(0, 1, 25)
    x = 10.0 + 2.5 * t
    y = np.ones(25) * 20.0

    vx, vy, speed = compute_velocity(x, y, fps=25.0)
    assert len(vx) == 25
    assert pytest.approx(np.mean(speed), 0.1) == 2.5
    assert pytest.approx(np.mean(vx), 0.1) == 2.5
    assert pytest.approx(np.mean(vy), 0.1) == 0.0


def test_pitch_control_surface():
    engine = PitchControlEngine()
    home_players = [
        {"x": 50.0, "y": 34.0, "vx": 1.0, "vy": 0.0},
        {"x": 60.0, "y": 30.0, "vx": 2.0, "vy": 0.0},
        {"x": 60.0, "y": 38.0, "vx": 2.0, "vy": 0.0},
    ]
    away_players = [
        {"x": 75.0, "y": 34.0, "vx": -1.0, "vy": 0.0},
        {"x": 80.0, "y": 25.0, "vx": -0.5, "vy": 0.0},
        {"x": 80.0, "y": 43.0, "vx": -0.5, "vy": 0.0},
    ]

    res = engine.calculate_pitch_control_surface(
        home_players, away_players, grid_cells_x=30, grid_cells_y=20
    )

    assert "pitch_control_home" in res
    assert "pitch_control_away" in res
    assert "home_controlled_area_m2" in res
    assert res["home_pitch_control_pct"] + res["away_pitch_control_pct"] == pytest.approx(100.0, 0.2)


def test_location_control_query():
    engine = PitchControlEngine()
    # Attacker right next to target
    attacking_players = [{"x": 70.0, "y": 34.0, "vx": 2.0, "vy": 0.0}]
    # Defender 20 meters away
    defending_players = [{"x": 90.0, "y": 34.0, "vx": 0.0, "vy": 0.0}]

    eval_result = engine.evaluate_location_control(
        target_x=72.0, target_y=34.0,
        attacking_players=attacking_players,
        defending_players=defending_players
    )

    assert eval_result["attacking_prob"] > 0.8
    assert eval_result["arrival_advantage_sec"] > 0.0
