"""
FastAPI Router for Coach Decision Support System.
Endpoints for match preparation, formation evaluation, player selection,
opponent exploitation, defensive countermeasures, tactical scenarios,
in-game monitoring, training priorities, and commercial match strategy dossiers.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from app.modules.coach.coach_decision_engine import CoachDecisionEngine, MatchPreparationReport
from app.modules.coach.formation_recommender import CandidateFormationEvaluation
from app.modules.coach.player_selection_engine import StartingXIPlan, ReplacementScenarioResult
from app.modules.coach.opponent_exploitation import OpponentExploitationOverview
from app.modules.coach.defensive_countermeasure import DefensiveCountermeasureOverview
from app.modules.coach.tactical_scenario import TacticalScenarioResult, ScenarioAdjustmentParams
from app.modules.coach.in_game_intelligence import InGameMonitoringSummary
from app.modules.coach.training_priority import TrainingProgramOverview

router = APIRouter(prefix="/coach", tags=["Coach Decision Support"])

_coach_engine = CoachDecisionEngine()


# --- Request Models ---

class MatchPreparationRequest(BaseModel):
    opponent_team: str = "Away"
    matches: List[str] = Field(default_factory=lambda: ["metrica_game_1", "metrica_game_2"])
    preferred_formation: str = "4-3-3"
    tactical_philosophy: str = "POSSESSION_BUILDUP"


class FormationEvaluationRequest(BaseModel):
    opponent_team: str = "Away"
    preferred_philosophy: str = "POSSESSION_BUILDUP"
    formation_name: Optional[str] = None


class PlayerSelectionRequest(BaseModel):
    formation_name: str = "4-3-3"
    team: str = "Home"
    excluded_player_ids: List[str] = Field(default_factory=list)


class PlayerReplacementRequest(BaseModel):
    target_slot_id: str
    incumbent_player_id: str
    replacement_player_id: str
    formation_name: str = "4-3-3"


class OpponentExploitationRequest(BaseModel):
    opponent_team: str = "Away"
    matches: List[str] = Field(default_factory=lambda: ["metrica_game_1", "metrica_game_2"])


class DefensiveCountermeasureRequest(BaseModel):
    opponent_team: str = "Away"
    matches: List[str] = Field(default_factory=lambda: ["metrica_game_1", "metrica_game_2"])


class TacticalScenarioRequest(BaseModel):
    params: ScenarioAdjustmentParams
    scenario_name: str = "Custom Tactical Scenario"


class TrainingPriorityRequest(BaseModel):
    opponent_team: str = "Away"
    matches: List[str] = Field(default_factory=lambda: ["metrica_game_1", "metrica_game_2"])


class MatchReportRequest(BaseModel):
    opponent_team: str = "Away"
    preferred_formation: str = "4-3-3"
    tactical_philosophy: str = "POSSESSION_BUILDUP"
    matches: List[str] = Field(default_factory=lambda: ["metrica_game_1", "metrica_game_2"])


# --- API Routes ---

@router.get("/status")
def get_coach_system_status() -> Dict[str, Any]:
    """Returns the operational status, supported formations, and capabilities of the coach system."""
    return {
        "status": "operational",
        "system": "TacticalGhost Coach Decision Support System",
        "version": "1.0.0",
        "supported_formations": ["4-3-3", "4-2-3-1", "4-4-2", "3-4-3", "3-5-2", "4-1-4-1", "5-3-2"],
        "supported_philosophies": ["POSSESSION_BUILDUP", "HIGH_PRESS_HIGH_LINE", "DIRECT_COUNTERATTACK", "COMPACT_LOW_BLOCK"],
        "telemetry_source": "Metrica Sports 25 Hz Optical Tracking (Game 1 & Game 2)",
        "decision_pipeline_steps": 10
    }


@router.post("/preparation", response_model=MatchPreparationReport)
def generate_match_preparation(req: MatchPreparationRequest) -> MatchPreparationReport:
    """Generates a complete 15-section match preparation report using the 10-step decision pipeline."""
    try:
        report = _coach_engine.generate_match_preparation_report(
            opponent_team=req.opponent_team,
            matches=req.matches,
            preferred_formation=req.preferred_formation,
            tactical_philosophy=req.tactical_philosophy
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match preparation failed: {str(e)}")


@router.post("/formation/evaluate", response_model=List[CandidateFormationEvaluation])
def evaluate_formations(req: FormationEvaluationRequest) -> List[CandidateFormationEvaluation]:
    """Evaluates candidate tactical formations against opponent characteristics and squad availability."""
    try:
        if req.formation_name:
            ev = _coach_engine._formation_recommender.evaluate_formation(
                formation_name=req.formation_name,
                opponent_team=req.opponent_team,
                preferred_philosophy=req.preferred_philosophy
            )
            return [ev]
        return _coach_engine.evaluate_formations(
            opponent_team=req.opponent_team,
            philosophy=req.preferred_philosophy
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Formation evaluation failed: {str(e)}")


@router.post("/player-selection", response_model=StartingXIPlan)
def plan_player_selection(req: PlayerSelectionRequest) -> StartingXIPlan:
    """Plans Starting XI and Bench options for a specified tactical formation."""
    try:
        return _coach_engine.plan_starting_xi(
            formation=req.formation_name,
            team=req.team,
            excluded=req.excluded_player_ids
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Player selection planning failed: {str(e)}")


@router.post("/player-selection/replacement", response_model=ReplacementScenarioResult)
def simulate_player_replacement(req: PlayerReplacementRequest) -> ReplacementScenarioResult:
    """Simulates replacing an incumbent player with a bench candidate in a tactical slot."""
    try:
        return _coach_engine._player_selection_engine.simulate_player_replacement(
            target_slot_id=req.target_slot_id,
            incumbent_player_id=req.incumbent_player_id,
            replacement_player_id=req.replacement_player_id,
            formation_name=req.formation_name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Player replacement simulation failed: {str(e)}")


@router.post("/exploitation", response_model=OpponentExploitationOverview)
def plan_opponent_exploitation(req: OpponentExploitationRequest) -> OpponentExploitationOverview:
    """Generates actionable tactical plans across four strategic exploitation corridors."""
    try:
        return _coach_engine.plan_exploitation(
            opponent_team=req.opponent_team,
            matches=req.matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Exploitation planning failed: {str(e)}")


@router.post("/countermeasures", response_model=DefensiveCountermeasureOverview)
def plan_defensive_countermeasures(req: DefensiveCountermeasureRequest) -> DefensiveCountermeasureOverview:
    """Generates defensive countermeasure strategies to neutralize opponent weapons."""
    try:
        return _coach_engine.plan_countermeasures(
            opponent_team=req.opponent_team,
            matches=req.matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Countermeasure planning failed: {str(e)}")


@router.post("/scenario/simulate", response_model=TacticalScenarioResult)
def simulate_tactical_scenario(req: TacticalScenarioRequest) -> TacticalScenarioResult:
    """Simulates a hypothetical tactical adjustment and estimates spatial, pitch-control, and risk deltas."""
    try:
        return _coach_engine.simulate_scenario(
            params=req.params,
            name=req.scenario_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario simulation failed: {str(e)}")


@router.get("/in-game/replay-monitor", response_model=InGameMonitoringSummary)
def monitor_in_game_replay(
    sequence_id: str = Query("seq_goal_1", description="Sequence ID to monitor"),
    start_frame: int = Query(2200, description="Start tracking frame"),
    end_frame: int = Query(2320, description="End tracking frame")
) -> InGameMonitoringSummary:
    """Provides replay-based historical tracking monitoring to detect structural shifts and tactical alerts."""
    try:
        return _coach_engine.monitor_in_game_replay(
            sequence_id=sequence_id,
            start_frame=start_frame,
            end_frame=end_frame
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"In-game replay monitoring failed: {str(e)}")


@router.post("/training/priorities", response_model=TrainingProgramOverview)
def plan_training_priorities(req: TrainingPriorityRequest) -> TrainingProgramOverview:
    """Translates tactical findings into structured weekly coaching drills and pitch setups."""
    try:
        return _coach_engine.plan_training(
            opponent_team=req.opponent_team,
            matches=req.matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training planning failed: {str(e)}")


@router.post("/report/json")
def get_match_strategy_report_json(req: MatchReportRequest) -> Dict[str, Any]:
    """Generates the full 18-section commercial match strategy report as structured JSON."""
    try:
        return _coach_engine.generate_strategy_report_json(
            opponent=req.opponent_team,
            formation=req.preferred_formation,
            philosophy=req.tactical_philosophy,
            matches=req.matches
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report JSON generation failed: {str(e)}")


@router.post("/report/html", response_class=HTMLResponse)
def get_match_strategy_report_html(req: MatchReportRequest):
    """Generates the full 18-section commercial match strategy report as print-friendly HTML."""
    try:
        html = _coach_engine.generate_strategy_report_html(
            opponent=req.opponent_team,
            formation=req.preferred_formation,
            philosophy=req.tactical_philosophy,
            matches=req.matches
        )
        return HTMLResponse(content=html, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report HTML generation failed: {str(e)}")
