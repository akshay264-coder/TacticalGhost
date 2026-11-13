import React from 'react';
import { PassingOption, PassingSynergyNetwork } from '../../types/tactical';
import { GitCommit, ArrowUpRight, Share2, AlertCircle, ShieldCheck } from 'lucide-react';

interface PlayerInteractionsPanelProps {
  carrier: { player_id: string; jersey_number: string } | null;
  passingOptions: PassingOption[];
  network: PassingSynergyNetwork | null;
}

export const PlayerInteractionsPanel: React.FC<PlayerInteractionsPanelProps> = ({
  carrier,
  passingOptions,
  network,
}) => {
  return (
    <div className="space-y-4">
      {/* Network Connectivity Summary */}
      {network && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 text-xs block">Viable Lanes</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{network.viable_lanes_count}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 text-xs block">Network Density</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{network.network_density}</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 text-xs block">Carrier Options</span>
            <span className="text-lg font-bold font-mono text-purple-400">{passingOptions.length}</span>
          </div>
        </div>
      )}

      {/* Passing Options List from Carrier */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <span className="flex items-center space-x-1.5">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Passing Lanes from Player {carrier?.jersey_number || ''}</span>
          </span>
          <span className="text-slate-500 font-mono text-[10px]">Ranked by Viability</span>
        </div>

        {passingOptions.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-lg text-xs text-slate-400 border border-slate-800 text-center">
            No active passing options available.
          </div>
        ) : (
          passingOptions.map((opt) => {
            const viabilityPct = Math.round(opt.viability_score * 100);
            const isProgressive = opt.forward_progression_m > 8.0;

            return (
              <div
                key={opt.receiver_id}
                className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center">
                      {opt.jersey_number}
                    </span>
                    <span className="font-semibold text-xs text-slate-200">
                      Player {opt.jersey_number}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      opt.tactical_category === 'progressive_break'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : opt.tactical_category === 'switch_play'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        : opt.tactical_category === 'risky_pocket'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {opt.tactical_category.replace('_', ' ')}
                    </span>
                  </div>

                  <span className={`font-mono font-bold text-xs ${
                    viabilityPct >= 65 ? 'text-emerald-400' : viabilityPct >= 45 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {viabilityPct}% Viability
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-900/60 p-1.5 rounded">
                  <div>
                    <span className="text-slate-500 block text-[9px]">DISTANCE</span>
                    <span className="text-slate-300">{opt.distance_m}m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">PROGRESSION</span>
                    <span className={opt.forward_progression_m > 0 ? 'text-cyan-400' : 'text-slate-400'}>
                      {opt.forward_progression_m > 0 ? `+${opt.forward_progression_m}m` : `${opt.forward_progression_m}m`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">REC CONTROL</span>
                    <span className="text-purple-300">{Math.round(opt.receiver_pitch_control * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">INTERCEPT RISK</span>
                    <span className={opt.interception_risk > 0.4 ? 'text-rose-400' : 'text-emerald-400'}>
                      {Math.round(opt.interception_risk * 100)}%
                    </span>
                  </div>
                </div>

                {opt.is_in_cover_shadow && (
                  <div className="text-[11px] text-amber-300/90 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Option obstructed by defender cover shadow cone</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
