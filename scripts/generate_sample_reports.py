"""
Generate sample reports across all 7 supported types in HTML, PDF, and JSON formats.
Copies the outputs to data/reports/ and the current conversation artifact directory.
"""

import os
import sys
import shutil
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.reporting.report_engine import TacticalReportingEngine
from app.reporting.report_schema import ReportType, ExportFormat, ReportGenerationRequest

ARTIFACT_DIR = Path(r"C:\Users\aksha\.gemini\antigravity\brain\7e3d206b-7514-4b1b-beff-30a5409d90c0")

def main():
    engine = TacticalReportingEngine()
    print("Reporting engine initialized.")

    report_configs = [
        (ReportType.MATCH_INTELLIGENCE, "sample_match_intelligence", {"match_id": "metrica_game_1", "sequence_id": "seq_01_goal_home"}),
        (ReportType.TACTICAL_ANALYSIS, "sample_tactical_analysis", {"match_id": "metrica_game_1", "sequence_id": "seq_01_goal_home"}),
        (ReportType.OPPONENT_ANALYSIS, "sample_opponent_analysis", {"match_id": "metrica_game_1", "opponent_team": "Away"}),
        (ReportType.COACH_STRATEGY, "sample_coach_strategy", {"match_id": "metrica_game_1", "preferred_formation": "4-3-3"}),
        (ReportType.PLAYER_SCOUTING, "sample_player_scouting", {"match_id": "metrica_game_1", "player_id": "Home_11"}),
        (ReportType.MULTI_MATCH_COMPARISON, "sample_multi_match", {"match_id": "metrica_game_1", "secondary_match_id": "metrica_game_2"}),
        (ReportType.EXECUTIVE_SUMMARY, "sample_executive_summary", {"match_id": "metrica_game_1", "sequence_id": "seq_01_goal_home"}),
    ]

    generated_artifacts = []

    for r_type, base_name, extra_params in report_configs:
        print(f"\n--- Generating {r_type.value} ({base_name}) ---")
        
        req = ReportGenerationRequest(
            report_type=r_type,
            custom_title=f"Sample {r_type.value.replace('_', ' ').title()}",
            **extra_params
        )
        resp = engine.generate_report(req)
        print(f"Generated {r_type.value}: ID={resp.report_id}")
        print(f"Export links: {resp.export_links}")

        storage_dir = Path(engine.registry.storage_dir)
        src_html = storage_dir / f"{resp.report_id}.html"
        src_pdf = storage_dir / f"{resp.report_id}.pdf"
        src_json = storage_dir / f"{resp.report_id}.json"

        if src_html.exists():
            dst_html = ARTIFACT_DIR / f"{base_name}.html"
            shutil.copyfile(src_html, dst_html)
            generated_artifacts.append(dst_html)
            print(f"Saved {dst_html.name} ({dst_html.stat().st_size} bytes)")

        if src_pdf.exists():
            dst_pdf = ARTIFACT_DIR / f"{base_name}.pdf"
            shutil.copyfile(src_pdf, dst_pdf)
            generated_artifacts.append(dst_pdf)
            print(f"Saved {dst_pdf.name} ({dst_pdf.stat().st_size} bytes)")

        if src_json.exists():
            dst_json = ARTIFACT_DIR / f"{base_name}.json"
            shutil.copyfile(src_json, dst_json)
            generated_artifacts.append(dst_json)
            print(f"Saved {dst_json.name} ({dst_json.stat().st_size} bytes)")

    print("\n--- Summary of Generated Artifacts ---")
    for art in generated_artifacts:
        print(f"Artifact: {art.name} ({art.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
