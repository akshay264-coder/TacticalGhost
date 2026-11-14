/**
 * TacticalGhost — Phase 19 Coach Decision Support System Type Definitions.
 */

export interface FormationSlot {
  slot_id: string;
  role_name: string;
  archetype_required: string;
  default_pitch_x_m: number;
  default_pitch_y_m: number;
  tactical_duty: string;
}

export interface CandidateFormationEvaluation {
  formation_name: string;
  compatibility_score: number;
  suitability_tier: 'HIGHLY_RECOMMENDED' | 'VIABLE_ALTERNATIVE' | 'SITUATIONAL_RISK' | string;
  strengths: string[];
  weaknesses: string[];
  player_role_suitability_score: number;
  rest_defense_score?: number;
  flank_overload_score?: number;
  opponent_exploit_score?: number;
  opponent_specific_advantages: string[];
  defensive_risks: string[];
  slots: FormationSlot[];
  supporting_evidence: string;
  confidence_tier: string;
  data_limitations: string;
}

export interface SelectedPlayerSlot {
  slot_id: string;
  slot_role: string;
  tactical_duty: string;
  assigned_player_id: string;
  jersey_number: string;
  team: string;
  primary_role: string;
  hybrid_classification: string;
  role_fit_score: number;
  data_quality_score: number;
  is_provisional?: boolean;
  identity_confidence?: number;
  key_strengths: string[];
  tactical_justification: string;
}

export interface BenchCandidate {
  player_id: string;
  jersey_number: string;
  primary_role: string;
  hybrid_classification: string;
  tactical_role_utility: string;
  data_quality_score: number;
  is_provisional?: boolean;
  identity_confidence?: number;
  replacement_target_slots: string[];
}

export interface ReplacementScenarioResult {
  target_slot_id: string;
  incumbent_player_id: string;
  replacement_player_id: string;
  incumbent_role_fit: number;
  replacement_role_fit: number;
  progression_delta_m: number;
  space_creation_delta: number;
  pressing_velocity_delta_mps: number;
  tactical_tradeoff_verdict: string;
  tactical_recommendation: string;
}

export interface StartingXIPlan {
  formation_name: string;
  total_squad_size: number;
  starting_xi: SelectedPlayerSlot[];
  bench: BenchCandidate[];
  squad_tactical_balance_score: number;
  unfilled_slots: string[];
  analytical_disclaimers: string;
}

export interface ExploitationPlanItem {
  corridor_category: 'WIDE_CHANNEL' | 'CENTRAL_POCKET' | 'PRESSING_BYPASS' | 'TRANSITION_SURGE' | string;
  headline: string;
  target_opponent_vulnerability: string;
  observed_metric_evidence: string;
  spatial_x_range_m?: [number, number];
  spatial_y_range_m?: [number, number];
  supporting_matches: string[];
  supporting_sequences: string[];
  tactical_mechanism: string;
  prescribed_attacking_pattern: string;
  potential_counter_risks: string[];
  confidence_tier: string;
  key_player_targets: string[];
  drill_recommendation: string;
}

export interface OpponentExploitationOverview {
  opponent_team: string;
  matches_analyzed: string[];
  overall_vulnerability_index: number;
  primary_strategic_corridor: string;
  exploitation_plans: ExploitationPlanItem[];
  analytical_disclaimer: string;
}

export interface CountermeasurePlanItem {
  threat_category: string;
  target_opponent_strength: string;
  observed_metric_evidence: string;
  supporting_matches: string[];
  potential_tactical_threat: string;
  prescribed_defensive_response: string;
  epistemic_classification?: string;
  tactical_tradeoffs: string[];
  alternative_tactical_approach: string;
  key_opponent_threat_actors: string[];
  assigned_defensive_duties: string;
  confidence_tier: string;
}

export interface DefensiveCountermeasureOverview {
  opponent_team: string;
  matches_analyzed: string[];
  opponent_threat_index: number;
  primary_threat_category: string;
  countermeasures: CountermeasurePlanItem[];
  analytical_disclaimer: string;
}

export interface ScenarioAdjustmentParams {
  baseline_formation: string;
  target_formation: string;
  defensive_line_shift_m: number;
  pressing_intensity_delta_pct: number;
  attacking_width_mode: 'WIDE' | 'BALANCED' | 'NARROW_INVERTED' | string;
  midfield_pivot_structure: 'SINGLE_PIVOT' | 'DOUBLE_PIVOT' | 'FLAT_THREE' | string;
  player_substitutions?: Record<string, string>;
}

export interface ScenarioMetricDelta {
  metric_name: string;
  baseline_value: number;
  simulated_value: number;
  delta_value: number;
  percentage_change: number;
  unit: string;
  tactical_interpretation: string;
}

export interface TacticalScenarioResult {
  scenario_id: string;
  scenario_name: string;
  scenario_description: string;
  params: ScenarioAdjustmentParams;
  metric_deltas: ScenarioMetricDelta[];
  evidence_category?: string;
  observed_match_facts: string[];
  model_derived_estimates: string[];
  hypothetical_scenario_assumptions: string[];
  tactical_tradeoffs: string[];
  strategic_verdict: string;
  uncertainty_level: 'LOW' | 'MODERATE' | 'HIGH' | string;
  confidence_score_pct: number;
  scientific_disclaimer: string;
}

export interface TacticalAlertItem {
  alert_id: string;
  timestamp_s: number;
  frame_number: number;
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY' | 'INFORMATIONAL' | string;
  tactical_event: string;
  observed_metric: string;
  structural_change_detected: string;
  coaching_implication: string;
  recommended_adjustment: string;
  target_player_roles: string[];
}

export interface InGameMonitoringSummary {
  monitoring_mode: string;
  analyzed_sequence_id: string;
  frame_range: string;
  total_alerts_detected: number;
  opponent_pressing_trend: string;
  defensive_compactness_trend: string;
  inter_line_space_status: string;
  alerts: TacticalAlertItem[];
  live_limitation_statement: string;
}

export interface CoachingDrill {
  drill_id: string;
  title: string;
  grid_dimensions_m: string;
  player_setup: string;
  target_phase: string;
  duration_minutes: number;
  exercise_progression: string;
  key_coaching_cues: string[];
  intended_learning_outcome: string;
}

export interface TrainingPriorityItem {
  priority_id: string;
  rank: number;
  headline: string;
  tactical_objective: string;
  urgency_level: string;
  observed_match_evidence: string;
  supporting_matches: string[];
  supporting_sequence_ids: string[];
  relevant_player_roles: string[];
  prescribed_drill: CoachingDrill;
  limitations: string;
}

export interface TrainingProgramOverview {
  opponent_target: string;
  training_cycle_name: string;
  total_priorities: number;
  priorities: TrainingPriorityItem[];
  methodological_disclaimer: string;
}

export interface DecisionExplanationAudit {
  decision_id: string;
  decision_category: string;
  what_is_recommended: string;
  what_evidence_supports_it: string;
  why_does_it_matter_tactically: string;
  advantages: string[];
  disadvantages_and_risks: string[];
  assumptions_made: string[];
  system_confidence_pct: number;
  confidence_tier: string;
  evidence_category?: string;
  missing_information_and_limitations: string;
  source_module: string;
  source_match_ids: string[];
  source_sequence_ids: string[];
  source_player_ids: string[];
  measured_metric_values: Record<string, any>;
  data_quality_score: number;
}

export interface TacticalApproachOption {
  approach_id: string;
  name: string;
  headline: string;
  target_formation: string;
  core_philosophy: string;
  tactical_compatibility_score: number;
  squad_suitability_score: number;
  defensive_risk_index: number;
  confidence_tier: string;
  key_advantages: string[];
  disadvantages_and_risks: string[];
  uncertainties_and_assumptions: string[];
  recommended_roles: Record<string, string>;
}

export interface MatchPreparationReport {
  opponent_team: string;
  available_matches: string[];
  tactical_philosophy: string;
  preferred_formation: string;
  section_1_opponent_tactical_identity: string;
  section_2_opponent_attacking_tendencies: string;
  section_3_opponent_defensive_structure: string;
  section_4_pressing_behaviour: string;
  section_5_transition_behaviour: string;
  section_6_recurring_tactical_patterns: string[];
  section_7_main_attacking_threats: string[];
  section_8_defensive_vulnerabilities: string[];
  section_9_player_specific_threats: string[];
  section_10_recommended_tactical_approach: TacticalApproachOption;
  section_11_suggested_formation: CandidateFormationEvaluation;
  section_12_player_role_assignments: Array<{
    slot: string;
    role: string;
    player: string;
    duty: string;
    fit_score: number;
  }>;
  section_13_defensive_priorities: string[];
  section_14_attacking_priorities: string[];
  section_15_training_preparation_priorities: Array<{
    priority: string;
    drill: string;
    setup: string;
    duration: string;
  }>;
  data_quality_score: number;
  traceability_audit: DecisionExplanationAudit;
  limitations_disclaimer: string;
}

export type float = number;
