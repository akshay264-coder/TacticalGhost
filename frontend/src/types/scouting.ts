export interface PlayerIdentity {
  player_id: string;
  tracking_id: string;
  jersey_number: string;
  team: string;
  match_ids: string[];
  identity_confidence_tier: string;
  mapping_provenance: string;
  profile_created_at: string;
  profile_updated_at: string;
}

export interface DataQualityReport {
  tracking_completeness_pct: number;
  missing_frames_count: number;
  position_continuity_pct: number;
  coordinate_validity_pct: number;
  match_duration_coverage_pct: number;
  event_coverage_pct: number;
  overall_quality_score: number;
  quality_tier: string;
  validation_notes: string;
}

export interface AttackingMetrics {
  forward_progression_m: number;
  mean_possession_x_m: number;
  mean_possession_y_m: number;
  attacking_width_m: number;
  half_space_occupation_pct: number;
  runs_behind_line_count: number;
  support_positioning_score: number;
  space_creation_rating: number;
  passing_involvement_pct: number;
  passing_lane_creation_count: number;
  third_man_runs_count: number;
  calculation_basis: string;
}

export interface DefensiveMetrics {
  defensive_line_coordination_m: number;
  recovery_velocity_mps: number;
  compactness_contribution_m2: number;
  space_protection_rating: number;
  defensive_tracking_distance_m: number;
  interception_opportunities: number;
  opposition_runner_tracking_pct: number;
  calculation_basis: string;
}

export interface PressingMetrics {
  pressing_engagement_pct: number;
  mean_closing_velocity_mps: number;
  peak_closing_velocity_mps: number;
  mean_time_to_intercept_s: number;
  cover_shadow_efficiency_pct: number;
  pressing_trap_participations: number;
  defensive_support_during_press_score: number;
  calculation_basis: string;
}

export interface TransitionMetrics {
  counterattack_release_speed_mps: number;
  post_turnover_recovery_speed_mps: number;
  defensive_rest_structure_index: number;
  transition_space_occupation_m2: number;
  forward_transition_support_runs: number;
  calculation_basis: string;
}

export interface PlayerTacticalProfile {
  attacking: AttackingMetrics;
  defensive: DefensiveMetrics;
  pressing: PressingMetrics;
  transition: TransitionMetrics;
  radar_scores: Record<string, number>;
  measured_facts: string;
  tactical_strengths: string[];
  potential_vulnerabilities: string[];
  limitations_disclaimer: string;
}

export interface PlayerScoutingProfile {
  identity: PlayerIdentity;
  data_quality: DataQualityReport;
  tactical_profile: PlayerTacticalProfile;
  primary_role: string;
  secondary_role?: string;
  hybrid_classification: string;
  role_confidence: number;
}

export interface OffBallContribution {
  contribution_id: string;
  player_id: string;
  match_id: string;
  sequence_id: string;
  frame_start: number;
  frame_end: number;
  timestamp_start_s: number;
  timestamp_end_s: number;
  movement_type: string;
  start_position: [number, number];
  end_position: [number, number];
  distance_covered_m: number;
  peak_speed_mps: number;
  space_created_m2: number;
  pitch_control_delta_pct: number;
  displaced_defenders: string[];
  defensive_line_displacement_m: number;
  tactical_value_established: boolean;
  confidence_level: string;
  tactical_interpretation: string;
  coaching_cue: string;
}

export interface RoleClassificationResult {
  player_id: string;
  primary_role: string;
  secondary_role?: string;
  hybrid_classification: string;
  role_confidence: number;
  positional_zone: string;
  explainable_rationale: string[];
  archetype_fit_scores: Record<string, number>;
  cross_match_evolution_notes: string;
}

export interface MetricDeltaItem {
  dimension: string;
  player_a_value: number;
  player_b_value: number;
  delta_value: number;
  percentage_difference: number;
  unit: string;
  favored_player: string;
  tactical_interpretation: string;
}

export interface ComparisonWarning {
  warning_type: string;
  severity: string;
  message: string;
}

export interface PlayerComparisonResult {
  player_a_id: string;
  player_b_id: string;
  player_a_role: string;
  player_b_role: string;
  roles_are_compatible: boolean;
  role_adjustment_applied: boolean;
  warnings: ComparisonWarning[];
  radar_comparison: Record<string, Record<string, number>>;
  metric_deltas: MetricDeltaItem[];
  overall_comparison_verdict: string;
  methodology_note: string;
}

export interface RequirementAssessment {
  requirement_name: string;
  target_metric: string;
  measured_value: number;
  ideal_threshold: number;
  compatibility_pct: number;
  weight_applied: number;
  weighted_score: number;
  supporting_evidence: string;
  missing_evidence_or_gap?: string;
}

export interface SensitivityShift {
  tested_priority: string;
  rank_delta: number;
  score_delta: number;
  tactical_rationale: string;
}

export interface PlayerTacticalFitResult {
  player_id: string;
  player_role: string;
  tactical_philosophy_name: string;
  overall_fit_score: number;
  confidence_tier: string;
  data_quality_score: number;
  requirement_breakdown: RequirementAssessment[];
  executive_summary: string;
  coaching_takeaway: string;
  sensitivity_analysis: SensitivityShift[];
  analytical_disclaimers: string;
}

export interface ShortlistCandidate {
  player_id: string;
  tracking_id: string;
  jersey_number: string;
  team: string;
  primary_role: string;
  hybrid_classification: string;
  data_quality_score: number;
  scouting_notes: string;
  tags: string[];
  target_philosophy: string;
  fit_score: number;
  date_added: string;
  last_updated: string;
}

export interface ShortlistDossierExport {
  title: string;
  export_timestamp: string;
  total_candidates: number;
  candidates: ShortlistCandidate[];
  methodology_disclaimer: string;
}
