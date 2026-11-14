"""
TacticalGhost — Player Scouting & Recruitment Intelligence API Routes.
Exposes endpoints for player profiles, off-ball intelligence, role classification,
pairwise comparison, tactical fit sensitivity, candidate shortlists, and scouting dossiers.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field

from app.modules.scouting.scouting_profile import (
    ScoutingProfileEngine,
    PlayerScoutingProfile
)
from app.modules.scouting.off_ball_contribution import (
    OffBallContributionEngine,
    OffBallContribution
)
from app.modules.scouting.player_role_classifier import (
    PlayerRoleClassifier,
    RoleClassificationResult
)
from app.modules.scouting.player_comparison import (
    PlayerComparisonEngine,
    PlayerComparisonResult
)
from app.modules.scouting.tactical_fit import (
    TacticalFitEngine,
    PlayerTacticalFitResult
)
from app.modules.scouting.shortlist_manager import (
    ShortlistManager,
    ShortlistCandidate
)
from app.modules.scouting.scouting_report import (
    ScoutingReportGenerator
)

router = APIRouter(prefix="/scouting", tags=["Player Scouting Intelligence"])

# Singletons for memory efficiency & fast caching
profile_engine = ScoutingProfileEngine()
off_ball_engine = OffBallContributionEngine()
role_classifier = PlayerRoleClassifier()
fit_engine = TacticalFitEngine(profile_engine)
comparison_engine = PlayerComparisonEngine(profile_engine)
shortlist_manager = ShortlistManager(profile_engine)
report_generator = ScoutingReportGenerator(
    profile_engine,
    off_ball_engine,
    role_classifier,
    fit_engine
)


class CompareRequest(BaseModel):
    player_a_id: str
    player_b_id: str
    apply_role_normalization: bool = True


class TacticalFitRequest(BaseModel):
    player_id: str
    philosophy_key: str = "HIGH_PRESS_HIGH_LINE"
    custom_weights: Optional[Dict[str, float]] = None


class ShortlistAddRequest(BaseModel):
    player_id: str
    notes: Optional[str] = ""
    tags: Optional[List[str]] = None
    target_philosophy: Optional[str] = "HIGH_PRESS_HIGH_LINE"
    fit_score: Optional[float] = 85.0


class ShortlistNotesRequest(BaseModel):
    notes: str
    tags: Optional[List[str]] = None


@router.get("/players", response_model=List[PlayerScoutingProfile])
def list_scouted_players(
    team: Optional[str] = Query(None, description="Filter by team (Home, Away)"),
    role: Optional[str] = Query(None, description="Filter by tactical role"),
    min_quality: float = Query(0.0, description="Minimum data quality score")
):
    """Lists all profiled players with optional role, team, and data quality filters."""
    return profile_engine.list_all_profiles(
        team_filter=team,
        role_filter=role,
        min_quality=min_quality
    )


@router.get("/players/{player_id}", response_model=PlayerScoutingProfile)
def get_player_profile(player_id: str):
    """Retrieves an individual player's tactical scouting profile."""
    profile = profile_engine.get_player_profile(player_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Player '{player_id}' not found.")
    return profile


@router.get("/players/{player_id}/off-ball", response_model=List[OffBallContribution])
def get_player_off_ball(player_id: str):
    """Retrieves verified off-ball contributions (decoy runs, space creation) for a player."""
    return off_ball_engine.get_player_off_ball_contributions(player_id)


@router.get("/players/{player_id}/role", response_model=RoleClassificationResult)
def get_player_role_classification(player_id: str):
    """Computes explainable role classification with multi-metric rationale."""
    profile = profile_engine.get_player_profile(player_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Player '{player_id}' not found.")
    
    tac = profile.tactical_profile
    return role_classifier.classify_player(
        player_id=player_id,
        mean_x_m=tac.attacking.mean_possession_x_m,
        mean_y_m=tac.attacking.mean_possession_y_m,
        progression_m=tac.attacking.forward_progression_m,
        pressing_engagement=tac.pressing.pressing_engagement_pct,
        peak_speed_mps=tac.pressing.peak_closing_velocity_mps,
        half_space_pct=tac.attacking.half_space_occupation_pct,
        team_role_hint=profile.primary_role
    )


@router.post("/compare", response_model=PlayerComparisonResult)
def compare_players(req: CompareRequest):
    """Executes a side-by-side role-adjusted player comparison."""
    try:
        return comparison_engine.compare_players(
            player_a_id=req.player_a_id,
            player_b_id=req.player_b_id,
            apply_role_normalization=req.apply_role_normalization
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tactical-fit/presets")
def get_tactical_fit_presets():
    """Lists available tactical philosophies and default requirements."""
    return TacticalFitEngine.PRESET_PHILOSOPHIES


@router.post("/tactical-fit", response_model=PlayerTacticalFitResult)
def evaluate_tactical_fit(req: TacticalFitRequest):
    """Evaluates player suitability against a specific tactical philosophy."""
    try:
        return fit_engine.evaluate_tactical_fit(
            player_id=req.player_id,
            philosophy_key=req.philosophy_key,
            custom_weights=req.custom_weights
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/shortlist", response_model=List[ShortlistCandidate])
def get_shortlist():
    """Returns active shortlisted recruitment candidates."""
    return shortlist_manager.get_shortlist()


@router.post("/shortlist", response_model=ShortlistCandidate)
def add_to_shortlist(req: ShortlistAddRequest):
    """Adds a candidate to the recruitment shortlist."""
    try:
        return shortlist_manager.add_candidate(
            player_id=req.player_id,
            notes=req.notes or "",
            tags=req.tags,
            target_philosophy=req.target_philosophy or "HIGH_PRESS_HIGH_LINE",
            fit_score=req.fit_score or 85.0
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/shortlist/{player_id}/notes", response_model=ShortlistCandidate)
def update_shortlist_notes(player_id: str, req: ShortlistNotesRequest):
    """Updates qualitative notes and tags for a shortlisted candidate."""
    try:
        return shortlist_manager.update_notes(
            player_id=player_id,
            notes=req.notes,
            tags=req.tags
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/shortlist/{player_id}")
def remove_from_shortlist(player_id: str):
    """Removes a candidate from the shortlist."""
    success = shortlist_manager.remove_candidate(player_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Player '{player_id}' not found in shortlist.")
    return {"status": "success", "removed_player_id": player_id}


@router.get("/shortlist/export")
def export_shortlist():
    """Exports the complete shortlist dossier payload."""
    return shortlist_manager.export_shortlist()


@router.get("/reports/{player_id}/json")
def get_scouting_report_json(player_id: str):
    """Generates the full 18-section structured scouting dossier."""
    try:
        return report_generator.generate_dossier_json(player_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/reports/{player_id}/html", response_class=Response)
def get_scouting_report_html(player_id: str):
    """Generates a standalone, print-friendly HTML scouting report."""
    try:
        html_content = report_generator.generate_html_report(player_id)
        return Response(content=html_content, media_type="text/html")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
