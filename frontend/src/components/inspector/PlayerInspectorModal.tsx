import React from 'react';
import { PlayerPos } from '../../types/tactical';
import { X, Activity, Gauge, Navigation } from 'lucide-react';

interface PlayerInspectorModalProps {
  player: PlayerPos | null;
  ballPos: { x: number | null; y: number | null };
  onClose: () => void;
}

export const PlayerInspectorModal: React.FC<PlayerInspectorModalProps> = ({
  player,
  ballPos,
  onClose,
}) => {
  if (!player) return null;

  const distToBall = (ballPos.x !== null && ballPos.y !== null)
    ? Math.hypot(player.x - ballPos.x, player.y - ballPos.y).toFixed(1)
    : 'N/A';

  const speedKmh = (player.speed * 3.6).toFixed(1);
  const accel = player.acceleration ?? 0;
  const accelColor = accel > 1.5 ? 'text-emerald-400' : accel < -1.5 ? 'text-rose-400' : 'text-slate-300';
  const accelLabel = accel > 1.5 ? 'HIGH ACCEL' : accel < -1.5 ? 'HARD DECEL' : 'CRUISE';

  return (
    <div className="absolute top-4 right-4 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-4 text-slate-200 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-7 h-7 rounded-full text-white font-bold font-mono text-xs flex items-center justify-center ${
            player.team === 'Home' ? 'bg-blue-600' : 'bg-red-600'
          }`}>
            {player.jersey_number}
          </span>
          <div>
            <h4 className="font-semibold text-sm">Player {player.jersey_number}</h4>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{player.team} Team</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-500 text-[10px] block">POSITION (X, Y)</span>
          <span className="text-cyan-400">{player.x}m, {player.y}m</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-500 text-[10px] block">DIST TO BALL</span>
          <span className="text-amber-400">{distToBall}m</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-500 text-[10px] block">SPEED (m/s / km/h)</span>
          <span className="text-emerald-400">{player.speed} m/s <span className="text-slate-500 text-[10px]">({speedKmh} km/h)</span></span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          <span className="text-slate-500 text-[10px] block">ACCEL ({accelLabel})</span>
          <span className={accelColor}>{accel > 0 ? `+${accel.toFixed(2)}` : accel.toFixed(2)} m/s²</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 col-span-2">
          <span className="text-slate-500 text-[10px] block">CUMULATIVE SEQUENCE DISTANCE</span>
          <span className="text-purple-400 font-bold">{player.cumulative_distance_m ?? 0.0} meters travelled</span>
        </div>
      </div>

      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-xs font-mono">
        <span className="text-slate-500 text-[10px] block">VELOCITY VECTOR (Vx, Vy)</span>
        <span className="text-slate-300">({player.vx > 0 ? `+${player.vx}` : player.vx}, {player.vy > 0 ? `+${player.vy}` : player.vy}) m/s</span>
      </div>
    </div>
  );
};
