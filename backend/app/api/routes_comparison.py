"""
FastAPI Routes for Multi-Sequence Tactical Intelligence and Comparison Engine.
"""

import os
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.core.dataloader import MatchDataManager
from app.core.pitch_control import PitchControlEngine
from app.modules.space_creation import SpaceCreationAnalyzer
from app.modules.defensive_vulnerability import DefensiveVulnerabilityDetector
from app.modules.pressing import PressingIntelligenceAnalyzer
from app.modules.player_interactions import PlayerInteractionAnalyzer
from app.modules.tactical_decision import TacticalDecisionIntelligenceEngine
from app.modules.sequence_comparison import SequenceComparisonEngine

router = APIRouter(prefix="/comparison", tags=["Multi-Sequence Comparison"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "metrica_sample")
data_manager = MatchDataManager(DATA_DIR)

# Shared analytical engines
pc_engine = PitchControlEngine()
space_analyzer = SpaceCreationAnalyzer(pitch_control_engine=pc_engine)
defensive_detector = DefensiveVulnerabilityDetector(pitch_control_engine=pc_engine)
pressing_analyzer = PressingIntelligenceAnalyzer()
interaction_analyzer = PlayerInteractionAnalyzer(pitch_control_engine=pc_engine, pressing_analyzer=pressing_analyzer)
decision_engine = TacticalDecisionIntelligenceEngine(
    pitch_control_engine=pc_engine,
    interaction_analyzer=interaction_analyzer
)

comparison_engine = SequenceComparisonEngine(
    pitch_control_engine=pc_engine,
    space_analyzer=space_analyzer,
    defensive_detector=defensive_detector,
    pressing_analyzer=pressing_analyzer,
    interaction_analyzer=interaction_analyzer,
    decision_engine=decision_engine
)


class ValidationRequest(BaseModel):
    sequence_ids: List[str]


@router.post("/validate")
def validate_sequences(req: ValidationRequest):
    """
    Module 8: Data Validation.
    Validates tracking completeness, coverage, coordinates, and sampling consistency
    across requested sequence IDs.
    """
    curated = data_manager.get_curated_sequences()
    results = {}

    for s_id in req.sequence_ids:
        meta = next((s for s in curated if s["sequence_id"] == s_id), None)
        if not meta:
            results[s_id] = {
                "is_valid": False,
                "errors": [f"Sequence {s_id} not found in match catalog."],
                "warnings": []
            }
            continue

        tracking = data_manager.get_sequence_tracking(
            start_frame=meta["start_frame"],
            end_frame=meta["end_frame"]
        )
        results[s_id] = comparison_engine.validate_sequence_data(meta, tracking)

    all_valid = all(r.get("is_valid", False) for r in results.values())
    return {
        "is_all_valid": all_valid,
        "sequences": results
    }


@router.get("/sequences")
def compare_sequences(
    seq_a: str = Query(..., description="First sequence ID to compare"),
    seq_b: str = Query(..., description="Second sequence ID to compare")
):
    """
    Modules 1-5: Full Multi-Dimensional Sequence Comparison.
    Computes spatial control, pressing intensity, attacking runs, and tactical decisions.
    """
    curated = data_manager.get_curated_sequences()
    meta_a = next((s for s in curated if s["sequence_id"] == seq_a), None)
    meta_b = next((s for s in curated if s["sequence_id"] == seq_b), None)

    if not meta_a:
        raise HTTPException(status_code=404, detail=f"Sequence A ({seq_a}) not found")
    if not meta_b:
        raise HTTPException(status_code=404, detail=f"Sequence B ({seq_b}) not found")

    tracking_a = data_manager.get_sequence_tracking(
        start_frame=meta_a["start_frame"],
        end_frame=meta_a["end_frame"]
    )
    tracking_b = data_manager.get_sequence_tracking(
        start_frame=meta_b["start_frame"],
        end_frame=meta_b["end_frame"]
    )

    comparison = comparison_engine.generate_full_comparison(
        seq_a_meta=meta_a,
        seq_b_meta=meta_b,
        seq_a_tracking=tracking_a,
        seq_b_tracking=tracking_b
    )
    return comparison


@router.get("/report/html", response_class=HTMLResponse)
def get_comparison_html_report(
    seq_a: str = Query(..., description="First sequence ID"),
    seq_b: str = Query(..., description="Second sequence ID")
):
    """
    Module 7: Automated Report Generation (HTML & Print-to-PDF).
    Generates a full-featured standalone HTML comparative tactical report.
    """
    comparison = compare_sequences(seq_a=seq_a, seq_b=seq_b)
    html_content = comparison_engine.generate_html_report(comparison)
    return HTMLResponse(content=html_content)
