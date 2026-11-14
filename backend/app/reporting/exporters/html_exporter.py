"""
Standalone HTML Report Exporter.
Produces self-contained, publication-grade tactical reports following TacticalGhost's
warm-cream, black, and orange editorial design identity.
Includes responsive layout, embedded vector SVGs, and print-friendly A4 styling.
"""

import html
from typing import Dict, Any
from app.reporting.report_schema import StandardTacticalReport


class HtmlReportExporter:
    """
    Renders a StandardTacticalReport into a standalone, styled HTML document.
    """

    @staticmethod
    def export(report: StandardTacticalReport) -> str:
        meta = report.metadata

        # Build Table of Contents & Sections
        toc_items = []
        sections_html = []

        for sec in report.sections:
            sec_id = sec.section_id
            sec_title = f"{sec.section_number}. {sec.title}"
            toc_items.append(f'<li><a href="#{sec_id}">{html.escape(sec_title)}</a></li>')

            # Render Visualizations for this section
            viz_html_list = []
            for v in sec.visualizations:
                viz_html_list.append(f"""
                <div class="viz-card">
                    <div class="viz-header">
                        <h4>{html.escape(v.title)}</h4>
                        <span class="viz-meta">{html.escape(v.source_reference)} | Units: {html.escape(v.units)}</span>
                    </div>
                    <div class="viz-content">
                        {v.svg_content}
                    </div>
                    <p class="viz-caption"><strong>Interpretation:</strong> {html.escape(v.interpretation)}</p>
                </div>
                """)

            # Basic markdown-to-HTML conversion for bold, headers, and bullet lists
            content_html = sec.content_markdown
            lines = content_html.split("\n")
            formatted_lines = []
            in_list = False
            for line in lines:
                l_str = line.strip()
                if l_str.startswith("### "):
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    formatted_lines.append(f"<h3>{html.escape(l_str[4:])}</h3>")
                elif l_str.startswith("## "):
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    formatted_lines.append(f"<h2>{html.escape(l_str[3:])}</h2>")
                elif l_str.startswith("# "):
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    formatted_lines.append(f"<h1>{html.escape(l_str[2:])}</h1>")
                elif l_str.startswith("- ") or l_str.startswith("* "):
                    if not in_list:
                        formatted_lines.append("<ul>")
                        in_list = True
                    # Inline bold parsing
                    item_text = html.escape(l_str[2:])
                    # Simple bold replacement
                    item_text = item_text.replace("**", "<strong>", 1)
                    item_text = item_text.replace("**", "</strong>", 1)
                    formatted_lines.append(f"<li>{item_text}</li>")
                elif l_str.startswith("1. ") or l_str.startswith("2. ") or l_str.startswith("3. ") or l_str.startswith("4. "):
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    item_text = html.escape(l_str[3:])
                    item_text = item_text.replace("**", "<strong>", 1)
                    item_text = item_text.replace("**", "</strong>", 1)
                    formatted_lines.append(f"<p class='num-item'><strong>{l_str[:3]}</strong> {item_text}</p>")
                elif not l_str:
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    formatted_lines.append("<br/>")
                else:
                    if in_list:
                        formatted_lines.append("</ul>")
                        in_list = False
                    p_text = html.escape(l_str)
                    p_text = p_text.replace("**", "<strong>", 1)
                    p_text = p_text.replace("**", "</strong>", 1)
                    formatted_lines.append(f"<p>{p_text}</p>")
            if in_list:
                formatted_lines.append("</ul>")

            body_rendered = "\n".join(formatted_lines)

            sections_html.append(f"""
            <section id="{sec_id}" class="report-section page-break-inside-avoid">
                <div class="section-title-wrap">
                    <span class="section-badge">Section {sec.section_number:02d}</span>
                    <h2 class="section-title">{html.escape(sec.title)}</h2>
                    {f'<p class="section-subtitle">{html.escape(sec.subtitle)}</p>' if sec.subtitle else ''}
                </div>
                <div class="section-body">
                    {body_rendered}
                </div>
                {"".join(viz_html_list)}
            </section>
            """)

        # Recommendations HTML
        recs_html = []
        for r in report.recommendations:
            recs_html.append(f"""
            <div class="rec-card priority-{r.priority.lower()}">
                <div class="rec-header">
                    <span class="priority-pill">{r.priority} PRIORITY</span>
                    <span class="category-pill">{r.evidence_category.value}</span>
                </div>
                <h4 class="rec-headline">{html.escape(r.headline)}</h4>
                <p class="rec-details">{html.escape(r.details)}</p>
                <div class="rec-footer">
                    <p><strong>Supporting Sequences:</strong> {', '.join(r.supporting_sequences)}</p>
                    <p><strong>Identified Counter-Risks:</strong> {'; '.join(r.counter_risks)}</p>
                    <p><strong>Expected Tactical Outcomes:</strong> {'; '.join(r.expected_outcomes)}</p>
                </div>
            </div>
            """)

        # Limitations HTML
        limitations_html = "".join([f"<li>{html.escape(lim)}</li>" for lim in report.limitations])

        # Full Document
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TacticalGhost — {html.escape(meta.title)}</title>
    <style>
        :root {{
            --bg-cream: #fdfbf7;
            --bg-card: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent-orange: #ea580c;
            --accent-dark: #c2410c;
            --border-color: #e2e8f0;
            --slate-pitch: #0f172a;
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            background-color: var(--bg-cream);
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            font-size: 14px;
            padding: 30px;
        }}

        .report-container {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            padding: 48px;
        }}

        /* Header & Cover */
        .header-brand {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--accent-orange);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}

        .brand-logo {{
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: var(--text-main);
        }}

        .brand-logo span {{
            color: var(--accent-orange);
        }}

        .confidential-tag {{
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: #fee2e2;
            color: #b91c1c;
            padding: 4px 10px;
            border-radius: 4px;
            border: 1px solid #fca5a5;
        }}

        .cover-title-wrap {{
            margin-bottom: 35px;
        }}

        .report-type-badge {{
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--accent-orange);
            background: #fff7ed;
            border: 1px solid #fed7aa;
            padding: 3px 10px;
            border-radius: 4px;
            margin-bottom: 12px;
        }}

        .cover-title {{
            font-size: 28px;
            font-weight: 800;
            color: var(--text-main);
            line-height: 1.25;
            margin-bottom: 8px;
        }}

        .cover-subtitle {{
            font-size: 14px;
            color: var(--text-muted);
            font-weight: 500;
        }}

        .meta-strip {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            background: #f8fafc;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 35px;
        }}

        .meta-item {{
            font-size: 11.5px;
        }}

        .meta-item-label {{
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 700;
            font-size: 9.5px;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }}

        .meta-item-value {{
            font-weight: 600;
            color: var(--text-main);
        }}

        /* Table of Contents */
        .toc-box {{
            background: #fffaf0;
            border: 1px solid #feebc8;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 40px;
        }}

        .toc-title {{
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #9c4221;
            margin-bottom: 12px;
        }}

        .toc-list {{
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 8px;
        }}

        .toc-list a {{
            color: #7b341e;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
        }}

        .toc-list a:hover {{
            text-decoration: underline;
        }}

        /* Sections */
        .report-section {{
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid var(--border-color);
        }}

        .section-title-wrap {{
            margin-bottom: 16px;
        }}

        .section-badge {{
            font-size: 10px;
            font-weight: 700;
            color: var(--accent-orange);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}

        .section-title {{
            font-size: 19px;
            font-weight: 800;
            color: var(--text-main);
            margin-top: 2px;
        }}

        .section-subtitle {{
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 500;
        }}

        .section-body {{
            font-size: 13.5px;
            color: #334155;
            line-height: 1.65;
            margin-bottom: 20px;
        }}

        .section-body h3 {{
            font-size: 15px;
            font-weight: 700;
            color: var(--text-main);
            margin: 16px 0 8px 0;
        }}

        .section-body ul {{
            padding-left: 20px;
            margin: 8px 0 16px 0;
        }}

        .section-body li {{
            margin-bottom: 4px;
        }}

        .section-body .num-item {{
            margin-bottom: 6px;
        }}

        /* Visualization Cards */
        .viz-card {{
            background: #0f172a;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }}

        .viz-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }}

        .viz-header h4 {{
            color: #f8fafc;
            font-size: 13px;
            font-weight: 700;
        }}

        .viz-meta {{
            color: #94a3b8;
            font-size: 10px;
            font-family: monospace;
        }}

        .viz-content {{
            display: flex;
            justify-content: center;
            margin: 10px 0;
        }}

        .viz-caption {{
            color: #cbd5e1;
            font-size: 11px;
            margin-top: 10px;
            line-height: 1.5;
            border-top: 1px solid #1e293b;
            padding-top: 8px;
        }}

        /* Recommendations */
        .rec-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid var(--accent-orange);
            border-radius: 6px;
            padding: 16px 20px;
            margin-bottom: 16px;
        }}

        .rec-header {{
            display: flex;
            gap: 8px;
            margin-bottom: 6px;
        }}

        .priority-pill {{
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 3px;
            background: #fee2e2;
            color: #991b1b;
        }}

        .category-pill {{
            font-size: 9px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 3px;
            background: #e0f2fe;
            color: #0369a1;
        }}

        .rec-headline {{
            font-size: 15px;
            font-weight: 700;
            color: var(--text-main);
            margin-bottom: 6px;
        }}

        .rec-details {{
            font-size: 12.5px;
            color: #334155;
            margin-bottom: 10px;
        }}

        .rec-footer {{
            font-size: 11px;
            color: var(--text-muted);
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
        }}

        /* Limitations */
        .limitations-box {{
            background: #f1f5f9;
            border-radius: 6px;
            padding: 16px 20px;
            font-size: 11.5px;
            color: #475569;
            margin-top: 30px;
        }}

        .limitations-box h4 {{
            color: #1e293b;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 6px;
        }}

        .limitations-box ul {{
            padding-left: 18px;
        }}

        /* Print / A4 formatting */
        @media print {{
            body {{
                background: #ffffff;
                padding: 0;
            }}
            .report-container {{
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
            }}
            .page-break-inside-avoid {{
                page-break-inside: avoid;
            }}
            .viz-card {{
                page-break-inside: avoid;
            }}
            @page {{
                size: A4;
                margin: 15mm;
            }}
        }}
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Brand Header -->
        <header class="header-brand">
            <div class="brand-logo">Tactical<span>Ghost</span></div>
            <div class="confidential-tag">{html.escape(meta.confidentiality_notice)}</div>
        </header>

        <!-- Cover & Title -->
        <div class="cover-title-wrap">
            <span class="report-type-badge">{html.escape(meta.report_type.value.replace('_', ' '))}</span>
            <h1 class="cover-title">{html.escape(meta.title)}</h1>
            <p class="cover-subtitle">{html.escape(meta.subtitle)}</p>
        </div>

        <!-- Metadata Strip -->
        <div class="meta-strip">
            <div class="meta-item">
                <div class="meta-item-label">Report ID</div>
                <div class="meta-item-value">{html.escape(meta.report_id)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-item-label">Generated At</div>
                <div class="meta-item-value">{html.escape(meta.generated_at[:19].replace('T', ' '))} UTC</div>
            </div>
            <div class="meta-item">
                <div class="meta-item-label">Source Datasets</div>
                <div class="meta-item-value">{', '.join(meta.source_matches)}</div>
            </div>
            <div class="meta-item">
                <div class="meta-item-label">Methodology</div>
                <div class="meta-item-value">{html.escape(meta.methodology_version)}</div>
            </div>
        </div>

        <!-- Table of Contents -->
        <div class="toc-box">
            <div class="toc-title">Table of Contents & Analytical Modules</div>
            <ul class="toc-list">
                {"".join(toc_items)}
            </ul>
        </div>

        <!-- Analytical Sections -->
        <main>
            {"".join(sections_html)}
        </main>

        <!-- Actionable Recommendations -->
        {f'''
        <div class="recommendations-section page-break-inside-avoid">
            <h3 style="font-size: 17px; font-weight: 800; margin-bottom: 14px;">Strategic & Actionable Recommendations</h3>
            {"".join(recs_html)}
        </div>
        ''' if recs_html else ''}

        <!-- Limitations & Provenance Charter -->
        <footer class="limitations-box page-break-inside-avoid">
            <h4>Analytical Boundaries & Data Provenance Notice</h4>
            <ul>
                {"".join(limitations_html)}
            </ul>
            <p style="margin-top: 8px; font-size: 10px; color: #94a3b8;">{html.escape(meta.analyst_signoff)} | Powered by TacticalGhost Engine</p>
        </footer>
    </div>
</body>
</html>"""
