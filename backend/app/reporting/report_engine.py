"""
Central Tactical Reporting Engine.
Deterministic orchestrator for generating, validating, exporting,
and registering all 7 professional football report types.
"""

import os
from typing import Dict, List, Optional, Any
from app.reporting.report_schema import (
    ReportType,
    ExportFormat,
    ReportGenerationRequest,
    ReportGenerationResponse,
    StandardTacticalReport
)
from app.reporting.report_context import ReportingContext
from app.reporting.report_registry import ReportRegistry
from app.reporting.report_validation import ReportValidator
from app.reporting.generators.match_report import MatchIntelligenceReportGenerator
from app.reporting.generators.tactical_report import TacticalAnalysisReportGenerator
from app.reporting.generators.opponent_report import OpponentAnalysisReportGenerator
from app.reporting.generators.coach_report import CoachStrategyReportGenerator
from app.reporting.generators.scouting_report import PlayerScoutingReportGenerator
from app.reporting.generators.comparison_report import MultiMatchComparisonReportGenerator
from app.reporting.generators.executive_report import ExecutiveSummaryReportGenerator
from app.reporting.exporters.html_exporter import HtmlReportExporter
from app.reporting.exporters.pdf_exporter import PdfReportExporter
from app.reporting.exporters.json_exporter import JsonReportExporter


class TacticalReportingEngine:
    """
    Central reporting pipeline: Intelligence Engines -> Context -> Generator -> Validator -> Exporters -> Registry.
    """

    def __init__(
        self,
        context: Optional[ReportingContext] = None,
        registry: Optional[ReportRegistry] = None
    ):
        self.ctx = context or ReportingContext()
        self.registry = registry or ReportRegistry()

        # Initialize the 7 specialized generators
        self.generators = {
            ReportType.MATCH_INTELLIGENCE: MatchIntelligenceReportGenerator(self.ctx),
            ReportType.TACTICAL_ANALYSIS: TacticalAnalysisReportGenerator(self.ctx),
            ReportType.OPPONENT_ANALYSIS: OpponentAnalysisReportGenerator(self.ctx),
            ReportType.COACH_STRATEGY: CoachStrategyReportGenerator(self.ctx),
            ReportType.PLAYER_SCOUTING: PlayerScoutingReportGenerator(self.ctx),
            ReportType.MULTI_MATCH_COMPARISON: MultiMatchComparisonReportGenerator(self.ctx),
            ReportType.EXECUTIVE_SUMMARY: ExecutiveSummaryReportGenerator(self.ctx)
        }

    def generate_report(self, request: ReportGenerationRequest) -> ReportGenerationResponse:
        """
        Executes deterministic report generation synchronously.
        """
        rtype = request.report_type
        if rtype not in self.generators:
            raise ValueError(f"Unsupported report type: {rtype}")

        generator = self.generators[rtype]

        # Dispatch based on report type
        if rtype == ReportType.MATCH_INTELLIGENCE:
            report = generator.generate(
                match_id=request.match_id or "metrica_game_1",
                team=request.team or "Home",
                opponent_team=request.opponent_team or "Away",
                custom_title=request.custom_title
            )
        elif rtype == ReportType.TACTICAL_ANALYSIS:
            report = generator.generate(
                match_id=request.match_id or "metrica_game_1",
                custom_title=request.custom_title
            )
        elif rtype == ReportType.OPPONENT_ANALYSIS:
            matches = [request.match_id or "metrica_game_1"]
            if request.secondary_match_id:
                matches.append(request.secondary_match_id)
            report = generator.generate(
                opponent_team=request.opponent_team or "Away",
                matches=matches,
                custom_title=request.custom_title
            )
        elif rtype == ReportType.COACH_STRATEGY:
            matches = [request.match_id or "metrica_game_1"]
            if request.secondary_match_id:
                matches.append(request.secondary_match_id)
            report = generator.generate(
                opponent_team=request.opponent_team or "Away",
                preferred_formation=request.preferred_formation or "4-3-3",
                tactical_philosophy=request.tactical_philosophy or "POSSESSION_BUILDUP",
                matches=matches,
                custom_title=request.custom_title
            )
        elif rtype == ReportType.PLAYER_SCOUTING:
            target_p = request.player_id or "Home_10"
            report = generator.generate(
                player_id=target_p,
                team=request.team or "Home",
                custom_title=request.custom_title
            )
        elif rtype == ReportType.MULTI_MATCH_COMPARISON:
            m1 = request.match_id or "metrica_game_1"
            m2 = request.secondary_match_id or "metrica_game_2"
            report = generator.generate(
                match1_id=m1,
                match2_id=m2,
                custom_title=request.custom_title
            )
        elif rtype == ReportType.EXECUTIVE_SUMMARY:
            report = generator.generate(
                match_id=request.match_id or "metrica_game_1",
                team=request.team or "Home",
                opponent_team=request.opponent_team or "Away",
                custom_title=request.custom_title
            )

        # Validate Report Integrity
        ReportValidator.validate_report(report)

        # Export artifacts
        html_str = HtmlReportExporter.export(report)
        pdf_path = os.path.join(self.registry.storage_dir, f"{report.metadata.report_id}.pdf")
        PdfReportExporter.export_pdf(report, pdf_path)
        
        pdf_bytes = None
        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

        # Save to Registry
        links = self.registry.save_report(report, html_content=html_str, pdf_bytes=pdf_bytes)

        return ReportGenerationResponse(
            report_id=report.metadata.report_id,
            report_type=report.metadata.report_type,
            status="COMPLETED",
            generated_at=report.metadata.generated_at,
            summary=report.executive_summary,
            export_links=links,
            report_data=report
        )

    def preview_report(self, request: ReportGenerationRequest) -> StandardTacticalReport:
        """
        Generates in-memory report preview without writing permanent files to disk.
        """
        res = self.generate_report(request)
        return res.report_data
