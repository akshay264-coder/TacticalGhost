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
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-sm text-[#171717] space-y-4">
      {/* Top Bar: Sequence Selector and Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <label className="text-xs uppercase tracking-wider text-[#525252] font-semibold">Match Sequence:</label>
          <select
            value={currentSequence?.sequence_id || ''}
            onChange={(e) => {
              const selected = sequences.find(s => s.sequence_id === e.target.value);
              if (selected) onSelectSequence(selected);
            }}
            className="bg-[#FAF7F2] border border-[#E5E0D8] text-[#171717] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#F28C28] font-medium"
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
            <span className="text-xs text-[#525252] font-medium uppercase tracking-wider">Decision Moments:</span>
            <div className="flex space-x-1">
              {currentSequence.decision_frames.map((df) => (
                <button
                  key={df}
                  onClick={() => onJumpToDecisionFrame(df)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    currentFrameNum === df
                      ? 'bg-[#F28C28] text-white border-[#F28C28] shadow-sm font-bold'
                      : 'bg-[#FAF7F2] text-[#525252] border-[#E5E0D8] hover:border-[#F28C28]/50 hover:text-[#171717]'
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
        <div className="flex justify-between items-center text-xs text-[#525252] font-mono">
          <span>Frame: <strong className="text-[#171717] font-bold">{currentFrameNum}</strong> ({currentFrameIndex + 1}/{totalFrames})</span>
          <span>Match Time: <strong className="text-[#F28C28] font-bold">{formatTime(currentTime)}</strong></span>
        </div>

        <div className="relative w-full flex items-center py-1">
          {/* Timeline Event Markers */}
          {sequenceEvents.map((ev, eIdx) => {
            const pct = Math.max(0, Math.min(100, ((ev.start_frame - startFrame) / frameSpan) * 100));
            const isGoal = ev.type.includes('SHOT') || ev.subtype?.includes('GOAL');
            const isTurnover = ev.type.includes('LOST') || ev.type.includes('INTERCEPTION');
            const markerColor = isGoal ? 'bg-[#F28C28] ring-[#F28C28]/40' : isTurnover ? 'bg-rose-500 ring-rose-500/40' : 'bg-blue-500 ring-blue-500/40';

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
            className="w-full h-2 bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg appearance-none cursor-pointer accent-[#F28C28] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E0D8]">
        <div className="flex items-center space-x-2">
          {/* Step Back 5 */}
          <button
            onClick={() => onSeek(Math.max(0, currentFrameIndex - 5))}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#525252] hover:text-[#171717] hover:bg-white border border-[#E5E0D8] transition"
            title="Step Back 5 Frames (Shift + Left)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          {/* Step Back 1 */}
          <button
            onClick={() => onSeek(Math.max(0, currentFrameIndex - 1))}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#525252] hover:text-[#171717] hover:bg-white border border-[#E5E0D8] transition"
            title="Step Back 1 Frame (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F28C28] hover:bg-[#E07B18] text-white font-bold shadow-sm transition active:scale-95"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Step Forward 1 */}
          <button
            onClick={() => onSeek(Math.min(totalFrames - 1, currentFrameIndex + 1))}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#525252] hover:text-[#171717] hover:bg-white border border-[#E5E0D8] transition"
            title="Step Forward 1 Frame (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Step Forward 5 */}
          <button
            onClick={() => onSeek(Math.min(totalFrames - 1, currentFrameIndex + 5))}
            className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#525252] hover:text-[#171717] hover:bg-white border border-[#E5E0D8] transition"
            title="Step Forward 5 Frames (Shift + Right)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed selector & Shortcuts Info */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Playback speed selector */}
          <div className="flex items-center space-x-1.5 font-mono">
            <FastForward className="w-3.5 h-3.5 text-[#525252]" />
            <span className="text-[#525252] text-xs">Speed:</span>
            {[0.25, 0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  playbackSpeed === s
                    ? 'bg-[#F28C28] text-white border-[#F28C28] font-bold shadow-sm'
                    : 'bg-[#FAF7F2] text-[#525252] border-[#E5E0D8] hover:text-[#171717] hover:bg-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Toggle Button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition ${
              showShortcuts
                ? 'bg-white text-[#F28C28] border-[#F28C28] shadow-sm font-bold'
                : 'bg-[#FAF7F2] text-[#525252] border-[#E5E0D8] hover:text-[#171717]'
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
        <div className="bg-[#FAF7F2] rounded-xl p-3 border border-[#E5E0D8] text-xs space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-[#171717]">
            <Info className="w-3.5 h-3.5 text-[#F28C28]" />
            <span>Keyboard Shortcuts:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono text-[#525252]">
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">Space</kbd> : Play / Pause</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">→</kbd> : ±1 Frame</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">Shift + ← / →</kbd> : ±5 Frames</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">↑</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">↓</kbd> : Speed Up / Down</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">1 - 5</kbd> : Switch Tabs</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">H</kbd> : Toggle Heatmap</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">D</kbd> : Toggle Def Block</div>
            <div><kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#171717]">P</kbd> : Toggle Passes</div>
          </div>
        </div>
      )}
    </div>
  );
};
