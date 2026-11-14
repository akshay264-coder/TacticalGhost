"""
FastAPI Routes for Commercial Tactical Pattern Intelligence & Opponent Weakness Discovery.
"""

import os
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse

from app.api.routes_sequences import data_manager
from app.modules.pattern_intelligence import PatternIntelligenceEngine

router = APIRouter(prefix="/patterns", tags=["Tactical Pattern Intelligence"])
pattern_engine = PatternIntelligenceEngine()


@router.get("/sequence/{sequence_id}")
def get_sequence_patterns(sequence_id: str):
    """
    Returns detected tactical patterns for a specific match sequence.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail=f"Sequence {sequence_id} not found")

    tracking_data = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )

    patterns = pattern_engine.detect_patterns_in_sequence(match_seq, tracking_data)
    opportunities = pattern_engine.discover_attacking_opportunities(
        attacking_team=match_seq.get("attacking_team", "Home"),
        sequence_meta=match_seq,
        tracking_data=tracking_data
    )

    return {
        "sequence_id": sequence_id,
        "total_patterns": len(patterns),
        "total_opportunities": len(opportunities),
        "patterns": patterns,
        "opportunities": opportunities
    }


@router.get("/match-summary")
def get_match_pattern_intelligence():
    """
    Returns aggregated match-wide tactical pattern intelligence across all available sequences.
    Identifies systemic opponent weaknesses, attacking opportunities, and coach-friendly insights.
    """
    seqs = data_manager.get_curated_sequences()
    all_tracking: Dict[str, Dict[str, Any]] = {}
    all_patterns: List[Dict[str, Any]] = []
    all_opportunities: List[Dict[str, Any]] = []

    for seq in seqs:
        s_id = seq["sequence_id"]
        track = data_manager.get_sequence_tracking(seq["start_frame"], seq["end_frame"])
        all_tracking[s_id] = track

        seq_patterns = pattern_engine.detect_patterns_in_sequence(seq, track)
        all_patterns.extend(seq_patterns)

        seq_opps = pattern_engine.discover_attacking_opportunities(
            attacking_team=seq.get("attacking_team", "Home"),
            sequence_meta=seq,
            tracking_data=track
        )
        all_opportunities.extend(seq_opps)

    # Opponent Weaknesses for Away and Home teams
    away_weaknesses = pattern_engine.discover_opponent_weaknesses("Away", seqs, all_tracking)
    home_weaknesses = pattern_engine.discover_opponent_weaknesses("Home", seqs, all_tracking)
    all_weaknesses = away_weaknesses + home_weaknesses

    # Coach Insights
    insights = pattern_engine.translate_to_coach_insights(all_patterns, all_weaknesses, all_opportunities)

    return {
        "match_id": "metrica_game_1",
        "match_title": "Metrica Sports Sample Game 1",
        "total_sequences_analyzed": len(seqs),
        "total_patterns_detected": len(all_patterns),
        "total_weaknesses_identified": len(all_weaknesses),
        "total_opportunities_identified": len(all_opportunities),
        "patterns": all_patterns,
        "weaknesses": all_weaknesses,
        "opportunities": all_opportunities,
        "coach_insights": insights
    }


@router.get("/compare")
def compare_sequence_patterns(
    seq_a: str = Query(..., description="First sequence ID"),
    seq_b: str = Query(..., description="Second sequence ID")
):
    """
    Compares tactical pattern frequencies, spatial channel distribution, and execution between two sequences.
    """
    seqs = data_manager.get_curated_sequences()
    meta_a = next((s for s in seqs if s["sequence_id"] == seq_a), None)
    meta_b = next((s for s in seqs if s["sequence_id"] == seq_b), None)

    if not meta_a:
        raise HTTPException(status_code=404, detail=f"Sequence A '{seq_a}' not found")
    if not meta_b:
        raise HTTPException(status_code=404, detail=f"Sequence B '{seq_b}' not found")

    track_a = data_manager.get_sequence_tracking(meta_a["start_frame"], meta_a["end_frame"])
    track_b = data_manager.get_sequence_tracking(meta_b["start_frame"], meta_b["end_frame"])

    patterns_a = pattern_engine.detect_patterns_in_sequence(meta_a, track_a)
    patterns_b = pattern_engine.detect_patterns_in_sequence(meta_b, track_b)

    return pattern_engine.compare_patterns_across_sequences(patterns_a, patterns_b, meta_a, meta_b)


@router.get("/briefing/html", response_class=HTMLResponse)
def get_commercial_briefing_html():
    """
    Renders a standalone commercial-grade tactical briefing HTML document for coaches and analysts.
    """
    seqs = data_manager.get_curated_sequences()
    all_tracking: Dict[str, Dict[str, Any]] = {}
    all_patterns: List[Dict[str, Any]] = []
    all_opportunities: List[Dict[str, Any]] = []

    for seq in seqs:
        s_id = seq["sequence_id"]
        track = data_manager.get_sequence_tracking(seq["start_frame"], seq["end_frame"])
        all_tracking[s_id] = track
        all_patterns.extend(pattern_engine.detect_patterns_in_sequence(seq, track))
        all_opportunities.extend(pattern_engine.discover_attacking_opportunities(
            attacking_team=seq.get("attacking_team", "Home"),
            sequence_meta=seq,
            tracking_data=track
        ))

    weaknesses = pattern_engine.discover_opponent_weaknesses("Away", seqs, all_tracking)
    insights = pattern_engine.translate_to_coach_insights(all_patterns, weaknesses, all_opportunities)

    html_content = pattern_engine.generate_commercial_briefing_html(
        insights=insights,
        weaknesses=weaknesses,
        opportunities=all_opportunities
    )
    return HTMLResponse(content=html_content)
