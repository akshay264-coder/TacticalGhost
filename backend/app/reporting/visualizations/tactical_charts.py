"""
Tactical Charts Generator (Pure SVG).
Produces high-resolution vector radar charts for player scouting,
horizontal distribution bars for tactical patterns, and comparison charts.
"""

import math
from typing import List, Dict, Tuple, Optional, Any
import html


def render_radar_chart_svg(
    categories: List[str],
    values: List[float],
    title: str = "Tactical Role Archetype Profile",
    player_id: str = "Player",
    width: int = 500,
    height: int = 420,
    max_val: float = 100.0
) -> str:
    """
    Renders an N-axis spider/radar chart in pure SVG.
    """
    n = len(categories)
    if n < 3:
        n = 3
        categories = categories + ["Attribute"] * (3 - len(categories))
        values = values + [50.0] * (3 - len(values))

    cx = width / 2.0
    cy = height / 2.0 + 15
    radius = min(width, height) * 0.35

    # Compute spokes
    spokes = []
    angle_step = (2 * math.pi) / n

    # Concentric circles
    grid_lines = []
    for level in [0.25, 0.50, 0.75, 1.0]:
        r = radius * level
        pts = []
        for i in range(n):
            angle = i * angle_step - (math.pi / 2)
            px = cx + r * math.cos(angle)
            py = cy + r * math.sin(angle)
            pts.append(f"{px:.1f},{py:.1f}")
        grid_lines.append(f'<polygon points="{" ".join(pts)}" fill="none" stroke="#334155" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>')

    # Spoke lines and labels
    spoke_elements = []
    poly_points = []
    
    for i in range(n):
        angle = i * angle_step - (math.pi / 2)
        px = cx + radius * math.cos(angle)
        py = cy + radius * math.sin(angle)
        spoke_elements.append(f'<line x1="{cx}" y1="{cy}" x2="{px:.1f}" y2="{py:.1f}" stroke="#475569" stroke-width="1.2" />')

        # Label position slightly further out
        lbl_r = radius + 22
        lx = cx + lbl_r * math.cos(angle)
        ly = cy + lbl_r * math.sin(angle)
        anchor = "middle"
        if math.cos(angle) > 0.3:
            anchor = "start"
        elif math.cos(angle) < -0.3:
            anchor = "end"
        cat_name = categories[i] if i < len(categories) else f"Dim {i+1}"
        spoke_elements.append(f'<text x="{lx:.1f}" y="{ly + 4:.1f}" fill="#cbd5e1" font-size="9" font-weight="600" text-anchor="{anchor}">{html.escape(cat_name)}</text>')

        # Value point
        val = values[i] if i < len(values) else 0.0
        norm_val = max(0.0, min(max_val, float(val))) / max_val
        vx = cx + (radius * norm_val) * math.cos(angle)
        vy = cy + (radius * norm_val) * math.sin(angle)
        poly_points.append(f"{vx:.1f},{vy:.1f}")

    poly_pts_str = " ".join(poly_points)

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="auto" style="max-width: {width}px; background: #0f172a; border-radius: 8px; font-family: Inter, system-ui, sans-serif;">
  <rect x="0" y="0" width="{width}" height="{height}" fill="#0f172a" rx="8" />
  
  <!-- Title -->
  <text x="24" y="28" fill="#f8fafc" font-size="12" font-weight="700">{html.escape(title)}</text>
  <text x="24" y="44" fill="#94a3b8" font-size="9.5" font-weight="500">Target Player: {html.escape(player_id)} (Scale: 0 - 100)</text>

  <!-- Grid Levels -->
  {"".join(grid_lines)}

  <!-- Axis Spokes -->
  {"".join(spoke_elements)}

  <!-- Data Polygon -->
  <polygon points="{poly_pts_str}" fill="#ea580c" fill-opacity="0.35" stroke="#ea580c" stroke-width="2.2" />
  
  <!-- Data Points -->
  {" ".join([f'<circle cx="{pt.split(",")[0]}" cy="{pt.split(",")[1]}" r="3.5" fill="#f97316" stroke="#ffffff" stroke-width="1.2" />' for pt in poly_points])}
</svg>"""
    return svg


def render_horizontal_bar_chart_svg(
    items: List[Tuple[str, float]],
    title: str = "Tactical Pattern Recurrence & Frequency",
    width: int = 600,
    height: int = 340,
    max_val: Optional[float] = None
) -> str:
    """
    Renders clean horizontal frequency bars in SVG.
    """
    if not items:
        items = [("No Data Available", 0.0)]

    vals = [v for _, v in items]
    top_v = max_val or (max(vals) * 1.15 if vals and max(vals) > 0 else 10.0)

    pad_l = 180
    pad_r = 60
    pad_t = 60
    bar_h = 22
    gap = 14
    total_h = pad_t + len(items) * (bar_h + gap) + 30

    bars_svg = []
    for i, (lbl, val) in enumerate(items):
        y = pad_t + i * (bar_h + gap)
        bw = (val / top_v) * (width - pad_l - pad_r) if top_v > 0 else 0
        bars_svg.append(f"""
  <!-- Bar {i+1} -->
  <g>
    <text x="{pad_l - 12}" y="{y + 15}" fill="#cbd5e1" font-size="10" font-weight="600" text-anchor="end">{html.escape(lbl[:26])}</text>
    <rect x="{pad_l}" y="{y}" width="{max(bw, 4)}" height="{bar_h}" fill="#ea580c" rx="3" fill-opacity="0.85" />
    <text x="{pad_l + bw + 8}" y="{y + 15}" fill="#f8fafc" font-size="10" font-weight="700">{val:.1f}</text>
  </g>
""")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {total_h}" width="100%" height="auto" style="max-width: {width}px; background: #0f172a; border-radius: 8px; font-family: Inter, system-ui, sans-serif;">
  <rect x="0" y="0" width="{width}" height="{total_h}" fill="#0f172a" rx="8" />
  <text x="24" y="32" fill="#f8fafc" font-size="12" font-weight="700">{html.escape(title)}</text>
  {"".join(bars_svg)}
</svg>"""
    return svg


def render_comparison_bar_chart_svg(
    metrics: List[Dict[str, Any]],
    team1_name: str = "Metrica Game 1",
    team2_name: str = "Metrica Game 2",
    title: str = "Cross-Match Tactical Comparison",
    width: int = 650,
    height: int = 380
) -> str:
    """
    Renders grouped comparison bars comparing two matches or teams.
    """
    pad_l = 170
    pad_r = 70
    pad_t = 65
    group_h = 36
    gap = 18
    total_h = pad_t + len(metrics) * (group_h + gap) + 40

    bars_svg = []
    for i, m in enumerate(metrics):
        y = pad_t + i * (group_h + gap)
        label = m.get("label", f"Metric {i+1}")
        v1 = float(m.get("team1_val", 0.0))
        v2 = float(m.get("team2_val", 0.0))
        scale = float(m.get("max_val", max(v1, v2, 1.0) * 1.2))

        b1_w = (v1 / scale) * (width - pad_l - pad_r) if scale > 0 else 0
        b2_w = (v2 / scale) * (width - pad_l - pad_r) if scale > 0 else 0

        bars_svg.append(f"""
  <!-- Metric Group {i+1}: {label} -->
  <g>
    <text x="{pad_l - 12}" y="{y + 22}" fill="#f1f5f9" font-size="10.5" font-weight="600" text-anchor="end">{html.escape(label[:24])}</text>
    
    <!-- Bar 1 -->
    <rect x="{pad_l}" y="{y}" width="{max(b1_w, 3)}" height="14" fill="#0284c7" rx="2" />
    <text x="{pad_l + b1_w + 6}" y="{y + 11}" fill="#38bdf8" font-size="9" font-weight="700">{v1:.1f}</text>

    <!-- Bar 2 -->
    <rect x="{pad_l}" y="{y + 18}" width="{max(b2_w, 3)}" height="14" fill="#ea580c" rx="2" />
    <text x="{pad_l + b2_w + 6}" y="{y + 29}" fill="#fb923c" font-size="9" font-weight="700">{v2:.1f}</text>
  </g>
""")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {total_h}" width="100%" height="auto" style="max-width: {width}px; background: #0f172a; border-radius: 8px; font-family: Inter, system-ui, sans-serif;">
  <rect x="0" y="0" width="{width}" height="{total_h}" fill="#0f172a" rx="8" />
  
  <text x="24" y="28" fill="#f8fafc" font-size="12" font-weight="700">{html.escape(title)}</text>
  
  <!-- Legend -->
  <rect x="{width - 240}" y="16" width="12" height="12" fill="#0284c7" rx="2" />
  <text x="{width - 222}" y="26" fill="#cbd5e1" font-size="9.5" font-weight="600">{html.escape(team1_name)}</text>
  
  <rect x="{width - 120}" y="16" width="12" height="12" fill="#ea580c" rx="2" />
  <text x="{width - 102}" y="26" fill="#cbd5e1" font-size="9.5" font-weight="600">{html.escape(team2_name)}</text>

  {"".join(bars_svg)}
</svg>"""
    return svg
