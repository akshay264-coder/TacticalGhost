import React, { useState, useEffect } from 'react';
import {
  PlayerScoutingProfile,
  OffBallContribution,
  RoleClassificationResult,
  PlayerComparisonResult,
  PlayerTacticalFitResult,
  ShortlistCandidate,
  ShortlistDossierExport
} from '../../types/scouting';
import {
  fetchScoutedPlayers,
  fetchPlayerProfile,
  fetchPlayerOffBall,
  fetchPlayerRole,
  comparePlayersApi,
  evaluateTacticalFitApi,
  fetchShortlist,
  addToShortlistApi,
  updateShortlistNotesApi,
  removeFromShortlistApi,
  exportShortlistApi
} from '../../services/scoutingApi';
import {
  Users,
  Search,
  Sparkles,
  Award,
  Layers,
  ArrowRightLeft,
  Sliders,
  Bookmark,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap,
  Target,
  ExternalLink,
  Download,
  Trash2,
  PlusCircle,
  Eye
} from 'lucide-react';

export const PlayerScoutingCentre: React.FC = () => {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<
    'overview' | 'profile' | 'off_ball' | 'role' | 'comparison' | 'tactical_fit' | 'shortlist' | 'report'
  >('overview');

  // Core data states
  const [players, setPlayers] = useState<PlayerScoutingProfile[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('Home_10');
  const [selectedProfile, setSelectedProfile] = useState<PlayerScoutingProfile | null>(null);
  const [offBallRuns, setOffBallRuns] = useState<OffBallContribution[]>([]);
  const [roleClassification, setRoleClassification] = useState<RoleClassificationResult | null>(null);
  
  // Comparison state
  const [comparePlayerA, setComparePlayerA] = useState<string>('Home_10');
  const [comparePlayerB, setComparePlayerB] = useState<string>('Away_24');
  const [comparisonResult, setComparisonResult] = useState<PlayerComparisonResult | null>(null);
  
  // Tactical Fit state
  const [targetPhilosophy, setTargetPhilosophy] = useState<string>('POSSESSION_BUILDUP');
  const [fitResult, setFitResult] = useState<PlayerTacticalFitResult | null>(null);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  
  // Shortlist state
  const [shortlist, setShortlist] = useState<ShortlistCandidate[]>([]);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  
  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load initial players list and shortlist
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [loadedPlayers, loadedShortlist] = await Promise.all([
          fetchScoutedPlayers(),
          fetchShortlist()
        ]);
        setPlayers(loadedPlayers);
        setShortlist(loadedShortlist);
        if (loadedPlayers.length > 0) {
          const initialId = loadedPlayers[0].identity.player_id;
          setSelectedPlayerId(initialId);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to initialize scouting engine');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Fetch detailed data when selected player changes
  useEffect(() => {
    if (!selectedPlayerId) return;
    async function loadPlayerDetails() {
      try {
        const [prof, offBall, role, fit] = await Promise.all([
          fetchPlayerProfile(selectedPlayerId),
          fetchPlayerOffBall(selectedPlayerId),
          fetchPlayerRole(selectedPlayerId),
          evaluateTacticalFitApi(selectedPlayerId, targetPhilosophy)
        ]);
        setSelectedProfile(prof);
        setOffBallRuns(offBall);
        setRoleClassification(role);
        setFitResult(fit);
      } catch (err: any) {
        console.error('Error loading player details:', err);
      }
    }
    loadPlayerDetails();
  }, [selectedPlayerId, targetPhilosophy]);

  // Execute Comparison
  const handleRunComparison = async () => {
    try {
      const res = await comparePlayersApi(comparePlayerA, comparePlayerB, true);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison error: ${err.message}`);
    }
  };

  // Add selected player to Shortlist
  const handleAddCurrentToShortlist = async () => {
    if (!selectedProfile) return;
    try {
      const added = await addToShortlistApi(
        selectedProfile.identity.player_id,
        `Identified prospect from ${selectedProfile.identity.team} squad.`,
        ['Scouted Prospect', selectedProfile.primary_role],
        targetPhilosophy,
        fitResult?.overall_fit_score || 85.0
      );
      setShortlist(prev => [...prev.filter(c => c.player_id !== added.player_id), added]);
      alert(`Added ${added.player_id} to recruitment shortlist!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Remove from Shortlist
  const handleRemoveShortlist = async (playerId: string) => {
    try {
      await removeFromShortlistApi(playerId);
      setShortlist(prev => prev.filter(c => c.player_id !== playerId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save updated notes
  const handleSaveNotes = async (playerId: string) => {
    try {
      const updated = await updateShortlistNotesApi(playerId, noteText);
      setShortlist(prev => prev.map(c => (c.player_id === playerId ? updated : c)));
      setEditingNotesId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export Shortlist JSON
  const handleExportShortlist = async () => {
    try {
      const data = await exportShortlistApi();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TacticalGhost_Shortlist_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered players for discovery
  const filteredPlayers = players.filter(p => {
    const matchesTeam = teamFilter === 'ALL' || p.identity.team.toUpperCase() === teamFilter.toUpperCase();
    const matchesRole = roleFilter === 'ALL' || p.primary_role.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesSearch =
      searchQuery === '' ||
      p.identity.player_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primary_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hybrid_classification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 text-[#171717]">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FEF3E8] text-[#F28C28] border border-[#FCD8B3]">
                Phase 18 Intelligence
              </span>
              <span className="text-xs text-[#525252]">
                Official Metrica Telemetry • 25 Hz Optical Tracking
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#171717] flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-[#F28C28]" />
              <span>PLAYER SCOUTING & RECRUITMENT CENTRE</span>
            </h1>
            <p className="text-xs text-[#525252] mt-1">
              See the player beyond the ball: Discover off-ball space creators, decoy runners, and role-adjusted tactical fits.
            </p>
          </div>

          {/* Quick Stats / Shortlist count */}
          <div className="flex items-center space-x-4 bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl px-4 py-2.5">
            <div>
              <div className="text-[10px] uppercase font-bold text-[#525252]">Profiled Roster</div>
              <div className="text-lg font-black text-[#171717] font-mono">{players.length} Players</div>
            </div>
            <div className="h-8 w-px bg-[#E5E0D8]" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#F28C28]">Saved Shortlist</div>
              <div className="text-lg font-black text-[#F28C28] font-mono">{shortlist.length} Targets</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-[#E5E0D8] text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview & Discovery', icon: Users },
            { id: 'profile', label: 'Tactical Profile & DNA', icon: Layers },
            { id: 'off_ball', label: 'Off-Ball Intelligence', icon: Sparkles },
            { id: 'role', label: 'Role Classification', icon: Award },
            { id: 'comparison', label: 'Player Comparison', icon: ArrowRightLeft },
            { id: 'tactical_fit', label: 'Tactical Fit & Sensitivity', icon: Sliders },
            { id: 'shortlist', label: `Recruitment Shortlist (${shortlist.length})`, icon: Bookmark },
            { id: 'report', label: 'Scouting Dossier & Export', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all ${
                  active
                    ? 'bg-[#F28C28] text-white shadow-sm font-bold'
                    : 'bg-[#FAF7F2] text-[#525252] hover:text-[#171717] hover:bg-white border border-[#E5E0D8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: OVERVIEW & DISCOVERY */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search player, role, tag..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Team Filter */}
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {['ALL', 'Home', 'Away'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTeamFilter(t)}
                    className={`px-2.5 py-1 rounded font-bold ${
                      teamFilter === t ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Displaying {filteredPlayers.length} verified candidate profiles
            </div>
          </div>

          {/* Player Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPlayers.map(p => {
              const isSelected = selectedPlayerId === p.identity.player_id;
              const isShortlisted = shortlist.some(c => c.player_id === p.identity.player_id);

              return (
                <div
                  key={p.identity.player_id}
                  onClick={() => setSelectedPlayerId(p.identity.player_id)}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        #{p.identity.jersey_number} • {p.identity.team}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {p.data_quality.overall_quality_score}% Quality
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-100 mb-0.5">{p.identity.player_id}</h3>
                    <div className="text-xs font-semibold text-cyan-400 mb-2">{p.primary_role}</div>
                    <div className="text-[11px] text-slate-400 mb-4 line-clamp-1">{p.hybrid_classification}</div>

                    {/* Key Attributes */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 mb-3 font-mono">
                      <div>
                        Top Speed: <span className="font-bold text-slate-200">{p.tactical_profile.pressing.peak_closing_velocity_mps} m/s</span>
                      </div>
                      <div>
                        Space Rating: <span className="font-bold text-cyan-300">{p.tactical_profile.attacking.space_creation_rating}/100</span>
                      </div>
                      <div>
                        Progression: <span className="font-bold text-slate-200">{p.tactical_profile.attacking.forward_progression_m}m</span>
                      </div>
                      <div>
                        Pressing: <span className="font-bold text-amber-300">{p.tactical_profile.pressing.pressing_engagement_pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <span className="text-[9px] text-slate-500 font-mono">
                      {p.identity.identity_confidence_tier}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPlayerId(p.identity.player_id);
                        setSubTab('profile');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900"
                    >
                      Inspect Profile →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TACTICAL PROFILE & DNA */}
      {subTab === 'profile' && selectedProfile && (
        <div className="space-y-6">
          {/* Player Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                  #{selectedProfile.identity.jersey_number} • {selectedProfile.identity.team}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                  {selectedProfile.identity.identity_confidence_tier}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{selectedProfile.identity.player_id}</h2>
              <div className="text-xs text-cyan-400 font-semibold">{selectedProfile.hybrid_classification}</div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddCurrentToShortlist}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center space-x-1"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to Shortlist</span>
              </button>
            </div>
          </div>

          {/* 4 Contribution Domains */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attacking Contribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Attacking Contribution</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Forward Progression:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.attacking.forward_progression_m}m</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Space Creation Rating:</span>
                    <span className="font-bold font-mono text-cyan-400">{selectedProfile.tactical_profile.attacking.space_creation_rating}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Half-Space Occupation:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.attacking.half_space_occupation_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Runs Behind Defense:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.attacking.runs_behind_line_count}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Defensive Contribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Defensive Contribution</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Space Protection:</span>
                    <span className="font-bold font-mono text-emerald-400">{selectedProfile.tactical_profile.defensive.space_protection_rating}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Recovery Velocity:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.defensive.recovery_velocity_mps} m/s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Compactness Impact:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.defensive.compactness_contribution_m2} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interceptions:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.defensive.interception_opportunities}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pressing Contribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Pressing Contribution</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Pressing Engagement:</span>
                    <span className="font-bold font-mono text-amber-400">{selectedProfile.tactical_profile.pressing.pressing_engagement_pct}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Peak Closing Velocity:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.pressing.peak_closing_velocity_mps} m/s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Time-To-Intercept:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.pressing.mean_time_to_intercept_s}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pressing Traps:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.pressing.pressing_trap_participations}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transition Contribution */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Transition Contribution</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Counterattack Release:</span>
                    <span className="font-bold font-mono text-purple-400">{selectedProfile.tactical_profile.transition.counterattack_release_speed_mps} m/s</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Rest Defense Index:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.transition.defensive_rest_structure_index}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Turnover Recovery:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.transition.post_turnover_recovery_speed_mps} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transition Runs:</span>
                    <span className="font-bold font-mono text-slate-200">{selectedProfile.tactical_profile.transition.forward_transition_support_runs}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Vulnerabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Observed Tactical Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                {selectedProfile.tactical_profile.tactical_strengths.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Potential Tactical Vulnerabilities</span>
              </h3>
              <ul className="space-y-2 text-xs text-rose-300/90 list-disc list-inside">
                {selectedProfile.tactical_profile.potential_vulnerabilities.map((v, idx) => (
                  <li key={idx} className="leading-relaxed">{v}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: OFF-BALL INTELLIGENCE */}
      {subTab === 'off_ball' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span>Verified Off-Ball Tactical Contributions — {selectedPlayerId}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tactical movements without direct ball touches: decoy sprints, marker displacement, and space creation.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {offBallRuns.length} Verified Actions
              </span>
            </div>

            {offBallRuns.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No off-ball contributions verified for this candidate in the current sequence window.
              </div>
            ) : (
              <div className="space-y-4">
                {offBallRuns.map(run => (
                  <div key={run.contribution_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {run.movement_type}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Sequence: {run.sequence_id} (Frames {run.frame_start} - {run.frame_end})
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-emerald-400 font-bold">+{run.space_created_m2} m² Space</span>
                        <span className="text-cyan-400 font-bold">+{run.pitch_control_delta_pct}% Control</span>
                        <span className="text-slate-300">{run.peak_speed_mps} m/s Peak</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {run.tactical_interpretation}
                    </p>

                    {run.displaced_defenders.length > 0 && (
                      <div className="text-[11px] text-slate-400 mb-3">
                        <span className="text-rose-400 font-semibold">Displaced Opponents:</span>{' '}
                        {run.displaced_defenders.join(', ')} (dragged by {run.defensive_line_displacement_m}m)
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
                      <strong>Coaching Cue:</strong> {run.coaching_cue}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ROLE CLASSIFICATION */}
      {subTab === 'role' && roleClassification && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  9-Archetype Spatial & Kinematic Classifier
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span>{roleClassification.primary_role}</span>
                  <span className="text-sm font-medium text-slate-400">
                    ({roleClassification.role_confidence}% Confidence)
                  </span>
                </h3>
                <div className="text-xs text-cyan-400 font-medium mt-1">
                  Hybrid Classification: <strong>{roleClassification.hybrid_classification}</strong>
                </div>
              </div>

              <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Operating Zone</span>
                <span className="font-bold text-slate-200">{roleClassification.positional_zone}</span>
              </div>
            </div>

            {/* Explainable Rationale */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Classification Rationale (Why this role was assigned)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {roleClassification.explainable_rationale.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Archetype Affinity Breakdown */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Multi-Archetype Fit Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(roleClassification.archetype_fit_scores)
                .sort((a, b) => b[1] - a[1])
                .map(([arch, score]) => (
                  <div key={arch} className="flex items-center space-x-3 text-xs">
                    <span className="w-40 font-semibold text-slate-300 truncate">{arch}</span>
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          score >= 80 ? 'bg-cyan-400' : score >= 60 ? 'bg-cyan-700' : 'bg-slate-700'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono font-bold text-slate-300">{score}%</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PLAYER COMPARISON */}
      {subTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              <span>Pairwise Role-Adjusted Player Comparison</span>
            </h3>

            {/* Selector Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Player A</label>
                <select
                  value={comparePlayerA}
                  onChange={e => setComparePlayerA(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {players.map(p => (
                    <option key={p.identity.player_id} value={p.identity.player_id}>
                      {p.identity.player_id} ({p.primary_role} - {p.identity.team})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Player B</label>
                <select
                  value={comparePlayerB}
                  onChange={e => setComparePlayerB(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {players.map(p => (
                    <option key={p.identity.player_id} value={p.identity.player_id}>
                      {p.identity.player_id} ({p.primary_role} - {p.identity.team})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRunComparison}
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center justify-center space-x-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Comparison</span>
                </button>
              </div>
            </div>

            {/* Comparison Results */}
            {comparisonResult && (
              <div className="space-y-6">
                {/* Warnings banner if role mismatch */}
                {comparisonResult.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 flex items-center space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{w.message}</span>
                  </div>
                ))}

                {/* Verdict Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <strong className="text-cyan-400 block mb-1">Comparison Verdict:</strong>
                  <p className="text-slate-300">{comparisonResult.overall_comparison_verdict}</p>
                </div>

                {/* Metric Delta Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                        <th className="py-2.5 px-3">Dimension</th>
                        <th className="py-2.5 px-3 font-mono">{comparePlayerA}</th>
                        <th className="py-2.5 px-3 font-mono">{comparePlayerB}</th>
                        <th className="py-2.5 px-3">Advantage</th>
                        <th className="py-2.5 px-3">Tactical Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResult.metric_deltas.map((d, idx) => (
                        <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                          <td className="py-2 px-3 font-bold text-slate-200">{d.dimension}</td>
                          <td className="py-2 px-3 font-mono text-slate-300">
                            {d.player_a_value} {d.unit}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">
                            {d.player_b_value} {d.unit}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.favored_player === comparePlayerA
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {d.favored_player} ({d.delta_value > 0 ? `+${d.delta_value}` : d.delta_value})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">{d.tactical_interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: TACTICAL FIT & SENSITIVITY */}
      {subTab === 'tactical_fit' && fitResult && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Tactical Philosophy Alignment
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>{fitResult.tactical_philosophy_name}</span>
                </h3>
                <div className="text-xs text-slate-400 mt-1">Candidate: {fitResult.player_id} ({fitResult.player_role})</div>
              </div>

              {/* Philosophy selector */}
              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                {[
                  { key: 'HIGH_PRESS_HIGH_LINE', label: 'High Press' },
                  { key: 'POSSESSION_BUILDUP', label: 'Possession' },
                  { key: 'DIRECT_COUNTERATTACK', label: 'Counterattack' },
                  { key: 'COMPACT_LOW_BLOCK', label: 'Low Block' }
                ].map(p => (
                  <button
                    key={p.key}
                    onClick={() => setTargetPhilosophy(p.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      targetPhilosophy === p.key
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Score Banner */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Calculated System Fit Score</div>
                <div className="text-3xl font-black font-mono text-cyan-400">
                  {fitResult.overall_fit_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{fitResult.executive_summary}</p>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {fitResult.confidence_tier} Confidence
                </span>
              </div>
            </div>

            {/* Requirements Breakdown */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Requirement Compatibility Breakdown
            </h4>
            <div className="space-y-3 mb-6">
              {fitResult.requirement_breakdown.map((r, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-slate-200">{r.requirement_name}</span>
                    <span className="font-mono text-xs font-bold text-cyan-400">{r.compatibility_pct}% Compatibility</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        r.compatibility_pct >= 80 ? 'bg-cyan-400' : r.compatibility_pct >= 60 ? 'bg-cyan-600' : 'bg-rose-500'
                      }`}
                      style={{ width: `${r.compatibility_pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>{r.supporting_evidence}</span>
                    <span className="font-mono text-slate-500">Weight: {r.weight_applied}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sensitivity Shifts */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Priority Sensitivity Analysis (How weight changes alter fit)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fitResult.sensitivity_analysis.map((s, idx) => (
                <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-300">{s.tested_priority}</span>
                    <span className={`font-mono font-bold ${s.score_delta >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {s.score_delta > 0 ? `+${s.score_delta}` : s.score_delta} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{s.tactical_rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: RECRUITMENT SHORTLIST */}
      {subTab === 'shortlist' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-cyan-400" />
                  <span>Recruitment Candidate Shortlist</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saved prospect dossiers with qualitative scouting observations and target philosophies.
                </p>
              </div>

              <button
                onClick={handleExportShortlist}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Shortlist JSON</span>
              </button>
            </div>

            {shortlist.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No candidates saved to shortlist yet. Browse players in Overview to shortlist targets.
              </div>
            ) : (
              <div className="space-y-4">
                {shortlist.map(c => (
                  <div key={c.player_id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-base font-bold text-slate-100">{c.player_id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            #{c.jersey_number} • {c.team}
                          </span>
                          <span className="text-xs text-cyan-400 font-semibold">{c.primary_role}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{c.hybrid_classification}</div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {c.fit_score}/100 Fit
                        </span>
                        <button
                          onClick={() => handleRemoveShortlist(c.player_id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                          title="Remove from Shortlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Scouting Notes Box */}
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 mb-3 text-xs">
                      {editingNotesId === c.player_id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveNotes(c.player_id)}
                              className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs"
                            >
                              Save Notes
                            </button>
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <p className="text-slate-300 leading-relaxed">{c.scouting_notes}</p>
                          <button
                            onClick={() => {
                              setEditingNotesId(c.player_id);
                              setNoteText(c.scouting_notes);
                            }}
                            className="text-[10px] text-cyan-400 hover:underline ml-4 flex-shrink-0"
                          >
                            Edit Notes
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {c.tags.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 8: SCOUTING DOSSIER & EXPORT */}
      {subTab === 'report' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>Comprehensive Scouting Dossier (18 Sections)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Print-ready analytical report covering kinematic benchmarks, off-ball evidence, and recruitment suitability.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`/api/scouting/reports/${selectedPlayerId}/html`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center space-x-1.5 shadow-md shadow-cyan-500/10"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Standalone HTML Dossier</span>
                </a>
              </div>
            </div>

            {/* In-App Report Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-xs space-y-4 font-mono">
              <div className="text-cyan-400 font-bold text-sm">
                TACTICALGHOST SCOUTING DOSSIER PREVIEW — {selectedPlayerId}
              </div>
              <div className="text-slate-400">
                1. Player Identity: {selectedProfile?.identity.player_id} ({selectedProfile?.primary_role})<br />
                2. Identity Confidence: {selectedProfile?.identity.identity_confidence_tier}<br />
                3. Data Quality: {selectedProfile?.data_quality.overall_quality_score}% verified tracking completeness<br />
                4. Role Classification: {selectedProfile?.primary_role} ({selectedProfile?.role_confidence}% confidence)<br />
                5. Attacking Contribution: {selectedProfile?.tactical_profile.attacking.forward_progression_m}m progression, {selectedProfile?.tactical_profile.attacking.space_creation_rating}/100 space creation<br />
                6. Defensive Contribution: {selectedProfile?.tactical_profile.defensive.space_protection_rating}/100 space protection<br />
                7. Pressing Contribution: {selectedProfile?.tactical_profile.pressing.peak_closing_velocity_mps} m/s peak closing speed<br />
                8. Transition Contribution: {selectedProfile?.tactical_profile.transition.counterattack_release_speed_mps} m/s release velocity<br />
                9. Off-Ball Intelligence: {offBallRuns.length} verified off-ball contributions with established tactical payoffs<br />
                10. Movement Profile: 25 Hz spatiotemporal trajectory reconstruction<br />
                11. Tactical Strengths: {selectedProfile?.tactical_profile.tactical_strengths.join('; ')}<br />
                12. Tactical Limitations: {selectedProfile?.tactical_profile.potential_vulnerabilities.join('; ')}<br />
                13. Tactical Fit: {fitResult?.overall_fit_score}/100 in {fitResult?.tactical_philosophy_name}<br />
                14. Player Comparisons: Evaluated against standard {selectedProfile?.primary_role} norms<br />
                15. Supporting Match Sequences: Metrica Game 1 & Game 2 ground truth<br />
                16. Recruitment Considerations: {fitResult?.coaching_takeaway}<br />
                17. Methodology: Spearman (2018) Pitch Control & Marker Displacement<br />
                18. Limitations: Anonymized optical tracking; physical conditioning assumed consistent.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
