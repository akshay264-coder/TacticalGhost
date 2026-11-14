"""
Opponent Intelligence & Multi-Match Analysis API Router.
Provides RESTful endpoints for match registry, compatibility validation,
tactical DNA profiling, cross-match patterns, weakness discovery,
tactical evolution, player intelligence, and commercial report generation.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Query, HTTPException, status
from fastapi.responses import HTMLResponse

from app.modules.multi_match.match_registry import (
    MatchRegistryService,
    MatchMetadata,
    MatchCompatibilityScore,
    DataQualityReport
)
from app.modules.multi_match.opponent_dna import (
    OpponentTacticalDNAEngine,
    OpponentTacticalProfile
)
from app.modules.multi_match.opponent_patterns import (
    CrossMatchPatternEngine,
    CrossMatchTacticalPattern
)
from app.modules.multi_match.opponent_weakness import (
    OpponentVulnerabilityAndStrengthEngine,
    OpponentWeakness,
    OpponentStrength
)
from app.modules.multi_match.tactical_evolution import (
    TacticalEvolutionEngine,
    OpponentTacticalEvolutionReport
)
from app.modules.multi_match.player_intelligence import (
    OpponentPlayerIntelligenceEngine,
    OpponentSquadIntelligence
)
from app.modules.multi_match.recommendations import (
    OpponentPreparationEngine,
    OpponentPreparationStrategy
)
from app.modules.multi_match.report_generator import generate_opponent_briefing_html

router = APIRouter(prefix="/api/opponent", tags=["Opponent Intelligence"])

# Shared service instances
registry_service = MatchRegistryService()
dna_engine = OpponentTacticalDNAEngine()
pattern_engine = CrossMatchPatternEngine()
vuln_strength_engine = OpponentVulnerabilityAndStrengthEngine()
evolution_engine = TacticalEvolutionEngine()
player_engine = OpponentPlayerIntelligenceEngine()
prep_engine = OpponentPreparationEngine()


def _resolve_str(val: Any, default: str) -> str:
    return val if isinstance(val, str) else default


def _resolve_opt_str(val: Any) -> Optional[str]:
    return val if isinstance(val, str) else None


@router.get("/matches", response_model=List[MatchMetadata])
def list_registered_matches(team: Optional[str] = Query(None, description="Filter by team name")):
    """Lists all registered matches in the registry."""
    return registry_service.list_matches(team=_resolve_opt_str(team))


@router.get("/matches/compatibility", response_model=MatchCompatibilityScore)
def check_match_compatibility(
    match_ids: str = Query(
        "metrica_game_1,metrica_game_2",
        description="Comma-separated list of match IDs to validate"
    )
):
    """
    Validates cross-match data compatibility and computes the transparent Data Compatibility Score.
    """
    raw = _resolve_str(match_ids, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw.split(",") if m.strip()]
    try:
        return registry_service.validate_compatibility(m_list)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/matches/{match_id}", response_model=MatchMetadata)
def get_match_details(match_id: str):
    """Retrieves metadata and data quality report for a specific match."""
    match = registry_service.get_match(match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match '{match_id}' not found in registry."
        )
    return match


@router.post("/matches/register", response_model=MatchMetadata)
def register_match(match_data: Dict[str, Any]):
    """Registers a new match into the multi-match registry."""
    try:
        return registry_service.register_match(match_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to register match: {str(e)}"
        )


@router.get("/profile", response_model=OpponentTacticalProfile)
def get_opponent_profile(
    team: str = Query("Away", description="Target opponent team ('Away' or 'Home')"),
    matches: Optional[str] = Query(
        "metrica_game_1,metrica_game_2",
        description="Comma-separated list of match IDs"
    )
):
    """
    Constructs the multi-match tactical DNA profile across attacking, defensive,
    pressing, and transition dimensions.
    """
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return dna_engine.compute_opponent_profile(opponent_team=raw_team, match_ids=m_list)


@router.get("/patterns", response_model=List[CrossMatchTacticalPattern])
def get_cross_match_patterns(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Identifies recurring tactical patterns confirmed across multiple matches."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return pattern_engine.get_cross_match_patterns(opponent_team=raw_team, match_ids=m_list)


@router.get("/weaknesses", response_model=List[OpponentWeakness])
def get_opponent_weaknesses(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Discovers systemic opponent vulnerabilities with explainable scoring."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return vuln_strength_engine.discover_weaknesses(opponent_team=raw_team, match_ids=m_list)


@router.get("/strengths", response_model=List[OpponentStrength])
def get_opponent_strengths(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Discovers recurring opponent strengths and tactical counter-measures."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return vuln_strength_engine.discover_strengths(opponent_team=raw_team, match_ids=m_list)


@router.get("/evolution", response_model=OpponentTacticalEvolutionReport)
def get_tactical_evolution(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Analyzes chronological tactical evolution and parameter shifts between matches."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return evolution_engine.analyze_tactical_evolution(opponent_team=raw_team, match_ids=m_list)


@router.get("/players", response_model=OpponentSquadIntelligence)
def get_player_intelligence(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Provides player-level intelligence and multi-match role evaluations."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return player_engine.get_opponent_squad_intelligence(opponent_team=raw_team, match_ids=m_list)


@router.get("/preparation", response_model=OpponentPreparationStrategy)
def get_preparation_strategy(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Generates an actionable tactical preparation plan and prescribed training week agenda."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]
    return prep_engine.generate_preparation_strategy(opponent_team=raw_team, match_ids=m_list)


@router.get("/report/html", response_class=HTMLResponse)
def get_commercial_briefing_html(
    team: str = Query("Away", description="Target opponent team"),
    matches: Optional[str] = Query("metrica_game_1,metrica_game_2")
):
    """Generates a standalone, print-optimized commercial HTML tactical briefing."""
    raw_team = _resolve_str(team, "Away")
    raw_matches = _resolve_str(matches, "metrica_game_1,metrica_game_2")
    m_list = [m.strip() for m in raw_matches.split(",") if m.strip()]

    profile = dna_engine.compute_opponent_profile(opponent_team=raw_team, match_ids=m_list)
    patterns = pattern_engine.get_cross_match_patterns(opponent_team=raw_team, match_ids=m_list)
    weaknesses = vuln_strength_engine.discover_weaknesses(opponent_team=raw_team, match_ids=m_list)
    strengths = vuln_strength_engine.discover_strengths(opponent_team=raw_team, match_ids=m_list)
    evolution = evolution_engine.analyze_tactical_evolution(opponent_team=raw_team, match_ids=m_list)
    squad = player_engine.get_opponent_squad_intelligence(opponent_team=raw_team, match_ids=m_list)
    preparation = prep_engine.generate_preparation_strategy(opponent_team=raw_team, match_ids=m_list)
    compatibility = registry_service.validate_compatibility(m_list)

    html_content = generate_opponent_briefing_html(
        profile=profile,
        patterns=patterns,
        weaknesses=weaknesses,
        strengths=strengths,
        evolution=evolution,
        squad=squad,
        preparation=preparation,
        compatibility=compatibility
    )

    return HTMLResponse(content=html_content)
