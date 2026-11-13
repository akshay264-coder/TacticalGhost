import React from 'react';
import { SpaceCreationData, OffBallRun } from '../../types/tactical';
import { Compass, Footprints, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface SpaceCreationPanelProps {
  data: SpaceCreationData | null;
  currentFrame: number;
  onSelectRun?: (run: OffBallRun) => void;
}

export const SpaceCreationPanel: React.FC<SpaceCreationPanelProps> = ({
  data,
  currentFrame,
  onSelectRun,
}) => {
  if (!data || data.runs.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <Footprints className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
        No high-speed off-ball runs detected in this sequence window.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
          <span className="text-slate-400 text-xs block">Off-ball Runs</span>
          <span className="text-xl font-bold font-mono text-cyan-400">{data.total_runs_detected}</span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
          <span className="text-slate-400 text-xs block">Max Space Created</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {Math.max(...data.runs.map(r => r.space_created_m2)).toFixed(0)}m²
          </span>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
          <span className="text-slate-400 text-xs block">Top Decoy Score</span>
          <span className="text-xl font-bold font-mono text-purple-400">
            {Math.round(Math.max(...data.runs.map(r => r.decoy_score)) * 100)}%
          </span>
        </div>
      </div>

      {/* List of Detected Runs */}
      <div className="space-y-3">
        {data.runs.map((run) => {
          const isActive = currentFrame >= run.start_frame && currentFrame <= run.end_frame;
          return (
            <div
              key={run.run_id}
              onClick={() => onSelectRun && onSelectRun(run)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold font-mono text-xs flex items-center justify-center">
                    {run.jersey_number}
                  </span>
                  <span className="font-semibold text-sm text-slate-200">
                    {run.run_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {run.decoy_score >= 0.5 && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 flex items-center space-x-1">
                      <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Decoy Run
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    Frames {run.start_frame}-{run.end_frame}
                  </span>
                </div>
              </div>

              {/* Spatial metrics */}
              <div className="grid grid-cols-4 gap-2 text-xs font-mono my-2 py-1.5 px-2 bg-slate-900/60 rounded-lg">
                <div>
                  <span className="text-slate-500 block text-[10px]">DISTANCE</span>
                  <span className="text-slate-200">{run.distance_m}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">AVG SPEED</span>
                  <span className="text-slate-200">{run.avg_speed_mps} m/s</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SPACE OPENED</span>
                  <span className="text-emerald-400">{run.space_created_m2}m²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">DECOY INDEX</span>
                  <span className="text-purple-400">{Math.round(run.decoy_score * 100)}%</span>
                </div>
              </div>

              {/* Dragged Defender Info */}
              {run.dragged_defender_id && (
                <div className="text-xs text-slate-300 flex items-center space-x-1.5 bg-rose-950/30 border border-rose-900/40 px-2 py-1 rounded">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    Dragged defender <strong className="text-rose-300">Player {run.dragged_defender_id.split('_').pop()}</strong> (tracking index: {run.marker_tracking_index})
                  </span>
                </div>
              )}

              {/* Tactical Explanation */}
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {run.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
