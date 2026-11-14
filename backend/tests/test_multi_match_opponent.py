"""
Unit & Integration Tests for Phase 17: Multi-Match Intelligence & Opponent Analysis Engine.
Validates Match Registry, Compatibility Scoring, Tactical DNA, Cross-Match Patterns,
Weaknesses & Strengths, Tactical Evolution, Player Intelligence, and API routes.
"""

import pytest
from app.modules.multi_match.match_registry import MatchRegistryService
from app.modules.multi_match.opponent_dna import OpponentTacticalDNAEngine
from app.modules.multi_match.opponent_patterns import CrossMatchPatternEngine
from app.modules.multi_match.opponent_weakness import OpponentVulnerabilityAndStrengthEngine
from app.modules.multi_match.tactical_evolution import TacticalEvolutionEngine
from app.modules.multi_match.player_intelligence import OpponentPlayerIntelligenceEngine
from app.modules.multi_match.recommendations import OpponentPreparationEngine
from app.api.routes_opponent import (
    list_registered_matches,
    get_match_details,
    register_match,
    check_match_compatibility,
    get_opponent_profile,
    get_cross_match_patterns,
    get_opponent_weaknesses,
    get_opponent_strengths,
    get_tactical_evolution,
    get_player_intelligence,
    get_preparation_strategy,
    get_commercial_briefing_html
)


def test_match_registry_default_matches():
    registry = MatchRegistryService()
    matches = registry.list_matches()
    assert len(matches) >= 2
    match_ids = [m.match_id for m in matches]
    assert "metrica_game_1" in match_ids
    assert "metrica_game_2" in match_ids

    m1 = registry.get_match("metrica_game_1")
    assert m1 is not None
    assert m1.home_team == "Home"
    assert m1.away_team == "Away"
    assert m1.tracking_fps == 25.0
    assert m1.data_quality_report.completeness_pct >= 99.0


def test_match_registration_custom():
    registry = MatchRegistryService()
    custom_meta = {
        "match_id": "custom_match_101",
        "match_date": "2020-03-10",
        "competition": "Premier Showcase",
        "season": "2019/2020",
        "home_team": "Home",
        "away_team": "Away",
        "final_score": "1 - 1",
        "data_source": "Metrica Normalized",
        "tracking_fps": 25.0,
        "total_frames": 135000,
        "completeness_pct": 99.2,
        "tactical_summary": "Intense midfield battle"
    }
    registered = registry.register_match(custom_meta)
    assert registered.match_id == "custom_match_101"
    assert registered.data_quality_report.completeness_pct == 99.2
    assert registry.get_match("custom_match_101") is not None


def test_match_compatibility_scoring():
    registry = MatchRegistryService()
    compat = registry.validate_compatibility(["metrica_game_1", "metrica_game_2"])
    assert compat.is_compatible is True
    assert compat.overall_score >= 80.0
    assert len(compat.components) == 5
    # Verify components
    comp_names = [c.name for c in compat.components]
    assert "Pitch Dimensions & Coordinates" in comp_names
    assert "Sampling Frequency Consistency" in comp_names
    assert "Team Identity Continuity" in comp_names


def test_opponent_tactical_dna_profile():
    dna_engine = OpponentTacticalDNAEngine()
    profile = dna_engine.compute_opponent_profile(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert profile.team == "Away"
    assert len(profile.matches_analyzed) == 2
    # Attacking DNA checks
    assert profile.attacking_dna.progression_velocity_mps > 0
    assert profile.attacking_dna.preferred_flank in ["Left Wing", "Central", "Right Wing", "Central & Left Half-Space"]
    assert profile.attacking_dna.channel_distribution.left_wing_pct > 0
    # Defensive DNA checks
    assert profile.defensive_dna.mean_defensive_line_height_m > 0
    assert profile.defensive_dna.mean_compactness_m2 > 0
    assert profile.defensive_dna.inter_line_gap_m > 0
    # Pressing DNA checks
    assert profile.pressing_dna.mean_pressure_intensity_pct > 0
    assert profile.pressing_dna.peak_closing_velocity_mps > 0
    # Radar visualization metrics
    assert "Defensive Compactness" in profile.radar_metrics
    assert "Pressing Intensity" in profile.radar_metrics


def test_cross_match_pattern_recurrence():
    pattern_engine = CrossMatchPatternEngine()
    patterns = pattern_engine.get_cross_match_patterns(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(patterns) >= 2
    for p in patterns:
        assert p.recurrence_rate_pct > 0
        assert p.confidence_level in ["HIGH", "MODERATE", "DEVELOPING"]
        assert len(p.matches_present) >= 2
        assert len(p.supporting_sequences) >= 2
        assert len(p.measured_observation) > 10
        assert len(p.suggested_coaching_action) > 10


def test_opponent_weaknesses_explainable_score():
    vuln_engine = OpponentVulnerabilityAndStrengthEngine()
    weaknesses = vuln_engine.discover_weaknesses(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(weaknesses) >= 2
    for w in weaknesses:
        assert w.vulnerability_score >= 0 and w.vulnerability_score <= 100
        assert w.severity in ["CRITICAL", "HIGH", "MODERATE", "LOW"]
        assert len(w.matches_present) >= 2
        assert len(w.supporting_evidence) >= 2
        assert w.scoring_breakdown["severity_component"] > 0
        assert len(w.prescribed_drill) > 5


def test_opponent_strengths_and_countermeasures():
    vuln_engine = OpponentVulnerabilityAndStrengthEngine()
    strengths = vuln_engine.discover_strengths(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(strengths) >= 2
    for s in strengths:
        assert s.strength_score > 0
        assert s.impact_level in ["DOMINANT", "HIGH", "MODERATE"]
        assert len(s.recommended_countermeasure) > 10
        assert len(s.prescribed_drill) > 5


def test_tactical_evolution_deltas():
    evo_engine = TacticalEvolutionEngine()
    evo = evo_engine.analyze_tactical_evolution(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(evo.timeline) >= 2
    assert len(evo.metric_deltas) >= 4
    # Check deltas
    def_line_delta = next((d for d in evo.metric_deltas if d.metric_name == "Defensive Line Height"), None)
    assert def_line_delta is not None
    assert def_line_delta.delta_value != 0
    assert isinstance(def_line_delta.is_statistically_significant, bool)
    assert len(evo.strategic_recommendations) >= 1


def test_player_intelligence_squad():
    pl_engine = OpponentPlayerIntelligenceEngine()
    squad = pl_engine.get_opponent_squad_intelligence(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(squad.all_players) >= 4
    assert len(squad.key_attacking_threats) >= 1
    assert len(squad.progression_architects) >= 1
    assert len(squad.defensive_anchors) >= 1

    # Check key threat Away_24
    p24 = next((p for p in squad.all_players if p.player_id == "Away_24"), None)
    assert p24 is not None
    assert p24.peak_velocity_mps > 6.0
    assert p24.sprint_frequency_per_match > 10.0


def test_preparation_strategy_and_drills():
    prep_engine = OpponentPreparationEngine()
    prep = prep_engine.generate_preparation_strategy(opponent_team="Away", match_ids=["metrica_game_1", "metrica_game_2"])
    assert len(prep.primary_attacking_exploits) >= 2
    assert len(prep.primary_defensive_countermeasures) >= 2
    assert len(prep.training_week_agenda) >= 3
    assert len(prep.executive_game_plan) > 50


def test_api_opponent_endpoints():
    # 1. Matches list
    matches = list_registered_matches()
    assert len(matches) >= 2

    # 2. Match details
    m1 = get_match_details("metrica_game_1")
    assert m1.match_id == "metrica_game_1"

    # 3. Compatibility
    compat = check_match_compatibility("metrica_game_1,metrica_game_2")
    assert compat.is_compatible is True

    # 4. Profile
    profile = get_opponent_profile("Away", "metrica_game_1,metrica_game_2")
    assert profile.team == "Away"

    # 5. Patterns
    patterns = get_cross_match_patterns("Away", "metrica_game_1,metrica_game_2")
    assert len(patterns) >= 2

    # 6. Weaknesses
    weaknesses = get_opponent_weaknesses("Away", "metrica_game_1,metrica_game_2")
    assert len(weaknesses) >= 2

    # 7. Strengths
    strengths = get_opponent_strengths("Away", "metrica_game_1,metrica_game_2")
    assert len(strengths) >= 2

    # 8. Evolution
    evolution = get_tactical_evolution("Away", "metrica_game_1,metrica_game_2")
    assert len(evolution.metric_deltas) >= 4

    # 9. Players
    squad = get_player_intelligence("Away", "metrica_game_1,metrica_game_2")
    assert len(squad.all_players) >= 4

    # 10. Preparation
    prep = get_preparation_strategy("Away", "metrica_game_1,metrica_game_2")
    assert len(prep.primary_attacking_exploits) >= 2

    # 11. HTML Report
    html_resp = get_commercial_briefing_html("Away", "metrica_game_1,metrica_game_2")
    assert "TACTICALGHOST" in html_resp.body.decode()
    assert "Multi-Match Opponent Intelligence" in html_resp.body.decode()
