"""
Tactical Pitch Diagram Generator (Pure SVG).
Renders 105m x 68m FIFA pitch geometry, formation structures,
movement trajectories, pressing traps, and exploitation corridors.
High-resolution vector output compatible with HTML, PDF, and print.
"""

from typing import List, Dict, Tuple, Optional, Any
import html


def create_svg_pitch_base(
    width: int = 700,
    height: int = 460,
    pitch_length: float = 105.0,
    pitch_width: float = 68.0,
    pad: int = 24,
    bg_color: str = "#0f172a",
    line_color: str = "#334155",
    pitch_fill: str = "#1e293b"
) -> Tuple[str, Any]:
    """
    Creates SVG base pitch elements and returns coordinate mapping function.
    Coordinates: x in [0, 105] (defensive to attacking), y in [0, 68] (left to right).
    """
    inner_w = width - (2 * pad)
    inner_h = height - (2 * pad)
    
    # Coordinate transformation:
    # x_m in [0, 105] -> x_svg in [pad, pad + inner_w]
    # y_m in [0, 68] -> y_svg in [pad, pad + inner_h]
    def to_svg(x_m: float, y_m: float) -> Tuple[float, float]:
        sx = pad + (float(x_m) / pitch_length) * inner_w
        sy = pad + (float(y_m) / pitch_width) * inner_h
        return sx, sy

    # Pitch geometry in SVG
    p_x0, p_y0 = to_svg(0, 0)
    p_x1, p_y1 = to_svg(105, 68)
    mid_x, _ = to_svg(52.5, 34)
    _, mid_y = to_svg(52.5, 34)

    # Penalty box: 16.5m length, width from 13.84m to 54.16m (40.32m wide, centered at 34)
    pen_left_tl = to_svg(0, 13.84)
    pen_left_br = to_svg(16.5, 54.16)
    pen_right_tl = to_svg(105 - 16.5, 13.84)
    pen_right_br = to_svg(105, 54.16)

    # 6-yard box: 5.5m length, from 24.84m to 43.16m (18.32m wide)
    box6_left_tl = to_svg(0, 24.84)
    box6_left_br = to_svg(5.5, 43.16)
    box6_right_tl = to_svg(105 - 5.5, 24.84)
    box6_right_br = to_svg(105, 43.16)

    # Center circle radius: 9.15m
    cc_r = (9.15 / pitch_length) * inner_w

    svg_header = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="auto" style="max-width: {width}px; background: {bg_color}; border-radius: 8px; font-family: Inter, system-ui, sans-serif;">
  <defs>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c"/>
    </marker>
    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4"/>
    </marker>
    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981"/>
    </marker>
    <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ea580c" stop-opacity="0.10"/>
    </linearGradient>
  </defs>

  <!-- Pitch Surface -->
  <rect x="{p_x0}" y="{p_y0}" width="{inner_w}" height="{inner_h}" fill="{pitch_fill}" rx="4" />
  
  <!-- Boundary & Center Line -->
  <rect x="{p_x0}" y="{p_y0}" width="{inner_w}" height="{inner_h}" fill="none" stroke="{line_color}" stroke-width="1.8" />
  <line x1="{mid_x}" y1="{p_y0}" x2="{mid_x}" y2="{p_y1}" stroke="{line_color}" stroke-width="1.5" />
  <circle cx="{mid_x}" cy="{mid_y}" r="{cc_r}" fill="none" stroke="{line_color}" stroke-width="1.5" />
  <circle cx="{mid_x}" cy="{mid_y}" r="2.5" fill="{line_color}" />

  <!-- Left Penalty & 6-Yard Box -->
  <rect x="{pen_left_tl[0]}" y="{pen_left_tl[1]}" width="{pen_left_br[0] - pen_left_tl[0]}" height="{pen_left_br[1] - pen_left_tl[1]}" fill="none" stroke="{line_color}" stroke-width="1.5" />
  <rect x="{box6_left_tl[0]}" y="{box6_left_tl[1]}" width="{box6_left_br[0] - box6_left_tl[0]}" height="{box6_left_br[1] - box6_left_tl[1]}" fill="none" stroke="{line_color}" stroke-width="1.2" />

  <!-- Right Penalty & 6-Yard Box -->
  <rect x="{pen_right_tl[0]}" y="{pen_right_tl[1]}" width="{pen_right_br[0] - pen_right_tl[0]}" height="{pen_right_br[1] - pen_right_tl[1]}" fill="none" stroke="{line_color}" stroke-width="1.5" />
  <rect x="{box6_right_tl[0]}" y="{box6_right_tl[1]}" width="{box6_right_br[0] - box6_right_tl[0]}" height="{box6_right_br[1] - box6_right_tl[1]}" fill="none" stroke="{line_color}" stroke-width="1.2" />

  <!-- Attacking Direction Indicator -->
  <g opacity="0.6">
    <line x1="{pad + 10}" y1="{height - 12}" x2="{pad + 70}" y2="{height - 12}" stroke="#94a3b8" stroke-width="1.2" marker-end="url(#arrow-cyan)"/>
    <text x="{pad + 78}" y="{height - 8}" fill="#94a3b8" font-size="9" font-weight="600">ATTACKING DIRECTION &rarr;</text>
  </g>
"""
    return svg_header, to_svg


def render_formation_svg(
    formation_name: str,
    slots: List[Dict[str, Any]],
    team_name: str = "Home",
    title: str = "Formation Tactical Structure",
    width: int = 700,
    height: int = 460
) -> str:
    """
    Renders 11 formation player slots on a standard 105m x 68m pitch.
    """
    svg, to_svg = create_svg_pitch_base(width, height)
    elements = [svg]

    # Title header inside SVG
    elements.append(f"""
  <!-- Title Badge -->
  <rect x="24" y="6" width="280" height="20" rx="4" fill="#1e293b" opacity="0.8"/>
  <text x="32" y="20" fill="#f8fafc" font-size="11" font-weight="700">{html.escape(title)} — {html.escape(formation_name)} ({html.escape(team_name)})</text>
""")

    # Render each slot
    for slot in slots:
        sx_m = float(slot.get("x", 50.0))
        sy_m = float(slot.get("y", 34.0))
        slot_name = slot.get("slot", "")
        role = slot.get("role", "")
        player_id = slot.get("player_id", "")
        jersey = str(slot.get("jersey", ""))
        is_gk = slot_name.upper() == "GK"

        fill_color = "#eab308" if is_gk else "#0284c7"
        text_color = "#0f172a" if is_gk else "#ffffff"

        cx, cy = to_svg(sx_m, sy_m)

        elements.append(f"""
  <!-- Player Slot: {slot_name} -->
  <g>
    <circle cx="{cx}" cy="{cy}" r="15" fill="{fill_color}" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))" />
    <text x="{cx}" y="{cy + 4}" fill="{text_color}" font-size="10" font-weight="800" text-anchor="middle">{html.escape(jersey or slot_name[:2])}</text>
    <rect x="{cx - 24}" y="{cy + 17}" width="48" height="14" rx="2" fill="#0f172a" opacity="0.85" />
    <text x="{cx}" y="{cy + 27}" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">{html.escape(slot_name)}</text>
  </g>
""")

    elements.append("</svg>")
    return "".join(elements)


def render_corridor_exploitation_svg(
    corridors: List[Dict[str, Any]],
    title: str = "Opponent Exploitation Corridors",
    width: int = 700,
    height: int = 460
) -> str:
    """
    Renders the 4 exploitation corridors with spatial bounding boxes and target opponents.
    """
    svg, to_svg = create_svg_pitch_base(width, height)
    elements = [svg]

    elements.append(f"""
  <text x="24" y="18" fill="#f8fafc" font-size="11" font-weight="700">{html.escape(title)}</text>
""")

    colors = ["#ea580c", "#06b6d4", "#10b981", "#8b5cf6"]

    for idx, c in enumerate(corridors):
        x_min, x_max = c.get("spatial_x_range_m", (50.0, 75.0))
        y_min, y_max = c.get("spatial_y_range_m", (20.0, 48.0))
        corridor_id = c.get("corridor_id", f"corridor_{idx+1}")
        headline = c.get("headline", corridor_id)
        target = c.get("target_opponent_strength", "Defensive Seam")
        col = colors[idx % len(colors)]

        # Bounding box in SVG
        tl_x, tl_y = to_svg(x_min, y_min)
        br_x, br_y = to_svg(x_max, y_max)
        bx_w = abs(br_x - tl_x)
        bx_h = abs(br_y - tl_y)

        elements.append(f"""
  <!-- Corridor: {corridor_id} -->
  <g>
    <rect x="{min(tl_x, br_x)}" y="{min(tl_y, br_y)}" width="{bx_w}" height="{bx_h}" fill="{col}" fill-opacity="0.22" stroke="{col}" stroke-width="1.8" stroke-dasharray="4,3" rx="4" />
    <rect x="{min(tl_x, br_x) + 4}" y="{min(tl_y, br_y) + 4}" width="140" height="24" rx="3" fill="#0f172a" fill-opacity="0.9" />
    <text x="{min(tl_x, br_x) + 8}" y="{min(tl_y, br_y) + 16}" fill="{col}" font-size="9" font-weight="800">#{idx+1} {html.escape(headline[:18])}</text>
    <text x="{min(tl_x, br_x) + 8}" y="{min(tl_y, br_y) + 25}" fill="#94a3b8" font-size="7.5" font-weight="600">{html.escape(target[:24])}</text>
  </g>
""")

    elements.append("</svg>")
    return "".join(elements)


def render_movement_trajectories_svg(
    trajectories: List[Dict[str, Any]],
    title: str = "Off-Ball Runs & Space Creation Vectors",
    width: int = 700,
    height: int = 460
) -> str:
    """
    Renders player movement tracks, decoy runs, and vacated space polygons.
    """
    svg, to_svg = create_svg_pitch_base(width, height)
    elements = [svg]

    elements.append(f"""
  <text x="24" y="18" fill="#f8fafc" font-size="11" font-weight="700">{html.escape(title)}</text>
""")

    for traj in trajectories:
        start_x, start_y = traj.get("start", (40.0, 30.0))
        end_x, end_y = traj.get("end", (60.0, 45.0))
        p_id = traj.get("player_id", "P1")
        run_type = traj.get("type", "PENETRATION")  # DECOY, BLINDSIDE, PENETRATION

        color = "#ea580c" if run_type == "DECOY" else ("#10b981" if run_type == "PENETRATION" else "#06b6d4")
        marker = "url(#arrow-orange)" if run_type == "DECOY" else ("url(#arrow-emerald)" if run_type == "PENETRATION" else "url(#arrow-cyan)")

        x0, y0 = to_svg(start_x, start_y)
        x1, y1 = to_svg(end_x, end_y)

        elements.append(f"""
  <!-- Run Trajectory: {p_id} -->
  <g>
    <circle cx="{x0}" cy="{y0}" r="4" fill="{color}" />
    <line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" stroke="{color}" stroke-width="2.5" marker-end="{marker}" stroke-dasharray="{'5,3' if run_type == 'DECOY' else 'none'}" />
    <circle cx="{x1}" cy="{y1}" r="3" fill="#ffffff" />
    <rect x="{x1 + 6}" y="{y1 - 8}" width="54" height="15" rx="2" fill="#0f172a" opacity="0.8" />
    <text x="{x1 + 10}" y="{y1 + 2}" fill="{color}" font-size="8" font-weight="700">{html.escape(p_id)} ({run_type[:4]})</text>
  </g>
""")

    elements.append("</svg>")
    return "".join(elements)
