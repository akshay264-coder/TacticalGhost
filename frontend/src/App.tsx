import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SequenceMeta,
  TrackingFrame,
  PlayerPos,
  MatchEvent,
  SpaceCreationData,
  DefensiveFrameAnalysis,
  PressingFrameAnalysis,
  PassingOption,
  PassingSynergyNetwork,
  DecisionEvaluation,
  PitchControlSurface,
  VisualizationLayersConfig
} from './types/tactical';
import {
  fetchSequences,
  fetchSequenceTracking,
  fetchSpaceCreation,
  fetchDefensiveVulnerability,
  fetchPressingAnalysis,
  fetchPlayerInteractions,
  fetchDecisions,
  fetchPitchControlSurface
} from './services/api';
import { TacticalPitch } from './components/pitch/TacticalPitch';
import { PlaybackControls } from './components/controls/PlaybackControls';
import { VisualizationControlPanel } from './components/controls/VisualizationControlPanel';
import { SpaceCreationPanel } from './components/modules/SpaceCreationPanel';
import { DefensiveVulnerabilityPanel } from './components/modules/DefensiveVulnerabilityPanel';
import { PressingPanel } from './components/modules/PressingPanel';
import { PlayerInteractionsPanel } from './components/modules/PlayerInteractionsPanel';
import { TacticalDecisionsPanel } from './components/modules/TacticalDecisionsPanel';
import { PlayerInspectorModal } from './components/inspector/PlayerInspectorModal';
import { SequenceComparisonDashboard } from './components/comparison/SequenceComparisonDashboard';
import { TacticalIntelligenceCentre } from './components/patterns/TacticalIntelligenceCentre';
import { OpponentIntelligenceCentre } from './components/opponent/OpponentIntelligenceCentre';
import { PlayerScoutingCentre } from './components/scouting/PlayerScoutingCentre';
import { CoachDecisionCentre } from './components/coach/CoachDecisionCentre';
import { ReportingCentre } from './components/reporting/ReportingCentre';

import {
  Shield,
  Target,
  Share2,
  Shuffle,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  GitCompare,
  Compass,
  Users,
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Activity
} from 'lucide-react';
import { MainDashboard } from './components/dashboard/MainDashboard';

const defaultLayerConfig: VisualizationLayersConfig = {
  showPitchControl: true,
  pitchControlOpacity: 0.65,
  pitchControlMode: 'dual',
  showPlayerTrails: true,
  trailLength: 10,
  trailTarget: 'selected',
  showVelocityArrows: true,
  showAccelerationBadges: true,
  showPassingLanes: true,
  passingLaneFilter: 'all',
  showDefensiveBlock: true,
  defendingTeam: 'Away',
  showDefensiveLineHeight: true,
  showInterLineGaps: true,
  showCoverShadows: true,
  showPressingVectors: true,
  showTimeThresholds: true,
  showRuns: true,
  showVacatedSpace: true,
  showDecisions: true,
  showTacticalZones: true,
};

export default function App() {
  // Navigation mode: 'dashboard' vs 'single' pitch vs 'comparison' vs 'patterns' vs 'opponent' vs 'scouting' vs 'coach' vs 'reports'
  const [appMode, setAppMode] = useState<'dashboard' | 'single' | 'comparison' | 'patterns' | 'opponent' | 'scouting' | 'coach' | 'reports'>(() => {
    if (window.location.search.includes('mode=reports') || window.location.search.includes('mode=reporting')) return 'reports';
    if (window.location.search.includes('mode=coach')) return 'coach';
    if (window.location.search.includes('mode=scouting')) return 'scouting';
    if (window.location.search.includes('mode=opponent')) return 'opponent';
    if (window.location.search.includes('mode=comparison')) return 'comparison';
    if (window.location.search.includes('mode=patterns') || window.location.search.includes('mode=intelligence')) return 'patterns';
    if (window.location.search.includes('mode=single') || window.location.search.includes('mode=pitch')) return 'single';
    return 'dashboard';
  });

  // Sequences state
  const [sequences, setSequences] = useState<SequenceMeta[]>([]);
  const [currentSequence, setCurrentSequence] = useState<SequenceMeta | null>(null);

  // Tracking frames state
  const [trackingFrames, setTrackingFrames] = useState<TrackingFrame[]>([]);
  const [sequenceEvents, setSequenceEvents] = useState<MatchEvent[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Layer visualization configuration
  const [layersConfig, setLayersConfig] = useState<VisualizationLayersConfig>(defaultLayerConfig);

  // Active module tab
  const [activeTab, setActiveTab] = useState<
    'space_creation' | 'defensive_vulnerability' | 'pressing' | 'player_interactions' | 'tactical_decisions'
  >('space_creation');

  // Module data states
  const [spaceData, setSpaceData] = useState<SpaceCreationData | null>(null);
  const [defensiveAnalysis, setDefensiveAnalysis] = useState<DefensiveFrameAnalysis | null>(null);
  const [pressingAnalysis, setPressingAnalysis] = useState<PressingFrameAnalysis | null>(null);
  const [passingOptions, setPassingOptions] = useState<PassingOption[]>([]);
  const [passingNetwork, setPassingNetwork] = useState<PassingSynergyNetwork | null>(null);
  const [decisionsData, setDecisionsData] = useState<DecisionEvaluation[]>([]);
  const [pitchControlSurface, setPitchControlSurface] = useState<PitchControlSurface | null>(null);

  // Selected player inspector
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPos | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  const pitchControlCacheRef = useRef<Map<number, PitchControlSurface>>(new Map());

  // 1. Initial Load: Fetch list of sequences
  const loadInitialSequences = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchSequences()
      .then((seqs) => {
        setSequences(seqs);
        if (seqs.length > 0) {
          setCurrentSequence(seqs[0]);
          setLayersConfig(prev => ({ ...prev, defendingTeam: seqs[0].defending_team }));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching sequences:', err);
        setError('Failed to connect to TacticalGhost backend API. Please ensure the backend is running.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadInitialSequences();
  }, [loadInitialSequences]);

  // 2. Load sequence tracking and pre-fetch sequence-level analytics
  useEffect(() => {
    if (!currentSequence) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    pitchControlCacheRef.current.clear();
    setPitchControlSurface(null);
    setLayersConfig(prev => ({ ...prev, defendingTeam: currentSequence.defending_team }));

    Promise.all([
      fetchSequenceTracking(currentSequence.sequence_id),
      fetchSpaceCreation(currentSequence.sequence_id),
      fetchDecisions(currentSequence.sequence_id)
    ])
      .then(([trackRes, spaceRes, decisionsRes]) => {
        setTrackingFrames(trackRes.tracking.frames);
        setSequenceEvents((trackRes as any).tracking?.events || (trackRes as any).events || []);
        setSpaceData(spaceRes);
        setDecisionsData(decisionsRes.decision_evaluations);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading sequence data:', err);
        setError(`Failed to load tactical sequence "${currentSequence.title}".`);
        setLoading(false);
      });
  }, [currentSequence]);

  const currentFrame = trackingFrames[currentFrameIndex] || null;

  // History frames for player movement trails (past 20 frames)
  const historyFrames = useMemo(() => {
    if (!trackingFrames.length || currentFrameIndex <= 0) return [];
    const startIdx = Math.max(0, currentFrameIndex - (layersConfig.trailLength || 10));
    return trackingFrames.slice(startIdx, currentFrameIndex + 1);
  }, [trackingFrames, currentFrameIndex, layersConfig.trailLength]);

  // Compute active selected player updated with current frame's position and speed
  const activeSelectedPlayer = useMemo(() => {
    if (!selectedPlayer || !currentFrame) return selectedPlayer;
    const pool = selectedPlayer.team === 'Home' ? currentFrame.home_players : currentFrame.away_players;
    const found = pool.find(p => p.player_id === selectedPlayer.player_id);
    return found || selectedPlayer;
  }, [selectedPlayer, currentFrame]);

  // 3. Compute/Fetch frame-level analytics when current frame or defending team changes
  useEffect(() => {
    if (!currentSequence || !currentFrame) return;
    const fNum = currentFrame.frame;

    // Load defensive vulnerability for current frame with defending team override
    fetchDefensiveVulnerability(currentSequence.sequence_id, fNum, layersConfig.defendingTeam)
      .then(res => setDefensiveAnalysis(res.analysis))
      .catch(err => console.error('Defensive fetch error:', err));

    // Load pressing analysis for current frame
    fetchPressingAnalysis(currentSequence.sequence_id, fNum)
      .then(res => setPressingAnalysis(res))
      .catch(err => console.error('Pressing fetch error:', err));

    // Load player interactions for current frame
    fetchPlayerInteractions(currentSequence.sequence_id, fNum)
      .then(res => {
        setPassingOptions(res.passing_options);
        setPassingNetwork(res.passing_network);
      })
      .catch(err => console.error('Interactions fetch error:', err));

    // Pitch control grid surface with in-memory caching and playback throttling
    if (layersConfig.showPitchControl && currentFrame.home_players.length > 0 && currentFrame.away_players.length > 0) {
      if (pitchControlCacheRef.current.has(fNum)) {
        setPitchControlSurface(pitchControlCacheRef.current.get(fNum)!);
      } else if (!isPlaying || currentFrameIndex % 4 === 0) {
        fetchPitchControlSurface(currentFrame.home_players, currentFrame.away_players, 30, 20)
          .then(surface => {
            pitchControlCacheRef.current.set(fNum, surface);
            setPitchControlSurface(surface);
          })
          .catch(err => console.error('Pitch control surface error:', err));
      }
    }
  }, [currentSequence, currentFrameIndex, layersConfig.showPitchControl, layersConfig.defendingTeam, isPlaying]);

  // 4. Animation playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const intervalMs = (1000 / 25) / playbackSpeed;
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = now - lastTickRef.current;
      if (elapsed >= intervalMs) {
        lastTickRef.current = now;
        setCurrentFrameIndex((prev) => {
          if (prev >= trackingFrames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, trackingFrames.length]);

  // 5. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs/selects
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        setCurrentFrameIndex(prev => Math.max(0, prev - delta));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const delta = e.shiftKey ? 5 : 1;
        setCurrentFrameIndex(prev => Math.min(trackingFrames.length - 1, prev + delta));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];
        setPlaybackSpeed(prev => {
          const idx = speeds.indexOf(prev);
          return idx < speeds.length - 1 ? speeds[idx + 1] : speeds[speeds.length - 1];
        });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];
        setPlaybackSpeed(prev => {
          const idx = speeds.indexOf(prev);
          return idx > 0 ? speeds[idx - 1] : speeds[0];
        });
      } else if (e.key === '1') {
        setActiveTab('space_creation');
      } else if (e.key === '2') {
        setActiveTab('defensive_vulnerability');
      } else if (e.key === '3') {
        setActiveTab('pressing');
      } else if (e.key === '4') {
        setActiveTab('player_interactions');
      } else if (e.key === '5') {
        setActiveTab('tactical_decisions');
      } else if (e.key.toLowerCase() === 'h') {
        setLayersConfig(prev => ({ ...prev, showPitchControl: !prev.showPitchControl }));
      } else if (e.key.toLowerCase() === 'd') {
        setLayersConfig(prev => ({ ...prev, showDefensiveBlock: !prev.showDefensiveBlock }));
      } else if (e.key.toLowerCase() === 'p') {
        setLayersConfig(prev => ({ ...prev, showPassingLanes: !prev.showPassingLanes }));
      } else if (e.key.toLowerCase() === 'c') {
        setLayersConfig(prev => ({ ...prev, showCoverShadows: !prev.showCoverShadows }));
      } else if (e.key.toLowerCase() === 'r') {
        setLayersConfig(prev => ({ ...prev, showRuns: !prev.showRuns }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trackingFrames.length]);

  const handleJumpToDecisionFrame = useCallback((frameNum: number) => {
    const idx = trackingFrames.findIndex(f => f.frame === frameNum);
    if (idx !== -1) {
      setCurrentFrameIndex(idx);
      setActiveTab('tactical_decisions');
    }
  }, [trackingFrames]);

  const handleJumpToFrame = useCallback((frameNum: number) => {
    const idx = trackingFrames.findIndex(f => f.frame === frameNum);
    if (idx !== -1) {
      setCurrentFrameIndex(idx);
    }
  }, [trackingFrames]);

  // Handle jump from Pattern Intelligence Centre directly to Pitch at specific sequence and frame
  const handleJumpToSequence = useCallback((seqId: string, targetFrame: number, highlightedPlayers?: string[]) => {
    setIsPlaying(false);
    const targetSeq = sequences.find(s => s.sequence_id === seqId);
    if (targetSeq) {
      if (targetSeq.sequence_id !== currentSequence?.sequence_id) {
        setCurrentSequence(targetSeq);
      }
      const frameIdx = Math.max(0, targetFrame - targetSeq.start_frame);
      setCurrentFrameIndex(frameIdx);
    }
    if (highlightedPlayers && highlightedPlayers.length > 0) {
      const pId = highlightedPlayers[0];
      const matchP = currentFrame?.home_players.find(p => p.player_id === pId) ||
                     currentFrame?.away_players.find(p => p.player_id === pId);
      if (matchP) setSelectedPlayer(matchP);
    }
    setAppMode('single');
  }, [sequences, currentSequence, currentFrame]);

  // Find active decision evaluation at or near current frame
  const currentDecisionEval = decisionsData.find(d => Math.abs(d.decision_frame - (currentFrame?.frame || 0)) <= 3) || decisionsData[0] || null;

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#171717] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white/95 border-b border-[#E5E0D8] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur shadow-sm">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setAppMode('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-[#F28C28] flex items-center justify-center font-black text-white text-base shadow-sm">
              TG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg text-[#171717] tracking-tight">TacticalGhost</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FEF3E8] text-[#F28C28] border border-[#FCD8B3] flex items-center space-x-1">
                  <span>Portfolio Edition</span>
                </span>
              </div>
              <p className="text-[11px] text-[#525252] font-medium hidden sm:block">See the game beyond the ball.</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <nav className="flex items-center rounded-xl bg-[#FAF7F2] p-1 border border-[#E5E0D8] overflow-x-auto max-w-[calc(100vw-220px)] scrollbar-none">
            <button
              onClick={() => setAppMode('dashboard')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'dashboard'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${appMode === 'dashboard' ? 'text-[#F28C28]' : ''}`} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setAppMode('single')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'single'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${appMode === 'single' ? 'text-[#F28C28]' : ''}`} />
              <span>Match Pitch</span>
            </button>
            <button
              onClick={() => setAppMode('comparison')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'comparison'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <GitCompare className={`w-3.5 h-3.5 ${appMode === 'comparison' ? 'text-[#F28C28]' : ''}`} />
              <span>Comparison</span>
            </button>
            <button
              onClick={() => setAppMode('patterns')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'patterns'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${appMode === 'patterns' ? 'text-[#F28C28]' : ''}`} />
              <span>Patterns</span>
            </button>
            <button
              onClick={() => setAppMode('opponent')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'opponent'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${appMode === 'opponent' ? 'text-[#F28C28]' : ''}`} />
              <span>Opponent</span>
            </button>
            <button
              onClick={() => setAppMode('scouting')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'scouting'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${appMode === 'scouting' ? 'text-[#F28C28]' : ''}`} />
              <span>Scouting</span>
            </button>
            <button
              onClick={() => setAppMode('coach')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'coach'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <BrainCircuit className={`w-3.5 h-3.5 ${appMode === 'coach' ? 'text-[#F28C28]' : ''}`} />
              <span>Coach Decision</span>
            </button>
            <button
              onClick={() => setAppMode('reports')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                appMode === 'reports'
                  ? 'bg-white text-[#171717] shadow-sm border border-[#E5E0D8]'
                  : 'text-[#525252] hover:text-[#171717]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${appMode === 'reports' ? 'text-[#F28C28]' : ''}`} />
              <span>Reporting</span>
            </button>
          </nav>
        </div>

        {/* Live HUD Quick Indicators */}
        {currentFrame && (
          <div className="hidden xl:flex items-center space-x-4 text-xs font-mono bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#E5E0D8]">
            <div>
              <span className="text-[#525252] text-[9px] block uppercase font-sans">Pitch Control</span>
              <span className="text-blue-600 font-bold">{pitchControlSurface?.home_pitch_control_pct ?? 50}%</span>
              <span className="text-[#525252] mx-1">/</span>
              <span className="text-red-600 font-bold">{pitchControlSurface?.away_pitch_control_pct ?? 50}%</span>
            </div>
            <div className="h-4 w-px bg-[#E5E0D8]" />
            <div>
              <span className="text-[#525252] text-[9px] block uppercase font-sans">Defending</span>
              <span className={`font-bold ${layersConfig.defendingTeam === 'Home' ? 'text-blue-600' : 'text-red-600'}`}>
                {layersConfig.defendingTeam}
              </span>
            </div>
            <div className="h-4 w-px bg-[#E5E0D8]" />
            <div>
              <span className="text-[#525252] text-[9px] block uppercase font-sans">Carrier Pressure</span>
              <span className={`font-bold ${
                (pressingAnalysis?.pressure.total_pressure_score ?? 0) > 0.6 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {Math.round((pressingAnalysis?.pressure.total_pressure_score ?? 0) * 100)}%
              </span>
            </div>
            <div className="h-4 w-px bg-[#E5E0D8]" />
            <div>
              <span className="text-[#525252] text-[9px] block uppercase font-sans">Line Height</span>
              <span className="text-[#F28C28] font-bold">{defensiveAnalysis?.defensive_line_height_m ?? 0}m</span>
            </div>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadInitialSequences}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-medium transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto relative">
        {appMode === 'dashboard' ? (
          <MainDashboard onNavigate={setAppMode} sequencesCount={sequences.length} />
        ) : appMode === 'reports' ? (
          <ReportingCentre />
        ) : appMode === 'coach' ? (
          <CoachDecisionCentre />
        ) : appMode === 'scouting' ? (
          <PlayerScoutingCentre />
        ) : appMode === 'opponent' ? (
          <OpponentIntelligenceCentre
            onJumpToSequence={handleJumpToSequence}
          />
        ) : appMode === 'patterns' ? (
          <TacticalIntelligenceCentre
            onJumpToSequence={handleJumpToSequence}
          />
        ) : appMode === 'comparison' ? (
          <SequenceComparisonDashboard
            sequences={sequences}
            defaultLayersConfig={layersConfig}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3 rounded-2xl">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">Synchronizing match tracking & tactical models...</p>
              </div>
            )}

            {/* Left Column: Interactive Pitch, Visualization Layers, and Playback Controls (7 or 8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
              {/* Tactical Pitch Visualizer Container */}
              <div className="relative">
                <TacticalPitch
                  frame={currentFrame}
                  historyFrames={historyFrames}
                  activeRuns={spaceData?.runs || []}
                  coverShadows={pressingAnalysis?.cover_shadows || []}
                  pressingAnalysis={pressingAnalysis}
                  passingOptions={passingOptions}
                  decisionAlternatives={currentDecisionEval?.evaluation.alternatives || []}
                  vulnerabilities={defensiveAnalysis?.vulnerabilities || []}
                  defensiveAnalysis={defensiveAnalysis}
                  pitchControl={layersConfig.showPitchControl ? pitchControlSurface : null}
                  selectedPlayerId={selectedPlayer?.player_id || null}
                  onSelectPlayer={(p) => setSelectedPlayer(p)}
                  config={layersConfig}
                />

                {/* Selected Player Floating Inspector */}
                <PlayerInspectorModal
                  player={activeSelectedPlayer}
                  ballPos={{ x: currentFrame?.ball.x ?? null, y: currentFrame?.ball.y ?? null }}
                  onClose={() => setSelectedPlayer(null)}
                />
              </div>

              {/* Interactive Visualization Layer Control Panel */}
              <VisualizationControlPanel
                config={layersConfig}
                onChangeConfig={(newCfg) => setLayersConfig(prev => ({ ...prev, ...newCfg }))}
                onResetDefaults={() => setLayersConfig(defaultLayerConfig)}
              />

              {/* Advanced Playback & Scrubber Controls */}
              <PlaybackControls
                sequences={sequences}
                currentSequence={currentSequence}
                onSelectSequence={(seq) => setCurrentSequence(seq)}
                currentFrameIndex={currentFrameIndex}
                totalFrames={trackingFrames.length}
                currentFrameData={currentFrame}
                events={sequenceEvents}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onSeek={(idx) => setCurrentFrameIndex(idx)}
                onJumpToFrame={handleJumpToFrame}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
                onJumpToDecisionFrame={handleJumpToDecisionFrame}
              />
            </div>

            {/* Right Column: Tactical Intelligence Dock (5 Core Modules) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3 bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-sm text-[#171717]">
              {/* Module Selection Navigation Tabs */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#E5E0D8] text-xs font-medium">
                <button
                  onClick={() => setActiveTab('space_creation')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'space_creation'
                      ? 'bg-white text-[#171717] border border-[#E5E0D8] shadow-sm font-bold'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                  title="Space Creation Intelligence (Key 1)"
                >
                  <Sparkles className={`w-4 h-4 ${activeTab === 'space_creation' ? 'text-[#F28C28]' : ''}`} />
                  <span className="text-[10px] tracking-tight">Space</span>
                </button>
                <button
                  onClick={() => setActiveTab('defensive_vulnerability')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'defensive_vulnerability'
                      ? 'bg-white text-[#171717] border border-[#E5E0D8] shadow-sm font-bold'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                  title="Defensive Vulnerability Detection (Key 2)"
                >
                  <Shield className={`w-4 h-4 ${activeTab === 'defensive_vulnerability' ? 'text-[#F28C28]' : ''}`} />
                  <span className="text-[10px] tracking-tight">Defense</span>
                </button>
                <button
                  onClick={() => setActiveTab('pressing')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'pressing'
                      ? 'bg-white text-[#171717] border border-[#E5E0D8] shadow-sm font-bold'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                  title="Pressing Intelligence (Key 3)"
                >
                  <Target className={`w-4 h-4 ${activeTab === 'pressing' ? 'text-[#F28C28]' : ''}`} />
                  <span className="text-[10px] tracking-tight">Pressing</span>
                </button>
                <button
                  onClick={() => setActiveTab('player_interactions')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'player_interactions'
                      ? 'bg-white text-[#171717] border border-[#E5E0D8] shadow-sm font-bold'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                  title="Player Interaction Analysis (Key 4)"
                >
                  <Share2 className={`w-4 h-4 ${activeTab === 'player_interactions' ? 'text-[#F28C28]' : ''}`} />
                  <span className="text-[10px] tracking-tight">Lanes</span>
                </button>
                <button
                  onClick={() => setActiveTab('tactical_decisions')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'tactical_decisions'
                      ? 'bg-white text-[#171717] border border-[#E5E0D8] shadow-sm font-bold'
                      : 'text-[#525252] hover:text-[#171717]'
                  }`}
                  title="Tactical Decision Intelligence (Key 5)"
                >
                  <Shuffle className={`w-4 h-4 ${activeTab === 'tactical_decisions' ? 'text-[#F28C28]' : ''}`} />
                  <span className="text-[10px] tracking-tight">Decisions</span>
                </button>
              </div>

              {/* Module Tab Header */}
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2 pt-1">
                <h3 className="font-bold text-sm text-[#171717] flex items-center space-x-2">
                  {activeTab === 'space_creation' && <span>Module 1: Space Creation Intelligence</span>}
                  {activeTab === 'defensive_vulnerability' && <span>Module 2: Defensive Vulnerability Detection</span>}
                  {activeTab === 'pressing' && <span>Module 3: Pressing Intelligence</span>}
                  {activeTab === 'player_interactions' && <span>Module 4: Player Interaction Analysis</span>}
                  {activeTab === 'tactical_decisions' && <span>Module 5: Tactical Decision Intelligence</span>}
                </h3>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1">
                {activeTab === 'space_creation' && (
                  <SpaceCreationPanel
                    data={spaceData}
                    currentFrame={currentFrame?.frame ?? 0}
                    onSelectRun={(run) => {
                      const idx = trackingFrames.findIndex(f => f.frame === run.start_frame);
                      if (idx !== -1) setCurrentFrameIndex(idx);
                    }}
                  />
                )}

                {activeTab === 'defensive_vulnerability' && (
                  <DefensiveVulnerabilityPanel analysis={defensiveAnalysis} />
                )}

                {activeTab === 'pressing' && (
                  <PressingPanel analysis={pressingAnalysis} />
                )}

                {activeTab === 'player_interactions' && (
                  <PlayerInteractionsPanel
                    carrier={pressingAnalysis?.ball_carrier ? {
                      player_id: pressingAnalysis.ball_carrier.player_id,
                      jersey_number: pressingAnalysis.ball_carrier.jersey_number
                    } : null}
                    passingOptions={passingOptions}
                    network={passingNetwork}
                  />
                )}

                {activeTab === 'tactical_decisions' && (
                  <TacticalDecisionsPanel
                    evaluation={currentDecisionEval}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
