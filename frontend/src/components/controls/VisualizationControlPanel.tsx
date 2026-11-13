import React, { useState } from 'react';
import {
  Layers,
  Eye,
  Activity,
  Compass,
  Shield,
  Zap,
  Target,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import {
  VisualizationLayersConfig,
  PitchControlMode,
  PassingLaneFilter,
  TrailTarget
} from '../../types/tactical';

interface VisualizationControlPanelProps {
  config: VisualizationLayersConfig;
  onChangeConfig: (newConfig: Partial<VisualizationLayersConfig>) => void;
  onResetDefaults: () => void;
}

export const VisualizationControlPanel: React.FC<VisualizationControlPanelProps> = ({
  config,
  onChangeConfig,
  onResetDefaults,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'all' | 'pitch_control' | 'kinematics' | 'defense' | 'passing'>('all');

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Tactical Visualization Layers
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
            Interactive HUD
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetDefaults}
            className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline px-2 py-0.5"
            title="Reset to default layers"
          >
            Reset
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title={isExpanded ? 'Collapse layers' : 'Expand layers'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Controls Container */}
      {isExpanded && (
        <div className="p-3.5 space-y-3.5 text-xs">
          {/* Quick Category Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-slate-800/60 pb-2">
            {[
              { id: 'all', label: 'All Layers' },
              { id: 'pitch_control', label: 'Pitch Control' },
              { id: 'kinematics', label: 'Player Kinematics' },
              { id: 'defense', label: 'Defensive Block' },
              { id: 'passing', label: 'Passing & Runs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  activeSection === tab.id
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section 1: Pitch Control Surface */}
          {(activeSection === 'all' || activeSection === 'pitch_control') && (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-slate-200">Pitch Control Heatmap</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showPitchControl}
                  onChange={(e) => onChangeConfig({ showPitchControl: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {config.showPitchControl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800/50">
                  {/* Mode Selector */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                      Control Surface Mode
                    </label>
                    <div className="flex rounded border border-slate-800 bg-slate-900 p-0.5">
                      {(['dual', 'home', 'away', 'contested'] as PitchControlMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => onChangeConfig({ pitchControlMode: mode })}
                          className={`flex-1 py-1 text-[10px] uppercase font-bold rounded transition capitalize ${
                            config.pitchControlMode === mode
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="uppercase font-semibold">Heatmap Opacity</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {Math.round(config.pitchControlOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={config.pitchControlOpacity}
                      onChange={(e) => onChangeConfig({ pitchControlOpacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Player Movement & Kinematics */}
          {(activeSection === 'all' || activeSection === 'kinematics') && (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Player Movement & Kinematics</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {/* Movement Trails */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showPlayerTrails}
                    onChange={(e) => onChangeConfig({ showPlayerTrails: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Movement Trails</span>
                </label>

                {/* Velocity Arrows */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showVelocityArrows}
                    onChange={(e) => onChangeConfig({ showVelocityArrows: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Velocity Vectors</span>
                </label>

                {/* Acceleration Badges */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showAccelerationBadges}
                    onChange={(e) => onChangeConfig({ showAccelerationBadges: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Accel / Decel</span>
                </label>

                {/* Tactical Zones */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showTacticalZones}
                    onChange={(e) => onChangeConfig({ showTacticalZones: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Zone 14 / Half-Spaces</span>
                </label>
              </div>

              {/* Sub-options for trails if enabled */}
              {config.showPlayerTrails && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Trail Target:</span>
                    <button
                      onClick={() => onChangeConfig({ trailTarget: 'selected' })}
                      className={`px-2 py-0.5 rounded border text-[10px] ${
                        config.trailTarget === 'selected'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Selected Player
                    </button>
                    <button
                      onClick={() => onChangeConfig({ trailTarget: 'all' })}
                      className={`px-2 py-0.5 rounded border text-[10px] ${
                        config.trailTarget === 'all'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      All Players
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Trail Length:</span>
                    {[5, 10, 15, 20].map((len) => (
                      <button
                        key={len}
                        onClick={() => onChangeConfig({ trailLength: len })}
                        className={`px-2 py-0.5 rounded border text-[10px] ${
                          config.trailLength === len
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {len}f ({(len * 0.04).toFixed(1)}s)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Defensive Structure & Vulnerability */}
          {(activeSection === 'all' || activeSection === 'defense') && (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold text-slate-200">Defensive Structure & Shape</span>
                </div>

                {/* Defending Team Switcher */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Defending Team:</span>
                  <button
                    onClick={() => onChangeConfig({ defendingTeam: 'Home' })}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition border ${
                      config.defendingTeam === 'Home'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => onChangeConfig({ defendingTeam: 'Away' })}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition border ${
                      config.defendingTeam === 'Away'
                        ? 'bg-red-600 text-white border-red-400 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Away
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {/* Defensive Block / Convex Hull */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showDefensiveBlock}
                    onChange={(e) => onChangeConfig({ showDefensiveBlock: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Convex Hull</span>
                </label>

                {/* Defensive Line Height */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showDefensiveLineHeight}
                    onChange={(e) => onChangeConfig({ showDefensiveLineHeight: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Def Line Height</span>
                </label>

                {/* Inter-Line Gaps */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showInterLineGaps}
                    onChange={(e) => onChangeConfig({ showInterLineGaps: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Inter-Line Gaps</span>
                </label>

                {/* Cover Shadows & Pressing */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showCoverShadows}
                    onChange={(e) => onChangeConfig({ showCoverShadows: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Cover Shadows</span>
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Passing Lanes, Off-ball Runs & Alternatives */}
          {(activeSection === 'all' || activeSection === 'passing') && (
            <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-slate-200">Passing Lanes & Movement Intelligence</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {/* Passing Lanes */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showPassingLanes}
                    onChange={(e) => onChangeConfig({ showPassingLanes: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Passing Options</span>
                </label>

                {/* Off-Ball Runs */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showRuns}
                    onChange={(e) => onChangeConfig({ showRuns: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Off-Ball Runs</span>
                </label>

                {/* Vacated Space */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showVacatedSpace}
                    onChange={(e) => onChangeConfig({ showVacatedSpace: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Vacated Space</span>
                </label>

                {/* Counterfactual Decisions */}
                <label className="flex items-center space-x-2 p-2 rounded bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={config.showDecisions}
                    onChange={(e) => onChangeConfig({ showDecisions: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-300">Counterfactuals</span>
                </label>
              </div>

              {/* Passing Lane Filter */}
              {config.showPassingLanes && (
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Lanes Filter:</span>
                  {(['all', 'viable_only', 'blocked_only'] as PassingLaneFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => onChangeConfig({ passingLaneFilter: filter })}
                      className={`px-2 py-0.5 rounded border text-[10px] capitalize ${
                        config.passingLaneFilter === filter
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {filter.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
