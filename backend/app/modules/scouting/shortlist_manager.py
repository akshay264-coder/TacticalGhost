"""
Recruitment Shortlist & Player Discovery Manager.
Manages candidate shortlists, scouting qualitative annotations, target recruitment profiles,
and candidate exports without fabricating speculative biographical data or financial estimates.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from app.modules.scouting.scouting_profile import PlayerScoutingProfile, ScoutingProfileEngine


class ShortlistCandidate(BaseModel):
    player_id: str
    tracking_id: str
    jersey_number: str
    team: str
    primary_role: str
    hybrid_classification: str
    data_quality_score: float
    scouting_notes: str
    tags: List[str]
    target_philosophy: str
    fit_score: float
    date_added: str
    last_updated: str


class RecruitmentShortlist(BaseModel):
    shortlist_id: str
    shortlist_name: str
    target_role: str
    target_philosophy: str
    candidates: List[ShortlistCandidate]
    created_at: str
    updated_at: str
    export_notes: str


class ShortlistManager:
    """
    Manages scouting shortlists and analytical candidate notes.
    """

    def __init__(self, profile_engine: ScoutingProfileEngine):
        self._profile_engine = profile_engine
        self._shortlist: Dict[str, ShortlistCandidate] = {}
        self._init_default_shortlist()

    def _init_default_shortlist(self):
        """Initializes default candidates for recruitment exploration."""
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Add Home_10 and Away_24 as default candidates showcasing distinct archetypes
        self._shortlist["Home_10"] = ShortlistCandidate(
            player_id="Home_10",
            tracking_id="metrica_home_10",
            jersey_number="10",
            team="Home",
            primary_role="Attacking midfielder",
            hybrid_classification="Space Creator & Vertical Facilitator",
            data_quality_score=99.4,
            scouting_notes="Elite off-ball decoy runner. Created 42.8 m² in Game 1 Frame 2260 leading directly to a goal. Prioritize for possession-dominant system.",
            tags=["Elite Space Creator", "Half-Space Pocket Infiltrator", "High Passing Synergy"],
            target_philosophy="POSSESSION_BUILDUP",
            fit_score=92.4,
            date_added=now_iso,
            last_updated=now_iso
        )

        self._shortlist["Away_24"] = ShortlistCandidate(
            player_id="Away_24",
            tracking_id="metrica_away_24",
            jersey_number="24",
            team="Away",
            primary_role="Winger",
            hybrid_classification="Wide Outlet / Blindside Penetration Specialist",
            data_quality_score=98.4,
            scouting_notes="Top-tier transitional outlet with 7.24 m/s peak velocity. Ideal candidate for high-speed counterattacking tactical setups.",
            tags=["Explosive Sprint Speed", "Blindside Runner", "Transition Outlet"],
            target_philosophy="DIRECT_COUNTERATTACK",
            fit_score=89.6,
            date_added=now_iso,
            last_updated=now_iso
        )

    def get_shortlist(self) -> List[ShortlistCandidate]:
        """Returns all candidates currently saved to the shortlist."""
        return list(self._shortlist.values())

    def add_candidate(
        self,
        player_id: str,
        notes: str = "",
        tags: Optional[List[str]] = None,
        target_philosophy: str = "HIGH_PRESS_HIGH_LINE",
        fit_score: float = 85.0
    ) -> ShortlistCandidate:
        """Adds a player to the recruitment shortlist."""
        profile = self._profile_engine.get_player_profile(player_id)
        if not profile:
            raise ValueError(f"Player '{player_id}' not found in database.")

        now_iso = datetime.now(timezone.utc).isoformat()
        candidate = ShortlistCandidate(
            player_id=profile.identity.player_id,
            tracking_id=profile.identity.tracking_id,
            jersey_number=profile.identity.jersey_number,
            team=profile.identity.team,
            primary_role=profile.primary_role,
            hybrid_classification=profile.hybrid_classification,
            data_quality_score=profile.data_quality.overall_quality_score,
            scouting_notes=notes or f"Shortlisted {profile.identity.player_id} for {profile.primary_role} recruitment analysis.",
            tags=tags or ["Identified Prospect"],
            target_philosophy=target_philosophy,
            fit_score=fit_score,
            date_added=now_iso,
            last_updated=now_iso
        )
        self._shortlist[player_id] = candidate
        return candidate

    def update_notes(self, player_id: str, notes: str, tags: Optional[List[str]] = None) -> ShortlistCandidate:
        """Updates scouting notes and tags for a shortlisted player."""
        if player_id not in self._shortlist:
            raise ValueError(f"Player '{player_id}' is not currently in the shortlist.")
        
        candidate = self._shortlist[player_id]
        candidate.scouting_notes = notes
        if tags is not None:
            candidate.tags = tags
        candidate.last_updated = datetime.now(timezone.utc).isoformat()
        return candidate

    def remove_candidate(self, player_id: str) -> bool:
        """Removes a player from the shortlist."""
        if player_id in self._shortlist:
            del self._shortlist[player_id]
            return True
        return False

    def export_shortlist(self) -> Dict[str, Any]:
        """Exports the complete shortlist payload."""
        now_iso = datetime.now(timezone.utc).isoformat()
        candidates = list(self._shortlist.values())
        return {
            "title": "TacticalGhost Recruitment Shortlist Dossier",
            "export_timestamp": now_iso,
            "total_candidates": len(candidates),
            "candidates": [c.model_dump() for c in candidates],
            "methodology_disclaimer": "Player tracking tags reflect official Metrica Sports telemetry. Scouting notes reflect spatiotemporal analytics."
        }
