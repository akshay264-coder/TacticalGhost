"""
Report Metadata Builder and Provenance Tracking Utilities.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.reporting.report_schema import ReportMetadata, ReportType


def build_report_metadata(
    report_type: ReportType,
    title: str,
    subtitle: str,
    source_matches: List[str],
    target_match_id: Optional[str] = None,
    target_team: Optional[str] = None,
    target_player_id: Optional[str] = None,
    dataset_compatibility: Optional[Dict[str, Any]] = None,
    custom_report_id: Optional[str] = None
) -> ReportMetadata:
    """
    Constructs a validated ReportMetadata record with deterministic identifiers and provenance.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    now_tag = now_iso.replace(":", "").replace("-", "")[:15]
    type_slug = report_type.value.lower()
    match_tag = target_match_id or (source_matches[0] if source_matches else "generic")
    report_id = custom_report_id or f"tg_{type_slug}_{match_tag}_{now_tag}"

    source_datasets = []
    for m in source_matches:
        if "game_1" in m:
            source_datasets.append("Metrica Sports Open Tracking Dataset 1 (25 Hz optical)")
        elif "game_2" in m:
            source_datasets.append("Metrica Sports Open Tracking Dataset 2 (25 Hz optical)")
        else:
            source_datasets.append(f"Official Tracking Stream ({m})")

    return ReportMetadata(
        report_id=report_id,
        report_type=report_type,
        report_version="2.0.0",
        title=title,
        subtitle=subtitle,
        generated_at=now_iso,
        target_match_id=target_match_id,
        source_matches=source_matches,
        source_datasets=source_datasets,
        dataset_compatibility=dataset_compatibility,
        target_team=target_team,
        target_player_id=target_player_id,
        methodology_version="TacticalGhost-v2.0-Spearman2018",
        analyst_signoff="TacticalGhost Certified Football Intelligence Group",
        confidentiality_notice="STRICTLY CONFIDENTIAL — PROFESSIONAL TACTICAL DOSSIER"
    )
