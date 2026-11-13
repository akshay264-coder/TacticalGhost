import React from 'react';
import { PressingFrameAnalysis } from '../../types/tactical';
import { Target, Zap, Clock, Users, EyeOff } from 'lucide-react';

interface PressingPanelProps {
  analysis: PressingFrameAnalysis | null;
}

export const PressingPanel: React.FC<PressingPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <Target className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
        No pressing data available for this frame.
      </div>
    );
  }

  const { pressure, cover_shadows, ball_carrier } = analysis;
  const pressurePct = Math.round(pressure.total_pressure_score * 100);

  return (
    <div className="space-y-4">
      {/* Carrier & Total Pressure Gauge */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Ball Carrier: <strong className="text-cyan-400">Player {ball_carrier?.jersey_number || 'None'}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            pressure.is_coordinated_trap
              ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}>
            {pressure.is_coordinated_trap ? 'Coordinated Pressing Trap' : 'Isolated Pressure'}
          </span>
        </div>

        {/* Dynamic Pressure Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Dynamic Pressure Index:</span>
            <span className={`font-bold ${
              pressurePct >= 70 ? 'text-rose-400' : pressurePct >= 40 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {pressurePct}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                pressurePct >= 70 ? 'bg-rose-500' : pressurePct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${pressurePct}%` }}
            />
          </div>
        </div>

        {/* Primary Presser Vector Metrics */}
        {pressure.primary_presser_id && (
          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 text-[10px] block">PRESSER</span>
              <span className="text-slate-200">Player {pressure.primary_presser_id.split('_').pop()}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">CLOSING SPEED</span>
              <span className="text-orange-400">{pressure.primary_closing_speed_mps} m/s</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">TIME TO CONTACT</span>
              <span className="text-amber-300">{pressure.time_to_contact_s}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Active Cover Shadows (Passing Lane Obstruction) */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <EyeOff className="w-3.5 h-3.5 text-orange-400" />
          <span>Cover Shadows & Blocked Lanes ({cover_shadows.filter(s => s.is_active_block).length})</span>
        </div>

        {cover_shadows.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-lg text-xs text-slate-400 border border-slate-800">
            No defenders in active cover-shadow projection range.
          </div>
        ) : (
          cover_shadows.map((sh, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs ${
                sh.is_active_block
                  ? 'bg-orange-950/20 border-orange-800/40'
                  : 'bg-slate-950/40 border-slate-800/60'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">
                  Defender {sh.jersey_number} Shadow ({sh.angular_width_deg}° cone)
                </span>
                <span className="text-slate-500 font-mono text-[11px]">{sh.distance_to_ball_m}m from ball</span>
              </div>
              {sh.blocked_teammates.length > 0 ? (
                <div className="mt-1.5 text-rose-300 font-mono text-[11px] flex items-center space-x-1">
                  <span>Blocked passing receivers:</span>
                  <strong className="text-rose-400">
                    {sh.blocked_teammates.map(id => `P${id.split('_').pop()}`).join(', ')}
                  </strong>
                </div>
              ) : (
                <div className="mt-1 text-slate-500 text-[11px]">
                  No teammate currently standing inside this shadow angle.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
