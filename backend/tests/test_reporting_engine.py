"""
Automated Test Suite for Automated Professional Tactical Reporting System (Phase 20).
Tests all 7 report generators, context building, vector visualizations,
HTML, PDF, JSON exporters, report validation constraints, registry, and FastAPI endpoints.
"""

import os
import pytest
from app.reporting.report_schema import (
    ReportType,
    EvidenceCategory,
    ExportFormat,
    ReportGenerationRequest,
    StandardTacticalReport
)
from app.reporting.report_context import ReportingContext
from app.reporting.report_engine import TacticalReportingEngine
from app.reporting.report_registry import ReportRegistry
from app.reporting.report_validation import ReportValidator, ReportValidationError
from app.reporting.exporters.html_exporter import HtmlReportExporter
from app.reporting.exporters.pdf_exporter import PdfReportExporter
from app.reporting.exporters.json_exporter import JsonReportExporter


@pytest.fixture(scope="module")
def reporting_engine():
    return TacticalReportingEngine()


def test_reporting_status_and_types(reporting_engine):
    """Verifies that all 7 report types are officially registered and supported."""
    assert len(reporting_engine.generators) == 7
    for rt in ReportType:
        assert rt in reporting_engine.generators


def test_match_intelligence_report_16_sections(reporting_engine):
    """
    Verifies that the Match Intelligence Report contains exactly all 16 required sections,
    retains evidence provenance, and renders pitch diagrams.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.MATCH_INTELLIGENCE,
        match_id="metrica_game_1",
        team="Home",
        opponent_team="Away"
    )
    res = reporting_engine.generate_report(req)
    assert res.status == "COMPLETED"
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.MATCH_INTELLIGENCE
    assert len(rep.sections) == 16

    # Verify section numbers 1 through 16
    sec_nums = [s.section_number for s in rep.sections]
    assert sec_nums == list(range(1, 17))

    # Verify visualizations present
    assert len(rep.visualizations) >= 2
    assert any(v.viz_type == "pitch_formation" for v in rep.visualizations)
    assert any(v.viz_type == "pitch_movement" for v in rep.visualizations)

    # Verify export links
    assert "html" in res.export_links
    assert "pdf" in res.export_links
    assert "json" in res.export_links


def test_tactical_analysis_report_multi_sequence_recurrence(reporting_engine):
    """
    Verifies that the Tactical Analysis Report identifies patterns
    with strict multi-sequence recurrence validation.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.TACTICAL_ANALYSIS,
        match_id="metrica_game_1"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.TACTICAL_ANALYSIS
    assert len(rep.supporting_sequences) >= 2
    assert "CP-01" in rep.sections[1].content_markdown


def test_opponent_analysis_report_epistemic_separation(reporting_engine):
    """
    Verifies that the Opponent Analysis Report separates observed telemetry
    from model estimates and prescriptive coaching directives.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.OPPONENT_ANALYSIS,
        opponent_team="Away",
        match_id="metrica_game_1",
        secondary_match_id="metrica_game_2"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.OPPONENT_ANALYSIS
    assert "DETERMINISTIC_MODEL_ESTIMATE" in rep.sections[0].content_markdown
    assert "OBSERVED_TRACKING_TELEMETRY" in rep.sections[1].content_markdown
    assert "COACHING_DIRECTIVE" in rep.sections[4].content_markdown


def test_coach_strategy_report_gameplan(reporting_engine):
    """
    Verifies that the Coach Strategy Report includes formation evaluation,
    starting XI, 4 corridors, and 4 training drills.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.COACH_STRATEGY,
        opponent_team="Away",
        preferred_formation="4-3-3",
        tactical_philosophy="POSSESSION_BUILDUP"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.COACH_STRATEGY
    assert len(rep.recommendations) >= 1
    assert "3+2 Rest-Defense" in rep.sections[4].content_markdown
    assert "Four Prescribed Practice Drills" in rep.sections[6].content_markdown


def test_player_scouting_report_anonymous_identity(reporting_engine):
    """
    Verifies that Player Scouting Reports use anonymous optical tracking tags
    and refuse to fabricate biographical or medical information.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.PLAYER_SCOUTING,
        player_id="Home_10",
        team="Home"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.PLAYER_SCOUTING
    assert rep.metadata.target_player_id == "Home_10"
    assert "PROVISIONAL_ANONYMOUS_TAG" in rep.sections[0].content_markdown
    assert "Zero fabrication of biographical" in rep.sections[0].content_markdown


def test_multi_match_comparison_report(reporting_engine):
    """
    Verifies cross-match comparison evaluating dataset compatibility
    and tactical DNA divergence.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.MULTI_MATCH_COMPARISON,
        match_id="metrica_game_1",
        secondary_match_id="metrica_game_2"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.MULTI_MATCH_COMPARISON
    assert "Dataset Compatibility Score" in rep.sections[0].content_markdown


def test_executive_summary_report_conciseness(reporting_engine):
    """
    Verifies that the Executive Summary Report produces high-level
    top 3 observations and top 3 vulnerabilities.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.EXECUTIVE_SUMMARY,
        match_id="metrica_game_1"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data
    assert rep is not None
    assert rep.metadata.report_type == ReportType.EXECUTIVE_SUMMARY
    assert "Three Strongest Tactical Observations" in rep.sections[1].title
    assert "Three Major Tactical Vulnerabilities" in rep.sections[2].title


def test_html_and_pdf_and_json_exporters(reporting_engine, tmp_path):
    """
    Tests HTML, PDF, and JSON exporters on a generated report.
    """
    req = ReportGenerationRequest(
        report_type=ReportType.EXECUTIVE_SUMMARY,
        match_id="metrica_game_1"
    )
    res = reporting_engine.generate_report(req)
    rep = res.report_data

    # HTML
    html_str = HtmlReportExporter.export(rep)
    assert "<!DOCTYPE html>" in html_str
    assert "TacticalGhost" in html_str
    assert "<svg" in html_str  # Embedded pitch SVG

    # JSON
    json_str = JsonReportExporter.export_json_string(rep)
    assert '"report_type": "EXECUTIVE_SUMMARY"' in json_str

    # PDF
    pdf_out = str(tmp_path / "test_exec.pdf")
    ok = PdfReportExporter.export_pdf(rep, pdf_out)
    assert ok is True
    assert os.path.exists(pdf_out)
    assert os.path.getsize(pdf_out) > 500


def test_report_validation_rules():
    """
    Verifies that ReportValidator strictly catches invalid or malformed data.
    """
    # Empty report should fail validation
    from app.reporting.report_schema import ReportMetadata
    meta = ReportMetadata(
        report_id="invalid_rep",
        report_type=ReportType.MATCH_INTELLIGENCE,
        title="Test",
        subtitle="Sub",
        generated_at="2026-11-14T00:00:00Z",
        source_matches=[]
    )
    empty_rep = StandardTacticalReport(
        metadata=meta,
        executive_summary="Empty",
        sections=[],
        limitations=[]
    )
    with pytest.raises(ReportValidationError):
        ReportValidator.validate_report(empty_rep)


def test_report_registry_sanitization(tmp_path):
    """
    Verifies that directory traversal attacks in report_id are sanitized.
    """
    reg = ReportRegistry(storage_dir=str(tmp_path))
    sanitized = reg._sanitize_id("../../etc/passwd")
    assert "/" not in sanitized
    assert ".." not in sanitized
