"""
FastAPI Routes for Match Sequences and Tracking data.
"""

import os
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException
from app.core.dataloader import MatchDataManager

router = APIRouter(prefix="/sequences", tags=["Sequences"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "metrica_sample")
data_manager = MatchDataManager(DATA_DIR)


@router.get("", response_model=List[Dict[str, Any]])
def list_sequences():
    """
    Returns the curated list of rich tactical sequences.
    """
    return data_manager.get_curated_sequences()


@router.get("/{sequence_id}")
def get_sequence_details(sequence_id: str):
    """
    Returns metadata for a specific tactical sequence.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail=f"Sequence {sequence_id} not found")
    return match_seq


@router.get("/{sequence_id}/tracking")
def get_sequence_tracking_data(
    sequence_id: str,
    fps: float = 25.0
):
    """
    Loads full synchronized frame tracking, ball coordinates, and events for the sequence.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail=f"Sequence {sequence_id} not found")

    tracking_data = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"],
        fps=float(fps)
    )
    return {
        "sequence": match_seq,
        "tracking": tracking_data
    }
