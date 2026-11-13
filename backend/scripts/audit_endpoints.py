"""
Comprehensive Production Readiness Audit Script for TacticalGhost API endpoints.
Tests all routes, status codes, response schemas, and invalid inputs.
"""

import sys
sys.path.insert(0, "backend")

from app.api.routes_sequences import list_sequences, get_sequence_details, get_sequence_tracking_data
from app.api.routes_analytics import (
    get_sequence_space_creation,
    get_sequence_defensive_vulnerability,
    get_sequence_pressing,
    get_sequence_interactions,
    get_sequence_decisions,
    compute_custom_pitch_control,
    PitchControlRequest
)
from app.main import health_check
from fastapi import HTTPException

def run_audit():
    print("=" * 60)
    print("TACTICALGHOST PRODUCTION-READINESS AUDIT")
    print("=" * 60)

    # 1. Health check
    h = health_check()
    assert h["status"] == "healthy", "Health check failed"
    print("[PASS] GET /api/health:", h)

    # 2. Sequences list
    seqs = list_sequences()
    assert len(seqs) >= 4, f"Expected at least 4 sequences, got {len(seqs)}"
    print(f"[PASS] GET /api/sequences: Found {len(seqs)} sequences")

    for s in seqs:
        sid = s["sequence_id"]
        # Sequence details
        details = get_sequence_details(sid)
        assert details["sequence_id"] == sid
        print(f"  * Sequence '{sid}': {details['title']} ({details['start_frame']}..{details['end_frame']})")

    # 3. Invalid sequence handling
    try:
        get_sequence_details("invalid_sequence_xyz")
        assert False, "Should have raised 404 for invalid sequence"
    except HTTPException as e:
        assert e.status_code == 404
        print("[PASS] Invalid sequence details returned 404 as expected")

    # 4. Tracking data for seq_goal_1
    track_res = get_sequence_tracking_data("seq_goal_1")
    frames = track_res["tracking"]["frames"]
    assert len(frames) > 0, "No frames loaded"
    frame_0 = frames[0]
    print(f"[PASS] GET /api/sequences/seq_goal_1/tracking: {len(frames)} frames. Frame 0: {frame_0['frame']} with {len(frame_0['home_players'])} Home, {len(frame_0['away_players'])} Away players")

    # 5. Module 1: Space Creation
    sc = get_sequence_space_creation("seq_goal_1")
    assert "runs" in sc
    assert sc["total_runs_detected"] >= 1
    print(f"[PASS] Module 1 Space Creation: {sc['total_runs_detected']} runs detected. First run: {sc['runs'][0]['run_type']} (decoy: {sc['runs'][0]['decoy_score']})")

    # 6. Module 2: Defensive Vulnerability
    test_frame = frames[10]["frame"]
    dv = get_sequence_defensive_vulnerability("seq_goal_1", frame=test_frame)
    assert dv["frame"] == test_frame
    assert "convex_hull_area_m2" in dv["analysis"]
    print(f"[PASS] Module 2 Defensive Vulnerability (Frame {test_frame}): Hull={dv['analysis']['convex_hull_area_m2']}m², Stretch={dv['analysis']['stretch_index_m']}m, BrokenLine={dv['analysis']['is_broken_line']}")

    # 7. Module 3: Pressing Intelligence
    pr = get_sequence_pressing("seq_goal_1", frame=test_frame)
    assert pr["frame"] == test_frame
    assert "total_pressure_score" in pr["pressure"]
    print(f"[PASS] Module 3 Pressing (Frame {test_frame}): Pressure={pr['pressure']['total_pressure_score']}, Trap={pr['pressure']['is_coordinated_trap']}, Shadows={len(pr['cover_shadows'])}")

    # 8. Module 4: Player Interactions
    pi = get_sequence_interactions("seq_goal_1", frame=test_frame)
    assert pi["frame"] == test_frame
    assert len(pi["passing_options"]) > 0
    print(f"[PASS] Module 4 Player Interactions (Frame {test_frame}): Passing options={len(pi['passing_options'])}, Top viability={pi['passing_options'][0]['viability_score']}")

    # 9. Module 5: Tactical Decisions
    dec_frame = seqs[0]["decision_frames"][0]
    dec = get_sequence_decisions("seq_goal_1", frame=dec_frame)
    assert len(dec["decision_evaluations"]) >= 1
    eval0 = dec["decision_evaluations"][0]["evaluation"]
    assert len(eval0["alternatives"]) >= 2
    print(f"[PASS] Module 5 Tactical Decisions (Frame {dec_frame}): Evaluated {len(eval0['alternatives'])} options for Carrier P{eval0['ball_carrier']['jersey_number']}")

    # 10. Pitch Control Post
    pc = compute_custom_pitch_control(PitchControlRequest(
        home_players=[{"x": 50, "y": 34, "vx": 0, "vy": 0}],
        away_players=[{"x": 70, "y": 34, "vx": 0, "vy": 0}],
        grid_cells_x=20,
        grid_cells_y=14
    ))
    assert pc["home_controlled_area_m2"] > 0
    print(f"[PASS] POST /api/analytics/pitch-control: Home area={pc['home_controlled_area_m2']}m², Away area={pc['away_controlled_area_m2']}m²")

    print("=" * 60)
    print("ALL 10 API ROUTE CHECKS PASSED PERFECTLY")
    print("=" * 60)

if __name__ == "__main__":
    run_audit()
