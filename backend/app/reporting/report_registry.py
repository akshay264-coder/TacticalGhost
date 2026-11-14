"""
Report Storage Registry and History Manager.
Provides safe, directory-traversal-proof filesystem persistence and retrieval
for HTML, PDF, and JSON tactical dossiers.
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from app.reporting.report_schema import StandardTacticalReport, ReportMetadata


class ReportRegistry:
    """
    Manages storage, retrieval, and listing of generated tactical reports.
    """

    SAFE_ID_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")

    def __init__(self, storage_dir: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.storage_dir = storage_dir or os.path.join(base_dir, "data", "reports")
        os.makedirs(self.storage_dir, exist_ok=True)
        self._in_memory_reports: Dict[str, StandardTacticalReport] = {}
        self._load_existing_reports()

    def _load_existing_reports(self) -> None:
        """Loads previously saved report JSONs on startup."""
        if not os.path.exists(self.storage_dir):
            return
        for fname in os.listdir(self.storage_dir):
            if fname.endswith(".json") and not fname.endswith(".meta.json"):
                fpath = os.path.join(self.storage_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        rep = StandardTacticalReport.model_validate(data)
                        self._in_memory_reports[rep.metadata.report_id] = rep
                except Exception:
                    pass

    def _sanitize_id(self, report_id: str) -> str:
        """Ensures report_id cannot perform path traversal."""
        if not self.SAFE_ID_REGEX.match(report_id):
            clean_id = re.sub(r"[^a-zA-Z0-9_\-]", "_", report_id)
            return clean_id[:64]
        return report_id

    def save_report(
        self,
        report: StandardTacticalReport,
        html_content: Optional[str] = None,
        pdf_bytes: Optional[bytes] = None
    ) -> Dict[str, str]:
        """
        Saves report artifacts to disk and updates in-memory registry.
        """
        clean_id = self._sanitize_id(report.metadata.report_id)
        report.metadata.report_id = clean_id
        self._in_memory_reports[clean_id] = report

        json_path = os.path.join(self.storage_dir, f"{clean_id}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(report.model_dump_json(indent=2))

        html_path = os.path.join(self.storage_dir, f"{clean_id}.html")
        if html_content:
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)

        pdf_path = os.path.join(self.storage_dir, f"{clean_id}.pdf")
        if pdf_bytes:
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)

        links = {
            "json": f"/api/reports/{clean_id}/json",
            "html": f"/api/reports/{clean_id}/html",
            "pdf": f"/api/reports/{clean_id}/pdf"
        }
        report.export_links = links
        return links

    def get_report(self, report_id: str) -> Optional[StandardTacticalReport]:
        clean_id = self._sanitize_id(report_id)
        if clean_id in self._in_memory_reports:
            return self._in_memory_reports[clean_id]

        json_path = os.path.join(self.storage_dir, f"{clean_id}.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    rep = StandardTacticalReport.model_validate(data)
                    self._in_memory_reports[clean_id] = rep
                    return rep
            except Exception:
                return None
        return None

    def get_report_html_path(self, report_id: str) -> Optional[str]:
        clean_id = self._sanitize_id(report_id)
        path = os.path.join(self.storage_dir, f"{clean_id}.html")
        return path if os.path.exists(path) else None

    def get_report_pdf_path(self, report_id: str) -> Optional[str]:
        clean_id = self._sanitize_id(report_id)
        path = os.path.join(self.storage_dir, f"{clean_id}.pdf")
        return path if os.path.exists(path) else None

    def list_reports(self) -> List[Dict[str, Any]]:
        """Returns sorted list of report summaries (newest first)."""
        reps = []
        for rep in self._in_memory_reports.values():
            m = rep.metadata
            reps.append({
                "report_id": m.report_id,
                "report_type": m.report_type.value,
                "title": m.title,
                "subtitle": m.subtitle,
                "generated_at": m.generated_at,
                "source_matches": m.source_matches,
                "target_team": m.target_team,
                "target_player_id": m.target_player_id,
                "export_links": rep.export_links
            })
        reps.sort(key=lambda x: x.get("generated_at", ""), reverse=True)
        return reps

    def delete_report(self, report_id: str) -> bool:
        clean_id = self._sanitize_id(report_id)
        deleted = False
        if clean_id in self._in_memory_reports:
            del self._in_memory_reports[clean_id]
            deleted = True

        for ext in [".json", ".html", ".pdf"]:
            path = os.path.join(self.storage_dir, f"{clean_id}{ext}")
            if os.path.exists(path):
                try:
                    os.remove(path)
                    deleted = True
                except Exception:
                    pass
        return deleted
