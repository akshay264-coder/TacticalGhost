"""
Commercial Opponent Intelligence HTML/PDF Report Generator.
Generates an executive, print-optimized tactical scouting dossier
for coaches, performance analysts, and academy directors.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime


def generate_opponent_briefing_html(
    profile: Any,
    patterns: List[Any],
    weaknesses: List[Any],
    strengths: List[Any],
    evolution: Any,
    squad: Any,
    preparation: Any,
    compatibility: Any
) -> str:
    """
    Compiles a comprehensive standalone commercial HTML tactical briefing.
    Includes print media stylesheet for professional PDF export.
    """
    now_str = datetime.now().strftime("%B %d, %Y - %H:%M UTC")

    # Generate Weakness Cards HTML
    weakness_cards_html = ""
    for w in weaknesses:
        ev_items_html = ""
        for ev in w.supporting_evidence:
            ev_items_html += f"""
            <div class="evidence-subitem">
                <span class="badge-match">{ev.match_id}</span>
                <strong>{ev.frame_timestamp}</strong> — <em>{ev.metric_value}</em>: {ev.description}
            </div>
            """

        weakness_cards_html += f"""
        <div class="card card-weakness">
            <div class="card-header">
                <div>
                    <span class="badge badge-danger">{w.severity} SEVERITY</span>
                    <span class="badge badge-score">Vulnerability Score: {w.vulnerability_score}/100</span>
                    <h3 class="card-title">{w.name}</h3>
                </div>
                <div class="card-meta">
                    <span>Recurrence: <strong>{w.recurrence_count} instances</strong></span>
                    <span>Matches: <strong>{', '.join(w.matches_present)}</strong></span>
                </div>
            </div>
            <div class="card-body">
                <p><strong>Measured Telemetry:</strong> {w.measured_facts}</p>
                <p><strong>Tactical Implication:</strong> {w.tactical_implication}</p>
                <div class="action-box exploit-box">
                    <strong>Recommended Exploit:</strong> {w.recommended_exploit}
                </div>
                <div class="action-box drill-box">
                    <strong>Prescribed Pitch Drill:</strong> <em>{w.prescribed_drill}</em>
                </div>
                <div class="evidence-container">
                    <strong>Supporting Tracking Evidence:</strong>
                    {ev_items_html}
                </div>
            </div>
        </div>
        """

    # Generate Strengths Cards HTML
    strength_cards_html = ""
    for s in strengths:
        ev_items_html = ""
        for ev in s.supporting_evidence:
            ev_items_html += f"""
            <div class="evidence-subitem">
                <span class="badge-match">{ev.match_id}</span>
                <strong>{ev.frame_timestamp}</strong> — <em>{ev.metric_value}</em>: {ev.description}
            </div>
            """

        strength_cards_html += f"""
        <div class="card card-strength">
            <div class="card-header">
                <div>
                    <span class="badge badge-success">{s.impact_level} THREAT</span>
                    <span class="badge badge-score">Strength Score: {s.strength_score}/100</span>
                    <h3 class="card-title">{s.name}</h3>
                </div>
                <div class="card-meta">
                    <span>Recurrence: <strong>{s.recurrence_count} times</strong></span>
                    <span>Matches: <strong>{', '.join(s.matches_present)}</strong></span>
                </div>
            </div>
            <div class="card-body">
                <p><strong>Measured Telemetry:</strong> {s.measured_facts}</p>
                <p><strong>Tactical Threat:</strong> {s.tactical_threat}</p>
                <div class="action-box counter-box">
                    <strong>Recommended Countermeasure:</strong> {s.recommended_countermeasure}
                </div>
                <div class="action-box drill-box">
                    <strong>Prescribed Pitch Drill:</strong> <em>{s.prescribed_drill}</em>
                </div>
                <div class="evidence-container">
                    <strong>Supporting Tracking Evidence:</strong>
                    {ev_items_html}
                </div>
            </div>
        </div>
        """

    # Generate Recurring Patterns HTML
    patterns_html = ""
    for p in patterns:
        patterns_html += f"""
        <div class="card card-pattern">
            <div class="card-header">
                <div>
                    <span class="badge badge-primary">{p.category.upper()}</span>
                    <span class="badge badge-info">{p.confidence_level} CONFIDENCE</span>
                    <h4 class="card-title">{p.name}</h4>
                </div>
                <div class="card-meta">
                    <span>Recurrence: <strong>{p.recurrence_count} times ({p.recurrence_rate_pct}%)</strong></span>
                    <span>Matches: <strong>{', '.join(p.matches_present)}</strong></span>
                </div>
            </div>
            <div class="card-body">
                <p><strong>Observation:</strong> {p.measured_observation}</p>
                <p><strong>Statistical Inference:</strong> {p.statistical_inference}</p>
                <p><strong>Tactical Interpretation:</strong> {p.tactical_interpretation}</p>
                <div class="action-box coach-box">
                    <strong>Coaching Action:</strong> {p.suggested_coaching_action}
                </div>
            </div>
        </div>
        """

    # Generate Tactical Evolution HTML
    evolution_rows_html = ""
    for d in evolution.metric_deltas:
        sig_class = "sig-yes" if d.is_statistically_significant else "sig-no"
        delta_str = f"+{d.delta_value}" if d.delta_value > 0 else f"{d.delta_value}"
        pct_str = f"+{d.percentage_change}%" if d.percentage_change > 0 else f"{d.percentage_change}%"
        evolution_rows_html += f"""
        <tr>
            <td><strong>{d.metric_name}</strong></td>
            <td>{d.game_1_value} {d.unit}</td>
            <td>{d.game_2_value} {d.unit}</td>
            <td class="{sig_class}"><strong>{delta_str} {d.unit} ({pct_str})</strong></td>
            <td><span class="badge { 'badge-danger' if d.is_statistically_significant else 'badge-info' }">{ 'Statistically Significant' if d.is_statistically_significant else 'Sampling Variance' }</span></td>
            <td>{d.interpretation}</td>
        </tr>
        """

    # Generate Player Intelligence HTML
    players_cards_html = ""
    for pl in squad.all_players:
        vuln_html = f"<p class='text-danger'><strong>Vulnerability Association:</strong> {pl.defensive_vulnerability_association}</p>" if pl.defensive_vulnerability_association else ""
        players_cards_html += f"""
        <div class="player-card">
            <div class="player-header">
                <div class="player-badge">#{pl.jersey_number}</div>
                <div>
                    <h4 class="player-name">{pl.player_id}</h4>
                    <span class="player-role">{pl.tactical_role}</span>
                </div>
            </div>
            <div class="player-stats">
                <div class="stat-pill"><span>Avg Pos:</span> <strong>X={pl.mean_position_x_m}m, Y={pl.mean_position_y_m}m</strong></div>
                <div class="stat-pill"><span>Peak Velocity:</span> <strong>{pl.peak_velocity_mps} m/s</strong></div>
                <div class="stat-pill"><span>Sprints/Match:</span> <strong>{pl.sprint_frequency_per_match}</strong></div>
                <div class="stat-pill"><span>Space Rating:</span> <strong>{pl.space_creation_rating}/100</strong></div>
                <div class="stat-pill"><span>Press Rating:</span> <strong>{pl.pressing_engagement_rating}/100</strong></div>
            </div>
            <p><strong>Tendency:</strong> {pl.key_tactical_tendency}</p>
            {vuln_html}
            <div class="action-box coach-box">
                <strong>Tactical Cue:</strong> {pl.coach_tactical_cue}
            </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TacticalGhost — Multi-Match Opponent Intelligence Dossier</title>
<style>
    @page {{
        size: A4;
        margin: 1.5cm;
    }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background-color: #f8fafc;
        margin: 0;
        padding: 24px;
        line-height: 1.5;
        font-size: 13px;
    }}
    .header {{
        border-bottom: 2px solid #0284c7;
        padding-bottom: 16px;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }}
    .brand {{
        font-size: 24px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.5px;
    }}
    .tagline {{
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
    }}
    .meta-box {{
        text-align: right;
        font-size: 11px;
        color: #475569;
    }}
    .section-title {{
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        border-left: 4px solid #0284c7;
        padding-left: 10px;
        margin-top: 32px;
        margin-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    .exec-summary {{
        background: #e0f2fe;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        font-size: 13px;
        color: #0369a1;
        line-height: 1.6;
    }}
    .dna-grid {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
    }}
    .dna-card {{
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
    }}
    .dna-card h4 {{
        margin: 0 0 10px 0;
        font-size: 13px;
        color: #0369a1;
        text-transform: uppercase;
    }}
    .dna-card ul {{
        margin: 0;
        padding-left: 18px;
        font-size: 12px;
        color: #334155;
    }}
    .dna-card li {{
        margin-bottom: 4px;
    }}
    .card {{
        background: #ffffff;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    .card-weakness {{
        border-left: 5px solid #ef4444;
    }}
    .card-strength {{
        border-left: 5px solid #10b981;
    }}
    .card-pattern {{
        border-left: 5px solid #6366f1;
    }}
    .card-header {{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 10px;
        margin-bottom: 10px;
    }}
    .card-title {{
        margin: 6px 0 0 0;
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
    }}
    .card-meta {{
        font-size: 11px;
        color: #64748b;
        text-align: right;
    }}
    .badge {{
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-right: 6px;
    }}
    .badge-danger {{ background: #fee2e2; color: #b91c1c; }}
    .badge-success {{ background: #dcfce7; color: #15803d; }}
    .badge-primary {{ background: #e0e7ff; color: #4338ca; }}
    .badge-info {{ background: #f1f5f9; color: #475569; }}
    .badge-score {{ background: #fef3c7; color: #b45309; }}
    .badge-match {{ background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 600; }}
    .action-box {{
        padding: 10px 14px;
        border-radius: 6px;
        margin: 8px 0;
        font-size: 12px;
    }}
    .exploit-box {{ background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; }}
    .counter-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }}
    .coach-box {{ background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; }}
    .drill-box {{ background: #fefce8; border: 1px solid #fef08a; color: #854d0e; }}
    .evidence-container {{
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 11px;
        margin-top: 10px;
    }}
    .evidence-subitem {{
        margin-top: 4px;
        color: #475569;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        background: #ffffff;
        font-size: 12px;
        margin-bottom: 24px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        overflow: hidden;
    }}
    th, td {{
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }}
    th {{
        background: #f1f5f9;
        font-weight: 700;
        color: #334155;
    }}
    .sig-yes {{ color: #0284c7; font-weight: 700; }}
    .sig-no {{ color: #64748b; }}
    .player-grid {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
    }}
    .player-card {{
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
    }}
    .player-header {{
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }}
    .player-badge {{
        width: 32px;
        height: 32px;
        background: #0284c7;
        color: #ffffff;
        font-weight: 700;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
    }}
    .player-name {{ margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }}
    .player-role {{ font-size: 11px; color: #64748b; }}
    .player-stats {{
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
    }}
    .stat-pill {{
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        color: #334155;
    }}
    .footer {{
        border-top: 1px solid #cbd5e1;
        padding-top: 12px;
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
        margin-top: 36px;
    }}
    @media print {{
        body {{
            background: #ffffff;
            padding: 0;
        }}
        .card {{
            break-inside: avoid;
        }}
    }}
</style>
</head>
<body>

<div class="header">
    <div>
        <div class="brand">TACTICALGHOST</div>
        <div class="tagline">Multi-Match Opponent Intelligence & Strategic Scouting Dossier</div>
    </div>
    <div class="meta-box">
        <div><strong>Target Opponent:</strong> {profile.team} Team</div>
        <div><strong>Matches Analyzed:</strong> {', '.join(profile.matches_analyzed)}</div>
        <div><strong>Telemetry Completeness:</strong> {profile.data_quality_score}% (25 Hz Tracking)</div>
        <div><strong>Generated:</strong> {now_str}</div>
    </div>
</div>

<div class="exec-summary">
    <strong>Executive Match Preparation Directive:</strong><br>
    {preparation.executive_game_plan}
</div>

<div class="section-title">1. Multi-Match Tactical DNA Profile</div>
<div class="dna-grid">
    <div class="dna-card">
        <h4>Attacking DNA ({profile.attacking_dna.preferred_flank})</h4>
        <ul>
            <li>Progression Velocity: <strong>{profile.attacking_dna.progression_velocity_mps} m/s</strong> (Directness: {profile.attacking_dna.directness_index})</li>
            <li>Attacking Width: <strong>{profile.attacking_dna.attacking_width_m}m</strong> | Depth: <strong>{profile.attacking_dna.attacking_depth_m}m</strong></li>
            <li>Channel Distribution: Left Wing: <strong>{profile.attacking_dna.channel_distribution.left_wing_pct}%</strong> | Central: <strong>{profile.attacking_dna.channel_distribution.central_pct}%</strong> | Right: <strong>{profile.attacking_dna.channel_distribution.right_wing_pct}%</strong></li>
            <li>Key Playmaker: <strong>{profile.attacking_dna.key_orchestrator}</strong></li>
            <li>Summary: {profile.attacking_dna.tactical_summary}</li>
        </ul>
    </div>
    <div class="dna-card">
        <h4>Defensive DNA ({profile.defensive_dna.block_type})</h4>
        <ul>
            <li>Defensive Line Height: <strong>{profile.defensive_dna.mean_defensive_line_height_m}m</strong> from goal</li>
            <li>Mean Compactness: <strong>{profile.defensive_dna.mean_compactness_m2} m²</strong> (Min: <strong>{profile.defensive_dna.min_compactness_m2} m²</strong>)</li>
            <li>Inter-Line Separation: <strong>{profile.defensive_dna.inter_line_gap_m}m</strong></li>
            <li>Backline Offside Depth Disparity: <strong>{profile.defensive_dna.offside_line_disparity_m}m</strong></li>
            <li>Summary: {profile.defensive_dna.tactical_summary}</li>
        </ul>
    </div>
    <div class="dna-card">
        <h4>Pressing DNA ({profile.pressing_dna.preferred_pressing_trap})</h4>
        <ul>
            <li>Pressing Intensity: <strong>{profile.pressing_dna.mean_pressure_intensity_pct}%</strong> (Frequency: {profile.pressing_dna.pressing_frequency_pct}%)</li>
            <li>Closing Speed: <strong>{profile.pressing_dna.peak_closing_velocity_mps} m/s</strong> | Mean TTC: <strong>{profile.pressing_dna.mean_time_to_contact_s}s</strong></li>
            <li>Initiation Thirds: High: <strong>{profile.pressing_dna.initiation_zone_high_pct}%</strong> | Mid: <strong>{profile.pressing_dna.initiation_zone_mid_pct}%</strong> | Low: <strong>{profile.pressing_dna.initiation_zone_low_pct}%</strong></li>
            <li>Pressing Turnover Success: <strong>{profile.pressing_dna.pressing_success_rate_pct}%</strong></li>
            <li>Summary: {profile.pressing_dna.tactical_summary}</li>
        </ul>
    </div>
    <div class="dna-card">
        <h4>Transition DNA ({profile.transition_dna.transition_style})</h4>
        <ul>
            <li>Counterattack Pace: <strong>{profile.transition_dna.counterattack_velocity_mps} m/s</strong></li>
            <li>Counterattack Frequency: <strong>{profile.transition_dna.counterattack_frequency_pct}%</strong></li>
            <li>Defensive Recovery Speed: <strong>{profile.transition_dna.defensive_recovery_speed_mps} m/s</strong></li>
            <li>Space Exposed Post-Turnover: <strong>{profile.transition_dna.mean_space_exposed_post_turnover_m2} m²</strong></li>
            <li>Summary: {profile.transition_dna.tactical_summary}</li>
        </ul>
    </div>
</div>

<div class="section-title">2. Systemic Opponent Vulnerabilities & Exploit Playbook</div>
<p style="color: #64748b; font-size: 11px; margin-top: -8px; margin-bottom: 12px;">
    *Requires verified recurrence across multiple matches to eliminate single-incident anomalies. Ranked by explainable vulnerability score.
</p>
{weakness_cards_html}

<div class="section-title">3. Key Opponent Strengths & Defensive Countermeasures</div>
{strength_cards_html}

<div class="section-title">4. Recurring Cross-Match Tactical Patterns</div>
{patterns_html}

<div class="section-title">5. Match-to-Match Tactical Evolution (Game 1 vs Game 2)</div>
<table>
    <thead>
        <tr>
            <th>Tactical Dimension</th>
            <th>Game 1 Value</th>
            <th>Game 2 Value</th>
            <th>Metric Delta (Δ)</th>
            <th>Statistical Status</th>
            <th>Analytical Interpretation</th>
        </tr>
    </thead>
    <tbody>
        {evolution_rows_html}
    </tbody>
</table>

<div class="section-title">6. Opponent Player Intelligence & Key Threat Profiles</div>
<div class="player-grid">
    {players_cards_html}
</div>

<div class="section-title">7. Prescribed Tactical Training Week Agenda</div>
<table>
    <thead>
        <tr>
            <th style="width: 25%;">Session Timeline</th>
            <th>Primary Tactical Preparation Focus & Pitch Exercise</th>
        </tr>
    </thead>
    <tbody>
        {"".join([f"<tr><td><strong>{a['day']}</strong></td><td>{a['focus']}</td></tr>" for a in preparation.training_week_agenda])}
    </tbody>
</table>

<div class="footer">
    <div>TacticalGhost Analytics Engine • Spatiotemporal Football Intelligence</div>
    <div>Strictly Measured Tracking Telemetry & Explainable Tactical Science</div>
    <div>Page 1 of 1 • Confidential Match Briefing</div>
</div>

</body>
</html>
    """
    return html
