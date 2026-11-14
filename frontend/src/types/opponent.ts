/**
 * Type definitions for Phase 17: Multi-Match Opponent Intelligence & Analysis Engine.
 */

export interface DataQualityReport {
  match_id: string;
  completeness_pct: number;
  missing_tracking_frames: number;
  missing_ball_frames: number;
  coordinate_system: string;
  tracking_hz: number;
  pitch_dimensions: string;
  quality_tier: string;
  validation_timestamp: string;
}

export interface MatchMetadata {
  match_id: string;
  match_date: string;
  competition: string;
  season: string;
  home_team: string;
  away_team: string;
  final_score: string;
  data_source: string;
  tracking_available: boolean;
  tracking_fps: number;
  event_available: boolean;
  total_frames: number;
  periods: number;
  data_quality: string;
  tactical_summary: string;
  data_quality_report?: DataQualityReport;
}

export interface CompatibilityComponent {
  name: string;
  score: number;
  weight: number;
  status: string;
  details: string;
}

export interface MatchCompatibilityScore {
  overall_score: number;
  is_compatible: boolean;
  evaluated_matches: string[];
  components: CompatibilityComponent[];
  warnings: string[];
  recommendations: string[];
}

export interface ChannelDistribution {
  left_wing_pct: number;
  left_half_space_pct: number;
  central_pct: number;
  right_half_space_pct: number;
  right_wing_pct: number;
}

export interface AttackingDNA {
  progression_velocity_mps: number;
  directness_index: number;
  attacking_width_m: number;
  attacking_depth_m: number;
  channel_distribution: ChannelDistribution;
  final_third_entries_per_match: number;
  cutback_frequency_pct: number;
  cross_frequency_pct: number;
  preferred_flank: string;
  key_orchestrator: string;
  tactical_summary: string;
}

export interface DefensiveDNA {
  mean_defensive_line_height_m: number;
  block_type: string;
  mean_compactness_m2: number;
  min_compactness_m2: number;
  mean_stretch_index_m: number;
  inter_line_gap_m: number;
  offside_line_disparity_m: number;
  defensive_width_m: number;
  central_penetration_conceded_pct: number;
  wide_overload_vulnerability_pct: number;
  recovery_speed_mps: number;
  tactical_summary: string;
}

export interface PressingDNA {
  pressing_frequency_pct: number;
  mean_pressure_intensity_pct: number;
  peak_closing_velocity_mps: number;
  mean_time_to_contact_s: number;
  initiation_zone_high_pct: number;
  initiation_zone_mid_pct: number;
  initiation_zone_low_pct: number;
  cover_shadow_obstruction_pct: number;
  preferred_pressing_trap: string;
  pressing_success_rate_pct: number;
  tactical_summary: string;
}

export interface TransitionDNA {
  counterattack_velocity_mps: number;
  counterattack_frequency_pct: number;
  forward_pass_ratio_in_transition: number;
  defensive_recovery_speed_mps: number;
  mean_space_exposed_post_turnover_m2: number;
  counterpress_duration_s: number;
  transition_style: string;
  tactical_summary: string;
}

export interface OpponentTacticalProfile {
  team: string;
  matches_analyzed: string[];
  total_sequences: number;
  data_quality_score: number;
  overall_tactical_archetype: string;
  attacking_dna: AttackingDNA;
  defensive_dna: DefensiveDNA;
  pressing_dna: PressingDNA;
  transition_dna: TransitionDNA;
  radar_metrics: Record<string, number>;
}

export interface SupportingSequenceRef {
  match_id: string;
  sequence_id: string;
  start_frame: number;
  end_frame: number;
  timestamp_desc: string;
  key_players: string[];
  observed_metric: string;
}

export interface CrossMatchTacticalPattern {
  pattern_id: string;
  name: string;
  category: string;
  team: string;
  matches_present: string[];
  recurrence_count: number;
  recurrence_rate_pct: number;
  confidence_level: string;
  supporting_sequences: SupportingSequenceRef[];
  measured_observation: string;
  statistical_inference: string;
  tactical_interpretation: string;
  suggested_coaching_action: string;
  limitations: string;
}

export interface SupportingEvidenceItem {
  match_id: string;
  sequence_id: string;
  frame_timestamp: string;
  metric_value: string;
  involved_players: string[];
  description: string;
}

export interface OpponentWeakness {
  weakness_id: string;
  name: string;
  category: string;
  severity: string;
  vulnerability_score: number;
  recurrence_count: number;
  matches_present: string[];
  scoring_breakdown: Record<string, number>;
  measured_facts: string;
  tactical_implication: string;
  recommended_exploit: string;
  prescribed_drill: string;
  supporting_evidence: SupportingEvidenceItem[];
  limitations: string;
}

export interface OpponentStrength {
  strength_id: string;
  name: string;
  category: string;
  impact_level: string;
  strength_score: number;
  recurrence_count: number;
  matches_present: string[];
  measured_facts: string;
  tactical_threat: string;
  recommended_countermeasure: string;
  prescribed_drill: string;
  supporting_evidence: SupportingEvidenceItem[];
  limitations: string;
}

export interface TacticalMetricDelta {
  metric_name: string;
  game_1_value: number;
  game_2_value: number;
  delta_value: number;
  percentage_change: number;
  unit: string;
  interpretation: string;
  is_statistically_significant: boolean;
  statistical_classification?: string;
  sample_size_description?: string;
}

export interface TacticalEvolutionTimelineEvent {
  match_id: string;
  match_date: string;
  tactical_shift_headline: string;
  primary_adjustment: string;
  key_metrics_snapshot: Record<string, number>;
  coach_takeaway: string;
}

export interface OpponentTacticalEvolutionReport {
  team: string;
  matches_compared: string[];
  timeline: TacticalEvolutionTimelineEvent[];
  metric_deltas: TacticalMetricDelta[];
  overall_evolution_summary: string;
  tactical_trend_status: string;
  strategic_recommendations: string[];
}

export interface PlayerMultiMatchProfile {
  player_id: string;
  jersey_number: string;
  team: string;
  tactical_role: string;
  matches_played: number;
  total_sequences_involved: number;
  mean_position_x_m: number;
  mean_position_y_m: number;
  sprint_frequency_per_match: number;
  peak_velocity_mps: number;
  space_creation_rating: number;
  pressing_engagement_rating: number;
  progression_involvement_pct: number;
  key_tactical_tendency: string;
  defensive_vulnerability_association?: string;
  coach_tactical_cue: string;
  identity_confidence_tier?: string;
  mapping_notes?: string;
}

export interface OpponentSquadIntelligence {
  team: string;
  matches_analyzed: string[];
  key_attacking_threats: PlayerMultiMatchProfile[];
  progression_architects: PlayerMultiMatchProfile[];
  defensive_anchors: PlayerMultiMatchProfile[];
  pressing_catalysts: PlayerMultiMatchProfile[];
  all_players: PlayerMultiMatchProfile[];
  overall_squad_tactical_summary: string;
}

export interface TacticalPreparationPlan {
  recommendation_id: string;
  headline: string;
  category: string;
  target_phase: string;
  priority: string;
  confidence_level: string;
  measured_observation: string;
  supporting_matches: string[];
  supporting_sequence_ids?: string[];
  supporting_metric_value?: string;
  tactical_implication: string;
  coaching_action_plan: string;
  prescribed_drill_title: string;
  drill_setup_and_cues: string;
  limitations: string;
  status?: string;
}

export interface OpponentPreparationStrategy {
  opponent_team: string;
  matches_analyzed: string[];
  executive_game_plan: string;
  primary_attacking_exploits: TacticalPreparationPlan[];
  primary_defensive_countermeasures: TacticalPreparationPlan[];
  training_week_agenda: Array<{ day: string; focus: string }>;
  analytical_limitations: string;
}
