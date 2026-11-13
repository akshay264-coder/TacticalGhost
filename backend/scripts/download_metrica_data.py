"""
Script to fetch official Metrica Sports open sample data.
Repository: https://github.com/metrica-sports/sample-data
Game: Sample Game 1 (Events, Home Tracking, Away Tracking)
"""

import os
import urllib.request
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "metrica_sample")
os.makedirs(DATA_DIR, exist_ok=True)

BASE_URL = "https://raw.githubusercontent.com/metrica-sports/sample-data/master/data/Sample_Game_1"
FILES = {
    "events": "Sample_Game_1_RawEventsData.csv",
    "tracking_home": "Sample_Game_1_RawTrackingData_Home_Team.csv",
    "tracking_away": "Sample_Game_1_RawTrackingData_Away_Team.csv",
}

def download_file(name: str, filename: str):
    target_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        print(f"[SKIP] {filename} already exists ({os.path.getsize(target_path):,} bytes).")
        return target_path
    
    url = f"{BASE_URL}/{filename}"
    print(f"[DOWNLOADING] {url} -> {target_path}...")
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "TacticalGhost/1.0 Football Analytics Research"}
    )
    with urllib.request.urlopen(req) as resp, open(target_path, "wb") as f:
        f.write(resp.read())
    print(f"[DONE] Saved {filename} ({os.path.getsize(target_path):,} bytes).")
    return target_path

if __name__ == "__main__":
    print("Starting download of official Metrica Sports Sample Game 1...")
    for key, fname in FILES.items():
        download_file(key, fname)
    print("All Metrica Sports sample files downloaded successfully!")
