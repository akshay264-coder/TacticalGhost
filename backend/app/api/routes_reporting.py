"""
FastAPI Router for Automated Professional Tactical Reporting System (Phase 20).
Provides endpoints for report configuration, synchronous generation,
preview, history, and downloads in HTML, PDF, and JSON formats.
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel, Field

from app.reporting.report_schema import (
    ReportType,
    ExportFormat,
    ReportGenerationRequest,
    ReportGenerationResponse,
    StandardTacticalReport
)
from app.reporting.report_engine import TacticalReportingEngine
from app.reporting.report_validation import ReportValidationError


router = APIRouter(prefix="/reports", tags=["Reporting Engine"])
_reporting_engine = TacticalReportingEngine()


@router.get("/status")
def get_reporting_status() -> Dict[str, Any]:
    """
    Returns reporting engine runtime status, version, and capabilities.
    """
    return {
        "status": "OPERATIONAL",
        "engine_version": "2.0.0",
        "supported_report_types": [rt.value for rt in ReportType],
        "supported_export_formats": ["html", "pdf", "json"],
        "storage_directory": "data/reports",
        "active_reports_count": len(_reporting_engine.registry.list_reports()),
        "generation_mode": "SYNCHRONOUS_DETERMINISTIC"
    }


@router.get("/types")
def get_report_types() -> List[Dict[str, Any]]:
    """
    Lists the 7 supported professional tactical report types with requirements.
    """
    return [
        {
            "type": ReportType.MATCH_INTELLIGENCE.value,
            "title": "Match Intelligence Report",
            "description": "Comprehensive 16-section post-match or pre-match dossier covering structures, transitions, and space creation.",
            "required_parameters": ["match_id"],
            "optional_parameters": ["team", "opponent_team"]
        },
        {
            "type": ReportType.TACTICAL_ANALYSIS.value,
            "title": "Tactical Analysis Report",
            "description": "Deep-dive tactical dossier focusing on Phase 16 commercial pattern archetypes and multi-sequence overloads.",
            "required_parameters": ["match_id"],
            "optional_parameters": []
        },
        {
            "type": ReportType.OPPONENT_ANALYSIS.value,
            "title": "Opponent Analysis Report",
            "description": "Multi-match opponent intelligence scouting dossier mapping tactical DNA, vulnerability clusters, and countermeasure directives.",
            "required_parameters": ["opponent_team"],
            "optional_parameters": ["match_id", "secondary_match_id"]
        },
        {
            "type": ReportType.COACH_STRATEGY.value,
            "title": "Coach Strategy Report",
            "description": "Tactical gameplan dossier including formation evaluation, starting XI selection, 4 exploitation corridors, and microcycle training drills.",
            "required_parameters": ["opponent_team", "preferred_formation"],
            "optional_parameters": ["tactical_philosophy"]
        },
        {
            "type": ReportType.PLAYER_SCOUTING.value,
            "title": "Player Scouting Report",
            "description": "Player scouting dossier evaluating 9 tactical role archetypes, off-ball space creation, and squad fit using anonymous tracking tags.",
            "required_parameters": ["player_id"],
            "optional_parameters": ["team"]
        },
        {
            "type": ReportType.MULTI_MATCH_COMPARISON.value,
            "title": "Multi-Match Comparison Report",
            "description": "Cross-match comparative analysis evaluating tactical DNA divergence and recurrent vulnerabilities between two matches.",
            "required_parameters": ["match_id", "secondary_match_id"],
            "optional_parameters": []
        },
        {
            "type": ReportType.EXECUTIVE_SUMMARY.value,
            "title": "Executive Summary Report",
            "description": "High-level decision brief for sporting directors and senior technical leadership focusing on top findings and decisive actions.",
            "required_parameters": ["match_id"],
            "optional_parameters": ["team", "opponent_team"]
        }
    ]


@router.post("/generate", response_model=ReportGenerationResponse)
def generate_report(request: ReportGenerationRequest) -> ReportGenerationResponse:
    """
    Generates a full tactical report synchronously, returning metadata and artifact links.
    """
    try:
        response = _reporting_engine.generate_report(request)
        return response
    except ReportValidationError as ve:
        raise HTTPException(status_code=400, detail=f"Report Validation Failed: {str(ve)}")
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Report Generation Error: {str(e)}")


@router.post("/preview", response_model=StandardTacticalReport)
def preview_report(request: ReportGenerationRequest) -> StandardTacticalReport:
    """
    Generates report data in-memory for previewing in the UI without saving to disk.
    """
    try:
        report = _reporting_engine.preview_report(request)
        return report
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preview generation error: {str(e)}")


@router.get("/history")
def get_report_history() -> List[Dict[str, Any]]:
    """
    Lists previously generated tactical reports from the registry.
    """
    return _reporting_engine.registry.list_reports()


@router.get("/templates")
def get_report_templates() -> List[Dict[str, Any]]:
    """
    Returns pre-configured report templates for rapid 1-click generation.
    """
    return [
        {
            "template_id": "tpl_game1_match_intelligence",
            "name": "Game 1 Full Match Intelligence",
            "report_type": ReportType.MATCH_INTELLIGENCE.value,
            "match_id": "metrica_game_1",
            "team": "Home",
            "opponent_team": "Away"
        },
        {
            "template_id": "tpl_away_opponent_dossier",
            "name": "Away Team Opponent Analysis",
            "report_type": ReportType.OPPONENT_ANALYSIS.value,
            "opponent_team": "Away",
            "match_id": "metrica_game_1",
            "secondary_match_id": "metrica_game_2"
        },
        {
            "template_id": "tpl_coach_gameplan_433",
            "name": "Coach Gameplan (4-3-3 vs Away)",
            "report_type": ReportType.COACH_STRATEGY.value,
            "opponent_team": "Away",
            "preferred_formation": "4-3-3",
            "tactical_philosophy": "POSSESSION_BUILDUP"
        },
        {
            "template_id": "tpl_scout_home_10",
            "name": "Player Scouting: Home_10 (Playmaker)",
            "report_type": ReportType.PLAYER_SCOUTING.value,
            "player_id": "Home_10",
            "team": "Home"
        },
        {
            "template_id": "tpl_multi_match_g1_g2",
            "name": "Cross-Match Comparison (Game 1 vs Game 2)",
            "report_type": ReportType.MULTI_MATCH_COMPARISON.value,
            "match_id": "metrica_game_1",
            "secondary_match_id": "metrica_game_2"
        },
        {
            "template_id": "tpl_exec_brief",
            "name": "Executive Decision Brief (Home vs Away)",
            "report_type": ReportType.EXECUTIVE_SUMMARY.value,
            "match_id": "metrica_game_1",
            "team": "Home",
            "opponent_team": "Away"
        }
    ]


@router.get("/{report_id}")
def get_report_by_id(report_id: str) -> StandardTacticalReport:
    """
    Retrieves the complete structured report data model.
    """
    report = _reporting_engine.registry.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")
    return report


@router.get("/{report_id}/html")
def get_report_html(report_id: str) -> HTMLResponse:
    """
    Serves the standalone HTML report for browser viewing or printing.
    """
    html_path = _reporting_engine.registry.get_report_html_path(report_id)
    if html_path:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
        return HTMLResponse(content=content)

    # Fallback to in-memory rendering if file not on disk
    report = _reporting_engine.registry.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")
    
    from app.reporting.exporters.html_exporter import HtmlReportExporter
    return HTMLResponse(content=HtmlReportExporter.export(report))


@router.get("/{report_id}/pdf")
def get_report_pdf(report_id: str):
    """
    Downloads the A4 PDF dossier.
    """
    pdf_path = _reporting_engine.registry.get_report_pdf_path(report_id)
    if pdf_path:
        return FileResponse(
            path=pdf_path,
            filename=f"{report_id}.pdf",
            media_type="application/pdf"
        )

    # Attempt dynamic PDF generation if not cached
    report = _reporting_engine.registry.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")

    from app.reporting.exporters.pdf_exporter import PdfReportExporter
    target_path = f"data/reports/{report_id}.pdf"
    ok = PdfReportExporter.export_pdf(report, target_path)
    if ok and os.path.exists(target_path):
        return FileResponse(
            path=target_path,
            filename=f"{report_id}.pdf",
            media_type="application/pdf"
        )
    raise HTTPException(status_code=500, detail="PDF generation failed for this report.")


@router.get("/{report_id}/json")
def get_report_json(report_id: str) -> JSONResponse:
    """
    Downloads the structured report JSON.
    """
    report = _reporting_engine.registry.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")
    return JSONResponse(content=report.model_dump())


@router.delete("/{report_id}")
def delete_report(report_id: str) -> Dict[str, Any]:
    """
    Removes a report and its artifacts from storage.
    """
    deleted = _reporting_engine.registry.delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")
    return {"status": "DELETED", "report_id": report_id}
