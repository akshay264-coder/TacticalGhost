"""
Unit tests for Module 4 (Player Interactions) and Module 5 (Tactical Decision Intelligence).
"""

import os
import pytest
from app.core.dataloader import MatchDataManager
from app.modules.player_interactions import PlayerInteractionAnalyzer
from app.modules.tactical_decision import TacticalDecisionIntelligenceEngine

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")


def test_passing_options_and_synergy_network():
    analyzer = PlayerInteractionAnalyzer()
    carrier = {"player_id": "Home_6", "jersey_number": "6", "x": 50.0, "y": 34.0, "vx": 0.0, "vy": 0.0}
    teammates = [
        carrier,
        {"player_id": "Home_10", "jersey_number": "10", "x": 65.0, "y": 34.0, "vx": 1.0, "vy": 0.0},
        {"player_id": "Home_8", "jersey_number": "8", "x": 55.0, "y": 15.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Home_7", "jersey_number": "7", "x": 55.0, "y": 55.0, "vx": 0.0, "vy": 0.0},
    ]
    defenders = [
        {"player_id": "Away_4", "jersey_number": "4", "x": 75.0, "y": 34.0, "vx": 0.0, "vy": 0.0},
        {"player_id": "Away_5", "jersey_number": "5", "x": 75.0, "y": 20.0, "vx": 0.0, "vy": 0.0},
    ]

    opts = analyzer.evaluate_passing_options(carrier, teammates, defenders)
    assert len(opts) == 3  # P10, P8, P7
    assert all(0.0 <= opt["viability_score"] <= 1.0 for opt in opts)
    assert all(0.0 <= opt["interception_risk"] <= 1.0 for opt in opts)

    # Test passing synergy network
    net = analyzer.build_passing_synergy_network(teammates, defenders, team_name="Home")
    assert net["nodes_count"] == 4
    assert net["viable_lanes_count"] > 0
    assert net["network_density"] >= 0.0


def test_tactical_decision_counterfactual_evaluation():
    engine = TacticalDecisionIntelligenceEngine()

    frame = {
        "frame": 2235,
        "time_s": 89.4,
        "ball": {"x": 68.0, "y": 34.0, "vx": 1.0, "vy": 0.0},
        "home_players": [
            {"player_id": "Home_10", "jersey_number": "10", "team": "Home", "x": 68.0, "y": 34.0, "vx": 2.0, "vy": 0.0},
            {"player_id": "Home_9", "jersey_number": "9", "team": "Home", "x": 88.0, "y": 32.0, "vx": 4.0, "vy": 0.0},
            {"player_id": "Home_8", "jersey_number": "8", "team": "Home", "x": 72.0, "y": 18.0, "vx": 1.0, "vy": 0.0},
        ],
        "away_players": [
            {"player_id": "Away_4", "jersey_number": "4", "team": "Away", "x": 82.0, "y": 25.0, "vx": 0.0, "vy": 0.0},
            {"player_id": "Away_5", "jersey_number": "5", "team": "Away", "x": 85.0, "y": 45.0, "vx": 0.0, "vy": 0.0},
        ]
    }

    actual_event = {
        "team": "Home",
        "type": "PASS",
        "from_player": "Player10",
        "to_player": "Player9"
    }

    decision_res = engine.evaluate_decision_frame(frame, actual_event=actual_event, attacking_team="Home")

    assert "ball_carrier" in decision_res
    assert decision_res["ball_carrier"]["jersey_number"] == "10"
    assert "alternatives" in decision_res
    assert len(decision_res["alternatives"]) >= 2

    # Verify actual observed decision is tagged
    actual_opt = next((a for a in decision_res["alternatives"] if a["is_actual_decision"]), None)
    assert actual_opt is not None
    assert actual_opt["target_jersey"] == "9"
    assert "xt_gain" in actual_opt
    assert "tactical_expected_value" in actual_opt


def test_decision_intelligence_on_real_metrica_goal():
    mgr = MatchDataManager(DATA_DIR)
    # Load frame 2260 in Goal Sequence 1
    seq_data = mgr.get_sequence_tracking(start_frame=2255, end_frame=2265, fps=25.0)
    frame_2260 = seq_data["frames"][5]

    engine = TacticalDecisionIntelligenceEngine()
    actual_event = {
        "team": "Home",
        "type": "PASS",
        "from_player": "Player10",
        "to_player": "Player9"
    }

    decision_res = engine.evaluate_decision_frame(frame_2260, actual_event=actual_event, attacking_team="Home")

    assert decision_res["total_options_evaluated"] > 0
    assert len(decision_res["alternatives"]) > 0
    for alt in decision_res["alternatives"]:
        assert alt["execution_success_prob"] >= 0.0
        assert alt["tactical_expected_value"] is not None
