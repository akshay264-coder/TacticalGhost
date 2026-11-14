"""
API Integration Tests for Reporting System Endpoints.
Verifies /api/reports/ routes, request/response validation, error handling, and history.
"""

import pytest
from app.api.routes_reporting import (
    get_reporting_status,
    get_report_types,
    get_report_templates,
    get_report_history,
    generate_report,
    preview_report,
    get_report_by_id,
    get_report_html,
    get_report_json,
    delete_report
)
from app.reporting.report_schema import ReportGenerationRequest, ReportType
from fastapi import HTTPException


def test_api_reporting_status_and_metadata():
    status = get_reporting_status()
    assert status["status"] == "OPERATIONAL"
    assert status["engine_version"] == "2.0.0"
    assert len(status["supported_report_types"]) == 7

    types = get_report_types()
    assert len(types) == 7
    assert any(t["type"] == "MATCH_INTELLIGENCE" for t in types)

    templates = get_report_templates()
    assert len(templates) >= 6
    assert any(tpl["template_id"] == "tpl_exec_brief" for tpl in templates)


def test_api_generate_and_retrieve_and_delete_report():
    req = ReportGenerationRequest(
        report_type=ReportType.EXECUTIVE_SUMMARY,
        match_id="metrica_game_1",
        custom_title="API Integration Test Executive Brief"
    )
    res = generate_report(req)
    assert res.status == "COMPLETED"
    report_id = res.report_id
    assert report_id.startswith("tg_")

    # Retrieve report by ID
    fetched = get_report_by_id(report_id)
    assert fetched.metadata.report_id == report_id
    assert fetched.metadata.title == "API Integration Test Executive Brief"

    # HTML
    html_resp = get_report_html(report_id)
    assert "<!DOCTYPE html>" in html_resp.body.decode("utf-8")

    # JSON
    json_resp = get_report_json(report_id)
    assert json_resp.status_code == 200

    # History
    hist = get_report_history()
    assert any(h["report_id"] == report_id for h in hist)

    # Delete
    del_res = delete_report(report_id)
    assert del_res["status"] == "DELETED"

    # Verify 404 after deletion
    with pytest.raises(HTTPException) as exc_info:
        get_report_by_id(report_id)
    assert exc_info.value.status_code == 404


def test_api_preview_report():
    req = ReportGenerationRequest(
        report_type=ReportType.TACTICAL_ANALYSIS,
        match_id="metrica_game_1"
    )
    prev = preview_report(req)
    assert prev.metadata.report_type == ReportType.TACTICAL_ANALYSIS
    assert len(prev.sections) >= 3


def test_api_error_handling_not_found():
    with pytest.raises(HTTPException) as exc_info:
        get_report_by_id("non_existent_report_id_12345")
    assert exc_info.value.status_code == 404
