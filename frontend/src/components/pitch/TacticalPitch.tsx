import React, { useMemo } from 'react';
import {
  TrackingFrame,
  PlayerPos,
  OffBallRun,
  CoverShadowInfo,
  PressingFrameAnalysis,
  PassingOption,
  ActionAlternative,
  VulnerableZone,
  DefensiveFrameAnalysis,
  PitchControlSurface,
  VisualizationLayersConfig
} from '../../types/tactical';

interface TacticalPitchProps {
  frame: TrackingFrame | null;
  historyFrames?: TrackingFrame[];
  activeRuns?: OffBallRun[];
  coverShadows?: CoverShadowInfo[];
  pressingAnalysis?: PressingFrameAnalysis | null;
  passingOptions?: PassingOption[];
  decisionAlternatives?: ActionAlternative[];
  vulnerabilities?: VulnerableZone[];
  defensiveAnalysis?: DefensiveFrameAnalysis | null;
  pitchControl?: PitchControlSurface | null;
  selectedPlayerId?: string | null;
  onSelectPlayer?: (player: PlayerPos) => void;
  config: VisualizationLayersConfig;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = React.memo(({
  frame,
  historyFrames = [],
  activeRuns = [],
  coverShadows = [],
  pressingAnalysis = null,
  passingOptions = [],
  decisionAlternatives = [],
  vulnerabilities = [],
  defensiveAnalysis = null,
  pitchControl = null,
  selectedPlayerId = null,
  onSelectPlayer,
  config,
}) => {
  // Pitch dimensions in meters
  const PITCH_W = 105.0;
  const PITCH_H = 68.0;

  // Convert standard pitch coordinates (0,0 bottom-left) to SVG coordinates (0,0 top-left)
  const toSvgY = (y: number) => PITCH_H - y;

  // 1. Compute Defensive Convex Hull points for defending team
  const defensiveHullPoints = useMemo(() => {
    if (!frame || !config.showDefensiveBlock) return '';
    const defenders = config.defendingTeam === 'Home' ? frame.home_players : frame.away_players;
    if (defenders.length < 3) return '';

    const points = defenders.map(p => ({ x: p.x, y: toSvgY(p.y) }));
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o: any, a: any, b: any) =>
      (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower: any[] = [];
    for (const p of points) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper: any[] = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    lower.pop();
    upper.pop();
    const hull = lower.concat(upper);
    return hull.map(p => `${p.x},${p.y}`).join(' ');
  }, [frame, config.showDefensiveBlock, config.defendingTeam]);

  // 2. Compute Player Movement Trails from history frames
  const playerTrails = useMemo(() => {
    if (!config.showPlayerTrails || !historyFrames || historyFrames.length === 0) return [];
    const trailLen = config.trailLength || 10;
    const recent = historyFrames.slice(-trailLen);

    const trailsMap: Record<string, { player_id: string; team: 'Home' | 'Away'; points: Array<{ x: number; y: number; alpha: number }> }> = {};

    recent.forEach((hf, fIdx) => {
      const alpha = (fIdx + 1) / recent.length;
      const allPlayers = [...hf.home_players, ...hf.away_players];

      allPlayers.forEach(p => {
        if (config.trailTarget === 'selected' && p.player_id !== selectedPlayerId) {
          return;
        }
        if (!trailsMap[p.player_id]) {
          trailsMap[p.player_id] = { player_id: p.player_id, team: p.team, points: [] };
        }
        trailsMap[p.player_id].points.push({ x: p.x, y: toSvgY(p.y), alpha });
      });
    });

    return Object.values(trailsMap);
  }, [config.showPlayerTrails, config.trailLength, config.trailTarget, selectedPlayerId, historyFrames]);

  // 3. Filter passing lanes
  const filteredPassingOptions = useMemo(() => {
    if (!config.showPassingLanes) return [];
    if (config.passingLaneFilter === 'viable_only') {
      return passingOptions.filter(o => o.viability_score >= 0.55);
    }
    if (config.passingLaneFilter === 'blocked_only') {
      return passingOptions.filter(o => o.viability_score < 0.55 || o.is_in_cover_shadow);
    }
    return passingOptions;
  }, [passingOptions, config.showPassingLanes, config.passingLaneFilter]);

  if (!frame) {
    return (
      <div className="w-full aspect-[105/68] bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-800">
        No frame data available
      </div>
    );
  }

  const ball = frame.ball;
  const bx = ball.x ?? 52.5;
  const by = ball.y !== null ? toSvgY(ball.y) : 34.0;

  // Defensive line X coordinate
  const defLineHeight = defensiveAnalysis?.defensive_line_height_m;
  const isBrokenLine = defensiveAnalysis?.is_broken_line ?? false;
  const brokenDefenderId = defensiveAnalysis?.broken_defender_id;

  return (
    <div className="relative w-full aspect-[105/68] bg-[#0d1e13] rounded-xl overflow-hidden shadow-2xl border border-emerald-950/60 select-none">
      <svg
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Markers */}
          <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
          </marker>
          <marker id="arrow-counterfactual" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
          </marker>
          <marker id="arrow-velocity-home" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
            <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(96, 165, 250, 0.85)" />
          </marker>
          <marker id="arrow-velocity-away" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
            <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(248, 113, 113, 0.85)" />
          </marker>
          <marker id="arrow-press" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
        </defs>

        {/* Pitch mowing lawn bands */}
        {Array.from({ length: 15 }).map((_, i) => (
          <rect
            key={i}
            x={(PITCH_W / 15) * i}
            y="0"
            width={PITCH_W / 15}
            height={PITCH_H}
            fill={i % 2 === 0 ? '#11291b' : '#0e2316'}
          />
        ))}

        {/* Tactical zones overlay (Zone 14 & Half spaces) */}
        {config.showTacticalZones && (
          <g className="transition-opacity duration-300">
            {/* Left & Right Half Spaces */}
            <rect x="52.5" y={toSvgY(54.4)} width="36" height={54.4 - 40.8} fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="1,1" strokeWidth="0.2" />
            <rect x="52.5" y={toSvgY(27.2)} width="36" height={27.2 - 13.6} fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="1,1" strokeWidth="0.2" />
            
            {/* Zone 14 */}
            <rect x="70.0" y={toSvgY(47.6)} width="18.5" height={47.6 - 20.4} fill="rgba(239, 68, 68, 0.08)" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="1.5,1.5" strokeWidth="0.3" />
            <text x="79.2" y={toSvgY(34.0)} fill="rgba(239, 68, 68, 0.6)" fontSize="2.2" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">ZONE 14</text>
          </g>
        )}

        {/* Standard Pitch Markings */}
        <g stroke="rgba(255, 255, 255, 0.35)" strokeWidth="0.35" fill="none">
          <rect x="0" y="0" width={PITCH_W} height={PITCH_H} />
          <line x1="52.5" y1="0" x2="52.5" y2={PITCH_H} />
          <circle cx="52.5" cy="34" r="9.15" />
          <circle cx="52.5" cy="34" r="0.4" fill="rgba(255, 255, 255, 0.8)" />

          {/* Left Penalty Area (Home) */}
          <rect x="0" y={toSvgY(54.16)} width="16.5" height="40.32" />
          <rect x="0" y={toSvgY(43.16)} width="5.5" height="18.32" />
          <circle cx="11.0" cy="34" r="0.4" fill="rgba(255, 255, 255, 0.8)" />
          <path d={`M 16.5 ${toSvgY(34 - 7.3)} A 9.15 9.15 0 0 1 16.5 ${toSvgY(34 + 7.3)}`} />

          {/* Right Penalty Area (Away) */}
          <rect x="88.5" y={toSvgY(54.16)} width="16.5" height="40.32" />
          <rect x="99.5" y={toSvgY(43.16)} width="5.5" height="18.32" />
          <circle cx="94.0" cy="34" r="0.4" fill="rgba(255, 255, 255, 0.8)" />
          <path d={`M 88.5 ${toSvgY(34 + 7.3)} A 9.15 9.15 0 0 1 88.5 ${toSvgY(34 - 7.3)}`} />

          {/* Goals */}
          <rect x="-2.0" y={toSvgY(37.66)} width="2.0" height="7.32" stroke="rgba(255,255,255,0.7)" />
          <rect x="105.0" y={toSvgY(37.66)} width="2.0" height="7.32" stroke="rgba(255,255,255,0.7)" />
        </g>

        {/* 1. Advanced Pitch Control Surface Heatmap */}
        {config.showPitchControl && pitchControl && (
          <g className="transition-opacity duration-300">
            {pitchControl.pitch_control_home.map((row, rIdx) => {
              const y1 = pitchControl.y_coords[rIdx];
              const cellH = (PITCH_H / pitchControl.y_coords.length) * 1.1;
              return row.map((probHome, cIdx) => {
                const x1 = pitchControl.x_coords[cIdx];
                const cellW = (PITCH_W / pitchControl.x_coords.length) * 1.1;
                const baseOpacity = config.pitchControlOpacity;

                let fillColor = 'transparent';
                if (config.pitchControlMode === 'dual') {
                  const isHome = probHome > 0.5;
                  const intensity = Math.abs(probHome - 0.5) * 2.0;
                  fillColor = isHome
                    ? `rgba(59, 130, 246, ${intensity * baseOpacity * 0.7})`
                    : `rgba(239, 68, 68, ${intensity * baseOpacity * 0.7})`;
                } else if (config.pitchControlMode === 'home') {
                  if (probHome > 0.5) {
                    const intensity = (probHome - 0.5) * 2.0;
                    fillColor = `rgba(59, 130, 246, ${intensity * baseOpacity * 0.85})`;
                  }
                } else if (config.pitchControlMode === 'away') {
                  if (probHome < 0.5) {
                    const intensity = (0.5 - probHome) * 2.0;
                    fillColor = `rgba(239, 68, 68, ${intensity * baseOpacity * 0.85})`;
                  }
                } else if (config.pitchControlMode === 'contested') {
                  // High contested zones: 0.4 to 0.6
                  if (probHome >= 0.38 && probHome <= 0.62) {
                    const contestScore = 1.0 - (Math.abs(probHome - 0.5) / 0.12);
                    fillColor = `rgba(234, 179, 8, ${contestScore * baseOpacity * 0.8})`;
                  }
                }

                if (fillColor === 'transparent') return null;

                return (
                  <rect
                    key={`${rIdx}-${cIdx}`}
                    x={x1}
                    y={toSvgY(y1 + cellH)}
                    width={cellW}
                    height={cellH}
                    fill={fillColor}
                  />
                );
              });
            })}
          </g>
        )}

        {/* 2. Defensive Structure: Convex Hull */}
        {config.showDefensiveBlock && defensiveHullPoints && (
          <polygon
            points={defensiveHullPoints}
            fill={config.defendingTeam === 'Home' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)'}
            stroke={config.defendingTeam === 'Home' ? 'rgba(96, 165, 250, 0.7)' : 'rgba(248, 113, 113, 0.7)'}
            strokeWidth="0.4"
            strokeDasharray="2,1"
          />
        )}

        {/* 3. Defensive Structure: Defensive Line Height Line */}
        {config.showDefensiveLineHeight && defLineHeight !== undefined && (
          <g>
            <line
              x1={defLineHeight}
              y1="0"
              x2={defLineHeight}
              y2={PITCH_H}
              stroke="#f43f5e"
              strokeWidth="0.45"
              strokeDasharray="1.5,1.5"
            />
            <rect
              x={Math.min(95, Math.max(5, defLineHeight - 11))}
              y="2.0"
              width="22"
              height="3.2"
              rx="0.8"
              fill="#0f172a"
              stroke="#f43f5e"
              strokeWidth="0.25"
            />
            <text
              x={Math.min(95, Math.max(5, defLineHeight))}
              y="4.2"
              fill="#f43f5e"
              fontSize="1.6"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              DEF LINE: {defLineHeight.toFixed(1)}m
            </text>
          </g>
        )}

        {/* 4. Defensive Structure: Inter-Line Gap Corridor */}
        {config.showInterLineGaps && defensiveAnalysis?.midfield_defense_gap_m && defLineHeight && (
          <g>
            <rect
              x={config.defendingTeam === 'Away' ? defLineHeight - defensiveAnalysis.midfield_defense_gap_m : defLineHeight}
              y="10"
              width={defensiveAnalysis.midfield_defense_gap_m}
              height="48"
              fill="rgba(244, 63, 94, 0.08)"
              stroke="rgba(244, 63, 94, 0.3)"
              strokeDasharray="2,1"
              strokeWidth="0.2"
            />
            <text
              x={config.defendingTeam === 'Away' ? defLineHeight - (defensiveAnalysis.midfield_defense_gap_m / 2) : defLineHeight + (defensiveAnalysis.midfield_defense_gap_m / 2)}
              y="34"
              fill="rgba(244, 63, 94, 0.6)"
              fontSize="1.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              GAP: {defensiveAnalysis.midfield_defense_gap_m.toFixed(1)}m
            </text>
          </g>
        )}

        {/* 5. Exposed Defensive Vulnerabilities */}
        {vulnerabilities.map((vuln, idx) => (
          <g key={idx}>
            <circle
              cx={vuln.center_point.x}
              cy={toSvgY(vuln.center_point.y)}
              r={5.5}
              fill="rgba(244, 63, 94, 0.15)"
              stroke="#f43f5e"
              strokeWidth="0.4"
              strokeDasharray="1,1"
            />
            <text
              x={vuln.center_point.x}
              y={toSvgY(vuln.center_point.y) - 6.2}
              fill="#f43f5e"
              fontSize="1.8"
              fontWeight="bold"
              textAnchor="middle"
            >
              ⚠ {vuln.zone_name.split(' ')[0]} ({Math.round(vuln.danger_score * 100)}%)
            </text>
          </g>
        ))}

        {/* 6. Pressing: Cover Shadows */}
        {config.showCoverShadows && ball.x !== null && coverShadows.map((sh, idx) => {
          if (!sh.is_active_block && sh.distance_to_ball_m > 8.0) return null;
          const centerRad = -((sh.center_angle_deg * Math.PI) / 180.0);
          const halfRad = ((sh.angular_width_deg * Math.PI) / 360.0);
          const shadowLen = 22.0;

          const p1x = bx + shadowLen * Math.cos(centerRad - halfRad);
          const p1y = by + shadowLen * Math.sin(centerRad - halfRad);
          const p2x = bx + shadowLen * Math.cos(centerRad + halfRad);
          const p2y = by + shadowLen * Math.sin(centerRad + halfRad);

          return (
            <path
              key={idx}
              d={`M ${bx} ${by} L ${p1x} ${p1y} A ${shadowLen} ${shadowLen} 0 0 1 ${p2x} ${p2y} Z`}
              fill="rgba(249, 115, 22, 0.16)"
              stroke="rgba(249, 115, 22, 0.5)"
              strokeWidth="0.25"
            />
          );
        })}

        {/* 7. Pressing: Closing Vectors & Time-To-Contact */}
        {pressingAnalysis && ball.x !== null && pressingAnalysis.pressure.pressers_detail.map((pr, idx) => {
          const presserTeam = config.defendingTeam;
          const pool = presserTeam === 'Home' ? frame.home_players : frame.away_players;
          const presser = pool.find(p => p.player_id === pr.defender_id);
          if (!presser) return null;

          const px = presser.x;
          const py = toSvgY(presser.y);

          return (
            <g key={idx}>
              {/* Closing vector towards carrier/ball */}
              <line
                x1={px}
                y1={py}
                x2={bx}
                y2={by}
                stroke="#f43f5e"
                strokeWidth="0.35"
                strokeDasharray="1,1"
                markerEnd="url(#arrow-press)"
                opacity={0.8}
              />
              {/* TTC Badge if <= 2.0s */}
              {pr.time_to_contact_s <= 2.0 && (
                <g>
                  <rect
                    x={(px + bx) / 2 - 3.2}
                    y={(py + by) / 2 - 1.2}
                    width="6.4"
                    height="2.4"
                    rx="0.5"
                    fill="#1e1b4b"
                    stroke="#f43f5e"
                    strokeWidth="0.2"
                  />
                  <text
                    x={(px + bx) / 2}
                    y={(py + by) / 2 + 0.5}
                    fill="#fda4af"
                    fontSize="1.3"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    TTC {pr.time_to_contact_s.toFixed(1)}s
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 8. Passing Options Lanes */}
        {ball.x !== null && filteredPassingOptions.map((opt, idx) => {
          const rx = opt.receiver_pos.x;
          const ry = toSvgY(opt.receiver_pos.y);
          const isViable = opt.viability_score >= 0.65;
          const isContested = opt.viability_score >= 0.45 && opt.viability_score < 0.65;
          const marker = isViable ? 'url(#arrow-green)' : isContested ? 'url(#arrow-amber)' : 'url(#arrow-red)';
          const color = isViable ? '#10b981' : isContested ? '#f59e0b' : '#ef4444';

          return (
            <g key={idx}>
              <line
                x1={bx}
                y1={by}
                x2={rx}
                y2={ry}
                stroke={color}
                strokeWidth={isViable ? 0.5 : 0.35}
                strokeDasharray={opt.is_in_cover_shadow ? '1.5,1.5' : undefined}
                markerEnd={marker}
                opacity={0.9}
              />
              {/* Viability & Risk Pill */}
              <rect
                x={(bx + rx) / 2 - 3.8}
                y={(by + ry) / 2 - 1.3}
                width="7.6"
                height="2.6"
                rx="0.6"
                fill="#0f172a"
                stroke={color}
                strokeWidth="0.2"
              />
              <text
                x={(bx + rx) / 2}
                y={(by + ry) / 2 + 0.5}
                fill="#f8fafc"
                fontSize="1.2"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {Math.round(opt.viability_score * 100)}% | R:{Math.round(opt.interception_risk * 100)}%
              </text>
            </g>
          );
        })}

        {/* 9. Off-Ball Movement: Runs & Vacated Space */}
        {config.showRuns && activeRuns.map((run, idx) => {
          const sx = run.start_position.x;
          const sy = toSvgY(run.start_position.y);
          const ex = run.end_position.x;
          const ey = toSvgY(run.end_position.y);

          return (
            <g key={idx}>
              {/* Vacated space halo */}
              {config.showVacatedSpace && (
                <g>
                  <circle
                    cx={sx}
                    cy={sy}
                    r="4.2"
                    fill="rgba(6, 182, 212, 0.15)"
                    stroke="#06b6d4"
                    strokeWidth="0.3"
                    strokeDasharray="1.5,1.5"
                  />
                  <text x={sx} y={sy - 4.6} fill="#06b6d4" fontSize="1.3" textAnchor="middle" fontWeight="bold">
                    Vacated ({Math.round(run.space_created_m2)}m²)
                  </text>
                </g>
              )}
              {/* Run vector */}
              <line
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                stroke="#06b6d4"
                strokeWidth="0.5"
                strokeDasharray="2,1"
              />
              {/* Decoy badge */}
              {run.decoy_score > 0.5 && (
                <text x={(sx + ex) / 2} y={(sy + ey) / 2 - 1.2} fill="#38bdf8" fontSize="1.3" fontWeight="bold" textAnchor="middle">
                  Decoy: {Math.round(run.decoy_score * 100)}%
                </text>
              )}
            </g>
          );
        })}

        {/* 10. Counterfactual Tactical Alternatives */}
        {config.showDecisions && ball.x !== null && decisionAlternatives.map((alt, idx) => {
          const dx = alt.destination.x;
          const dy = toSvgY(alt.destination.y);
          const isActual = alt.is_actual_decision;
          const strokeColor = isActual ? '#3b82f6' : '#a855f7';

          return (
            <g key={idx}>
              <line
                x1={bx}
                y1={by}
                x2={dx}
                y2={dy}
                stroke={strokeColor}
                strokeWidth={isActual ? 0.6 : 0.45}
                strokeDasharray={isActual ? undefined : '2,1'}
                markerEnd={isActual ? 'url(#arrow-green)' : 'url(#arrow-counterfactual)'}
              />
              <rect
                x={(bx + dx) / 2 - 3.5}
                y={(by + dy) / 2 - 1.5}
                width="7.0"
                height="2.8"
                rx="0.6"
                fill="#1e1b4b"
                stroke={strokeColor}
                strokeWidth="0.3"
              />
              <text
                x={(bx + dx) / 2}
                y={(by + dy) / 2 + 0.4}
                fill={isActual ? '#60a5fa' : '#c084fc'}
                fontSize="1.3"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {alt.action_type} {alt.tactical_expected_value > 0 ? `+${alt.tactical_expected_value.toFixed(3)}` : alt.tactical_expected_value.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* 11. Player Movement Trails */}
        {config.showPlayerTrails && playerTrails.map((trail) => {
          const color = trail.team === 'Home' ? '#60a5fa' : '#f87171';
          return (
            <g key={`trail-${trail.player_id}`}>
              {trail.points.map((pt, pIdx) => (
                <circle
                  key={pIdx}
                  cx={pt.x}
                  cy={pt.y}
                  r={0.8 * pt.alpha}
                  fill={color}
                  opacity={pt.alpha * 0.6}
                />
              ))}
              {trail.points.length > 1 && (
                <polyline
                  points={trail.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.25"
                  strokeDasharray="1,1"
                  opacity={0.4}
                />
              )}
            </g>
          );
        })}

        {/* 12. Home Players (Blue) */}
        {frame.home_players.map((p) => {
          const px = p.x;
          const py = toSvgY(p.y);
          const isSelected = selectedPlayerId === p.player_id;
          const speed = p.speed || 0;
          const accel = p.acceleration || 0;
          const isBroken = isBrokenLine && config.defendingTeam === 'Home' && brokenDefenderId === p.player_id;

          return (
            <g
              key={p.player_id}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelectPlayer && onSelectPlayer(p)}
            >
              {/* Velocity Arrow */}
              {config.showVelocityArrows && speed > 0.6 && (
                <line
                  x1={px}
                  y1={py}
                  x2={px + p.vx * 0.8}
                  y2={py - p.vy * 0.8}
                  stroke="rgba(96, 165, 250, 0.85)"
                  strokeWidth="0.35"
                  markerEnd="url(#arrow-velocity-home)"
                />
              )}

              {/* Broken Line Indicator */}
              {isBroken && (
                <circle cx={px} cy={py} r="3.6" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" className="animate-ping" />
              )}

              {/* Selection Ring */}
              {isSelected && (
                <circle cx={px} cy={py} r="3.0" fill="none" stroke="#38bdf8" strokeWidth="0.45" strokeDasharray="1,1" />
              )}

              {/* Player Disc */}
              <circle
                cx={px}
                cy={py}
                r="1.8"
                fill="#2563eb"
                stroke="#60a5fa"
                strokeWidth="0.35"
              />
              {/* Jersey Number */}
              <text
                x={px}
                y={py + 0.6}
                fill="#ffffff"
                fontSize="1.4"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {p.jersey_number}
              </text>

              {/* Acceleration / Deceleration Indicator */}
              {config.showAccelerationBadges && Math.abs(accel) >= 1.5 && (
                <g>
                  <circle
                    cx={px + 2.0}
                    cy={py - 2.0}
                    r="1.0"
                    fill={accel > 0 ? '#10b981' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="0.2"
                  />
                  <text
                    x={px + 2.0}
                    y={py - 1.6}
                    fill="#ffffff"
                    fontSize="1.0"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {accel > 0 ? '▲' : '▼'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 13. Away Players (Red) */}
        {frame.away_players.map((p) => {
          const px = p.x;
          const py = toSvgY(p.y);
          const isSelected = selectedPlayerId === p.player_id;
          const speed = p.speed || 0;
          const accel = p.acceleration || 0;
          const isBroken = isBrokenLine && config.defendingTeam === 'Away' && brokenDefenderId === p.player_id;

          return (
            <g
              key={p.player_id}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => onSelectPlayer && onSelectPlayer(p)}
            >
              {/* Velocity Arrow */}
              {config.showVelocityArrows && speed > 0.6 && (
                <line
                  x1={px}
                  y1={py}
                  x2={px + p.vx * 0.8}
                  y2={py - p.vy * 0.8}
                  stroke="rgba(248, 113, 113, 0.85)"
                  strokeWidth="0.35"
                  markerEnd="url(#arrow-velocity-away)"
                />
              )}

              {/* Broken Line Indicator */}
              {isBroken && (
                <circle cx={px} cy={py} r="3.6" fill="none" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" className="animate-ping" />
              )}

              {/* Selection Ring */}
              {isSelected && (
                <circle cx={px} cy={py} r="3.0" fill="none" stroke="#f87171" strokeWidth="0.45" strokeDasharray="1,1" />
              )}

              {/* Player Disc */}
              <circle
                cx={px}
                cy={py}
                r="1.8"
                fill="#dc2626"
                stroke="#f87171"
                strokeWidth="0.35"
              />
              {/* Jersey Number */}
              <text
                x={px}
                y={py + 0.6}
                fill="#ffffff"
                fontSize="1.4"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {p.jersey_number}
              </text>

              {/* Acceleration / Deceleration Indicator */}
              {config.showAccelerationBadges && Math.abs(accel) >= 1.5 && (
                <g>
                  <circle
                    cx={px + 2.0}
                    cy={py - 2.0}
                    r="1.0"
                    fill={accel > 0 ? '#10b981' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="0.2"
                  />
                  <text
                    x={px + 2.0}
                    y={py - 1.6}
                    fill="#ffffff"
                    fontSize="1.0"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {accel > 0 ? '▲' : '▼'}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 14. Ball (Gold) */}
        {ball.x !== null && (
          <g>
            <circle cx={bx} cy={by} r="2.0" fill="rgba(251, 191, 36, 0.25)" className="animate-ping" />
            <circle cx={bx} cy={by} r="1.1" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.35" />
          </g>
        )}
      </svg>
    </div>
  );
});
