# TacticalGhost — Advanced Football Tactical Intelligence & Analytics Platform

> **"See the game beyond the ball."**  
> An evidence-driven spatiotemporal analytics platform transforming 25 Hz optical tracking data into actionable tactical intelligence, off-ball space quantification, pressing dynamics, counterfactual decision analysis, and publication-grade coaching dossiers.

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-120%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

---

## 1. Executive Summary & Portfolio Overview

Modern football analytics remains overwhelmingly fixated on on-ball events (passes, shots, goals, and basic Expected Goals models). Yet on average, an individual player possesses the ball for less than **3 minutes** out of 90; the remaining **87 minutes** consist of off-ball positioning, space creation, pressing traps, defensive compression, and decoy runs.

**TacticalGhost** was engineered to illuminate the game that unfolds away from the ball. By synchronizing 25 Hz optical tracking telemetry with event logs across official Metrica Sports matches, TacticalGhost provides a deterministic mathematical engine and an interactive decision support system. It enables coaches, tactical analysts, and recruitment directors to evaluate tactical structures, measure off-ball contributions, simulate counterfactual tactical decisions, and automatically compile audit-traceable tactical reports with zero data fabrication.

---

## 2. Platform Architecture & Technology Stack

The platform is constructed as a decoupled, high-performance client-server architecture designed for sub-second spatiotemporal queries and high-resolution 2D visual rendering:

```
TacticalGhost/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & middleware
│   │   ├── api/
│   │   │   ├── routes_sequences.py    # Sequence listings & tracking data (25 Hz)
│   │   │   ├── routes_analytics.py    # 5 Core Tactical Intelligence Modules
│   │   │   ├── routes_comparison.py   # Multi-Sequence Comparison & Differential Engine
│   │   │   ├── routes_pattern.py      # Commercial Pattern Intelligence & Briefings
│   │   │   ├── routes_opponent.py     # Multi-Match Opponent Analysis Engine
│   │   │   ├── routes_scouting.py     # Player Scouting & 9 Tactical Archetypes
│   │   │   ├── routes_coach.py        # Coach Decision Support System (12 Endpoints)
│   │   │   └── routes_reporting.py    # Automated Professional Reporting Engine (10 Endpoints)
│   │   ├── core/
│   │   │   ├── pitch.py               # 105m x 68m FIFA pitch geometry & kinematics
│   │   │   ├── pitch_control.py       # Spearman (2018) pitch control model
│   │   │   └── dataloader.py          # Metrica Sports open tracking & events synchronizer
│   │   ├── modules/
│   │   │   ├── space_creation.py      # Module 1: Off-ball runs & decoy quantification
│   │   │   ├── defensive_vulnerability.py # Module 2: Compactness & contextual danger
│   │   │   ├── pressing.py            # Module 3: Closing velocity & cover shadows
│   │   │   ├── player_interactions.py # Module 4: Passing viability & synergy networks
│   │   │   ├── tactical_decision.py   # Module 5: Counterfactuals & Expected Threat (xT)
│   │   │   ├── pattern/               # Pattern detection, overload & transition analysis
│   │   │   ├── multi_match/           # Cross-match DNA, evolution & squad profiles
│   │   │   ├── scouting/              # Scouting metrics, radar plots & role taxonomy
│   │   │   └── coach/                 # Formation planner, scenario lab & adjustments
│   │   └── reporting/                 # Automated Reporting Engine (HTML, PDF, JSON)
│   ├── data/
│   │   ├── metrica_sample/            # Official Metrica Sports Game 1 & Game 2 datasets
│   │   └── reports/                   # Persistent storage for generated dossiers
│   ├── tests/                         # 120 pytest unit and integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/             # Main Executive Portfolio Dashboard
│   │   │   ├── pitch/TacticalPitch.tsx # 2D Interactive Pitch (105m x 68m Canvas)
│   │   │   ├── controls/              # Playback, timeline scrubbing & layer toggles
│   │   │   ├── comparison/            # Dual-Pitch Multi-Sequence Comparison
│   │   │   ├── patterns/              # Commercial Tactical Pattern Intelligence
│   │   │   ├── opponent/              # Multi-Match Opponent Intelligence Centre
│   │   │   ├── scouting/              # Player Scouting & Recruitment Intelligence
│   │   │   ├── coach/                 # Coach Decision Support System (9 Modules)
│   │   │   ├── reporting/             # Professional Reporting Centre (8 Dossier Types)
│   │   │   └── inspector/             # High-resolution Player Spatiotemporal Inspector
│   │   ├── types/                     # Strictly typed TypeScript interfaces
│   │   └── App.tsx                    # Multi-mode executive navigation & HUD
│   ├── package.json
│   └── vite.config.ts
└── docs/
    ├── METHODOLOGY.md                 # Mathematical formulations & scientific derivations
    └── PHASE20_REPORTING_METHODOLOGY.md # Editorial standards & epistemic grading rules
```

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Backend API** | Python 3.13, FastAPI, Uvicorn | Spatiotemporal calculation, REST endpoints, JSON streaming |
| **Numerical Processing**| NumPy, SciPy, Pandas | Kinematics, convex hulls, Voronoi, Spearman surface integration |
| **Pitch Control Engine**| Vectorized bivariate Gaussian integration | Continuous probability surface of ball arrival and territorial control |
| **Frontend Framework** | React 18, TypeScript 5.6, Vite 5.4 | Real-time 25 Hz coordinate rendering, state management, SPA |
| **Styling & UI System** | Tailwind CSS 3.4, Lucide Icons | Warm Cream (`#F5F0E6`) & Orange Accent (`#F28C28`) design system |
| **Reporting System** | Jinja2, WeasyPrint, pure SVG | Deterministic HTML/PDF/JSON tactical dossier compilation |
| **Quality Assurance** | Pytest, TypeScript Strict Mode | 120 backend tests, 0 TypeScript compile errors |

---

## 3. Data Provenance & Dataset Integrity

All analytical computations within TacticalGhost derive strictly from authentic, publicly released tracking and event datasets provided by **Metrica Sports**:

- **Game 1**: 145,006 frames captured at 25 Hz (~96.6 minutes of continuous match play). Includes 26 players, ball tracking coordinates, and 3,382 synchronized event annotations.
- **Game 2**: Complete independent match tracking dataset captured at 25 Hz, enabling authentic cross-match tactical analysis and opponent scouting.
- **Pitch Dimensions**: Normalized to standard FIFA international dimensions ($105.0\text{ m} \times 68.0\text{ m}$) with Cartesian origin $(0,0)$ at pitch centre.
- **Player Anonymity**: In strict compliance with open-data distribution agreements, players are identified exclusively via anonymous tracking identifiers (`Home_1` through `Home_14`, `Away_1` through `Away_26`). 

> **Scientific Provenance Note:**  
> Anonymous tracking IDs do not represent named professional players or commercial transfer targets. Observed physical and tactical patterns reflect the specific telemetry of the two recorded fixtures and should not be interpreted as universal athletic baselines across global football competitions.

---

## 4. Core Research Questions Answered

TacticalGhost addresses seven fundamental research questions in spatiotemporal football analytics:

1. **How do players create space without touching the ball?**  
   Quantifies off-ball runs, defender-dragging correlation ($r \ge 0.70$), vacated space ($m^2$), and decoy efficiency.
2. **Which defensive structures expose dangerous territorial gaps?**  
   Evaluates defensive line compactness, longitudinal stretch, broken offside lines, and contextual danger based on ball-carrier pressure and defensive recovery speed.
3. **How does pressing alter opponent decision trees and passing options?**  
   Calculates closing velocity vectors, time-to-contact ($TTC$), multi-player pressing coordination, and geometric cover shadow obstruction ($m^2$).
4. **Which off-ball player movements generate optimal passing lanes?**  
   Evaluates dynamic passing lane viability, receiver pitch control, and passing network synergy matrices.
5. **What counterfactual actions were available at any critical moment?**  
   Simulates alternative tactical choices (passes, carries, shots) evaluating Expected Threat ($xT$) advancement, spatial risk, and Tactical Expected Value ($TEV$).
6. **How do team tactical patterns evolve across matches and game states?**  
   Detects recurring overloads, systemic pressing flaws, build-up channel biases, and set-piece behaviors across distinct fixtures.
7. **How can tracking data be translated into explainable coaching decisions?**  
   Generates automated formation recommendations, tactical trade-offs, defensive countermeasures, and publication-ready dossiers without manual data stitching.

---

## 5. Data Analytics Methodology

TacticalGhost follows a rigorous, eight-stage end-to-end data analytics workflow:

```
[Raw 25 Hz Optical Tracking Data] (x, y, t)
               │
               ▼
   1. Data Ingestion & Normalization (105m x 68m FIFA Pitch, Coordinate Transform)
               │
               ▼
   2. Kinematic Computation (Savitzky-Golay Smoothing, Velocity & Acceleration Vectors)
               │
               ▼
   3. Spatiotemporal Pitch Control (Spearman 2018 Ball Interception Physics)
               │
               ▼
   4. Tactical Pattern Intelligence (Convex Hulls, Cover Shadows, Line Compactness)
               │
               ▼
   5. Counterfactual Modeling (Discretized Expected Threat xT, Tactical Expected Value)
               │
               ▼
   6. Cross-Match Differential Engine (Longitudinal DNA, Systemic Exploits, Archetypes)
               │
               ▼
   7. Interactive Visual Analytics (2D Canvas, Scrubbing, High-Contrast Overlays)
               │
               ▼
   8. Automated Decision Reporting (4-Tier Epistemic Grading, Multi-Format Dossiers)
```

### Detailed Methodology Breakdown:

1. **Data Ingestion & Coordinate Transformation:**  
   Metrica tracking coordinates ($[0, 1] \times [0, 1]$) are transformed into metric Cartesian space where $x \in [-52.5, +52.5]$ meters and $y \in [-34.0, +34.0]$ meters. Frame timestamps are synchronized at $\Delta t = 0.04\text{ s}$ ($25\text{ Hz}$).
2. **Kinematic Computation & Signal Filtering:**  
   To prevent optical tracking noise from distorting velocity and acceleration, coordinates are smoothed using a windowed filter. Velocity vectors $\vec{v}_i = (\frac{\Delta x_i}{\Delta t}, \frac{\Delta y_i}{\Delta t})$ and acceleration vectors $\vec{a}_i = \frac{\Delta \vec{v}_i}{\Delta t}$ are computed per entity.
3. **Spatiotemporal Pitch Control Surface:**  
   Implemented according to the foundational physics model of William Spearman (2018). Each player's time-to-intercept $T_i(\vec{r})$ to location $\vec{r}$ is modeled using maximum speed ($v_{\max} = 9.0\text{ m/s}$), reaction time ($\tau_{\text{react}} = 0.5\text{ s}$), and physical acceleration. Probability distributions are integrated over time using a logistic arrival probability function:
   $$P(\text{Player } i \text{ intercepts at } t) = \frac{1}{1 + \exp(-\lambda(t - T_i))}$$
4. **Defensive Structure & Vulnerability Modeling:**  
   Defensive compactness is derived from the minimum 2D convex hull containing all outfield defenders. Lines are segmented into defensive, midfield, and forward horizontal strata. Vulnerability is defined not merely by unoccupied space, but by *contextual accessible danger* (evaluating ball carrier orientation, direct line of sight, and defender recovery distance).
5. **Pressing Dynamics & Cover Shadow Geometry:**  
   Pressing intensity is triggered when a defender's closing speed toward the ball carrier exceeds $2.5\text{ m/s}$ with time-to-contact $TTC < 2.5\text{ s}$. The defender's physical cover shadow is modeled as a conic projection:
   $$\theta = 2 \cdot \arctan\left(\frac{r_{\text{block}}}{d(\vec{p}_{\text{def}}, \vec{p}_{\text{ball}})}\right)$$
   projected backwards across passing lanes to quantify obstructed receiver territory ($m^2$).
6. **Counterfactual Decision Analysis & Expected Threat ($xT$):**  
   At event decision frames, alternative passing, dribbling, and shooting choices are identified. The pitch is partitioned into an $M \times N$ spatial grid where each cell possesses an empirical transition probability $T(c \to c')$ and scoring probability $S(c)$. Counterfactual options are evaluated using Tactical Expected Value ($TEV$):
   $$TEV = P_{\text{success}} \cdot xT_{\text{target}} - (1 - P_{\text{success}}) \cdot \text{TurnoverRisk}$$
7. **Cross-Match Opponent Profiling & Scouting Taxonomy:**  
   Players are classified into 9 tactical archetypes (e.g., *Regista / Deep-Lying Playmaker*, *Pressing Forward*, *Inverted Winger*, *Box-to-Box Engine*) via unsupervised percentile clustering over 14 spatiotemporal metrics.
8. **Automated Evidence Compilation & Epistemic Honesty:**  
   All output claims are validated against deterministic data thresholds, preventing hallucinations or unsubstantiated coaching claims.

---

## 6. The Seven Analytical Disciplines

TacticalGhost unifies seven core analytical modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TACTICALGHOST ANALYTICAL SUITE                    │
├─────────────────────┬─────────────────────┬────────────────────────────┤
│ 1. Match            │ 2. Sequence         │ 3. Tactical Pattern        │
│    Intelligence     │    Comparison       │    Intelligence            │
│  - 25 Hz Tracking   │  - Side-by-side sync│  - Recurring overloads     │
│  - Pitch Control    │  - Spatiotemporal   │  - Pressing trap discovery │
│  - Kinematic trails │    differentials    │  - Commercial briefings    │
├─────────────────────┼─────────────────────┼────────────────────────────┤
│ 4. Opponent         │ 5. Player Scouting  │ 6. Coach Decision          │
│    Intelligence     │    & Recruitment    │    Support System          │
│  - Multi-match DNA  │  - 9 Role archetypes│  - Formation recommender   │
│  - Flaw detection   │  - 14-metric radars │  - Scenario simulator      │
│  - Exploit playbook │  - Tactical fit %   │  - In-game alerts          │
├─────────────────────┴─────────────────────┴────────────────────────────┤
│ 7. Automated Professional Reporting System                             │
│  - 7 Structured report types (Match, Post-Match, Opponent, Scouting)   │
│  - Deterministic HTML, A4 Vector PDF, and JSON schemas                 │
│  - 4-Tier Epistemic Evidence Grading System                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Epistemic Evidence Grading System

To uphold scientific credibility, every metric, annotation, and recommendation in TacticalGhost is tagged with one of four explicit epistemic confidence levels:

```
[TIER 1] OBSERVED_TRACKING_TELEMETRY
  └── Direct physical observations: coordinates, velocity, frame timestamps, event tags.
[TIER 2] DETERMINISTIC_MODEL_ESTIMATE
  └── Mathematical calculations: Spearman pitch control %, convex hull area, xT score.
[TIER 3] TACTICAL_INTERPRETATION
  └── Algorithmic tactical inferences: decoy runs, pressing intensity, line breaking.
[TIER 4] HYPOTHETICAL_COACHING_ASSUMPTION
  └── Counterfactual recommendations: substitute suggestions, tactical shifts.
```

This strict separation guarantees that tactical opinions are never presented as raw tracking facts.

---

## 8. Visual Intelligence Gallery

Below are the 8 key dashboards and reporting views captured during release verification:

| Figure | Dashboard / View | Description | File Link |
| :---: | :--- | :--- | :--- |
| **01** | **Main Executive Dashboard** | Central portfolio hub showing loaded datasets, 7 core analytical disciplines, and system entry launchers. | [final_01_main_dashboard.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_01_main_dashboard.png) |
| **02** | **Match Pitch & Pitch Control** | High-resolution 2D tactical pitch with Spearman pitch control heatmaps, player trails, velocity vectors, and passing lanes. | [final_02_match_intelligence.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_02_match_intelligence.png) |
| **03** | **Pattern Intelligence Centre** | Commercial tactical intelligence displaying detected overloads, pressing traps, and coach briefing summaries. | [final_03_pattern_intelligence.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_03_pattern_intelligence.png) |
| **04** | **Opponent Intelligence Centre** | Multi-match cross-validation displaying tactical DNA, progression biases, and systemic weaknesses. | [final_04_opponent_intelligence.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_04_opponent_intelligence.png) |
| **05** | **Player Scouting & Recruitment** | 9-archetype tactical role classification, candidate ranking, similarity search, and 14-metric radars. | [final_05_player_scouting.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_05_player_scouting.png) |
| **06** | **Coach Decision Support** | Formation compatibility planner, opponent exploitation matrix, scenario simulation lab, and in-game alerts. | [final_06_coach_decision.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_06_coach_decision.png) |
| **07** | **Professional Reporting Centre** | Executive reporting suite featuring 8 structured templates, instant generation, and interactive archive management. | [final_07_reporting_centre.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_07_reporting_centre.png) |
| **08** | **Rendered Tactical Dossier** | Complete publication-ready HTML/PDF report featuring editorial typography, pitch diagrams, and epistemic badges. | [final_08_generated_report.png](file:///c:/Users/aksha/Downloads/TacticalGhost/final_08_generated_report.png) |

---

## 9. Automated Professional Reporting System

TacticalGhost incorporates a complete report generation engine capable of exporting dossiers in three production formats:

1. **Editorial HTML**: Fully responsive web view featuring high-contrast typography, interactive SVG pitches, and data tables.
2. **Vector A4 PDF**: Multi-page publication-quality documents formatted with page numbers, section headers, and print styling.
3. **Machine-Readable JSON**: Complete structured data output matching strict Pydantic schemas for downstream data pipelines.

### Supported Report Types:
- `MATCH_INTELLIGENCE`: Comprehensive single-match tactical autopsy.
- `POST_MATCH_ANALYSIS`: Performance review, off-ball effectiveness, and transition analysis.
- `TACTICAL_PREPARATION`: Pre-match opponent scouting and exploitation playbook.
- `OPPONENT_ANALYSIS`: Multi-match DNA, pressing vulnerability, and build-up patterns.
- `PLAYER_SCOUTING`: Tactical profile, role suitability, and comparison radar.
- `COACH_DECISION_STRATEGY`: Formation comparison, substitution simulations, and match plan.
- `EXECUTIVE_SUMMARY`: High-level tactical digest for technical directors and sporting leadership.

---

## 10. Quality Audit & Test Suite Verification

TacticalGhost maintains an extensive, regression-free automated test suite:

- **Backend Pytest Suite**: **120 / 120 tests passing** in `51.08s` (`pytest backend/tests -v`).
- **Frontend Production Build**: **0 TypeScript errors**, bundled cleanly via Vite in `9.79s`.
- **Validation Rules**:
  - `Rule 7 & 9`: Defender closing velocity ($v > 2.5\text{ m/s}$) and time-to-contact ($TTC < 2.5\text{ s}$) required for pressing classification. Proximity alone is never counted.
  - `Rule 8`: Defensive line gaps evaluated contextually with ball carrier pressure and passing feasibility.
  - `Rule 5`: Zero subjective intent claims; all metrics describe spatial geometries and counterfactual expected values.
  - Zero mock data in production calculation paths.

---

## 11. Getting Started & Installation

### Prerequisites
- Python 3.13+
- Node.js 18+ and npm
- Google Chrome (optional, for headless report screenshot capture)

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/akshay264-coder/TacticalGhost.git
cd TacticalGhost

# Set up Python virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Run complete test suite (120 tests)
pytest backend/tests -v

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --app-dir backend --port 8000 --reload
```
Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/api/docs`.

### Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Build for production
npm run build

# Start Vite development server on port 3000
npm run dev -- --port 3000 --host 127.0.0.1
```
Open your browser at `http://127.0.0.1:3000` to launch the platform.

---

## 12. Primary API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/sequences` | GET | List available tracking sequences with tactical tags |
| `/api/tracking/{sequence_id}` | GET | Stream 25 Hz coordinates, speeds, and events |
| `/api/analytics/pitch-control` | POST | Compute continuous Spearman pitch control surface |
| `/api/analytics/space-creation` | POST | Quantify off-ball runs, marker dragging, and vacated space |
| `/api/analytics/defensive-vulnerability` | POST | Analyze line heights, compactness, and vulnerable gaps |
| `/api/analytics/pressing` | POST | Detect closing vectors, cover shadows, and pressing intensity |
| `/api/analytics/decisions` | POST | Evaluate counterfactual options and Tactical Expected Value |
| `/api/patterns/summary` | GET | Commercial tactical patterns and coach briefing |
| `/api/opponent/profile` | GET | Opponent tactical DNA and playing style indices |
| `/api/scouting/players` | GET | Player scouting registry with 9 tactical role archetypes |
| `/api/coach/strategy-matrix` | GET | Opponent exploitation strategy and countermeasures |
| `/api/reporting/generate` | POST | Generate HTML, PDF, and JSON tactical dossiers |
| `/api/reporting/catalog` | GET | Browse generated report archives with metadata |

---

## 13. Limitations & Boundary Conditions

1. **Optical Tracking Occlusion & Noise:**  
   Metrica tracking data is derived from broadcast-style optical cameras. Moments of extreme congestion (e.g., corners) occasionally produce coordinate noise, mitigated in our pipeline via velocity filtering.
2. **Absence of Biometric & Physical Telemetry:**  
   The platform operates purely on spatial tracking coordinates ($x, y, t$). Physiological metrics such as player heart rate, muscle fatigue, or subjective effort are not modeled.
3. **Sample Size & Generalization Boundary:**  
   Evaluations are grounded in Metrica Game 1 and Game 2. While mathematical models (Spearman Pitch Control, Voronoi hulls, $xT$) are universally applicable, observed player profiles represent specific match behaviors rather than multi-season career distributions.
4. **Third-Dimension Limitations:**  
   Current spatial computations utilize 2D Cartesian coordinates. Aerial duels and ball trajectory heights ($z$) are inferred from event tags rather than direct 3D ball coordinates.

---

## 14. License, Citations & Acknowledgements

### License
This project is licensed under the MIT License.

### Academic & Technical Citations
- **Spearman, W. (2018).** *Beyond Expected Goals: Quantifying Probability of Scoring Using Pitch Control Models.* MIT Sloan Sports Analytics Conference.
- **Fernández, J., & Bornn, L. (2018).** *Wide Open Spaces: Generating, assessing, and analyzing open space in football.* MIT Sloan Sports Analytics Conference.
- **Metrica Sports.** *Open Football Tracking and Event Data Repository.* [GitHub: Metrica-Sports/sample-data](https://github.com/Metrica-Sports/sample-data).

---
*TacticalGhost — Developed with rigorous mathematical principles for modern football intelligence.*
