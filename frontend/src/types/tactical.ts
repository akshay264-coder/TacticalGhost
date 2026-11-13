export interface PlayerPos {
  player_id: string;
  jersey_number: string;
  team: 'Home' | 'Away';
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  acceleration?: number;
  cumulative_distance_m?: number;
}

export interface BallPos {
  x: number | null;
  y: number | null;
  vx: number;
  vy: number;
}

export interface TrackingFrame {
  frame: number;
  time_s: number;
  ball: BallPos;
  home_players: PlayerPos[];
  away_players: PlayerPos[];
}

export interface MatchEvent {
  team: string;
  type: string;
  subtype: string | null;
  start_frame: number;
  end_frame: number;
  from_player: string | null;
  to_player: string | null;
  start_x_m: number | null;
  start_y_m: number | null;
}

export interface SequenceMeta {
  sequence_id: string;
  title: string;
  match_id: string;
  period: number;
  start_frame: number;
  end_frame: number;
  start_time_s: number;
  end_time_s: number;
  duration_s: number;
  attacking_team: 'Home' | 'Away';
  defending_team: 'Home' | 'Away';
  key_events: string[];
  tactical_theme: string;
  decision_frames: number[];
}

export interface OffBallRun {
  run_id: string;
  player_id: string;
  jersey_number: string;
  team: string;
  start_frame: number;
  end_frame: number;
  duration_s: number;
  start_position: { x: number; y: number };
  end_position: { x: number; y: number };
  distance_m: number;
  avg_speed_mps: number;
  run_type: string;
  dragged_defender_id: string | null;
  marker_tracking_index: number;
  space_created_m2: number;
  decoy_score: number;
  explanation: string;
}

export interface SpaceCreationData {
  sequence_id: string;
  attacking_team: string;
  total_runs_detected: number;
  runs: OffBallRun[];
}

export interface VulnerableZone {
  zone_name: string;
  center_point: { x: number; y: number };
  danger_score: number;
  attacking_control_prob: number;
  carrier_freedom: number;
  defensive_cover_distance_m: number;
  explanation: string;
}

export interface DefensiveFrameAnalysis {
  defending_team: string;
  convex_hull_area_m2: number;
  stretch_index_m: number;
  horizontal_spread_m: number;
  vertical_spread_m: number;
  defensive_line_height_m: number;
  midfield_defense_gap_m: number;
  is_broken_line: boolean;
  broken_defender_id: string | null;
  vulnerabilities: VulnerableZone[];
}

export interface PresserDetail {
  defender_id: string;
  jersey_number: string;
  distance_m: number;
  closing_speed_mps: number;
  time_to_contact_s: number;
  pressure_score: number;
}

export interface CoverShadowInfo {
  defender_id: string;
  jersey_number: string;
  distance_to_ball_m: number;
  center_angle_deg: number;
  angular_width_deg: number;
  blocked_teammates: string[];
  is_active_block: boolean;
}

export interface PressingFrameAnalysis {
  frame: number;
  ball_carrier?: {
    player_id: string;
    jersey_number: string;
    position: { x: number; y: number };
  };
  pressure: {
    total_pressure_score: number;
    primary_presser_id: string | null;
    primary_closing_speed_mps: number;
    time_to_contact_s: number;
    is_coordinated_trap: boolean;
    pressers_count: number;
    pressers_detail: PresserDetail[];
  };
  cover_shadows: CoverShadowInfo[];
}

export interface PassingOption {
  receiver_id: string;
  jersey_number: string;
  receiver_pos: { x: number; y: number };
  distance_m: number;
  angle_deg: number;
  forward_progression_m: number;
  receiver_pitch_control: number;
  interception_risk: number;
  is_in_cover_shadow: boolean;
  viability_score: number;
  tactical_category: string;
  explanation: string;
}

export interface PassingSynergyNetwork {
  team: string;
  nodes_count: number;
  viable_lanes_count: number;
  network_density: number;
  viable_edges: Array<{
    from: string;
    to: string;
    weight: number;
    category: string;
  }>;
}

export interface ActionAlternative {
  action_type: 'PASS' | 'CARRY' | 'SHOT';
  target_player_id: string | null;
  target_jersey: string | null;
  destination: { x: number; y: number };
  is_actual_decision: boolean;
  execution_success_prob: number;
  xt_gain: number;
  pitch_control_gain: number;
  tactical_expected_value: number;
  risk_level: string;
  recommendation_tier: string;
  explanation: string;
}

export interface DecisionEvaluation {
  decision_frame: number;
  associated_event: MatchEvent | null;
  evaluation: {
    frame: number;
    time_s: number;
    ball_carrier: {
      player_id: string;
      jersey_number: string;
      team: string;
      position: { x: number; y: number };
      current_xt: number;
    };
    total_options_evaluated: number;
    alternatives: ActionAlternative[];
  };
}

export interface PitchControlSurface {
  x_coords: number[];
  y_coords: number[];
  pitch_control_home: number[][];
  pitch_control_away: number[][];
  home_controlled_area_m2: number;
  away_controlled_area_m2: number;
  home_pitch_control_pct: number;
  away_pitch_control_pct: number;
}

export type PitchControlMode = 'dual' | 'home' | 'away' | 'contested';
export type PassingLaneFilter = 'all' | 'viable_only' | 'blocked_only';
export type TrailTarget = 'selected' | 'all';

export interface VisualizationLayersConfig {
  // Pitch control
  showPitchControl: boolean;
  pitchControlOpacity: number; // 0.1 to 1.0
  pitchControlMode: PitchControlMode;

  // Player kinematics & movement trails
  showPlayerTrails: boolean;
  trailLength: number; // 5, 10, 15, 20
  trailTarget: TrailTarget;
  showVelocityArrows: boolean;
  showAccelerationBadges: boolean;

  // Passing lanes
  showPassingLanes: boolean;
  passingLaneFilter: PassingLaneFilter;

  // Defensive block & structure
  showDefensiveBlock: boolean;
  defendingTeam: 'Home' | 'Away';
  showDefensiveLineHeight: boolean;
  showInterLineGaps: boolean;

  // Pressing & Cover Shadows
  showCoverShadows: boolean;
  showPressingVectors: boolean;
  showTimeThresholds: boolean;

  // Off-ball runs
  showRuns: boolean;
  showVacatedSpace: boolean;

  // Counterfactual alternatives
  showDecisions: boolean;

  // Tactical pitch zones
  showTacticalZones: boolean;
}
