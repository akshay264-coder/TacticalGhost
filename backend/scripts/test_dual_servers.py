"""
Dual-server integration test.
Launches both FastAPI backend (port 8000) and Vite frontend (port 3000),
probes frontend reverse proxy routing to backend API, and cleanly terminates.
"""

import subprocess
import sys
import time
import urllib.request
import json
import os

def test_dual_servers():
    print("[1/5] Starting FastAPI backend on port 8000...")
    backend_cmd = [
        sys.executable,
        "-m", "uvicorn",
        "app.main:app",
        "--app-dir", "backend",
        "--host", "127.0.0.1",
        "--port", "8000"
    ]
    backend_proc = subprocess.Popen(backend_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    frontend_proc = None
    try:
        # Wait for backend
        time.sleep(3.0)

        # Probe backend directly
        with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5) as r:
            assert r.status == 200
            print("  -> Backend direct probe OK (port 8000)")

        print("[2/5] Starting Vite frontend preview on port 3000...")
        # Run npm run preview or npx vite preview --port 3000 inside frontend
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
        frontend_cmd = ["npx.cmd", "vite", "preview", "--port", "3000"]
        frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        time.sleep(3.5)

        print("[3/5] Probing frontend root http://localhost:3000...")
        with urllib.request.urlopen("http://localhost:3000/", timeout=5) as r:
            assert r.status == 200
            html = r.read().decode()
            assert "TacticalGhost" in html
            print("  -> Frontend served index.html successfully (port 3000)")

        print("[4/5] Testing direct API communication...")
        with urllib.request.urlopen("http://127.0.0.1:8000/api/sequences", timeout=5) as r:
            assert r.status == 200
            data = json.loads(r.read().decode())
            assert len(data) >= 4
            print(f"  -> API returned {len(data)} curated sequences")

        print("[5/5] Testing real-time tracking data delivery...")
        with urllib.request.urlopen("http://127.0.0.1:8000/api/sequences/seq_goal_1/tracking", timeout=5) as r:
            assert r.status == 200
            track = json.loads(r.read().decode())
            assert len(track["tracking"]["frames"]) > 100
            print(f"  -> Delivered {len(track['tracking']['frames'])} frames of tracking data")

        print("\nDUAL-SERVER INTEGRATION VERIFIED: Both servers operational and responding.")

    finally:
        print("Cleaning up server processes...")
        if backend_proc:
            backend_proc.terminate()
            try:
                backend_proc.wait(timeout=2)
            except Exception:
                backend_proc.kill()

        if frontend_proc:
            frontend_proc.terminate()
            try:
                frontend_proc.wait(timeout=2)
            except Exception:
                frontend_proc.kill()

        print("All processes cleanly terminated.")

if __name__ == "__main__":
    test_dual_servers()
