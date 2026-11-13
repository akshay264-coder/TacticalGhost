import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Keyboard,
  Info
} from 'lucide-react';
import { SequenceMeta, TrackingFrame, MatchEvent } from '../../types/tactical';

interface PlaybackControlsProps {
  sequences: SequenceMeta[];
  currentSequence: SequenceMeta | null;
  onSelectSequence: (seq: SequenceMeta) => void;
  currentFrameIndex: number;
  totalFrames: number;
  currentFrameData: TrackingFrame | null;
  events?: MatchEvent[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (frameIndex: number) => void;
  onJumpToFrame?: (frameNum: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onJumpToDecisionFrame: (frame: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  sequences,
  currentSequence,
  onSelectSequence,
  currentFrameIndex,
  totalFrames,
  currentFrameData,
  events = [],
  isPlaying,
  onTogglePlay,
  onSeek,
  onJumpToFrame,
  playbackSpeed,
  onChangeSpeed,
  onJumpToDecisionFrame,
}) => {
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  const formatTime = (timeS: number) => {
    const mins = Math.floor(timeS / 60);
    const secs = (timeS % 60).toFixed(2);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;
  };

  const currentTime = currentFrameData?.time_s ?? 0;
  const currentFrameNum = currentFrameData?.frame ?? 0;
  const startFrame = currentSequence?.start_frame ?? 0;
  const endFrame = currentSequence?.end_frame ?? 1;
  const frameSpan = Math.max(1, endFrame - startFrame);

  // Relevant timeline events that fall within or near the sequence
  const sequenceEvents = events.filter(
    (ev) => ev.start_frame >= startFrame && ev.start_frame <= endFrame
  );

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-xl space-y-4">
      {/* Top Bar: Sequence Selector and Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Match Sequence:</label>
          <select
            value={currentSequence?.sequence_id || ''}
            onChange={(e) => {
              const selected = sequences.find(s => s.sequence_id === e.target.value);
              if (selected) onSelectSequence(selected);
            }}
            className="bg-slate-950 border border-slate-700 text-cyan-400 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
          >
            {sequences.map((s) => (
              <option key={s.sequence_id} value={s.sequence_id}>
                {s.title} ({s.duration_s}s)
              </option>
            ))}
          </select>
        </div>

        {/* Quick jump to key decision moments */}
        {currentSequence?.decision_frames && currentSequence.decision_frames.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Decision Moments:</span>
            <div className="flex space-x-1">
              {currentSequence.decision_frames.map((df) => (
                <button
                  key={df}
                  onClick={() => onJumpToDecisionFrame(df)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    currentFrameNum === df
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-slate-950 text-purple-300 border-slate-800 hover:border-purple-500/50'
                  }`}
                >
                  Frame {df}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrubber Timeline with Event Markers */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Frame: <strong className="text-cyan-400">{currentFrameNum}</strong> ({currentFrameIndex + 1}/{totalFrames})</span>
          <span>Match Time: <strong className="text-amber-400">{formatTime(currentTime)}</strong></span>
        </div>

        <div className="relative w-full flex items-center py-1">
          {/* Timeline Event Markers */}
          {sequenceEvents.map((ev, eIdx) => {
            const pct = Math.max(0, Math.min(100, ((ev.start_frame - startFrame) / frameSpan) * 100));
            const isGoal = ev.type.includes('SHOT') || ev.subtype?.includes('GOAL');
            const isTurnover = ev.type.includes('LOST') || ev.type.includes('INTERCEPTION');
            const markerColor = isGoal ? 'bg-amber-400 ring-amber-400/50' : isTurnover ? 'bg-rose-500 ring-rose-500/50' : 'bg-cyan-400 ring-cyan-400/50';

            return (
              <button
                key={eIdx}
                style={{ left: `${pct}%` }}
                onClick={() => onJumpToFrame && onJumpToFrame(ev.start_frame)}
                className={`absolute z-10 w-2.5 h-2.5 rounded-full -translate-x-1/2 ring-2 transition-transform hover:scale-150 ${markerColor}`}
                title={`Frame ${ev.start_frame}: ${ev.type} (${ev.team}) - Click to jump`}
              />
            );
          })}

          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={currentFrameIndex}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-center space-x-2">
          {/* Step Back 5 */}
          <button
            onClick={() => onSeek(Math.max(0, currentFrameIndex - 5))}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Step Back 5 Frames (Shift + Left)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          {/* Step Back 1 */}
          <button
            onClick={() => onSeek(Math.max(0, currentFrameIndex - 1))}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Step Back 1 Frame (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Step Forward 1 */}
          <button
            onClick={() => onSeek(Math.min(totalFrames - 1, currentFrameIndex + 1))}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Step Forward 1 Frame (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Step Forward 5 */}
          <button
            onClick={() => onSeek(Math.min(totalFrames - 1, currentFrameIndex + 5))}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Step Forward 5 Frames (Shift + Right)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed selector & Shortcuts Info */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Playback speed selector */}
          <div className="flex items-center space-x-1.5 font-mono">
            <FastForward className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Speed:</span>
            {[0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  playbackSpeed === s
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Toggle Button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`flex items-center space-x-1 px-2 py-1 rounded border transition ${
              showShortcuts
                ? 'bg-slate-800 text-cyan-300 border-cyan-500'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="View Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keys</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Drawer */}
      {showShortcuts && (
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Keyboard Shortcuts:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">Space</kbd> : Play / Pause</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">→</kbd> : ±1 Frame</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">Shift + ← / →</kbd> : ±5 Frames</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">↑</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">↓</kbd> : Speed Up / Down</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">1 - 5</kbd> : Switch Tabs</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">H</kbd> : Toggle Heatmap</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">D</kbd> : Toggle Def Block</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">P</kbd> : Toggle Passes</div>
          </div>
        </div>
      )}
    </div>
  );
};
