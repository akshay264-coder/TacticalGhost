import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SequenceMeta,
  TrackingFrame,
  VisualizationLayersConfig
} from '../../types/tactical';
import { FullComparisonData } from '../../types/comparison';
import {
  fetchSequenceTracking,
  fetchSequenceComparison,
  getComparisonReportHtmlUrl
} from '../../services/api';
import { TacticalPitch } from '../pitch/TacticalPitch';
import {
  GitCompare,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Shield,
  Target,
  Share2,
  FileText,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface SequenceComparisonDashboardProps {
  sequences: SequenceMeta[];
  defaultLayersConfig: VisualizationLayersConfig;
}

export const SequenceComparisonDashboard: React.FC<SequenceComparisonDashboardProps> = ({
  sequences,
  defaultLayersConfig,
}) => {
  // Sequence selection
  const [seqAId, setSeqAId] = useState<string>(sequences[0]?.sequence_id || 'seq_goal_1');
  const [seqBId, setSeqBId] = useState<string>(sequences[1]?.sequence_id || 'seq_buildup_break');

  // Tracking data
  const [trackingA, setTrackingA] = useState<TrackingFrame[]>([]);
  const [trackingB, setTrackingB] = useState<TrackingFrame[]>([]);

  // Frame scrubbers
  const [frameIndexA, setFrameIndexA] = useState<number>(0);
  const [frameIndexB, setFrameIndexB] = useState<number>(0);
  const [syncPlayback, setSyncPlayback] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Active view tab
  const [comparisonTab, setComparisonTab] = useState<
    'visual' | 'spatial' | 'pressing' | 'decisions' | 'report'
  >('visual');

  // Full comparative analytics data
  const [comparisonData, setComparisonData] = useState<FullComparisonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());

  // 1. Fetch Comparison Analysis and Tracking for Sequence A & Sequence B
  const loadComparison = useCallback(async () => {
    if (!seqAId || !seqBId) return;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setFrameIndexA(0);
    setFrameIndexB(0);

    try {
      const [compRes, trackARes, trackBRes] = await Promise.all([
        fetchSequenceComparison(seqAId, seqBId),
        fetchSequenceTracking(seqAId),
        fetchSequenceTracking(seqBId)
      ]);

      setComparisonData(compRes);
      setTrackingA(trackARes.tracking.frames);
      setTrackingB(trackBRes.tracking.frames);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading comparison:', err);
      setError('Failed to calculate multi-sequence tactical comparison.');
      setLoading(false);
    }
  }, [seqAId, seqBId]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // 2. Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const intervalMs = 1000 / 25; // 25 fps
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = now - lastTickRef.current;
      if (elapsed >= intervalMs) {
        lastTickRef.current = now;

        setFrameIndexA((prevA) => {
          const nextA = prevA < trackingA.length - 1 ? prevA + 1 : 0;
          if (syncPlayback && trackingA.length > 0 && trackingB.length > 0) {
            const normalizedProgress = nextA / (trackingA.length - 1);
            setFrameIndexB(Math.min(trackingB.length - 1, Math.round(normalizedProgress * (trackingB.length - 1))));
          }
          return nextA;
        });

        if (!syncPlayback) {
          setFrameIndexB((prevB) => (prevB < trackingB.length - 1 ? prevB + 1 : 0));
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, syncPlayback, trackingA.length, trackingB.length]);

  const currentFrameA = trackingA[frameIndexA] || null;
  const currentFrameB = trackingB[frameIndexB] || null;

  const seqAMeta = sequences.find(s => s.sequence_id === seqAId);
  const seqBMeta = sequences.find(s => s.sequence_id === seqBId);

  const reportUrl = getComparisonReportHtmlUrl(seqAId, seqBId);

  return (
    <div className="space-y-5">
      {/* Top Header: Comparison Mode Control Bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-[#171717]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 text-[#171717] font-bold text-sm">
            <GitCompare className="w-5 h-5 text-[#F28C28]" />
            <span>Multi-Sequence Comparison</span>
          </div>

          {/* Sequence A Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-600 uppercase">Seq A:</span>
            <select
              value={seqAId}
              onChange={(e) => setSeqAId(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5E0D8] text-[#171717] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#F28C28]"
            >
              {sequences.map(s => (
                <option key={s.sequence_id} value={s.sequence_id} disabled={s.sequence_id === seqBId}>
                  {s.title} ({s.duration_s}s)
                </option>
              ))}
            </select>
          </div>

          {/* Sequence B Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-red-600 uppercase">Seq B:</span>
            <select
              value={seqBId}
              onChange={(e) => setSeqBId(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5E0D8] text-[#171717] text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#F28C28]"
            >
              {sequences.map(s => (
                <option key={s.sequence_id} value={s.sequence_id} disabled={s.sequence_id === seqAId}>
                  {s.title} ({s.duration_s}s)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Synchronize Playback Toggle */}
          <label className="flex items-center space-x-1.5 text-xs text-[#525252] cursor-pointer">
            <input
              type="checkbox"
              checked={syncPlayback}
              onChange={(e) => setSyncPlayback(e.target.checked)}
              className="rounded bg-white border-[#E5E0D8] text-[#F28C28] focus:ring-0 accent-[#F28C28]"
            />
            <span className="text-[11px] font-medium">Sync Playback</span>
          </label>

          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#F28C28] hover:bg-[#E07B18] text-white font-bold text-xs transition shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Both'}</span>
          </button>

          {/* Export Report Button */}
          <a
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#171717] border border-[#E5E0D8] font-semibold text-xs transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Export Report (PDF / HTML)</span>
          </a>
        </div>
      </div>

      {/* Comparative View Sub-Navigation */}
      <div className="flex border-b border-[#E5E0D8] space-x-2 text-xs font-medium">
        {[
          { id: 'visual', label: 'Side-by-Side Visual Pitch', icon: Layers },
          { id: 'spatial', label: 'Spatial & Defensive Matrix', icon: Shield },
          { id: 'pressing', label: 'Pressing Dynamics', icon: Target },
          { id: 'decisions', label: 'Attacking & Counterfactual Decisions', icon: Sparkles },
          { id: 'report', label: 'Technical Report Preview', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setComparisonTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 border-b-2 font-semibold transition ${
                comparisonTab === tab.id
                  ? 'border-[#F28C28] text-[#F28C28] bg-[#FEF3E8] rounded-t-lg font-bold'
                  : 'border-transparent text-[#525252] hover:text-[#171717]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Validation Status Pill */}
      {comparisonData?.validation && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Tracking Data Validation:</span>
            <span className="text-emerald-400 font-mono">
              Seq A {comparisonData.validation.sequence_a.ball_coverage_pct}% Ball Coverage | Seq B {comparisonData.validation.sequence_b.ball_coverage_pct}% Ball Coverage
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Sampling: 25.0 Hz | Normalized 105m x 68m</span>
        </div>
      )}

      {/* SUB-VIEW 1: Visual Side-by-Side Tactical Pitches */}
      {comparisonTab === 'visual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Left Column: Sequence A Pitch */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">Seq A</span>
                    <span>{seqAMeta?.title}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">{seqAMeta?.tactical_theme}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-cyan-400 font-bold">Frame {currentFrameA?.frame}</span>
                  <span className="text-slate-500 block text-[10px]">T: {currentFrameA?.time_s}s</span>
                </div>
              </div>

              {/* Pitch A */}
              <div className="relative">
                <TacticalPitch
                  frame={currentFrameA}
                  config={{
                    ...defaultLayersConfig,
                    defendingTeam: seqAMeta?.defending_team || 'Away'
                  }}
                />
              </div>

              {/* Scrubber A */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trackingA.length - 1)}
                  value={frameIndexA}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setFrameIndexA(idx);
                    if (syncPlayback && trackingA.length > 0 && trackingB.length > 0) {
                      const norm = idx / (trackingA.length - 1);
                      setFrameIndexB(Math.min(trackingB.length - 1, Math.round(norm * (trackingB.length - 1))));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-950 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Right Column: Sequence B Pitch */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-slate-100 flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">Seq B</span>
                    <span>{seqBMeta?.title}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">{seqBMeta?.tactical_theme}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-rose-400 font-bold">Frame {currentFrameB?.frame}</span>
                  <span className="text-slate-500 block text-[10px]">T: {currentFrameB?.time_s}s</span>
                </div>
              </div>

              {/* Pitch B */}
              <div className="relative">
                <TacticalPitch
                  frame={currentFrameB}
                  config={{
                    ...defaultLayersConfig,
                    defendingTeam: seqBMeta?.defending_team || 'Home'
                  }}
                />
              </div>

              {/* Scrubber B */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trackingB.length - 1)}
                  value={frameIndexB}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setFrameIndexB(idx);
                    if (syncPlayback && trackingA.length > 0 && trackingB.length > 0) {
                      const norm = idx / (trackingB.length - 1);
                      setFrameIndexA(Math.min(trackingA.length - 1, Math.round(norm * (trackingA.length - 1))));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-950 rounded appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Spatial & Tactical Matrix */}
      {comparisonTab === 'spatial' && comparisonData && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Spatial Control and Defensive Compactness Comparison</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Metric Dimension</th>
                  <th className="py-2.5 px-3 text-blue-400">Seq A ({seqAMeta?.title.split('—')[0]})</th>
                  <th className="py-2.5 px-3 text-red-400">Seq B ({seqBMeta?.title.split('—')[0]})</th>
                  <th className="py-2.5 px-3 text-cyan-400">Delta (A - B)</th>
                  <th className="py-2.5 px-3 text-slate-400">Scientific Formula / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr>
                  <td className="py-2 px-3 text-slate-300 font-sans font-medium">Defensive Convex Hull Area</td>
                  <td className="py-2 px-3 text-blue-300">{comparisonData.sequence_a.spatial.avg_convex_hull_area_m2} m²</td>
                  <td className="py-2 px-3 text-red-300">{comparisonData.sequence_b.spatial.avg_convex_hull_area_m2} m²</td>
                  <td className={`py-2 px-3 font-bold ${comparisonData.comparative_deltas.convex_hull_area_delta_m2 > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {comparisonData.comparative_deltas.convex_hull_area_delta_m2 > 0 ? `+${comparisonData.comparative_deltas.convex_hull_area_delta_m2}` : comparisonData.comparative_deltas.convex_hull_area_delta_m2} m²
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">2D Monotone Chain Polygon Area (m²)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300 font-sans font-medium">Defensive Line Height</td>
                  <td className="py-2 px-3 text-blue-300">{comparisonData.sequence_a.spatial.avg_defensive_line_height_m} m</td>
                  <td className="py-2 px-3 text-red-300">{comparisonData.sequence_b.spatial.avg_defensive_line_height_m} m</td>
                  <td className="py-2 px-3 font-bold text-cyan-400">
                    {comparisonData.comparative_deltas.defensive_line_height_delta_m > 0 ? `+${comparisonData.comparative_deltas.defensive_line_height_delta_m}` : comparisonData.comparative_deltas.defensive_line_height_delta_m} m
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">Coordinate distance from defending goal line (m)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300 font-sans font-medium">Inter-Line Defensive Gap</td>
                  <td className="py-2 px-3 text-blue-300">{comparisonData.sequence_a.spatial.avg_inter_line_gap_m} m</td>
                  <td className="py-2 px-3 text-red-300">{comparisonData.sequence_b.spatial.avg_inter_line_gap_m} m</td>
                  <td className="py-2 px-3 text-slate-300">
                    {(comparisonData.sequence_a.spatial.avg_inter_line_gap_m - comparisonData.sequence_b.spatial.avg_inter_line_gap_m).toFixed(1)} m
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">Corridor depth between defense and midfield line (m)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-300 font-sans font-medium">Pitch Control Attacking %</td>
                  <td className="py-2 px-3 text-blue-300">{comparisonData.sequence_a.spatial.mid_pitch_control_attacking_pct}%</td>
                  <td className="py-2 px-3 text-red-300">{comparisonData.sequence_b.spatial.mid_pitch_control_attacking_pct}%</td>
                  <td className="py-2 px-3 font-bold text-cyan-400">
                    {(comparisonData.sequence_a.spatial.mid_pitch_control_attacking_pct - comparisonData.sequence_b.spatial.mid_pitch_control_attacking_pct).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">Spearman (2018) time-to-intercept grid probability</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Pressing Dynamics */}
      {comparisonTab === 'pressing' && comparisonData && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
            <Target className="w-4 h-4 text-orange-400" />
            <span>Pressing Intensity, Closing Velocity & Cover Shadows</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Carrier Pressure Intensity</span>
              <div className="flex justify-center items-baseline space-x-2 font-mono">
                <span className="text-xl font-bold text-blue-400">{Math.round(comparisonData.sequence_a.pressing.avg_pressure_score * 100)}%</span>
                <span className="text-slate-500">vs</span>
                <span className="text-xl font-bold text-red-400">{Math.round(comparisonData.sequence_b.pressing.avg_pressure_score * 100)}%</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Delta: {Math.round(comparisonData.comparative_deltas.pressure_score_delta * 100)}%
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Min Time-To-Contact (TTC)</span>
              <div className="flex justify-center items-baseline space-x-2 font-mono">
                <span className="text-xl font-bold text-blue-400">{comparisonData.sequence_a.pressing.min_time_to_contact_s}s</span>
                <span className="text-slate-500">vs</span>
                <span className="text-xl font-bold text-red-400">{comparisonData.sequence_b.pressing.min_time_to_contact_s}s</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Critical Reaction Window (&le; 2.0s)
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Peak Closing Speed</span>
              <div className="flex justify-center items-baseline space-x-2 font-mono">
                <span className="text-xl font-bold text-blue-400">{comparisonData.sequence_a.pressing.peak_closing_speed_mps} m/s</span>
                <span className="text-slate-500">vs</span>
                <span className="text-xl font-bold text-red-400">{comparisonData.sequence_b.pressing.peak_closing_speed_mps} m/s</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                Defender closing velocity vector
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: Attacking & Decisions */}
      {comparisonTab === 'decisions' && comparisonData && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Attacking Space Creation & Counterfactual Decisions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-blue-400 uppercase">Sequence A Decision Efficiency</h4>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Decision Efficiency Ratio:</span>
                <span className="font-bold text-blue-300">{comparisonData.sequence_a.decisions.decision_efficiency_ratio}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Space Creation Rate:</span>
                <span className="text-slate-200">{comparisonData.sequence_a.attacking.space_creation_rate_m2_per_sec} m²/s</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Final Action Result:</span>
                <span className="text-emerald-400 font-bold">{comparisonData.sequence_a.attacking.final_action}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-red-400 uppercase">Sequence B Decision Efficiency</h4>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Decision Efficiency Ratio:</span>
                <span className="font-bold text-red-300">{comparisonData.sequence_b.decisions.decision_efficiency_ratio}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Space Creation Rate:</span>
                <span className="text-slate-200">{comparisonData.sequence_b.attacking.space_creation_rate_m2_per_sec} m²/s</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Final Action Result:</span>
                <span className="text-rose-400 font-bold">{comparisonData.sequence_b.attacking.final_action}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: Report Preview */}
      {comparisonTab === 'report' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Standalone HTML Tactical Report Preview:</span>
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Open in new window for direct print</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <iframe
            src={reportUrl}
            className="w-full h-[650px] rounded-lg border border-slate-800 bg-slate-950"
            title="Comparison Report Preview"
          />
        </div>
      )}
    </div>
  );
};
