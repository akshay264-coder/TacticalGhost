import { SequenceMeta, OffBallRun } from './tactical';

export interface SequenceValidationDetails {
  missing_ball_frames: number;
  missing_player_frames: number;
  out_of_bounds_coords: number;
}

export interface SequenceValidationResult {
  is_valid: boolean;
  sequence_id: string;
  total_frames: number;
  fps: number;
  duration_s: number;
  ball_coverage_pct: number;
  player_coverage_pct: number;
  warnings: string[];
  errors: string[];
  details: SequenceValidationDetails;
}

export interface SpatialSummary {
  attacking_team: string;
  defending_team: string;
  avg_convex_hull_area_m2: number;
  min_convex_hull_area_m2: number;
  max_convex_hull_area_m2: number;
  avg_stretch_index_m: number;
  avg_defensive_line_height_m: number;
  avg_inter_line_gap_m: number;
  broken_defensive_lines_pct: number;
  mid_pitch_control_attacking_pct: number;
  mid_pitch_control_defending_pct: number;
  total_sampled_frames: number;
}

export interface PressingSummary {
  avg_pressure_score: number;
  peak_pressure_score: number;
  avg_closing_speed_mps: number;
  peak_closing_speed_mps: number;
  min_time_to_contact_s: number;
  avg_time_to_contact_s: number;
  avg_pressers_involved: number;
  coordinated_traps_frequency_pct: number;
  avg_cover_shadow_width_deg: number;
}

export interface AttackingSummary {
  total_off_ball_runs: number;
  decoy_runs_count: number;
  avg_decoy_score: number;
  total_space_created_m2: number;
  space_creation_rate_m2_per_sec: number;
  completed_passes_count: number;
  progressive_passes_count: number;
  final_action: string;
  runs_detail: OffBallRun[];
}

export interface DecisionMomentSummary {
  frame: number;
  time_s: number;
  carrier: string;
  actual_action: string;
  actual_tev: number;
  best_action: string;
  best_tev: number;
  tev_opportunity_delta: number;
  explanation: string;
}

export interface CounterfactualSummary {
  total_decision_moments: number;
  avg_options_available: number;
  avg_xt_generated: number;
  avg_actual_tev: number;
  avg_max_alternative_tev: number;
  decision_efficiency_ratio: number;
  moments: DecisionMomentSummary[];
}

export interface SequenceComparativeBranch {
  metadata: SequenceMeta;
  spatial: SpatialSummary;
  pressing: PressingSummary;
  attacking: AttackingSummary;
  decisions: CounterfactualSummary;
}

export interface ComparativeDeltas {
  convex_hull_area_delta_m2: number;
  defensive_line_height_delta_m: number;
  pressure_score_delta: number;
  space_created_delta_m2: number;
  decision_efficiency_delta: number;
}

export interface FullComparisonData {
  validation: {
    sequence_a: SequenceValidationResult;
    sequence_b: SequenceValidationResult;
    is_comparable: boolean;
  };
  sequence_a: SequenceComparativeBranch;
  sequence_b: SequenceComparativeBranch;
  comparative_deltas: ComparativeDeltas;
  comparative_findings: string[];
}
