import React, { useState, useEffect, useMemo } from 'react';
import {
  MatchPatternSummary,
  TacticalPatternItem,
  OpponentWeaknessItem,
  AttackingOpportunityItem,
  CoachInsightItem,
  PatternComparisonData
} from '../../types/patterns';
import {
  fetchMatchPatternSummary,
  fetchPatternComparison,
  getCommercialBriefingHtmlUrl
} from '../../services/api';
import {
  Sparkles,
  ShieldAlert,
  Target,
  Zap,
  Printer,
  Compass,
  ArrowRight,
  Filter,
  Users,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  GitCompare,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

interface TacticalIntelligenceCentreProps {
  onJumpToSequence: (sequenceId: string, frame: number, highlightedPlayers?: string[]) => void;
}

export const TacticalIntelligenceCentre: React.FC<TacticalIntelligenceCentreProps> = ({
  onJumpToSequence,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<MatchPatternSummary | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'insights' | 'patterns' | 'weaknesses' | 'opportunities' | 'comparison'
  >('insights');

  // Filters
  const [selectedTeam, setSelectedTeam] = useState<'All' | 'Home' | 'Away'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Comparison State
  const [compareSeqA, setCompareSeqA] = useState<string>('seq_goal_1');
  const [compareSeqB, setCompareSeqB] = useState<string>('seq_buildup_break');
  const [comparisonData, setComparisonData] = useState<PatternComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    loadPatternData();
  }, []);

  const loadPatternData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMatchPatternSummary();
      setSummaryData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load tactical pattern intelligence');
    } finally {
      setLoading(false);
    }
  };

  // Load comparison data when switching to comparison tab or changing sequences
  useEffect(() => {
    if (activeTab === 'comparison') {
      loadComparison();
    }
  }, [activeTab, compareSeqA, compareSeqB]);

  const loadComparison = async () => {
    if (compareSeqA === compareSeqB) return;
    try {
      setLoadingComparison(true);
      const data = await fetchPatternComparison(compareSeqA, compareSeqB);
      setComparisonData(data);
    } catch (err: any) {
      console.error('Comparison load error:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  // Filtered Coach Insights
  const filteredInsights = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.coach_insights.filter((ins) => {
      const matchTeam = selectedTeam === 'All' || ins.team === selectedTeam;
      const matchCat = selectedCategory === 'All' || ins.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        ins.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.measured_observation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.coach_explanation.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTeam && matchCat && matchSearch;
    });
  }, [summaryData, selectedTeam, selectedCategory, searchQuery]);

  // Filtered Patterns
  const filteredPatterns = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.patterns.filter((p) => {
      const matchTeam = selectedTeam === 'All' || p.team === selectedTeam;
      const matchSearch =
        !searchQuery ||
        p.pattern_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tactical_summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [summaryData, selectedTeam, searchQuery]);

  // Filtered Weaknesses
  const filteredWeaknesses = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.weaknesses.filter((w) => {
      const matchTeam = selectedTeam === 'All' || w.target_team === selectedTeam;
      const matchSearch =
        !searchQuery ||
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tactical_implication.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [summaryData, selectedTeam, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin" />
        <div className="text-lg font-medium text-slate-200">Analyzing Match Tactical Patterns...</div>
        <div className="text-sm text-slate-400">
          Scanning Metrica tracking coordinates for overloads, pressing traps, and opponent vulnerabilities
        </div>
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="p-8 bg-red-950/30 border border-red-500/40 rounded-xl m-6 text-red-200 flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base mb-1">Pattern Intelligence Engine Error</h3>
          <p className="text-sm text-red-300 mb-4">{error || 'Unknown error occurred'}</p>
          <button
            onClick={loadPatternData}
            className="px-4 py-2 bg-red-800/80 hover:bg-red-700 rounded-lg text-sm font-medium transition"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                TACTICAL INTELLIGENCE CENTRE
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Commercial Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Automated pattern recognition, opponent vulnerability discovery, and coach-ready tactical game plans derived from 25 Hz tracking telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open(getCommercialBriefingHtmlUrl(), '_blank')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-900/30 transition border border-cyan-400/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF Briefing</span>
            </button>
            <button
              onClick={loadPatternData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh Analysis"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI Metric Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-tight">
                {summaryData.total_patterns_detected}
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Patterns Detected
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center space-x-3">
            <div className="p-2 rounded bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-tight">
                {summaryData.total_weaknesses_identified}
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Systemic Weaknesses
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center space-x-3">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-tight">
                {summaryData.total_opportunities_identified}
              </div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Attacking Exploits
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center space-x-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-tight">92.4%</div>
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Confidence Quality
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="flex border-b border-slate-800 mt-5 space-x-2 text-xs font-semibold">
          {[
            { id: 'insights', label: 'Coach Briefing & Action Plan', icon: Sparkles, count: summaryData.coach_insights.length },
            { id: 'patterns', label: 'Team Tactical Patterns', icon: Layers, count: summaryData.patterns.length },
            { id: 'weaknesses', label: 'Opponent Weaknesses', icon: ShieldAlert, count: summaryData.weaknesses.length },
            { id: 'opportunities', label: 'Attacking Exploits', icon: Target, count: summaryData.opportunities.length },
            { id: 'comparison', label: 'Cross-Sequence Comparison', icon: GitCompare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 transition -mb-px ${
                  isActive
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {/* Filter Controls (for lists) */}
        {activeTab !== 'comparison' && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1 text-slate-500" /> Filter:
              </span>
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-md border border-slate-800">
                {(['All', 'Home', 'Away'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTeam(t)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      selectedTeam === t
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tactical themes, players, or metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* TAB 1: COACH BRIEFING & INSIGHTS CARDS */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {filteredInsights.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                No tactical insights match the active filters.
              </div>
            ) : (
              filteredInsights.map((ins) => (
                <div
                  key={ins.insight_id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition shadow-lg"
                >
                  <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          ins.category === 'Opponent Weakness'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : ins.category === 'Attacking Opportunity'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        }`}
                      >
                        {ins.category}
                      </span>
                      <h3 className="text-sm font-bold text-white">{ins.headline}</h3>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {ins.timestamp_label}
                      </span>
                      <button
                        onClick={() =>
                          onJumpToSequence(ins.sequence_id, ins.frame_moment, ins.relevant_players)
                        }
                        className="flex items-center space-x-1.5 px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded text-xs font-semibold transition border border-cyan-500/40"
                      >
                        <span>Jump to Pitch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-3.5">
                    {/* Factual Observation */}
                    <div className="flex items-start space-x-2.5 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase text-[10px] mt-0.5 flex-shrink-0">
                        Evidence
                      </span>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                        {ins.measured_observation}
                      </p>
                    </div>

                    {/* Coach Explanation */}
                    <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center">
                        <Compass className="w-3.5 h-3.5 mr-1.5" /> Tactical Rationale
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {ins.coach_explanation}
                      </p>
                    </div>

                    {/* Actionable Recommendation */}
                    <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center">
                        <Zap className="w-3.5 h-3.5 mr-1.5" /> Coaching Action Plan
                      </div>
                      <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                        {ins.actionable_recommendation}
                      </p>
                    </div>

                    {/* Footer with Drill & Players */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-300">Recommended Exercise: </span>
                        <span className="italic text-cyan-300">{ins.training_drill}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-300">Involved: </span>
                        <span>{ins.relevant_players.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: TEAM TACTICAL PATTERNS */}
        {activeTab === 'patterns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatterns.map((p) => (
              <div
                key={p.pattern_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                      {p.pattern_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {p.timestamp_start_s}s – {p.timestamp_end_s}s ({p.duration_s}s)
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1.5">{p.pattern_name}</h4>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{p.tactical_summary}</p>

                  <div className="space-y-1 text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800 mb-3">
                    {p.supporting_observations.map((obs, i) => (
                      <div key={i} className="flex items-start">
                        <span className="text-cyan-500 mr-1.5">•</span>
                        <span>{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Zone: <span className="text-slate-200 font-medium">{p.spatial_zone}</span>
                  </div>
                  <button
                    onClick={() => onJumpToSequence(p.sequence_id, p.frame_start, p.relevant_players)}
                    className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <span>Inspect Frame</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: OPPONENT WEAKNESSES */}
        {activeTab === 'weaknesses' && (
          <div className="space-y-4">
            {filteredWeaknesses.map((w) => (
              <div
                key={w.weakness_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                        w.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {w.severity.toUpperCase()} SEVERITY
                    </span>
                    <h3 className="text-base font-bold text-white">{w.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Recurred in {w.supporting_sequences.length} sequences ({w.recurrence_count} instances)
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {w.tactical_implication}
                </p>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs mb-3.5">
                  <span className="font-semibold text-rose-400">Tactical Exploit Plan: </span>
                  <span className="text-slate-200">{w.actionable_exploit_plan}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center space-x-4">
                    <span>
                      Frequency: <strong className="text-white">{w.frequency_rate}%</strong>
                    </span>
                    <span>
                      Target Team: <strong className="text-cyan-400">{w.target_team}</strong>
                    </span>
                  </div>

                  {w.supporting_sequences.length > 0 && (
                    <button
                      onClick={() =>
                        onJumpToSequence(w.supporting_sequences[0], w.supporting_frames[0] || 0)
                      }
                      className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition"
                    >
                      <span>View Occurrence</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: ATTACKING OPPORTUNITIES */}
        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryData.opportunities.map((opp) => (
              <div
                key={opp.opportunity_id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                      {opp.exploit_potential} POTENTIAL
                    </span>
                    <span className="text-[11px] text-slate-400">Frame {opp.frame_moment}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1.5">{opp.title}</h4>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">{opp.coach_cue}</p>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 mb-3">
                    <div>
                      <strong className="text-slate-300">Spatial Target:</strong> {opp.spatial_target}
                    </div>
                    <div>
                      <strong className="text-slate-300">Drill:</strong> {opp.training_drill}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Team: <strong className="text-cyan-400">{opp.attacking_team}</strong>
                  </span>
                  <button
                    onClick={() => onJumpToSequence(opp.sequence_id, opp.frame_moment, opp.key_actors)}
                    className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <span>View Exploit</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: PATTERN COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compare:</span>
                <select
                  value={compareSeqA}
                  onChange={(e) => setCompareSeqA(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="seq_goal_1">Goal Sequence 1 (seq_goal_1)</option>
                  <option value="seq_pressing_turnover">Counter-Pressing (seq_pressing_turnover)</option>
                  <option value="seq_buildup_break">Build-up Block (seq_buildup_break)</option>
                  <option value="seq_transitional_counter">Transitional Counter (seq_transitional_counter)</option>
                </select>

                <span className="text-xs text-slate-500 font-bold">vs</span>

                <select
                  value={compareSeqB}
                  onChange={(e) => setCompareSeqB(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="seq_buildup_break">Build-up Block (seq_buildup_break)</option>
                  <option value="seq_goal_1">Goal Sequence 1 (seq_goal_1)</option>
                  <option value="seq_pressing_turnover">Counter-Pressing (seq_pressing_turnover)</option>
                  <option value="seq_transitional_counter">Transitional Counter (seq_transitional_counter)</option>
                </select>
              </div>

              {loadingComparison && (
                <div className="flex items-center space-x-2 text-xs text-cyan-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Cross-Sequence Differential...</span>
                </div>
              )}
            </div>

            {comparisonData && (
              <div className="space-y-6">
                {/* Differential Summary Callout */}
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200">
                  <div className="font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center">
                    <Info className="w-4 h-4 mr-1.5" /> Tactical Differential Summary
                  </div>
                  <p>{comparisonData.tactical_differential_summary}</p>
                </div>

                {/* Flank Distribution Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      {comparisonData.sequence_a.title} ({comparisonData.sequence_a.sequence_id})
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Left Flank Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_a.flank_distribution.left}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Central Channel Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_a.flank_distribution.central}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Right Flank Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_a.flank_distribution.right}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                      {comparisonData.sequence_b.title} ({comparisonData.sequence_b.sequence_id})
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Left Flank Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_b.flank_distribution.left}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Central Channel Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_b.flank_distribution.central}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Right Flank Patterns:</span>
                        <strong className="text-white">{comparisonData.sequence_b.flank_distribution.right}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pattern Delta Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                        <th className="p-3">Pattern Type</th>
                        <th className="p-3">{comparisonData.sequence_a.sequence_id} Count</th>
                        <th className="p-3">{comparisonData.sequence_b.sequence_id} Count</th>
                        <th className="p-3">Differential (Δ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {comparisonData.comparison_matrix.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-white">{row.type_display}</td>
                          <td className="p-3 text-slate-300">{row.sequence_a_count}</td>
                          <td className="p-3 text-slate-300">{row.sequence_b_count}</td>
                          <td
                            className={`p-3 font-bold ${
                              row.delta > 0
                                ? 'text-emerald-400'
                                : row.delta < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {row.delta > 0 ? `+${row.delta}` : row.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
