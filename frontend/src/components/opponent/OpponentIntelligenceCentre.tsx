import React, { useState, useEffect } from 'react';
import {
  MatchMetadata,
  MatchCompatibilityScore,
  OpponentTacticalProfile,
  CrossMatchTacticalPattern,
  OpponentWeakness,
  OpponentStrength,
  OpponentTacticalEvolutionReport,
  OpponentSquadIntelligence,
  OpponentPreparationStrategy
} from '../../types/opponent';
import {
  fetchRegisteredMatches,
  fetchMatchCompatibility,
  fetchOpponentProfile,
  fetchCrossMatchPatterns,
  fetchOpponentWeaknesses,
  fetchOpponentStrengths,
  fetchTacticalEvolution,
  fetchOpponentSquad,
  fetchPreparationStrategy,
  getCommercialOpponentBriefingHtmlUrl
} from '../../services/api';
import {
  Shield,
  Target,
  Sparkles,
  TrendingUp,
  Users,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers,
  Compass,
  Zap,
  ArrowUpRight,
  Calendar,
  Lock,
  Eye
} from 'lucide-react';

interface OpponentIntelligenceCentreProps {
  onJumpToSequence?: (seqId: string, targetFrame: number, highlightedPlayers?: string[]) => void;
}

export const OpponentIntelligenceCentre: React.FC<OpponentIntelligenceCentreProps> = ({
  onJumpToSequence
}) => {
  const [opponentTeam, setOpponentTeam] = useState<'Away' | 'Home'>('Away');
  const [selectedMatches, setSelectedMatches] = useState<string[]>(['metrica_game_1', 'metrica_game_2']);
  const [activeTab, setActiveTab] = useState<
    'dna' | 'weaknesses' | 'strengths' | 'patterns' | 'evolution' | 'players' | 'preparation'
  >('dna');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Loaded data
  const [matches, setMatches] = useState<MatchMetadata[]>([]);
  const [compatibility, setCompatibility] = useState<MatchCompatibilityScore | null>(null);
  const [profile, setProfile] = useState<OpponentTacticalProfile | null>(null);
  const [patterns, setPatterns] = useState<CrossMatchTacticalPattern[]>([]);
  const [weaknesses, setWeaknesses] = useState<OpponentWeakness[]>([]);
  const [strengths, setStrengths] = useState<OpponentStrength[]>([]);
  const [evolution, setEvolution] = useState<OpponentTacticalEvolutionReport | null>(null);
  const [squad, setSquad] = useState<OpponentSquadIntelligence | null>(null);
  const [preparation, setPreparation] = useState<OpponentPreparationStrategy | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');

  const loadAllOpponentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const matchParam = selectedMatches.join(',');
      const [
        matchList,
        compat,
        prof,
        pats,
        weaks,
        strs,
        evo,
        sq,
        prep
      ] = await Promise.all([
        fetchRegisteredMatches(),
        fetchMatchCompatibility(matchParam),
        fetchOpponentProfile(opponentTeam, matchParam),
        fetchCrossMatchPatterns(opponentTeam, matchParam),
        fetchOpponentWeaknesses(opponentTeam, matchParam),
        fetchOpponentStrengths(opponentTeam, matchParam),
        fetchTacticalEvolution(opponentTeam, matchParam),
        fetchOpponentSquad(opponentTeam, matchParam),
        fetchPreparationStrategy(opponentTeam, matchParam)
      ]);

      setMatches(matchList);
      setCompatibility(compat);
      setProfile(prof);
      setPatterns(pats);
      setWeaknesses(weaks);
      setStrengths(strs);
      setEvolution(evo);
      setSquad(sq);
      setPreparation(prep);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load multi-match opponent intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOpponentData();
  }, [opponentTeam, selectedMatches]);

  const filteredWeaknesses = weaknesses.filter(w => {
    const matchesSev = severityFilter === 'ALL' || w.severity.toUpperCase() === severityFilter;
    const matchesSearch = !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.measured_facts.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tactical_implication.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div className="flex flex-col space-y-6 text-[#171717]">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <div className="p-2 rounded-xl bg-[#FEF3E8] border border-[#FCD8B3] text-[#F28C28]">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                    OPPONENT INTELLIGENCE CENTRE
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#FEF3E8] border border-[#FCD8B3] text-[#F28C28]">
                    Multi-Match DNA (25 Hz)
                  </span>
                </div>
                <p className="text-xs text-[#525252]">
                  Cross-match telemetry synthesis, explainable vulnerability discovery, and strategic preparation playbooks.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Target Opponent Selector */}
            <div className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E5E0D8] text-xs">
              <span className="text-[#525252] px-2 font-medium">Opponent:</span>
              <button
                onClick={() => setOpponentTeam('Away')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  opponentTeam === 'Away'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                Away Team
              </button>
              <button
                onClick={() => setOpponentTeam('Home')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  opponentTeam === 'Home'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-[#525252] hover:text-[#171717]'
                }`}
              >
                Home Team
              </button>
            </div>

            {/* Print / PDF Briefing Export */}
            <button
              onClick={() => {
                const url = getCommercialOpponentBriefingHtmlUrl(opponentTeam, selectedMatches.join(','));
                window.open(url, '_blank');
              }}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#F28C28] hover:bg-[#E07B18] text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Commercial Briefing</span>
            </button>

            <button
              onClick={loadAllOpponentData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-white text-[#525252] border border-[#E5E0D8] transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#F28C28]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top 4 Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] block mb-1">
              Tactical Archetype
            </span>
            <div className="text-sm font-bold text-[#171717] leading-snug">
              {profile ? profile.overall_tactical_archetype : 'Analyzing telemetry...'}
            </div>
            <div className="mt-2 text-[10px] text-[#525252]">
              Across {selectedMatches.length} verified Metrica matches
            </div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] block mb-1">
              Data Compatibility
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {compatibility ? `${compatibility.overall_score}%` : '100%'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#525252] flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
              <span>105x68m coords • 25 Hz telemetry</span>
            </div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] block mb-1">
              Systemic Vulnerabilities
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black text-rose-600 font-mono">
                {weaknesses.length}
              </span>
              <span className="text-xs text-rose-700 font-medium">
                Flaws Confirmed (Recurrence ≥ 2)
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#525252]">
              Top flaw score: <strong className="text-rose-600">{weaknesses[0]?.vulnerability_score || 0}/100</strong>
            </div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Progression Channel Bias
            </span>
            <div className="text-sm font-bold text-cyan-300">
              {profile?.attacking_dna.preferred_flank || 'Loading...'}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Orchestrator: <strong className="text-slate-200">{profile?.attacking_dna.key_orchestrator || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-[#E5E0D8] overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            { id: 'dna', label: 'Tactical DNA', icon: Compass, count: undefined },
            { id: 'weaknesses', label: 'Weaknesses & Exploits', icon: AlertTriangle, count: weaknesses.length },
            { id: 'strengths', label: 'Strengths & Counters', icon: Shield, count: strengths.length },
            { id: 'patterns', label: 'Cross-Match Patterns', icon: Layers, count: patterns.length },
            { id: 'evolution', label: 'Tactical Evolution', icon: TrendingUp, count: undefined },
            { id: 'players', label: 'Player Intelligence', icon: Users, count: squad?.all_players.length },
            { id: 'preparation', label: 'Preparation Playbook', icon: Zap, count: undefined },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F28C28] text-white shadow-sm font-bold'
                    : 'text-[#525252] hover:text-[#171717] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#525252]'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#EAE3D2] text-[#525252]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-16 flex flex-col items-center justify-center space-y-4 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#F28C28] animate-spin" />
          <p className="text-sm font-medium text-[#525252]">
            Synthesizing 25 Hz telemetry across {selectedMatches.join(' and ')}...
          </p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-rose-800 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h3 className="font-bold">Error loading multi-match data</h3>
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: TACTICAL DNA */}
          {activeTab === 'dna' && profile && (
            <div className="space-y-6">
              {/* Radar Metrics Overview */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Tactical DNA Dimension Index (Normalized [0, 100])</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(profile.radar_metrics).map(([k, v]) => (
                    <div key={k} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs text-slate-400">{k}</span>
                        <span className="text-sm font-black font-mono text-cyan-300">{v}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full"
                          style={{ width: `${v}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attacking DNA */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-400">
                          <Target className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">Attacking DNA Profile</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 border border-blue-800 text-blue-300">
                        {profile.attacking_dna.preferred_flank}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      {profile.attacking_dna.tactical_summary}
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Progression Velocity:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.attacking_dna.progression_velocity_mps} m/s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Directness Index:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.attacking_dna.directness_index}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Attacking Width / Depth:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.attacking_dna.attacking_width_m}m / {profile.attacking_dna.attacking_depth_m}m</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Key Playmaker:</span>
                        <span className="font-bold text-cyan-300">{profile.attacking_dna.key_orchestrator}</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                      Flank Progression Distribution
                    </span>
                    <div className="flex h-3 rounded-full overflow-hidden text-[9px] font-bold font-mono text-center">
                      <div style={{ width: `${profile.attacking_dna.channel_distribution.left_wing_pct}%` }} className="bg-blue-600 text-white" title="Left Wing">
                        L {Math.round(profile.attacking_dna.channel_distribution.left_wing_pct)}%
                      </div>
                      <div style={{ width: `${profile.attacking_dna.channel_distribution.left_half_space_pct}%` }} className="bg-blue-500 text-white" title="Left Half Space" />
                      <div style={{ width: `${profile.attacking_dna.channel_distribution.central_pct}%` }} className="bg-cyan-500 text-slate-950" title="Center">
                        C {Math.round(profile.attacking_dna.channel_distribution.central_pct)}%
                      </div>
                      <div style={{ width: `${profile.attacking_dna.channel_distribution.right_half_space_pct}%` }} className="bg-indigo-500 text-white" title="Right Half Space" />
                      <div style={{ width: `${profile.attacking_dna.channel_distribution.right_wing_pct}%` }} className="bg-indigo-600 text-white" title="Right Wing">
                        R {Math.round(profile.attacking_dna.channel_distribution.right_wing_pct)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Defensive DNA */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
                          <Shield className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">Defensive DNA Profile</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300">
                        {profile.defensive_dna.block_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      {profile.defensive_dna.tactical_summary}
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Defensive Line Height:</span>
                        <span className="font-mono font-bold text-amber-300">{profile.defensive_dna.mean_defensive_line_height_m}m</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Mean Compactness (Hull):</span>
                        <span className="font-mono font-bold text-slate-200">{profile.defensive_dna.mean_compactness_m2} m²</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Inter-Line Gap (Def-Mid):</span>
                        <span className="font-mono font-bold text-rose-300">{profile.defensive_dna.inter_line_gap_m}m</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Offside Line Depth Disparity:</span>
                        <span className="font-mono font-bold text-rose-300">{profile.defensive_dna.offside_line_disparity_m}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between text-slate-400">
                    <span>Recovery Speed: <strong className="text-slate-200">{profile.defensive_dna.recovery_speed_mps} m/s</strong></span>
                    <span>Min Box Hull: <strong className="text-slate-200">{profile.defensive_dna.min_compactness_m2} m²</strong></span>
                  </div>
                </div>

                {/* Pressing DNA */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">Pressing DNA Profile</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 border border-purple-800 text-purple-300">
                        {profile.pressing_dna.preferred_pressing_trap}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      {profile.pressing_dna.tactical_summary}
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Pressure Intensity:</span>
                        <span className="font-mono font-bold text-purple-300">{profile.pressing_dna.mean_pressure_intensity_pct}%</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Peak Closing Velocity:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.pressing_dna.peak_closing_velocity_mps} m/s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Mean Time-to-Contact (TTC):</span>
                        <span className="font-mono font-bold text-slate-200">{profile.pressing_dna.mean_time_to_contact_s}s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Turnover Win Rate:</span>
                        <span className="font-mono font-bold text-emerald-400">{profile.pressing_dna.pressing_success_rate_pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] flex justify-between text-slate-400 font-medium">
                    <span>High Third: {profile.pressing_dna.initiation_zone_high_pct}%</span>
                    <span>Mid Third: {profile.pressing_dna.initiation_zone_mid_pct}%</span>
                    <span>Low Third: {profile.pressing_dna.initiation_zone_low_pct}%</span>
                  </div>
                </div>

                {/* Transition DNA */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">Transition DNA Profile</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-800 text-amber-300">
                        {profile.transition_dna.transition_style}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      {profile.transition_dna.tactical_summary}
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Counterattack Velocity:</span>
                        <span className="font-mono font-bold text-amber-300">{profile.transition_dna.counterattack_velocity_mps} m/s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Counter Frequency:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.transition_dna.counterattack_frequency_pct}%</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Recovery Speed Post-Turnover:</span>
                        <span className="font-mono font-bold text-slate-200">{profile.transition_dna.defensive_recovery_speed_mps} m/s</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-500">Space Exposed Post-Turnover:</span>
                        <span className="font-mono font-bold text-rose-300">{profile.transition_dna.mean_space_exposed_post_turnover_m2} m²</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between text-slate-400">
                    <span>Forward Pass Ratio: <strong className="text-slate-200">{Math.round(profile.transition_dna.forward_pass_ratio_in_transition * 100)}%</strong></span>
                    <span>Counterpress Duration: <strong className="text-slate-200">{profile.transition_dna.counterpress_duration_s}s</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEMIC WEAKNESSES */}
          {activeTab === 'weaknesses' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center space-x-2 text-xs font-semibold">
                  <span className="text-slate-500">Severity:</span>
                  {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-3 py-1 rounded transition ${
                        severityFilter === sev
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search vulnerabilities..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Weakness Cards */}
              <div className="space-y-4">
                {filteredWeaknesses.map(w => (
                  <div key={w.weakness_id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            w.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            w.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {w.severity} Severity
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Vulnerability Score: {w.vulnerability_score}/100
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-100">{w.name}</h3>
                      </div>

                      <div className="text-xs text-slate-400 md:text-right space-y-0.5">
                        <div>Recurrence: <strong className="text-slate-200">{w.recurrence_count} instances</strong></div>
                        <div>Verified in: <strong className="text-cyan-400">{w.matches_present.join(', ')}</strong></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                      <div className="space-y-3">
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase text-[10px]">Measured Telemetry:</span>
                          <p className="text-slate-300 mt-0.5 leading-relaxed">{w.measured_facts}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase text-[10px]">Tactical Implication:</span>
                          <p className="text-slate-400 mt-0.5 leading-relaxed">{w.tactical_implication}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-400 mb-1">
                            Actionable Coaching Exploit:
                          </span>
                          <p>{w.recommended_exploit}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-400 mb-1">
                            Prescribed Pitch Training Drill:
                          </span>
                          <p className="italic">{w.prescribed_drill}</p>
                        </div>
                      </div>
                    </div>

                    {/* Supporting Evidence Citations */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Supporting Telemetry Citations (Multi-Match Tracking):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {w.supporting_evidence.map((ev, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-start justify-between">
                            <div>
                              <span className="font-semibold text-slate-300">{ev.match_id}</span> ({ev.frame_timestamp}): {ev.description}
                            </div>
                            {onJumpToSequence && (
                              <button
                                onClick={() => onJumpToSequence(ev.sequence_id, 2260, ev.involved_players)}
                                className="shrink-0 ml-2 px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-[10px] font-medium border border-cyan-800/60 transition"
                              >
                                View Pitch
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STRENGTHS & COUNTERMEASURES */}
          {activeTab === 'strengths' && (
            <div className="space-y-4">
              {strengths.map(s => (
                <div key={s.strength_id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {s.impact_level} Threat
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Strength Score: {s.strength_score}/100
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100">{s.name}</h3>
                    </div>

                    <div className="text-xs text-slate-400 md:text-right space-y-0.5">
                      <div>Recurrence: <strong className="text-slate-200">{s.recurrence_count} occurrences</strong></div>
                      <div>Matches: <strong className="text-cyan-400">{s.matches_present.join(', ')}</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[10px]">Measured Performance:</span>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">{s.measured_facts}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block uppercase text-[10px]">Tactical Threat:</span>
                        <p className="text-slate-400 mt-0.5 leading-relaxed">{s.tactical_threat}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-400 mb-1">
                          Recommended Defensive Countermeasure:
                        </span>
                        <p>{s.recommended_countermeasure}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-amber-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-400 mb-1">
                          Prescribed Neutralization Drill:
                        </span>
                        <p className="italic">{s.prescribed_drill}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CROSS-MATCH PATTERNS */}
          {activeTab === 'patterns' && (
            <div className="space-y-4">
              {patterns.map(p => (
                <div key={p.pattern_id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                          {p.category.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {p.confidence_level} Confidence
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
                    </div>

                    <div className="text-xs text-slate-400 md:text-right space-y-0.5">
                      <div>Recurrence Rate: <strong className="text-emerald-400">{p.recurrence_rate_pct}%</strong></div>
                      <div>Observed: <strong className="text-slate-200">{p.recurrence_count} times</strong></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    <div className="space-y-2">
                      <p><strong className="text-slate-400">Measured Telemetry:</strong> <span className="text-slate-300">{p.measured_observation}</span></p>
                      <p><strong className="text-slate-400">Statistical Inference:</strong> <span className="text-slate-300">{p.statistical_inference}</span></p>
                      <p><strong className="text-slate-400">Tactical Interpretation:</strong> <span className="text-slate-300">{p.tactical_interpretation}</span></p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                          Coach Instruction:
                        </span>
                        <p className="text-slate-300 leading-relaxed">{p.suggested_coaching_action}</p>
                      </div>
                      <div className="mt-3 text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                        {p.limitations}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: TACTICAL EVOLUTION */}
          {activeTab === 'evolution' && evolution && (
            <div className="space-y-6">
              {/* Timeline Header */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Opponent Tactical Evolution Timeline</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                    Status: {evolution.tactical_trend_status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {evolution.overall_evolution_summary}
                </p>

                {/* Timeline Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {evolution.timeline.map((ev, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{ev.match_id} ({ev.match_date})</span>
                        <span className="text-[10px] text-slate-500">Milestone {idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-200 mb-1">{ev.tactical_shift_headline}</h4>
                      <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{ev.primary_adjustment}</p>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                        <strong>Coach Takeaway:</strong> {ev.coach_takeaway}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric Deltas Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
                <h3 className="font-bold text-sm text-slate-100 mb-4">
                  Match-to-Match Tactical Shift Matrix (Game 1 vs Game 2)
                </h3>
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tactical Metric</th>
                      <th className="py-2.5 px-3">Game 1 Value</th>
                      <th className="py-2.5 px-3">Game 2 Value</th>
                      <th className="py-2.5 px-3">Delta (Δ)</th>
                      <th className="py-2.5 px-3">Significance</th>
                      <th className="py-2.5 px-3">Analytical Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {evolution.metric_deltas.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{d.metric_name}</td>
                        <td className="py-2.5 px-3 font-mono">{d.game_1_value} {d.unit}</td>
                        <td className="py-2.5 px-3 font-mono">{d.game_2_value} {d.unit}</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${d.delta_value > 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {d.delta_value > 0 ? `+${d.delta_value}` : d.delta_value} {d.unit} ({d.percentage_change > 0 ? `+${d.percentage_change}%` : `${d.percentage_change}%`})
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.is_statistically_significant
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {d.statistical_classification || (d.is_statistically_significant ? 'Practical Shift (|Δ| ≥ 5%)' : 'Minor Variation (< 5%)')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{d.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PLAYER INTELLIGENCE */}
          {activeTab === 'players' && squad && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Squad Tactical Role Profiles</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {squad.overall_squad_tactical_summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {squad.all_players.map(pl => (
                    <div key={pl.player_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-600 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md shadow-cyan-600/20">
                            #{pl.jersey_number}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">{pl.player_id}</h4>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[11px] text-cyan-400 font-medium">{pl.tactical_role}</span>
                              {pl.identity_confidence_tier && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {pl.identity_confidence_tier}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-[10px]">
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Avg Pos: <strong className="text-slate-100">X={pl.mean_position_x_m}m</strong>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Top Speed: <strong className="text-slate-100">{pl.peak_velocity_mps} m/s</strong>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Sprints: <strong className="text-slate-100">{pl.sprint_frequency_per_match}/match</strong>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Space: <strong className="text-slate-100">{pl.space_creation_rating}/100</strong>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Pressing: <strong className="text-slate-100">{pl.pressing_engagement_rating}/100</strong>
                          </div>
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            Sequences: <strong className="text-slate-100">{pl.total_sequences_involved}</strong>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                          <strong>Key Tendency:</strong> {pl.key_tactical_tendency}
                        </p>
                        {pl.defensive_vulnerability_association && (
                          <p className="text-xs text-rose-400 mb-2">
                            <strong>Vulnerability:</strong> {pl.defensive_vulnerability_association}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                        <strong>Tactical Cue:</strong> {pl.coach_tactical_cue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PREPARATION PLAYBOOK */}
          {activeTab === 'preparation' && preparation && (
            <div className="space-y-6">
              {/* Executive Directive */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-sm text-slate-100 mb-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Executive Tactical Preparation Strategy</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {preparation.executive_game_plan}
                </p>
              </div>

              {/* Weekly Training Agenda */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h3 className="font-bold text-sm text-slate-100 mb-4 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Recommended Training Week Tactical Periodization</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {preparation.training_week_agenda.map((sess, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                        {sess.day}
                      </span>
                      <p className="text-xs font-semibold text-slate-200">
                        {sess.focus}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Drills */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-100">
                  Targeted Training Pitch Exercises
                </h3>
                {preparation.primary_attacking_exploits.concat(preparation.primary_defensive_countermeasures).map(plan => (
                  <div key={plan.recommendation_id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                        {plan.target_phase} • {plan.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {plan.prescribed_drill_title}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mb-2">{plan.headline}</h4>
                    <p className="text-xs text-slate-300 mb-3">{plan.coaching_action_plan}</p>
                    {plan.supporting_sequence_ids && plan.supporting_sequence_ids.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mb-3">
                        <span className="text-cyan-400 font-semibold">Supporting Sequences:</span>
                        <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {plan.supporting_sequence_ids.join(', ')}
                        </span>
                        {plan.supporting_metric_value && (
                          <span className="text-slate-500 font-mono">({plan.supporting_metric_value})</span>
                        )}
                      </div>
                    )}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                      <strong className="text-amber-400 block mb-1">Exercise Setup & Coaching Cues:</strong>
                      {plan.drill_setup_and_cues}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
