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

import {
  Shield,
  Target,
  Share2,
  Shuffle,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  GitCompare
} from 'lucide-react';

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
  // Navigation mode: 'single' sequence analysis vs 'comparison' engine vs 'patterns' intelligence centre
  const [appMode, setAppMode] = useState<'single' | 'comparison' | 'patterns'>(() => {
    if (window.location.search.includes('mode=comparison')) return 'comparison';
    if (window.location.search.includes('mode=patterns') || window.location.search.includes('mode=intelligence')) return 'patterns';
    return 'single';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20">
              TG
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">TacticalGhost</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>v1.6 Commercial Pattern Engine</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">See the game beyond the ball.</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="hidden sm:flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setAppMode('single')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                appMode === 'single'
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Sequence
            </button>
            <button
              onClick={() => setAppMode('comparison')}
              className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                appMode === 'comparison'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Comparison Engine</span>
            </button>
            <button
              onClick={() => setAppMode('patterns')}
              className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center space-x-1.5 ${
                appMode === 'patterns'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Intelligence Centre</span>
            </button>
          </div>
        </div>

        {/* Live HUD Quick Indicators */}
        {currentFrame && (
          <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Pitch Control</span>
              <span className="text-blue-400 font-bold">{pitchControlSurface?.home_pitch_control_pct ?? 50}%</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-red-400 font-bold">{pitchControlSurface?.away_pitch_control_pct ?? 50}%</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Defending Team</span>
              <span className={`font-bold ${layersConfig.defendingTeam === 'Home' ? 'text-blue-400' : 'text-red-400'}`}>
                {layersConfig.defendingTeam}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Carrier Pressure</span>
              <span className={`font-bold ${
                (pressingAnalysis?.pressure.total_pressure_score ?? 0) > 0.6 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {Math.round((pressingAnalysis?.pressure.total_pressure_score ?? 0) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Def Line Height</span>
              <span className="text-amber-400 font-bold">{defensiveAnalysis?.defensive_line_height_m ?? 0}m</span>
            </div>
          </div>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadInitialSequences}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-100 font-medium transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto relative">
        {appMode === 'patterns' ? (
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
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
              {/* Module Selection Navigation Tabs */}
              <div className="grid grid-cols-5 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('space_creation')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'space_creation'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/70 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Space Creation Intelligence (Key 1)"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">Space</span>
                </button>
                <button
                  onClick={() => setActiveTab('defensive_vulnerability')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'defensive_vulnerability'
                      ? 'bg-rose-950 text-rose-300 border border-rose-600/70 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Defensive Vulnerability Detection (Key 2)"
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">Defense</span>
                </button>
                <button
                  onClick={() => setActiveTab('pressing')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'pressing'
                      ? 'bg-orange-950 text-orange-300 border border-orange-600/70 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Pressing Intelligence (Key 3)"
                >
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">Pressing</span>
                </button>
                <button
                  onClick={() => setActiveTab('player_interactions')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'player_interactions'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Player Interaction Analysis (Key 4)"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">Lanes</span>
                </button>
                <button
                  onClick={() => setActiveTab('tactical_decisions')}
                  className={`p-2 rounded-lg flex flex-col items-center justify-center space-y-1 transition ${
                    activeTab === 'tactical_decisions'
                      ? 'bg-purple-950 text-purple-300 border border-purple-600/70 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tactical Decision Intelligence (Key 5)"
                >
                  <Shuffle className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">Decisions</span>
                </button>
              </div>

              {/* Module Tab Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 pt-1">
                <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                  {activeTab === 'space_creation' && <span>Module 1: Space Creation Intelligence</span>}
                  {activeTab === 'defensive_vulnerability' && <span>Module 2: Defensive Vulnerability Detection</span>}
                  {activeTab === 'pressing' && <span>Module 3: Pressing Intelligence</span>}
                  {activeTab === 'player_interactions' && <span>Module 4: Player Interaction Analysis</span>}
                  {activeTab === 'tactical_decisions' && <span>Module 5: Tactical Decision Intelligence</span>}
                </h3>
              </div>

              {/* Tab Content Panels */}
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
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
