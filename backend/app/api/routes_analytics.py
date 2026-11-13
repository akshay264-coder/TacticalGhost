"""
FastAPI Routes for Core Tactical Intelligence Modules.
"""

import os
from typing import Dict, List, Any, Optional
import numpy as np
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel

from app.core.dataloader import MatchDataManager
from app.core.pitch_control import PitchControlEngine
from app.modules.space_creation import SpaceCreationAnalyzer
from app.modules.defensive_vulnerability import DefensiveVulnerabilityDetector
from app.modules.pressing import PressingIntelligenceAnalyzer
from app.modules.player_interactions import PlayerInteractionAnalyzer
from app.modules.tactical_decision import TacticalDecisionIntelligenceEngine

router = APIRouter(prefix="/analytics", tags=["Tactical Analytics"])

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


class PitchControlRequest(BaseModel):
    home_players: List[Dict[str, float]]
    away_players: List[Dict[str, float]]
    ball: Optional[Dict[str, Optional[float]]] = None
    grid_cells_x: int = 40
    grid_cells_y: int = 26


@router.post("/pitch-control")
def compute_custom_pitch_control(req: PitchControlRequest):
    """
    Computes continuous Pitch Control surface for custom or current frame coordinates.
    """
    surface = pc_engine.calculate_pitch_control_surface(
        home_players=req.home_players,
        away_players=req.away_players,
        grid_cells_x=req.grid_cells_x,
        grid_cells_y=req.grid_cells_y
    )
    return surface


@router.get("/sequence/{sequence_id}/space-creation")
def get_sequence_space_creation(sequence_id: str):
    """
    Module 1: Space Creation Intelligence for a sequence.
    Detects all off-ball runs, decoy run ratings, dragged markers, and space created.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    tracking = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )
    runs = space_analyzer.identify_off_ball_runs(
        frames=tracking["frames"],
        attacking_team=match_seq["attacking_team"]
    )
    return {
        "sequence_id": sequence_id,
        "attacking_team": match_seq["attacking_team"],
        "total_runs_detected": len(runs),
        "runs": runs
    }


@router.get("/sequence/{sequence_id}/defensive-vulnerability")
def get_sequence_defensive_vulnerability(
    sequence_id: str,
    frame: Optional[int] = Query(None, description="Specific frame number to analyze"),
    defending_team: Optional[str] = Query(None, description="Optional override defending team: 'Home' or 'Away'")
):
    """
    Module 2: Defensive Vulnerability Detection.
    Evaluates defensive compactness, stretch index, broken lines, and exposed spaces.
    Supports dynamic defending team switching between Home and Away.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    tracking = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )

    frames = tracking["frames"]
    def_team = defending_team if defending_team in ["Home", "Away"] else match_seq["defending_team"]
    att_team = "Away" if def_team == "Home" else "Home"
    def_key = "home_players" if def_team == "Home" else "away_players"
    att_key = "away_players" if def_team == "Home" else "home_players"
    def_goal_x = 0.0 if def_team == "Home" else 105.0

    if frame is not None:
        target_f = next((f for f in frames if f["frame"] == frame), None)
        if not target_f:
            raise HTTPException(status_code=404, detail=f"Frame {frame} not found in sequence")
        result = defensive_detector.analyze_defensive_frame(
            defending_players=target_f[def_key],
            attacking_players=target_f[att_key],
            ball_pos=target_f.get("ball", {}),
            defending_team=def_team,
            defending_goal_x=def_goal_x
        )
        return {"frame": frame, "analysis": result}

    # Summary analysis across key sampled frames (every 10 frames = 0.4s)
    sampled_analysis = []
    for f in frames[::10]:
        res = defensive_detector.analyze_defensive_frame(
            defending_players=f[def_key],
            attacking_players=f[att_key],
            ball_pos=f.get("ball", {}),
            defending_team=def_team,
            defending_goal_x=def_goal_x
        )
        sampled_analysis.append({
            "frame": f["frame"],
            "time_s": f["time_s"],
            "analysis": res
        })

    return {
        "sequence_id": sequence_id,
        "defending_team": def_team,
        "frames_analyzed": len(sampled_analysis),
        "timeline": sampled_analysis
    }


@router.get("/sequence/{sequence_id}/pressing")
def get_sequence_pressing(
    sequence_id: str,
    frame: Optional[int] = Query(None, description="Specific frame number to analyze")
):
    """
    Module 3: Pressing Intelligence.
    Calculates dynamic pressure score, closing velocities, time-to-contact, and cover shadows.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    tracking = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )
    frames = tracking["frames"]
    def_team = match_seq["defending_team"]
    att_team = match_seq["attacking_team"]
    def_key = "home_players" if def_team == "Home" else "away_players"
    att_key = "away_players" if def_team == "Home" else "home_players"

    def analyze_single_frame(f: Dict[str, Any]) -> Dict[str, Any]:
        ball = f.get("ball", {})
        bx = ball.get("x")
        by = ball.get("y")
        if bx is None or by is None or not f[att_key]:
            return {"pressure": None, "shadows": []}

        carrier = min(f[att_key], key=lambda p: np.hypot(p["x"] - bx, p["y"] - by))
        pressure = pressing_analyzer.evaluate_pressure_on_carrier(
            carrier_pos=(carrier["x"], carrier["y"]),
            defending_players=f[def_key]
        )
        shadows = pressing_analyzer.compute_cover_shadows(
            ball_pos=(bx, by),
            defending_players=f[def_key],
            teammate_options=f[att_key]
        )
        return {
            "ball_carrier": {
                "player_id": carrier["player_id"],
                "jersey_number": carrier.get("jersey_number"),
                "position": {"x": carrier["x"], "y": carrier["y"]}
            },
            "pressure": pressure,
            "cover_shadows": shadows
        }

    if frame is not None:
        target_f = next((f for f in frames if f["frame"] == frame), None)
        if not target_f:
            raise HTTPException(status_code=404, detail=f"Frame {frame} not found in sequence")
        return {"frame": frame, **analyze_single_frame(target_f)}

    # Sample timeline
    timeline = []
    for f in frames[::10]:
        timeline.append({
            "frame": f["frame"],
            "time_s": f["time_s"],
            **analyze_single_frame(f)
        })

    return {
        "sequence_id": sequence_id,
        "defending_team": def_team,
        "timeline": timeline
    }


@router.get("/sequence/{sequence_id}/player-interactions")
def get_sequence_interactions(
    sequence_id: str,
    frame: int = Query(..., description="Frame number to evaluate passing network")
):
    """
    Module 4: Player Interaction Analysis.
    Evaluates passing lane viability scores, interception risks, and passing network graph.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    tracking = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )
    target_f = next((f for f in tracking["frames"] if f["frame"] == frame), None)
    if not target_f:
        raise HTTPException(status_code=404, detail=f"Frame {frame} not found in sequence")

    att_team = match_seq["attacking_team"]
    def_team = match_seq["defending_team"]
    att_key = "home_players" if att_team == "Home" else "away_players"
    def_key = "away_players" if att_team == "Home" else "home_players"

    ball = target_f.get("ball", {})
    bx, by = ball.get("x"), ball.get("y")
    if bx is None or by is None or not target_f.get(att_key):
        return {
            "sequence_id": sequence_id,
            "frame": frame,
            "ball_carrier": None,
            "passing_options": [],
            "passing_network": {
                "team": att_team,
                "nodes_count": len(target_f.get(att_key, [])),
                "viable_lanes_count": 0,
                "network_density": 0.0,
                "viable_edges": []
            }
        }

    carrier = min(target_f[att_key], key=lambda p: np.hypot(p["x"] - bx, p["y"] - by))
    passing_options = interaction_analyzer.evaluate_passing_options(
        carrier=carrier,
        teammates=target_f[att_key],
        defenders=target_f[def_key],
        attacking_goal_x=105.0 if att_team == "Home" else 0.0
    )
    network_summary = interaction_analyzer.build_passing_synergy_network(
        players=target_f[att_key],
        defenders=target_f[def_key],
        team_name=att_team
    )

    return {
        "sequence_id": sequence_id,
        "frame": frame,
        "ball_carrier": {
            "player_id": carrier["player_id"],
            "jersey_number": carrier.get("jersey_number"),
            "position": {"x": carrier["x"], "y": carrier["y"]}
        },
        "passing_options": passing_options,
        "passing_network": network_summary
    }


@router.get("/sequence/{sequence_id}/decisions")
def get_sequence_decisions(
    sequence_id: str,
    frame: Optional[int] = Query(None, description="Specific decision frame")
):
    """
    Module 5: Tactical Decision Intelligence.
    Evaluates observed action vs counterfactual realistic alternatives (passes, carries, shots)
    with xT advancement, execution safety, and tactical expected value.
    """
    seqs = data_manager.get_curated_sequences()
    match_seq = next((s for s in seqs if s["sequence_id"] == sequence_id), None)
    if not match_seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    tracking = data_manager.get_sequence_tracking(
        start_frame=match_seq["start_frame"],
        end_frame=match_seq["end_frame"]
    )
    frames = tracking["frames"]
    events = tracking["events"]
    decision_frames = match_seq.get("decision_frames", [frames[len(frames) // 2]["frame"]])

    if frame is not None:
        target_f = next((f for f in frames if f["frame"] == frame), None)
        if not target_f:
            raise HTTPException(status_code=404, detail=f"Frame {frame} not found in sequence")
        target_frames = [frame]
    else:
        target_frames = decision_frames
    evaluations = []

    for df_num in target_frames:
        tf = next((f for f in frames if f["frame"] == df_num), None)
        if not tf:
            continue

        # Look for corresponding event near this frame
        matching_event = next((
            ev for ev in events
            if abs(ev["start_frame"] - df_num) <= 25 or abs(ev["end_frame"] - df_num) <= 25
        ), None)

        dec_eval = decision_engine.evaluate_decision_frame(
            frame_data=tf,
            actual_event=matching_event,
            attacking_team=match_seq["attacking_team"],
            attacking_goal_x=105.0 if match_seq["attacking_team"] == "Home" else 0.0
        )
        evaluations.append({
            "decision_frame": df_num,
            "associated_event": matching_event,
            "evaluation": dec_eval
        })

    return {
        "sequence_id": sequence_id,
        "decision_evaluations": evaluations
    }
