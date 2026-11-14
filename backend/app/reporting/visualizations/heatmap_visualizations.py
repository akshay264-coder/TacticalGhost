"""
Spatial Heatmap and Tactical Zone Density Generator (Pure SVG).
Visualizes space creation density, defensive vulnerability zones,
and pitch control partitions on standard 105m x 68m coordinates.
"""

from typing import List, Dict, Tuple, Optional, Any
import html
from app.reporting.visualizations.pitch_visualizations import create_svg_pitch_base


def render_zone_heatmap_svg(
    zones: List[Dict[str, Any]],
    title: str = "Tactical Spatial Vulnerability & Density Grid",
    metric_label: str = "Vulnerability Index",
    width: int = 700,
    height: int = 460
) -> str:
    """
    Renders a spatial 6x4 zone grid overlaid on the 105m x 68m pitch.
    """
    svg, to_svg = create_svg_pitch_base(width, height)
    elements = [svg]

    elements.append(f"""
  <text x="24" y="18" fill="#f8fafc" font-size="11" font-weight="700">{html.escape(title)}</text>
""")

    # Standard tactical zones if none provided
    if not zones:
        zones = [
            {"name": "Zone 14", "x_min": 68.0, "x_max": 88.0, "y_min": 24.0, "y_max": 44.0, "intensity": 0.82},
            {"name": "Right Half-Space", "x_min": 55.0, "x_max": 85.0, "y_min": 44.0, "y_max": 56.0, "intensity": 0.94},
            {"name": "Left Half-Space", "x_min": 55.0, "x_max": 85.0, "y_min": 12.0, "y_max": 24.0, "intensity": 0.58},
            {"name": "Penalty Box Cutback", "x_min": 85.0, "x_max": 98.0, "y_min": 22.0, "y_max": 46.0, "intensity": 0.76},
            {"name": "Central Rest Defense", "x_min": 35.0, "x_max": 65.0, "y_min": 22.0, "y_max": 46.0, "intensity": 0.65}
        ]

    for z in zones:
        x_min = float(z.get("x_min", 50.0))
        x_max = float(z.get("x_max", 70.0))
        y_min = float(z.get("y_min", 20.0))
        y_max = float(z.get("y_max", 40.0))
        intensity = float(z.get("intensity", 0.5))
        name = str(z.get("name", "Zone"))

        tl_x, tl_y = to_svg(x_min, y_min)
        br_x, br_y = to_svg(x_max, y_max)
        bx_w = abs(br_x - tl_x)
        bx_h = abs(br_y - tl_y)

        # Color calculation based on intensity (0.0: cyan, 0.5: amber, 1.0: orange/red)
        fill_color = "#ea580c" if intensity > 0.75 else ("#f59e0b" if intensity > 0.5 else "#06b6d4")
        opacity = 0.15 + (intensity * 0.35)

        elements.append(f"""
  <!-- Zone: {name} -->
  <g>
    <rect x="{min(tl_x, br_x)}" y="{min(tl_y, br_y)}" width="{bx_w}" height="{bx_h}" fill="{fill_color}" fill-opacity="{opacity:.2f}" stroke="{fill_color}" stroke-width="1.2" rx="3" />
    <rect x="{min(tl_x, br_x) + 4}" y="{min(tl_y, br_y) + 4}" width="110" height="20" rx="2" fill="#0f172a" fill-opacity="0.85" />
    <text x="{min(tl_x, br_x) + 8}" y="{min(tl_y, br_y) + 14}" fill="#f8fafc" font-size="8.5" font-weight="700">{html.escape(name[:16])}</text>
    <text x="{min(tl_x, br_x) + 8}" y="{min(tl_y, br_y) + 21}" fill="{fill_color}" font-size="7.5" font-weight="600">{metric_label}: {intensity:.2f}</text>
  </g>
""")

    elements.append("</svg>")
    return "".join(elements)
