# TacticalGhost

> **See the game beyond the ball.**  
> Football Tactical Intelligence Platform: Off-ball movements, space creation, pressing dynamics, and counterfactual decision analysis.

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-39%20Passed-brightgreen.svg)]()

---

## ⚽ Project Overview

TacticalGhost moves beyond ball-centric statistics (goals, assists, standard xG) to provide high-resolution, spatiotemporal intelligence on **what happens away from the ball**.

### Core Research Questions Answered:
1. **How do players create space without touching the ball?**  
   Quantifies off-ball runs, marker-dragging correlation, vacated space ($m^2$), and decoy indices.
2. **Which defensive structures expose dangerous spaces?**  
   Analyzes compactness, stretch indices, broken offside lines, and context-dependent danger (evaluating passing accessibility, carrier pressure, and defensive cover).
3. **How does pressing change the opponent's passing options?**  
   Measures closing velocity vectors, time-to-contact, multi-agent pressing traps, and geometric cover shadow obstruction.
4. **Which player movements create useful opportunities for teammates?**  
   Evaluates dynamic passing lane viability, receiver pitch control, and passing synergy networks.
5. **Given a player's position and tactical situation, what alternative actions were realistically available?**  
   Models counterfactual choices (passes, carries, shots) using Expected Threat ($xT$) advancement, execution probability, and Tactical Expected Value ($TEV$).

---

## 🏛 Architecture & Tech Stack

```
TacticalGhost/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & CORS
│   │   ├── api/
│   │   │   ├── routes_sequences.py    # Sequence listings & tracking data
│   │   │   ├── routes_analytics.py    # 5 Core Tactical Intelligence Modules
│   │   │   └── routes_comparison.py   # Phase 15 Multi-Sequence Comparison & Report API
│   │   ├── core/
│   │   │   ├── pitch.py               # 105m x 68m FIFA pitch geometry & Savitzky-Golay kinematics
│   │   │   ├── pitch_control.py       # Spearman (2018) time-to-intercept pitch control engine
│   │   │   └── dataloader.py          # Metrica Sports open tracking & events synchronizer
│   │   └── modules/
│   │       ├── space_creation.py      # Module 1: Off-ball runs & decoy quantification
│   │       ├── defensive_vulnerability.py # Module 2: Compactness & contextual danger
│   │       ├── pressing.py            # Module 3: Closing velocity & cover shadows
│   │       ├── player_interactions.py # Module 4: Passing viability & synergy networks
│   │       ├── tactical_decision.py   # Module 5: Counterfactuals & Expected Threat (xT)
│   │       └── sequence_comparison.py # Phase 15: Spatial, Pressing, Attacking & Decision Comparison
│   ├── data/
│   │   └── metrica_sample/            # Official Metrica Sports Sample Game 1 tracking & events
│   ├── tests/                         # 39 comprehensive unit & integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pitch/TacticalPitch.tsx # 2D Interactive Pitch with Phase 14 Advanced Visualization Engine
│   │   │   ├── controls/PlaybackControls.tsx # 25fps scrubber, slow-mo, event markers & shortcuts
│   │   │   ├── controls/VisualizationControlPanel.tsx # Granular layer toggles, modes & opacity
│   │   │   ├── comparison/SequenceComparisonDashboard.tsx # Phase 15 Side-by-Side Dual Pitch & Comparative Intelligence
│   │   │   ├── modules/               # 5 dedicated intelligence panels
│   │   │   └── inspector/PlayerInspectorModal.tsx # Spatiotemporal kinematics, accel & distance
│   │   ├── types/
│   │   │   ├── tactical.ts            # Strictly typed TypeScript models
│   │   │   └── comparison.ts          # Comparison schemas & validation types
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── docs/
    └── METHODOLOGY.md                 # Detailed mathematical formulas & scientific citations
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.13+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
# Activate virtual environment
.venv\Scripts\activate   # Windows
# or source .venv/bin/activate  # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Run backend test suite (25 tests)
pytest backend/tests -v

# Start FastAPI server (runs on port 8000)
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```

Interactive API documentation available at: `http://localhost:8000/api/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Verify TypeScript and production build
npm run dev     # Start Vite dev server on http://localhost:3000
```

---

## 🧪 Analytical Validation & Rigor

All metrics adhere strictly to the project constitution:
- **No data fabrication**: Powered by verified official Metrica Sports open tracking & event data.
- **Rule 7 & 9 compliant**: Proximity alone is never classified as pressing. Defender closing velocity vectors and time-to-contact are mandatory.
- **Rule 8 compliant**: Defensive gaps are never classified as dangerous without evaluating passing accessibility, ball carrier pressure, and defensive cover recovery.
- **Rule 5 compliant**: Analytical scores quantify observed spatial geometries and counterfactual expected threat—never claiming subjective player intent.
- **31 automated tests** validate kinematics, pitch control surfaces, line breaking, edge cases, and counterfactual rankings.
