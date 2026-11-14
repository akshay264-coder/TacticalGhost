"""
JSON Report Exporter.
Serializes StandardTacticalReport to deterministic, schema-validated JSON.
"""

import json
from typing import Dict, Any
from app.reporting.report_schema import StandardTacticalReport


class JsonReportExporter:
    """
    Exports StandardTacticalReport to formatted JSON.
    """

    @staticmethod
    def export_dict(report: StandardTacticalReport) -> Dict[str, Any]:
        return report.model_dump()

    @staticmethod
    def export_json_string(report: StandardTacticalReport, indent: int = 2) -> str:
        return json.dumps(report.model_dump(), indent=indent, default=str)

    @staticmethod
    def save_json_file(report: StandardTacticalReport, output_path: str, indent: int = 2) -> None:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(JsonReportExporter.export_json_string(report, indent=indent))
