import subprocess
import shutil
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = Path(r"C:\Users\aksha\.gemini\antigravity\brain\7e3d206b-7514-4b1b-beff-30a5409d90c0")

def capture(url, out_name):
    out_path = Path.cwd() / out_name
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--screenshot={out_path}",
        "--window-size=1600,1050",
        url
    ]
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    print("Return code:", res.returncode)
    print("Stdout:", res.stdout)
    print("Stderr:", res.stderr)
    if out_path.exists():
        print(f"Success! {out_path} ({out_path.stat().st_size} bytes)")
        # Copy to artifact directory
        art_path = ARTIFACT_DIR / out_name
        shutil.copyfile(out_path, art_path)
        print(f"Copied to {art_path}")
    else:
        print(f"Failed to find {out_path}")

if __name__ == "__main__":
    capture("http://127.0.0.1:3000/?mode=reports", "phase20_reporting_centre.png")
    # Also preview one of the generated HTML reports directly!
    sample_html = (ARTIFACT_DIR / "sample_match_intelligence.html").as_uri()
    capture(sample_html, "phase20_report_preview_editorial.png")
