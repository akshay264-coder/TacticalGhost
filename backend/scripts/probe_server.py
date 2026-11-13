"""
Verification script to launch FastAPI via Uvicorn in background, probe all endpoints, and cleanly exit.
"""

import subprocess
import sys
import time
import urllib.request
import json

def probe():
    print("[1/4] Starting FastAPI backend via uvicorn...")
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "app.main:app",
        "--app-dir", "backend",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # Wait for server to bind
        time.sleep(3.5)

        print("[2/4] Probing http://127.0.0.1:8000/api/health...")
        with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print("  -> Health status:", data.get("status"), "| Modules:", len(data.get("modules", [])))

        print("[3/4] Probing http://127.0.0.1:8000/api/sequences...")
        with urllib.request.urlopen("http://127.0.0.1:8000/api/sequences", timeout=5) as resp:
            seqs = json.loads(resp.read().decode())
            print("  -> Available curated sequences:", len(seqs))
            for s in seqs:
                print(f"     * [{s['sequence_id']}] {s['title']}")

        print("[4/4] Probing http://127.0.0.1:8000/api/analytics/sequence/seq_goal_1/space-creation...")
        with urllib.request.urlopen("http://127.0.0.1:8000/api/analytics/sequence/seq_goal_1/space-creation", timeout=5) as resp:
            sc = json.loads(resp.read().decode())
            print(f"  -> Space creation runs detected: {sc.get('total_runs_detected')}")

        print("\nAll live HTTP server endpoints probed successfully!")
    finally:
        print("Stopping uvicorn process...")
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except Exception:
            proc.kill()
        print("Server process cleanly stopped.")

if __name__ == "__main__":
    probe()
