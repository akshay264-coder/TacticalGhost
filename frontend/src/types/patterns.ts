export interface TacticalPatternItem {
  pattern_id: string;
  pattern_type: 'wide_overload' | 'central_overload' | 'half_space_occupation' | 'pressing_trap' | 'line_break' | 'counter_attack' | 'off_ball_run';
  pattern_name: string;
  sequence_id: string;
  team: string;
  frame_start: number;
  frame_end: number;
  timestamp_start_s: number;
  timestamp_end_s: number;
  duration_s: number;
  confidence: number;
  evidence_quality: 'High' | 'Medium' | 'Low';
  supporting_observations: string[];
  relevant_players: string[];
  spatial_zone: string;
  spatial_coordinates: {
    x: number;
    y: number;
    zone: string;
  };
  detection_methodology: string;
  tactical_summary: string;
  coach_explanation: string;
  actionable_recommendation: string;
  drill_recommendation: string;
}

export interface OpponentWeaknessItem {
  weakness_id: string;
  weakness_type: 'inter_line_gap' | 'wide_isolation' | 'broken_offside_line' | 'slow_recovery' | 'pressing_breakdown';
  title: string;
  target_team: string;
  severity: 'Critical' | 'High' | 'Moderate';
  recurrence_count: number;
  frequency_rate: number;
  supporting_sequences: string[];
  supporting_frames: number[];
  affected_players: string[];
  measured_metrics: Record<string, any>;
  tactical_implication: string;
  actionable_exploit_plan: string;
}

export interface AttackingOpportunityItem {
  opportunity_id: string;
  opportunity_type: 'cutback_corridor' | 'overload_exploit' | 'third_man_combination' | 'progressive_channel' | 'space_creation_exploit';
  title: string;
  attacking_team: string;
  exploit_potential: 'Very High' | 'High' | 'Promising';
  sequence_id: string;
  frame_moment: number;
  key_actors: string[];
  spatial_target: string;
  underlying_metrics: Record<string, any>;
  coach_cue: string;
  training_drill: string;
}

export interface CoachInsightItem {
  insight_id: string;
  headline: string;
  category: 'Team Pattern' | 'Opponent Weakness' | 'Attacking Opportunity';
  badge: string;
  severity_or_potential: string;
  team: string;
  sequence_id: string;
  frame_moment: number;
  timestamp_label: string;
  relevant_players: string[];
  confidence_score: number;
  measured_observation: string;
  coach_explanation: string;
  actionable_recommendation: string;
  training_drill: string;
}

export interface MatchPatternSummary {
  match_id: string;
  match_title: string;
  total_sequences_analyzed: number;
  total_patterns_detected: number;
  total_weaknesses_identified: number;
  total_opportunities_identified: number;
  patterns: TacticalPatternItem[];
  weaknesses: OpponentWeaknessItem[];
  opportunities: AttackingOpportunityItem[];
  coach_insights: CoachInsightItem[];
}

export interface PatternComparisonMatrixItem {
  pattern_type: string;
  type_display: string;
  sequence_a_count: number;
  sequence_b_count: number;
  delta: number;
}

export interface PatternComparisonData {
  sequence_a: {
    sequence_id: string;
    title: string;
    total_patterns: number;
    flank_distribution: { left: number; central: number; right: number };
  };
  sequence_b: {
    sequence_id: string;
    title: string;
    total_patterns: number;
    flank_distribution: { left: number; central: number; right: number };
  };
  comparison_matrix: PatternComparisonMatrixItem[];
  tactical_differential_summary: string;
}
