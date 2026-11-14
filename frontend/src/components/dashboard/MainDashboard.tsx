import React from 'react';
import {
  Activity,
  GitCompare,
  Sparkles,
  Compass,
  Users,
  BrainCircuit,
  FileText,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Flame,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

interface MainDashboardProps {
  onNavigate: (mode: 'single' | 'comparison' | 'patterns' | 'opponent' | 'scouting' | 'coach' | 'reports') => void;
  sequencesCount?: number;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onNavigate,
  sequencesCount = 7
}) => {
  return (
    <div className="flex flex-col space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Banner */}
      <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FEF3E8] border border-[#FCD8B3] text-[#F28C28] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TacticalGhost Football Intelligence Platform • Portfolio Edition</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
              See the Game Beyond the Ball.
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#525252] leading-relaxed">
              TacticalGhost moves beyond ball-centric statistics (goals, assists, and standard xG) to provide high-resolution,
              spatiotemporal intelligence on <strong>what happens away from the ball</strong>: physics-based pitch control,
              off-ball space creation, pressing traps, opponent tactical DNA, player scouting archetypes, and coach decision support.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#525252]">
              <div className="flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
                <span>Zero Data Fabrication</span>
              </div>
              <div className="flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
                <span>Official Metrica 25 Hz Telemetry</span>
              </div>
              <div className="flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
                <span>William Spearman (2018) Pitch Control</span>
              </div>
              <div className="flex items-center space-x-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#F28C28]" />
                <span>4 Epistemic Evidence Tiers</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            <button
              onClick={() => onNavigate('single')}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#E07B18] text-white font-semibold text-sm shadow-sm transition active:scale-[0.98]"
            >
              <span>Explore Tactical Pitch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E5E0D8] text-[#171717] font-semibold text-sm transition"
            >
              <FileText className="w-4 h-4 text-[#F28C28]" />
              <span>Reporting Centre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dataset & Provenance Section */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8] text-[#F28C28]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171717]">Loaded Datasets & Telemetry Provenance</h2>
              <p className="text-xs text-[#525252]">Active official tracking datasets synchronized with event streams</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#FEF3E8] text-[#F28C28] border border-[#FCD8B3]">
            Curated 25 Hz Tracking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <div className="flex items-center justify-between text-xs text-[#525252] mb-1">
              <span className="font-semibold uppercase tracking-wider">Primary Match</span>
              <span className="px-2 py-0.5 rounded bg-white text-[#171717] font-bold border border-[#E5E0D8]">Game 1</span>
            </div>
            <div className="text-sm font-bold text-[#171717] mt-1">Metrica Sports Open Dataset 1</div>
            <p className="text-xs text-[#525252] mt-1">
              Full 90-minute optical tracking stream with 14 Home & 11 Away outfield players + ball coordinates.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-[11px] text-[#525252]">
              <span>Sample Rate: 25 fps</span>
              <span className="font-semibold text-[#171717]">145,000+ Frames</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <div className="flex items-center justify-between text-xs text-[#525252] mb-1">
              <span className="font-semibold uppercase tracking-wider">Validation Match</span>
              <span className="px-2 py-0.5 rounded bg-white text-[#171717] font-bold border border-[#E5E0D8]">Game 2</span>
            </div>
            <div className="text-sm font-bold text-[#171717] mt-1">Metrica Sports Open Dataset 2</div>
            <p className="text-xs text-[#525252] mt-1">
              Independent secondary match used for multi-match tactical DNA verification, compatibility scoring, and drift.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-[11px] text-[#525252]">
              <span>Sample Rate: 25 fps</span>
              <span className="font-semibold text-[#171717]">Distinct Teams</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8]">
            <div className="flex items-center justify-between text-xs text-[#525252] mb-1">
              <span className="font-semibold uppercase tracking-wider">Pitch Dimensions</span>
              <span className="px-2 py-0.5 rounded bg-white text-[#171717] font-bold border border-[#E5E0D8]">FIFA Std</span>
            </div>
            <div className="text-sm font-bold text-[#171717] mt-1">105.0 m × 68.0 m Pitch Coordinate Grid</div>
            <p className="text-xs text-[#525252] mt-1">
              Normalized origin (0,0) at bottom-left corner flag; metric coordinates mapped to FIFA standard pitch boundaries.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-[11px] text-[#525252]">
              <span>Zone 14 & Half-Spaces</span>
              <span className="font-semibold text-[#171717]">Kinematics Calibrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Modules Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#171717]">Seven Core Tactical Intelligence Disciplines</h2>
          <p className="text-xs text-[#525252]">
            Comprehensive spatiotemporal capabilities spanning match analysis, player scouting, and coaching strategy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Tactical Pitch & Kinematics */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FEF3E8] text-[#F28C28] group-hover:scale-105 transition">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phases 1–15
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Match Pitch & Kinematics</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Interactive 2D pitch with Spearman pitch control heatmaps, off-ball decoy runs, passing lane synergy,
                closing velocity pressing traps, and counterfactual xT decision alternatives.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">7 Curated Sequences</span>
              <button
                onClick={() => onNavigate('single')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>Launch Pitch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Sequence Comparison Engine */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#171717] group-hover:scale-105 transition">
                  <GitCompare className="w-5 h-5 text-[#F28C28]" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phase 15
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Multi-Sequence Comparison</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Dual-pitch synchronized comparative playback comparing two distinct tactical episodes side-by-side with
                spatial deltas, pitch control differentials, and pressing intensity variance.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">Dual-Pitch Alignment</span>
              <button
                onClick={() => onNavigate('comparison')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>Compare Sequences</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Pattern Intelligence Centre */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#171717] group-hover:scale-105 transition">
                  <Sparkles className="w-5 h-5 text-[#F28C28]" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phase 16
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Commercial Pattern Intelligence</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Discovers recurrent tactical patterns across multiple sequences: wide overloads, defensive seam exploitation,
                pressing triggers, and commercial briefing generation.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">Multi-Sequence Recurrence</span>
              <button
                onClick={() => onNavigate('patterns')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>Explore Patterns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Opponent Intelligence */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#171717] group-hover:scale-105 transition">
                  <Compass className="w-5 h-5 text-[#F28C28]" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phase 17 & 17.1
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Opponent Tactical DNA</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                4-Dimensional tactical fingerprint (Buildup, Pressing, Rest-Defense, Vulnerability), cross-match dataset
                compatibility scoring, and explainable defensive countermeasure directives.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">Multi-Match Synthesis</span>
              <button
                onClick={() => onNavigate('opponent')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>Scout Opponent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 5. Player Scouting & Recruitment */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#171717] group-hover:scale-105 transition">
                  <Users className="w-5 h-5 text-[#F28C28]" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phase 18 & 18.1
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Player Scouting Centre</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Objective scouting profiles built strictly from physical tracking data: 9 role archetypes, 6-axis performance
                radar charts, off-ball space contribution, and anonymous ID isolation.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">9 Tactical Archetypes</span>
              <button
                onClick={() => onNavigate('scouting')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>View Scouting</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 6. Coach Decision Support System */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#F28C28]/40 transition group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] text-[#171717] group-hover:scale-105 transition">
                  <BrainCircuit className="w-5 h-5 text-[#F28C28]" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#525252] border border-[#E5E0D8]">
                  Phase 19 & 19.1
                </span>
              </div>
              <h3 className="text-base font-bold text-[#171717]">Coach Decision Centre</h3>
              <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                Match preparation support evaluating 7 candidate formations, Starting XI role placement, 4 corridor exploitation
                tactics, 3+2 rest-defense, and 4 periodized microcycle coaching drills.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs text-[#525252]">7 Formations & 4 Drills</span>
              <button
                onClick={() => onNavigate('coach')}
                className="text-xs font-semibold text-[#F28C28] hover:text-[#E07B18] inline-flex items-center space-x-1"
              >
                <span>Open Gameplan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 7. Reporting Centre Highlight */}
        <div className="mt-5 bg-gradient-to-r from-white via-[#FAF7F2] to-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#F28C28] uppercase tracking-wider mb-1">
              <FileCheck2 className="w-4 h-4" />
              <span>Phase 20 Publication-Grade Output</span>
            </div>
            <h3 className="text-lg font-bold text-[#171717]">Automated Professional Reporting Engine</h3>
            <p className="text-xs text-[#525252] mt-1 leading-relaxed">
              Generates 7 standard professional tactical dossiers across standalone HTML, vector A4 PDF, and REST JSON.
              Includes pure vector SVG pitch diagrams, 16-section Match Intelligence, and dual-engine ReportLab/Chrome export.
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#E07B18] text-white font-semibold text-sm shadow-sm transition whitespace-nowrap"
          >
            <span>Launch Reporting Centre</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Epistemic Honesty & Scientific Standards */}
      <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#F28C28]" />
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Scientific Validation & Epistemic Honesty</h3>
            <p className="text-xs text-[#525252]">Clear separation between physical telemetry and model interpretations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-[#E5E0D8]">
            <div className="font-bold text-[#171717] mb-0.5">Tier 1: Telemetry</div>
            <div className="text-[11px] text-[#525252]">
              Observed optical coordinates (x, y, t), sprint counts, and raw velocity vectors.
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#E5E0D8]">
            <div className="font-bold text-[#171717] mb-0.5">Tier 2: Model Estimate</div>
            <div className="text-[11px] text-[#525252]">
              Spearman pitch control, Voronoi fields, and convex hull stretch index.
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#E5E0D8]">
            <div className="font-bold text-[#171717] mb-0.5">Tier 3: Tactical Label</div>
            <div className="text-[11px] text-[#525252]">
              Decoy runs, spatial overloads, and pressing trap classifications.
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#E5E0D8]">
            <div className="font-bold text-[#171717] mb-0.5">Tier 4: Coach Directive</div>
            <div className="text-[11px] text-[#525252]">
              Countermeasure suggestions, tactical role assignments, and training drills.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
