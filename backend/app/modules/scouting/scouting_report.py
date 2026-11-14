"""
Player Scouting Dossier Report Generator.
Produces comprehensive, print-friendly standalone HTML and JSON scouting dossiers
covering all 18 analytical sections specified in the TacticalGhost constitution.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.modules.scouting.scouting_profile import PlayerScoutingProfile, ScoutingProfileEngine
from app.modules.scouting.off_ball_contribution import OffBallContributionEngine
from app.modules.scouting.player_role_classifier import PlayerRoleClassifier
from app.modules.scouting.tactical_fit import TacticalFitEngine


class ScoutingReportGenerator:
    """
    Generates structured 18-section scouting reports and HTML documents.
    """

    def __init__(
        self,
        profile_engine: ScoutingProfileEngine,
        off_ball_engine: OffBallContributionEngine,
        role_classifier: PlayerRoleClassifier,
        fit_engine: TacticalFitEngine
    ):
        self._profile_engine = profile_engine
        self._off_ball_engine = off_ball_engine
        self._role_classifier = role_classifier
        self._fit_engine = fit_engine

    def generate_dossier_json(self, player_id: str) -> Dict[str, Any]:
        """Generates the complete 18-section structured scouting report."""
        profile = self._profile_engine.get_player_profile(player_id)
        if not profile:
            raise ValueError(f"Player '{player_id}' not found.")

        off_ball_runs = self._off_ball_engine.get_player_off_ball_contributions(player_id)
        fit_res = self._fit_engine.evaluate_tactical_fit(player_id, "POSSESSION_BUILDUP" if profile.identity.team == "Home" else "DIRECT_COUNTERATTACK")
        now_iso = datetime.now(timezone.utc).isoformat()

        tac = profile.tactical_profile

        dossier = {
            "report_title": f"TACTICALGHOST SCOUTING DOSSIER — {player_id}",
            "generated_at": now_iso,
            # 1. Player identity
            "section_1_player_identity": {
                "player_id": profile.identity.player_id,
                "tracking_id": profile.identity.tracking_id,
                "jersey_number": profile.identity.jersey_number,
                "team": profile.identity.team,
                "matches_tracked": profile.identity.match_ids
            },
            # 2. Identity confidence
            "section_2_identity_confidence": {
                "confidence_tier": profile.identity.identity_confidence_tier,
                "mapping_provenance": profile.identity.mapping_provenance,
                "biographical_context": "Anonymized tracking tag. Real-world footballer names and biographical details are intentionally omitted to maintain scientific honesty."
            },
            # 3. Data quality
            "section_3_data_quality": profile.data_quality.model_dump(),
            # 4. Role classification
            "section_4_role_classification": {
                "primary_role": profile.primary_role,
                "secondary_role": profile.secondary_role,
                "hybrid_classification": profile.hybrid_classification,
                "role_confidence": profile.role_confidence
            },
            # 5. Attacking contribution
            "section_5_attacking_contribution": tac.attacking.model_dump(),
            # 6. Defensive contribution
            "section_6_defensive_contribution": tac.defensive.model_dump(),
            # 7. Pressing contribution
            "section_7_pressing_contribution": tac.pressing.model_dump(),
            # 8. Transition contribution
            "section_8_transition_contribution": tac.transition.model_dump(),
            # 9. Off-ball intelligence
            "section_9_off_ball_intelligence": {
                "total_verified_contributions": len(off_ball_runs),
                "contributions": [r.model_dump() for r in off_ball_runs]
            },
            # 10. Movement profile
            "section_10_movement_profile": {
                "peak_velocity_mps": tac.pressing.peak_closing_velocity_mps,
                "recovery_speed_mps": tac.transition.post_turnover_recovery_speed_mps,
                "counterattack_release_speed_mps": tac.transition.counterattack_release_speed_mps,
                "radar_dimensions": tac.radar_scores
            },
            # 11. Tactical strengths
            "section_11_tactical_strengths": tac.tactical_strengths,
            # 12. Potential limitations
            "section_12_potential_limitations": tac.potential_vulnerabilities,
            # 13. Tactical fit
            "section_13_tactical_fit": fit_res.model_dump(),
            # 14. Player comparisons
            "section_14_player_comparisons": {
                "primary_role_norm_comparison": f"Evaluated against standard {profile.primary_role} archetype norms.",
                "radar_benchmarks": tac.radar_scores
            },
            # 15. Supporting match sequences
            "section_15_supporting_match_sequences": [
                {
                    "sequence_id": r.sequence_id,
                    "match_id": r.match_id,
                    "frame_range": f"{r.frame_start} - {r.frame_end}",
                    "space_created_m2": r.space_created_m2,
                    "tactical_event": r.movement_type
                }
                for r in off_ball_runs
            ],
            # 16. Recruitment considerations
            "section_16_recruitment_considerations": {
                "tactical_system_recommendation": f"Best deployed in systems utilizing {profile.hybrid_classification}.",
                "coaching_takeaway": fit_res.coaching_takeaway,
                "integration_risk": "Moderate adjustment period required if transition responsibilities conflict with current physical pacing."
            },
            # 17. Methodology
            "section_17_methodology": {
                "sampling_frequency": "25 Hz optical tracking telemetry",
                "pitch_control_framework": "Spearman (2018) time-to-intercept model",
                "space_creation_derivation": "Convex hull expansion and marker displacement tracking"
            },
            # 18. Limitations
            "section_18_limitations": {
                "sample_size": f"Evaluated across {len(profile.identity.match_ids)} full official match tracking recordings.",
                "disclaimer": "Metrics represent observed empirical performance in official Metrica datasets. Tactical compatibility does not guarantee future individual performance."
            }
        }
        return dossier

    def generate_html_report(self, player_id: str) -> str:
        """Generates a polished, standalone, print-friendly HTML dossier."""
        d = self.generate_dossier_json(player_id)
        p_id = d["section_1_player_identity"]["player_id"]
        role = d["section_4_role_classification"]["primary_role"]
        hybrid = d["section_4_role_classification"]["hybrid_classification"]
        team = d["section_1_player_identity"]["team"]
        conf_tier = d["section_2_identity_confidence"]["confidence_tier"]
        q_score = d["section_3_data_quality"]["overall_quality_score"]

        # Build off-ball run table rows
        run_rows = ""
        for r in d["section_9_off_ball_intelligence"]["contributions"]:
            run_rows += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #334155; font-family: monospace;">{r['sequence_id']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #334155; font-weight: bold; color: #38bdf8;">{r['movement_type']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #334155;">Frames {r['frame_start']}-{r['frame_end']}</td>
                <td style="padding: 8px; border-bottom: 1px solid #334155; color: #4ade80;">+{r['space_created_m2']} m²</td>
                <td style="padding: 8px; border-bottom: 1px solid #334155; color: #38bdf8;">{r['peak_speed_mps']} m/s</td>
                <td style="padding: 8px; border-bottom: 1px solid #334155;">{r['tactical_interpretation']}</td>
            </tr>
            """

        # Build strengths list
        strengths_html = "".join([f"<li style='margin-bottom: 6px;'>{s}</li>" for s in d["section_11_tactical_strengths"]])
        vulns_html = "".join([f"<li style='margin-bottom: 6px;'>{v}</li>" for v in d["section_12_potential_limitations"]])

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TacticalGhost Scouting Dossier — {p_id}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            margin: 0;
            padding: 30px;
            line-height: 1.5;
        }}
        .header {{
            border-bottom: 2px solid #38bdf8;
            padding-bottom: 20px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }}
        .title {{
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #f8fafc;
            margin: 0;
        }}
        .subtitle {{
            font-size: 14px;
            color: #38bdf8;
            margin-top: 5px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-right: 8px;
        }}
        .badge-cyan {{ background: #082f49; color: #38bdf8; border: 1px solid #0284c7; }}
        .badge-green {{ background: #052e16; color: #4ade80; border: 1px solid #16a34a; }}
        .badge-amber {{ background: #451a03; color: #f59e0b; border: 1px solid #b45309; }}
        .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }}
        .card {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 20px;
        }}
        .card-title {{
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            margin-top: 0;
            margin-bottom: 12px;
            border-bottom: 1px solid #334155;
            padding-bottom: 8px;
        }}
        .metric-val {{
            font-size: 20px;
            font-weight: 800;
            color: #f8fafc;
            font-family: monospace;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            text-align: left;
        }}
        th {{
            background: #0f172a;
            padding: 10px 8px;
            color: #94a3b8;
            border-bottom: 2px solid #334155;
            text-transform: uppercase;
            font-size: 10px;
        }}
        .disclaimer {{
            margin-top: 30px;
            padding: 15px;
            background: #090d16;
            border: 1px solid #1e293b;
            border-radius: 8px;
            font-size: 11px;
            color: #64748b;
        }}
        @media print {{
            body {{ background: #ffffff; color: #000000; }}
            .card {{ background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; }}
            .header {{ border-bottom: 2px solid #0284c7; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">TACTICALGHOST — PLAYER RECRUITMENT DOSSIER</h1>
            <div class="subtitle">{p_id} • {team} Team • {role}</div>
            <div style="margin-top: 10px;">
                <span class="badge badge-cyan">{hybrid}</span>
                <span class="badge badge-green">Data Quality: {q_score}%</span>
                <span class="badge badge-amber">{conf_tier}</span>
            </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
            Generated: {d['generated_at'][:19]}Z<br>
            Official Metrica Telemetry (25 Hz)
        </div>
    </div>

    <div class="grid-2">
        <div class="card">
            <h3 class="card-title">Tactical Strengths & Key Tendencies</h3>
            <ul style="padding-left: 20px; font-size: 13px; color: #cbd5e1; margin: 0;">
                {strengths_html}
            </ul>
        </div>
        <div class="card">
            <h3 class="card-title">Potential Tactical Vulnerabilities</h3>
            <ul style="padding-left: 20px; font-size: 13px; color: #fda4af; margin: 0;">
                {vulns_html}
            </ul>
        </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
        <h3 class="card-title">Verified Off-Ball Contributions (Beyond The Ball)</h3>
        <table>
            <thead>
                <tr>
                    <th>Sequence</th>
                    <th>Tactical Action</th>
                    <th>Frame Window</th>
                    <th>Space Created</th>
                    <th>Peak Speed</th>
                    <th>Tactical Interpretation</th>
                </tr>
            </thead>
            <tbody>
                {run_rows}
            </tbody>
        </table>
    </div>

    <div class="grid-2">
        <div class="card">
            <h3 class="card-title">Tactical Fit Assessment ({d['section_13_tactical_fit']['tactical_philosophy_name']})</h3>
            <div class="metric-val" style="color: #38bdf8; margin-bottom: 8px;">
                {d['section_13_tactical_fit']['overall_fit_score']} / 100 Fit Score
            </div>
            <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 12px;">
                {d['section_13_tactical_fit']['executive_summary']}
            </p>
            <div style="background: #0f172a; padding: 10px; border-radius: 8px; font-size: 11px; color: #38bdf8;">
                <strong>Coaching Takeaway:</strong> {d['section_13_tactical_fit']['coaching_takeaway']}
            </div>
        </div>

        <div class="card">
            <h3 class="card-title">Kinematic & Spatial Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                    Peak Velocity: <strong>{d['section_10_movement_profile']['peak_velocity_mps']} m/s</strong>
                </div>
                <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                    Recovery Speed: <strong>{d['section_10_movement_profile']['recovery_speed_mps']} m/s</strong>
                </div>
                <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                    Release Pace: <strong>{d['section_10_movement_profile']['counterattack_release_speed_mps']} m/s</strong>
                </div>
                <div style="background: #0f172a; padding: 8px; border-radius: 6px;">
                    Role Confidence: <strong>{d['section_4_role_classification']['role_confidence']}%</strong>
                </div>
            </div>
        </div>
    </div>

    <div class="disclaimer">
        <strong>Scientific & Ethical Methodology Note:</strong><br>
        TacticalGhost utilizes official Metrica Sports optical tracking telemetry (25 Hz). Player entities are labeled with tracking tags (e.g., {p_id}) and are not linked to biographical footballer identities. All evaluations strictly separate measured kinematic facts from inferred tactical fit scores.
    </div>
</body>
</html>
"""
        return html
