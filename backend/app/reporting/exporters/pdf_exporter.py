"""
Professional PDF Report Exporter.
Supports primary Chrome Headless print-to-pdf engine (for exact HTML/SVG pixel fidelity)
with a robust ReportLab in-process vector fallback engine.
Enforces A4 page formatting, running headers, and footers.
"""

import os
import subprocess
from typing import Optional
from app.reporting.report_schema import StandardTacticalReport
from app.reporting.exporters.html_exporter import HtmlReportExporter


class PdfReportExporter:
    """
    Renders StandardTacticalReport to an A4 PDF document.
    """

    @staticmethod
    def export_pdf(
        report: StandardTacticalReport,
        output_pdf_path: str,
        temp_html_path: Optional[str] = None
    ) -> bool:
        """
        Attempts Chrome headless PDF rendering first; falls back to ReportLab.
        """
        os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)
        html_content = HtmlReportExporter.export(report)

        # 1. Primary: Chrome Headless print-to-pdf
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "/usr/bin/google-chrome",
            "/usr/bin/chromium-browser"
        ]
        
        chrome_bin = None
        for p in chrome_paths:
            if os.path.exists(p):
                chrome_bin = p
                break

        if chrome_bin:
            th_path = temp_html_path or output_pdf_path.replace(".pdf", ".tmp.html")
            try:
                with open(th_path, "w", encoding="utf-8") as f:
                    f.write(html_content)

                cmd = [
                    chrome_bin,
                    "--headless=new",
                    "--disable-gpu",
                    "--no-margins",
                    f"--print-to-pdf={output_pdf_path}",
                    th_path
                ]
                res = subprocess.run(cmd, capture_output=True, timeout=25)
                if os.path.exists(output_pdf_path) and os.path.getsize(output_pdf_path) > 1000:
                    # Clean up temp html
                    if os.path.exists(th_path) and th_path.endswith(".tmp.html"):
                        try:
                            os.remove(th_path)
                        except Exception:
                            pass
                    return True
            except Exception as e:
                pass

        # 2. In-Process Fallback: ReportLab Vector Engine
        return PdfReportExporter._export_reportlab_fallback(report, output_pdf_path)

    @staticmethod
    def _export_reportlab_fallback(report: StandardTacticalReport, output_pdf_path: str) -> bool:
        """
        Generates structured A4 PDF using ReportLab library.
        """
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
            )
            from reportlab.pdfgen import canvas

            class NumberedCanvas(canvas.Canvas):
                def __init__(self, *args, **kwargs):
                    super().__init__(*args, **kwargs)
                    self._saved_page_states = []

                def showPage(self):
                    self._saved_page_states.append(dict(self.__dict__))
                    self._startPage()

                def save(self):
                    num_pages = len(self._saved_page_states)
                    for state in self._saved_page_states:
                        self.__dict__.update(state)
                        self.draw_page_number(num_pages)
                        super().showPage()
                    super().save()

                def draw_page_number(self, page_count):
                    self.saveState()
                    self.setFont("Helvetica", 8)
                    self.setFillColor(colors.HexColor("#64748b"))
                    self.setStrokeColor(colors.HexColor("#e2e8f0"))
                    self.setLineWidth(0.5)

                    # Running Header (pages > 1)
                    if self._pageNumber > 1:
                        self.line(40, 800, 555, 800)
                        self.drawString(40, 805, "TacticalGhost — Professional Football Intelligence")
                        self.drawRightString(555, 805, "CONFIDENTIAL")

                    # Running Footer
                    self.line(40, 45, 555, 45)
                    self.drawString(40, 32, "TacticalGhost Certified Analysis | Spearman (2018) Pitch Control")
                    self.drawRightString(555, 32, f"Page {self._pageNumber} of {page_count}")
                    self.restoreState()

            doc = SimpleDocTemplate(
                output_pdf_path,
                pagesize=A4,
                leftMargin=40,
                rightMargin=40,
                topMargin=55,
                bottomMargin=55
            )

            styles = getSampleStyleSheet()
            
            # Custom typography
            title_style = ParagraphStyle(
                'ReportTitle',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=20,
                leading=24,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=6
            )
            subtitle_style = ParagraphStyle(
                'ReportSubtitle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                leading=14,
                textColor=colors.HexColor("#64748b"),
                spaceAfter=15
            )
            h2_style = ParagraphStyle(
                'SectionHeader',
                parent=styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=14,
                leading=17,
                textColor=colors.HexColor("#ea580c"),
                spaceBefore=14,
                spaceAfter=8
            )
            body_style = ParagraphStyle(
                'BodyTextCustom',
                parent=styles['BodyText'],
                fontName='Helvetica',
                fontSize=9.5,
                leading=13.5,
                textColor=colors.HexColor("#334155"),
                spaceAfter=8
            )
            tag_style = ParagraphStyle(
                'TagStyle',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=8.5,
                leading=10,
                textColor=colors.HexColor("#ea580c")
            )

            story = []

            # Cover Title Banner
            meta = report.metadata
            story.append(Paragraph(meta.report_type.value.replace('_', ' '), tag_style))
            story.append(Paragraph(meta.title, title_style))
            story.append(Paragraph(meta.subtitle, subtitle_style))

            # Metadata Table
            meta_data = [
                [
                    Paragraph("<b>Report ID:</b> " + meta.report_id, body_style),
                    Paragraph("<b>Generated:</b> " + meta.generated_at[:10], body_style)
                ],
                [
                    Paragraph("<b>Source Matches:</b> " + ", ".join(meta.source_matches), body_style),
                    Paragraph("<b>Methodology:</b> " + meta.methodology_version, body_style)
                ]
            ]
            meta_table = Table(meta_data, colWidths=[250, 265])
            meta_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(meta_table)
            story.append(Spacer(1, 15))

            # Sections
            for sec in report.sections:
                story.append(Paragraph(f"{sec.section_number}. {sec.title}", h2_style))
                for p in sec.content_markdown.split("\n\n"):
                    p_clean = p.strip()
                    if p_clean:
                        import re
                        p_clean = re.sub(r"^#+\s*", "", p_clean, flags=re.MULTILINE)
                        p_clean = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", p_clean)
                        p_clean = re.sub(r"\*(.+?)\*", r"<i>\1</i>", p_clean)
                        p_clean = p_clean.replace("&", "&amp;")
                        story.append(Paragraph(p_clean, body_style))
                story.append(Spacer(1, 8))

            # Recommendations
            if report.recommendations:
                story.append(Paragraph("Strategic Recommendations", h2_style))
                for r in report.recommendations:
                    rec_p = Paragraph(f"<b>[{r.priority}] {r.headline}</b><br/>{r.details}<br/><i>Risks: {'; '.join(r.counter_risks)}</i>", body_style)
                    story.append(rec_p)
                    story.append(Spacer(1, 6))

            # Limitations
            story.append(Spacer(1, 10))
            story.append(Paragraph("<b>Analytical Limitations:</b>", tag_style))
            for lim in report.limitations:
                story.append(Paragraph(f"• {lim}", body_style))

            doc.build(story, canvasmaker=NumberedCanvas)
            return os.path.exists(output_pdf_path) and os.path.getsize(output_pdf_path) > 500

        except Exception as e:
            # Fallback simple binary if ReportLab fails
            return False
