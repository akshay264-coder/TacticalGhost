import React, { useState, useEffect } from 'react';
import {
  MatchPreparationReport,
  CandidateFormationEvaluation,
  StartingXIPlan,
  ReplacementScenarioResult,
  OpponentExploitationOverview,
  DefensiveCountermeasureOverview,
  TacticalScenarioResult,
  ScenarioAdjustmentParams,
  InGameMonitoringSummary,
  TrainingProgramOverview
} from '../../types/coach';
import {
  generateMatchPreparation,
  evaluateFormations,
  planPlayerSelection,
  simulatePlayerReplacement,
  planOpponentExploitation,
  planDefensiveCountermeasures,
  simulateTacticalScenario,
  monitorInGameReplay,
  planTrainingPriorities,
  fetchMatchStrategyReportJson
} from '../../services/coachApi';
import {
  BrainCircuit,
  ClipboardList,
  Shield,
  Target,
  Sparkles,
  Sliders,
  Radio,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Printer,
  Info,
  Clock,
  ExternalLink,
  Flame,
  Activity
} from 'lucide-react';

export function CoachDecisionCentre() {
  const [activeTab, setActiveTab] = useState<
    'preparation' | 'formation' | 'players' | 'exploitation' | 'countermeasures' | 'scenarios' | 'in_game' | 'training' | 'report'
  >(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('coachTab');
      if (p && ['preparation', 'formation', 'players', 'exploitation', 'countermeasures', 'scenarios', 'in_game', 'training', 'report'].includes(p)) {
        return p as any;
      }
    }
    return 'preparation';
  });

  // Shared configuration state
  const [selectedOpponent, setSelectedOpponent] = useState<string>('Away');
  const [selectedFormation, setSelectedFormation] = useState<string>('4-3-3');
  const [selectedPhilosophy, setSelectedPhilosophy] = useState<string>('POSSESSION_BUILDUP');

  // Async data states
  const [loading, setLoading] = useState<boolean>(false);
  const [prepReport, setPrepReport] = useState<MatchPreparationReport | null>(null);
  const [formations, setFormations] = useState<CandidateFormationEvaluation[]>([]);
  const [startingXIPlan, setStartingXIPlan] = useState<StartingXIPlan | null>(null);
  const [exploitation, setExploitation] = useState<OpponentExploitationOverview | null>(null);
  const [countermeasures, setCountermeasures] = useState<DefensiveCountermeasureOverview | null>(null);
  const [scenarioResult, setScenarioResult] = useState<TacticalScenarioResult | null>(null);
  const [inGameSummary, setInGameSummary] = useState<InGameMonitoringSummary | null>(null);
  const [trainingProgram, setTrainingProgram] = useState<TrainingProgramOverview | null>(null);
  const [fullReportJson, setFullReportJson] = useState<Record<string, any> | null>(null);

  // Scenario Lab interactive sliders
  const [scenarioParams, setScenarioParams] = useState<ScenarioAdjustmentParams>({
    baseline_formation: '4-3-3',
    target_formation: '4-2-3-1',
    defensive_line_shift_m: 4.0,
    pressing_intensity_delta_pct: 15.0,
    attacking_width_mode: 'WIDE',
    midfield_pivot_structure: 'DOUBLE_PIVOT'
  });

  // Replacement simulation interactive state
  const [replacementModalOpen, setReplacementModalOpen] = useState<boolean>(false);
  const [replacementSlot, setReplacementSlot] = useState<string>('LCM');
  const [incumbentId, setIncumbentId] = useState<string>('Home_6');
  const [candidateId, setCandidateId] = useState<string>('Home_8');
  const [replacementResult, setReplacementResult] = useState<ReplacementScenarioResult | null>(null);

  // Initial load
  useEffect(() => {
    loadAllCoachData();
  }, [selectedOpponent, selectedFormation, selectedPhilosophy]);

  async function loadAllCoachData() {
    setLoading(true);
    try {
      const [pReport, fList, xiPlan, exp, cm, scen, ig, train, repJson] = await Promise.all([
        generateMatchPreparation({
          opponent_team: selectedOpponent,
          preferred_formation: selectedFormation,
          tactical_philosophy: selectedPhilosophy
        }),
        evaluateFormations({
          opponent_team: selectedOpponent,
          preferred_philosophy: selectedPhilosophy
        }),
        planPlayerSelection({
          formation_name: selectedFormation,
          team: 'Home'
        }),
        planOpponentExploitation({ opponent_team: selectedOpponent }),
        planDefensiveCountermeasures({ opponent_team: selectedOpponent }),
        simulateTacticalScenario({
          adjustment_params: scenarioParams,
          scenario_name: 'Strategic Scenario Simulation'
        }),
        monitorInGameReplay('seq_goal_1', 2200, 2320),
        planTrainingPriorities({ opponent_team: selectedOpponent }),
        fetchMatchStrategyReportJson({
          opponent_team: selectedOpponent,
          preferred_formation: selectedFormation,
          tactical_philosophy: selectedPhilosophy
        })
      ]);

      setPrepReport(pReport);
      setFormations(fList);
      setStartingXIPlan(xiPlan);
      setExploitation(exp);
      setCountermeasures(cm);
      setScenarioResult(scen);
      setInGameSummary(ig);
      setTrainingProgram(train);
      setFullReportJson(repJson);
    } catch (err) {
      console.error('Failed to load coach decision support data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runScenarioSimulation() {
    setLoading(true);
    try {
      const res = await simulateTacticalScenario({
        adjustment_params: scenarioParams,
        scenario_name: `Tactical Shift: ${scenarioParams.target_formation}`
      });
      setScenarioResult(res);
    } catch (err) {
      console.error('Scenario simulation failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function runReplacementSimulation() {
    try {
      const res = await simulatePlayerReplacement({
        target_slot_id: replacementSlot,
        incumbent_player_id: incumbentId,
        replacement_player_id: candidateId,
        formation_name: selectedFormation
      });
      setReplacementResult(res);
    } catch (err) {
      console.error('Replacement simulation failed:', err);
    }
  }

  return (
    <div className="flex flex-col space-y-6 text-[#171717]">
      {/* Top Header Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-[#FEF3E8] border border-[#FCD8B3] shadow-sm">
            <BrainCircuit className="w-6 h-6 text-[#F28C28]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">COACH DECISION SUPPORT SYSTEM</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEF3E8] text-[#F28C28] border border-[#FCD8B3]">
                Phase 19 Engine
              </span>
            </div>
            <p className="text-xs text-[#525252] mt-0.5">
              Transforming multi-match tracking evidence into explainable tactical choices.
            </p>
          </div>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center space-x-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
            <span className="text-[#525252] uppercase text-[10px] font-semibold">Opponent:</span>
            <select
              value={selectedOpponent}
              onChange={(e) => setSelectedOpponent(e.target.value)}
              className="bg-transparent text-rose-600 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Away" className="bg-white text-[#171717]">Away (Metrica)</option>
              <option value="Home" className="bg-white text-[#171717]">Home (Self)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
            <span className="text-[#525252] uppercase text-[10px] font-semibold">Formation:</span>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              className="bg-transparent text-blue-600 font-bold focus:outline-none cursor-pointer"
            >
              <option value="4-3-3" className="bg-white text-[#171717]">4-3-3</option>
              <option value="4-2-3-1" className="bg-white text-[#171717]">4-2-3-1</option>
              <option value="4-4-2" className="bg-white text-[#171717]">4-4-2</option>
              <option value="3-5-2" className="bg-white text-[#171717]">3-5-2</option>
              <option value="3-4-3" className="bg-white text-[#171717]">3-4-3</option>
              <option value="4-1-4-1" className="bg-white text-[#171717]">4-1-4-1</option>
              <option value="5-3-2" className="bg-white text-[#171717]">5-3-2</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
            <span className="text-[#525252] uppercase text-[10px] font-semibold">Philosophy:</span>
            <select
              value={selectedPhilosophy}
              onChange={(e) => setSelectedPhilosophy(e.target.value)}
              className="bg-transparent text-emerald-600 font-bold focus:outline-none cursor-pointer"
            >
              <option value="POSSESSION_BUILDUP" className="bg-white text-[#171717]">Positional Possession</option>
              <option value="HIGH_PRESS_HIGH_LINE" className="bg-white text-[#171717]">High Press & High Line</option>
              <option value="DIRECT_COUNTERATTACK" className="bg-white text-[#171717]">Direct Counterattack</option>
              <option value="COMPACT_LOW_BLOCK" className="bg-white text-[#171717]">Compact Low-Block</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E0D8]">
        {[
          { id: 'preparation', label: 'A. Match Preparation', icon: ClipboardList },
          { id: 'formation', label: 'B. Formation Planner', icon: Layers },
          { id: 'players', label: 'C. Player Selection', icon: Users },
          { id: 'exploitation', label: 'D. Opponent Exploitation', icon: Flame },
          { id: 'countermeasures', label: 'E. Defensive Countermeasures', icon: Shield },
          { id: 'scenarios', label: 'F. Scenario Lab', icon: Sliders },
          { id: 'in_game', label: 'G. In-Game Intelligence', icon: Radio },
          { id: 'training', label: 'H. Training Priorities', icon: Target },
          { id: 'report', label: 'I. Strategy Report', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#F28C28] text-white shadow-sm font-bold'
                  : 'text-[#525252] hover:text-[#171717] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#525252]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="flex items-center space-x-2 text-xs text-[#F28C28] font-mono py-1 animate-pulse">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing decision engines across spatiotemporal models...</span>
        </div>
      )}

      {/* TAB A: MATCH PREPARATION */}
      {activeTab === 'preparation' && prepReport && (
        <div className="space-y-6">
          {/* Executive Tactical Approach Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-orange-500/30 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                  Recommended Tactical Strategy
                </span>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                  {prepReport.section_10_recommended_tactical_approach.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {prepReport.section_10_recommended_tactical_approach.headline}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Compatibility</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {prepReport.section_10_recommended_tactical_approach.tactical_compatibility_score}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Risk Index</div>
                  <div className="text-xl font-bold text-orange-400 font-mono">
                    {prepReport.section_10_recommended_tactical_approach.defensive_risk_index}/100
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Strategic Advantages</span>
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {prepReport.section_10_recommended_tactical_approach.key_advantages.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-rose-400 flex items-center space-x-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Disadvantages & Risks</span>
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {prepReport.section_10_recommended_tactical_approach.disadvantages_and_risks.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5 mb-2">
                  <Info className="w-3.5 h-3.5" />
                  <span>Assumptions & Uncertainties</span>
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {prepReport.section_10_recommended_tactical_approach.uncertainties_and_assumptions.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 15-Section Preparation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 1 & 2: Opponent Profile</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Tactical Identity & Attacking Tendencies</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {prepReport.section_1_opponent_tactical_identity}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {prepReport.section_2_opponent_attacking_tendencies}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 3 & 4: Defense & Pressing</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Defensive Structure & Pressing Behavior</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {prepReport.section_3_opponent_defensive_structure}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {prepReport.section_4_pressing_behaviour}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 6: Recurring Patterns</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Verified Tactical Patterns</h3>
              <ul className="text-xs text-slate-300 space-y-1.5 mt-2 list-disc list-inside">
                {prepReport.section_6_recurring_tactical_patterns.map((pat, i) => (
                  <li key={i}>{pat}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 8 & 9: Vulnerabilities & Threats</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Exploitable Vulnerabilities & Player Threats</h3>
              <ul className="text-xs text-rose-300 space-y-1 mt-2 list-disc list-inside">
                {prepReport.section_8_defensive_vulnerabilities.map((vuln, i) => (
                  <li key={i}>{vuln}</li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                {prepReport.section_9_player_specific_threats.map((pt, i) => (
                  <div key={i} className="font-mono text-slate-300">• {pt}</div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 13: Defensive Priorities</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Matchday Defensive Execution Plan</h3>
              <ul className="text-xs text-slate-300 space-y-1.5 mt-2 list-disc list-inside">
                {prepReport.section_13_defensive_priorities.map((dp, i) => (
                  <li key={i}>{dp}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Section 14: Attacking Priorities</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Matchday Attacking Execution Plan</h3>
              <ul className="text-xs text-slate-300 space-y-1.5 mt-2 list-disc list-inside">
                {prepReport.section_14_attacking_priorities.map((ap, i) => (
                  <li key={i}>{ap}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: FORMATION PLANNER */}
      {activeTab === 'formation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 2D Interactive Formation Pitch */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">2D Tactical Formation Layout ({selectedFormation})</h3>
                <p className="text-[11px] text-slate-400 font-mono">105m x 68m Pitch Coordinate Placement</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                11 Positions
              </span>
            </div>

            {/* Pitch Visualization Canvas Container */}
            <div className="relative w-full aspect-[105/68] bg-emerald-950/60 rounded-xl border-2 border-emerald-800/80 overflow-hidden shadow-inner">
              {/* Pitch markings */}
              <div className="absolute inset-0 border border-emerald-500/30 m-3 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-emerald-500/30 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/30 pointer-events-none" />
              <div className="absolute top-1/2 left-3 -translate-y-1/2 w-12 h-24 border border-emerald-500/30 pointer-events-none" />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 w-12 h-24 border border-emerald-500/30 pointer-events-none" />

              {/* Formation slot nodes */}
              {formations.find(f => f.formation_name === selectedFormation)?.slots.map((slot) => {
                const posX = (slot.default_pitch_x_m / 105) * 100;
                const posY = (slot.default_pitch_y_m / 68) * 100;
                return (
                  <div
                    key={slot.slot_id}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-orange-600 border-2 border-white text-white font-bold text-[9px] flex items-center justify-center shadow-lg group-hover:scale-125 transition">
                      {slot.slot_id}
                    </div>
                    <span className="text-[9px] font-mono text-slate-200 bg-slate-950/80 px-1 rounded mt-0.5 whitespace-nowrap">
                      {slot.role_name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 font-mono">
              Hover nodes to inspect slot duties. Attacking direction is left-to-right toward the right goal.
            </div>
          </div>

          {/* Right: Formation Comparison & Selection */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Formation Candidate Rankings</h3>
            <div className="space-y-3">
              {formations.map((f) => (
                <div
                  key={f.formation_name}
                  onClick={() => setSelectedFormation(f.formation_name)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    selectedFormation === f.formation_name
                      ? 'bg-slate-900 border-orange-500 shadow-md ring-1 ring-orange-500/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-bold text-slate-100 font-mono">{f.formation_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        f.suitability_tier === 'HIGHLY_RECOMMENDED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : f.suitability_tier === 'VIABLE_ALTERNATIVE'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        {f.suitability_tier.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-400 font-mono">{f.compatibility_score}%</span>
                      <span className="text-[10px] text-slate-500 block">Fit Score</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                    <div>
                      <strong className="text-emerald-400 block mb-0.5 text-[11px]">Primary Strength:</strong>
                      <span>{f.strengths[0]}</span>
                    </div>
                    <div>
                      <strong className="text-rose-400 block mb-0.5 text-[11px]">Defensive Risk:</strong>
                      <span>{f.defensive_risks[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB C: PLAYER SELECTION & STARTING XI */}
      {activeTab === 'players' && startingXIPlan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Starting XI & Tactical Role Assignments ({selectedFormation})</h3>
              <p className="text-xs text-slate-400">Selected using empirical scouting profiles and role compatibility optimization.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Squad Balance</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{startingXIPlan.squad_tactical_balance_score}/100</span>
              </div>
              <button
                onClick={() => setReplacementModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white transition flex items-center space-x-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulate Replacement</span>
              </button>
            </div>
          </div>

          {/* Starting XI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {startingXIPlan.starting_xi.map((slot) => (
              <div key={slot.slot_id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-orange-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {slot.slot_id}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{slot.slot_role}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">{slot.role_fit_score}% Fit</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-orange-400">{slot.assigned_player_id}</span>
                    <span className="text-[10px] font-mono text-slate-400">Jersey #{slot.jersey_number}</span>
                  </div>
                  <div className="text-[11px] text-cyan-300 mt-0.5">{slot.hybrid_classification}</div>
                  <div className="text-[11px] text-slate-400 mt-1 italic">Duty: {slot.tactical_duty}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bench Roster */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Tactical Bench Candidates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {startingXIPlan.bench.map((b) => (
                <div key={b.player_id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-slate-200">{b.player_id}</span>
                    <span className="text-slate-500">#{b.jersey_number}</span>
                  </div>
                  <div className="text-[11px] text-orange-400 mt-1">{b.tactical_role_utility}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Targets: {b.replacement_target_slots.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Replacement Simulation Modal */}
          {replacementModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-slate-100">Player Replacement Scenario</h3>
                  <button onClick={() => setReplacementModalOpen(false)} className="text-slate-400 hover:text-slate-200">✕</button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Target Slot:</label>
                    <input
                      value={replacementSlot}
                      onChange={(e) => setReplacementSlot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Incumbent Player ID:</label>
                    <input
                      value={incumbentId}
                      onChange={(e) => setIncumbentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Replacement Candidate ID:</label>
                    <input
                      value={candidateId}
                      onChange={(e) => setCandidateId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                </div>

                <button
                  onClick={runReplacementSimulation}
                  className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 font-bold text-xs text-white transition"
                >
                  Run Comparison
                </button>

                {replacementResult && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="font-bold text-orange-400">{replacementResult.tactical_tradeoff_verdict}</div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-[10px] text-slate-500 block">Progression</span>
                        <span className={replacementResult.progression_delta_m >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {replacementResult.progression_delta_m >= 0 ? `+${replacementResult.progression_delta_m}` : replacementResult.progression_delta_m}m
                        </span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-[10px] text-slate-500 block">Space Created</span>
                        <span className={replacementResult.space_creation_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {replacementResult.space_creation_delta >= 0 ? `+${replacementResult.space_creation_delta}` : replacementResult.space_creation_delta}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded">
                        <span className="text-[10px] text-slate-500 block">Speed</span>
                        <span className={replacementResult.pressing_velocity_delta_mps >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {replacementResult.pressing_velocity_delta_mps >= 0 ? `+${replacementResult.pressing_velocity_delta_mps}` : replacementResult.pressing_velocity_delta_mps}m/s
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-300 italic">{replacementResult.tactical_recommendation}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB D: OPPONENT EXPLOITATION */}
      {activeTab === 'exploitation' && exploitation && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Strategic Opponent Exploitation Plans</h3>
              <p className="text-xs text-slate-400">Actionable attacking blueprints across four strategic corridors.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Vulnerability Index</span>
              <span className="text-lg font-bold text-orange-400 font-mono">{exploitation.overall_vulnerability_index}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exploitation.exploitation_plans.map((plan, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-orange-950 text-orange-300 border border-orange-500/40">
                      {plan.corridor_category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{plan.confidence_tier} CONFIDENCE</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{plan.headline}</h4>
                  <p className="text-xs text-rose-300 mt-1 font-mono">{plan.target_opponent_vulnerability}</p>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{plan.tactical_mechanism}</p>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                    <strong className="text-cyan-400 block mb-0.5">Prescribed Attacking Pattern:</strong>
                    <span className="text-slate-300">{plan.prescribed_attacking_pattern}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Targets: <strong className="text-slate-200">{plan.key_player_targets.join(', ')}</strong></span>
                  <span className="text-orange-400 font-semibold">{plan.drill_recommendation.split(':')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB E: DEFENSIVE COUNTERMEASURES */}
      {activeTab === 'countermeasures' && countermeasures && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Defensive Countermeasures & Neutralization Plans</h3>
              <p className="text-xs text-slate-400">Structured defensive tactics to nullify opponent attacking weapons.</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Opponent Threat Index</span>
              <span className="text-lg font-bold text-rose-400 font-mono">{countermeasures.opponent_threat_index}/100</span>
            </div>
          </div>

          <div className="space-y-3">
            {countermeasures.countermeasures.map((cm, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40">
                    {cm.threat_category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Threat Actors: {cm.key_opponent_threat_actors.join(', ')}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">{cm.target_opponent_strength}</h4>
                <p className="text-xs text-slate-300 mt-1.5">{cm.prescribed_defensive_response}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <strong className="text-amber-400 block mb-0.5">Assigned Defensive Duties:</strong>
                    <span className="text-slate-300">{cm.assigned_defensive_duties}</span>
                  </div>
                  <div>
                    <strong className="text-cyan-400 block mb-0.5">Alternative Approach:</strong>
                    <span className="text-slate-300">{cm.alternative_tactical_approach}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB F: SCENARIO LAB */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tactical Scenario Configuration</h3>
              <p className="text-xs text-slate-400">Simulate hypothetical shifts in formation, depth, and intensity.</p>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Target Formation:</label>
                <select
                  value={scenarioParams.target_formation}
                  onChange={(e) => setScenarioParams({ ...scenarioParams, target_formation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="5-3-2">5-3-2</option>
                  <option value="3-4-3">3-4-3</option>
                  <option value="4-4-2">4-4-2</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Defensive Line Shift:</span>
                  <span className="text-cyan-300 font-bold">
                    {scenarioParams.defensive_line_shift_m >= 0 ? `+${scenarioParams.defensive_line_shift_m}` : scenarioParams.defensive_line_shift_m} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={scenarioParams.defensive_line_shift_m}
                  onChange={(e) => setScenarioParams({ ...scenarioParams, defensive_line_shift_m: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Pressing Intensity Delta:</span>
                  <span className="text-orange-300 font-bold">
                    {scenarioParams.pressing_intensity_delta_pct >= 0 ? `+${scenarioParams.pressing_intensity_delta_pct}` : scenarioParams.pressing_intensity_delta_pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  step="5"
                  value={scenarioParams.pressing_intensity_delta_pct}
                  onChange={(e) => setScenarioParams({ ...scenarioParams, pressing_intensity_delta_pct: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Attacking Width Mode:</label>
                <select
                  value={scenarioParams.attacking_width_mode}
                  onChange={(e) => setScenarioParams({ ...scenarioParams, attacking_width_mode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="WIDE">Wide Touchline Isolation</option>
                  <option value="BALANCED">Balanced Intermediate</option>
                  <option value="NARROW_INVERTED">Narrow Half-Space Overload</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Midfield Pivot Structure:</label>
                <select
                  value={scenarioParams.midfield_pivot_structure}
                  onChange={(e) => setScenarioParams({ ...scenarioParams, midfield_pivot_structure: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="DOUBLE_PIVOT">Double Pivot (Dual Screening)</option>
                  <option value="SINGLE_PIVOT">Single Pivot (Single Anchor)</option>
                  <option value="FLAT_THREE">Flat Three Midfield</option>
                </select>
              </div>

              <button
                onClick={runScenarioSimulation}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-bold text-white transition mt-2"
              >
                Execute Scenario Simulation
              </button>
            </div>
          </div>

          {/* Right Results */}
          <div className="lg:col-span-7 space-y-4">
            {scenarioResult && (
              <>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Simulation Verdict</span>
                      <h4 className="text-sm font-bold text-orange-400 mt-0.5">{scenarioResult.strategic_verdict}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-950 text-cyan-300 border border-slate-800">
                      Confidence: {scenarioResult.confidence_score_pct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {scenarioResult.metric_deltas.map((d, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">{d.metric_name}</span>
                      <div className="flex items-baseline space-x-1.5 mt-1 font-mono">
                        <span className="text-base font-bold text-slate-100">{d.simulated_value} {d.unit}</span>
                        <span className={`text-xs font-semibold ${d.delta_value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({d.delta_value >= 0 ? `+${d.delta_value}` : d.delta_value})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1 line-clamp-2">{d.tactical_interpretation}</span>
                    </div>
                  ))}
                </div>

                {/* Scientific Honesty Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Scientific Honesty & Epistemic Separation
                  </div>
                  <div className="text-emerald-300">
                    <strong>Observed Facts:</strong> {scenarioResult.observed_match_facts[0]}
                  </div>
                  <div className="text-cyan-300">
                    <strong>Model Estimates:</strong> {scenarioResult.model_derived_estimates[0]}
                  </div>
                  <div className="text-amber-300">
                    <strong>Assumptions:</strong> {scenarioResult.hypothetical_scenario_assumptions[0]}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB G: IN-GAME INTELLIGENCE */}
      {activeTab === 'in_game' && inGameSummary && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">In-Game Replay Monitoring & Adjustment Feed</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{inGameSummary.frame_range}</p>
            </div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
              {inGameSummary.monitoring_mode}
            </span>
          </div>

          <div className="space-y-3">
            {inGameSummary.alerts.map((alert) => (
              <div key={alert.alert_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      alert.severity === 'OPPORTUNITY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{alert.tactical_event}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{alert.timestamp_s}s (Frame {alert.frame_number})</span>
                </div>

                <p className="text-xs text-slate-300 mt-1">{alert.structural_change_detected}</p>

                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <strong className="text-orange-400 block mb-0.5">Recommended Real-Time Adjustment:</strong>
                  <span className="text-slate-200">{alert.recommended_adjustment}</span>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">Targets: {alert.target_player_roles.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-500 italic">
            Note: {inGameSummary.live_limitation_statement}
          </div>
        </div>
      )}

      {/* TAB H: TRAINING PRIORITIES */}
      {activeTab === 'training' && trainingProgram && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Tactical Training Priorities & Pitch Drills</h3>
              <p className="text-xs text-slate-400">{trainingProgram.training_cycle_name}</p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-950 text-orange-400 border border-slate-800">
              {trainingProgram.total_priorities} Priority Sessions
            </span>
          </div>

          <div className="space-y-4">
            {trainingProgram.priorities.map((item) => (
              <div key={item.priority_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                      #{item.rank}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{item.headline}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">{item.urgency_level} URGENCY</span>
                </div>

                <p className="text-xs text-slate-300">{item.tactical_objective}</p>

                {/* Drill Card */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-cyan-300">{item.prescribed_drill.title}</span>
                    <span className="text-slate-400">{item.prescribed_drill.duration_minutes} min | {item.prescribed_drill.grid_dimensions_m}</span>
                  </div>
                  <div className="text-slate-400">Setup: {item.prescribed_drill.player_setup} ({item.prescribed_drill.target_phase})</div>
                  <div className="text-slate-300">{item.prescribed_drill.exercise_progression}</div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <strong className="text-orange-400 block mb-1">Key Coaching Cues:</strong>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {item.prescribed_drill.key_coaching_cues.map((cue, cIdx) => (
                        <li key={cIdx}>{cue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB I: MATCH STRATEGY REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">18-Section Commercial Match Strategy Dossier</h3>
              <p className="text-xs text-slate-400">Complete coach-facing preparation document with full evidence traceability.</p>
            </div>
            <div className="flex items-center space-x-2.5">
              <a
                href="/api/coach/report/html"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-semibold text-xs text-white transition flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Printable HTML Dossier</span>
              </a>
            </div>
          </div>

          {/* JSON Dossier Inspector */}
          {fullReportJson && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800">
              <pre className="text-slate-300">{JSON.stringify(fullReportJson, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
