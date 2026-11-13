"""
Unit tests for Module 2 (Defensive Vulnerability) and Module 3 (Pressing Intelligence).
"""

import pytest
from app.modules.defensive_vulnerability import DefensiveVulnerabilityDetector
from app.modules.pressing import PressingIntelligenceAnalyzer


def test_defensive_compactness_and_line_break():
    detector = DefensiveVulnerabilityDetector()

    # 4 defenders in line at x=80, plus 4 midfielders at x=65
    defenders = [
        {"player_id": "Away_2", "jersey_number": "2", "x": 80.0, "y": 15.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_3", "jersey_number": "3", "x": 80.0, "y": 28.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_4", "jersey_number": "4", "x": 80.0, "y": 42.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_5", "jersey_number": "5", "x": 80.0, "y": 55.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_6", "jersey_number": "6", "x": 65.0, "y": 20.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_7", "jersey_number": "7", "x": 65.0, "y": 34.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_8", "jersey_number": "8", "x": 65.0, "y": 48.0, "vx": 0.0, "vy": 0.0},
    ]
    attackers = [
        {"player_id": "Home_10", "jersey_number": "10", "x": 58.0, "y": 34.0, "vx": 1.0, "vy": 0.0}
    ]

    res = detector.analyze_defensive_frame(
        defending_players=defenders,
        attacking_players=attackers,
        ball_pos={"x": 58.0, "y": 34.0},
        carrier_pressure_score=0.2,
        defending_team="Away",
        defending_goal_x=105.0
    )

    assert res["convex_hull_area_m2"] > 0.0
    assert res["stretch_index_m"] > 0.0
    assert res["defensive_line_height_m"] == pytest.approx(80.0, 0.5)
    assert res["is_broken_line"] is False

    # Now introduce broken line: Defender 4 drops to x=84.0 (> 2.5m behind line)
    defenders[2]["x"] = 84.0
    res_broken = detector.analyze_defensive_frame(
        defending_players=defenders,
        attacking_players=attackers,
        ball_pos={"x": 58.0, "y": 34.0},
        carrier_pressure_score=0.2,
        defending_team="Away",
        defending_goal_x=105.0
    )
    assert res_broken["is_broken_line"] is True
    assert res_broken["broken_defender_id"] == "Away_4"


def test_pressing_closing_velocity_rule():
    """
    Verifies Rule 7 & 9: Proximity alone is not pressing.
    Closing velocity towards the carrier determines real pressure.
    """
    analyzer = PressingIntelligenceAnalyzer()
    carrier = (50.0, 34.0)

    # Case A: Defender 3.0m away sprinting TOWARDS carrier at 5 m/s
    defenders_closing = [
        {"player_id": "Away_8", "jersey_number": "8", "x": 53.0, "y": 34.0, "vx": -5.0, "vy": 0.0}
    ]
    res_closing = analyzer.evaluate_pressure_on_carrier(carrier, defenders_closing)

    # Case B: Defender 3.0m away retreating AWAY from carrier at -4 m/s (dropping off)
    defenders_retreating = [
        {"player_id": "Away_8", "jersey_number": "8", "x": 53.0, "y": 34.0, "vx": 4.0, "vy": 0.0}
    ]
    res_retreating = analyzer.evaluate_pressure_on_carrier(carrier, defenders_retreating)

    assert res_closing["total_pressure_score"] > res_retreating["total_pressure_score"]
    assert res_closing["primary_closing_speed_mps"] > 0.0
    assert res_retreating["primary_closing_speed_mps"] < 0.0


def test_cover_shadow_cone():
    analyzer = PressingIntelligenceAnalyzer(effective_block_radius=2.0)
    ball = (40.0, 34.0)

    # Defender directly in front of ball at (45.0, 34.0)
    defenders = [
        {"player_id": "Away_4", "jersey_number": "4", "x": 45.0, "y": 34.0}
    ]
    # Teammate 1 is directly behind defender at (55.0, 34.0) -> SHOULD be blocked
    # Teammate 2 is wide left at (50.0, 10.0) -> SHOULD NOT be blocked
    teammates = [
        {"player_id": "Home_9", "jersey_number": "9", "x": 55.0, "y": 34.0},
        {"player_id": "Home_7", "jersey_number": "7", "x": 50.0, "y": 10.0}
    ]

    shadows = analyzer.compute_cover_shadows(ball, defenders, teammates)
    assert len(shadows) == 1
    sh = shadows[0]
    assert "Home_9" in sh["blocked_teammates"]
    assert "Home_7" not in sh["blocked_teammates"]
