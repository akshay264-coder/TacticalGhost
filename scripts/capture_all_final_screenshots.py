import subprocess
import shutil
import time
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = Path(r"C:\Users\aksha\.gemini\antigravity\brain\7e3d206b-7514-4b1b-beff-30a5409d90c0")
WORKSPACE_DIR = Path(r"C:\Users\aksha\Downloads\TacticalGhost")

TARGETS = [
    ("http://127.0.0.1:3000/?mode=dashboard", "final_01_main_dashboard.png"),
    ("http://127.0.0.1:3000/?mode=single", "final_02_match_intelligence.png"),
    ("http://127.0.0.1:3000/?mode=patterns", "final_03_pattern_intelligence.png"),
    ("http://127.0.0.1:3000/?mode=opponent", "final_04_opponent_intelligence.png"),
    ("http://127.0.0.1:3000/?mode=scouting", "final_05_player_scouting.png"),
    ("http://127.0.0.1:3000/?mode=coach", "final_06_coach_decision.png"),
    ("http://127.0.0.1:3000/?mode=reports", "final_07_reporting_centre.png"),
]

def capture_url(url, out_name):
    out_path = WORKSPACE_DIR / out_name
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--screenshot={out_path}",
        "--window-size=1600,1050",
        url
    ]
    print(f"Capturing {out_name} from {url}...")
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        if out_path.exists() and out_path.stat().st_size > 5000:
            print(f"✓ Created {out_name} ({out_path.stat().st_size} bytes)")
            art_path = ARTIFACT_DIR / out_name
            shutil.copyfile(out_path, art_path)
            print(f"  Copied to artifact dir: {art_path}")
            return True
        else:
            print(f"✗ Failed or empty: {out_name}")
            return False
    except Exception as e:
        print(f"Error capturing {out_name}: {e}")
        return False

def main():
    print("=== CAPTURING 8 FINAL VERIFICATION SCREENSHOTS ===")
    
    # Capture the 7 dashboard modes
    for url, filename in TARGETS:
        capture_url(url, filename)
        time.sleep(1)

    # Capture 8th: Rendered HTML Report
    # Check for sample_match_intelligence.html in backend/data/reports or artifact dir
    html_report_path = WORKSPACE_DIR / "backend" / "data" / "reports" / "sample_match_intelligence.html"
    if not html_report_path.exists():
        html_report_path = ARTIFACT_DIR / "sample_match_intelligence.html"
    
    if html_report_path.exists():
        capture_url(html_report_path.as_uri(), "final_08_generated_report.png")
    else:
        print(f"Report file not found at {html_report_path}")

    print("=== FINISHED CAPTURING SCREENSHOTS ===")

if __name__ == "__main__":
    main()
