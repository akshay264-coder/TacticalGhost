/**
 * TypeScript Interfaces for Automated Professional Tactical Reporting System (Phase 20).
 */

export type ReportType =
  | 'MATCH_INTELLIGENCE'
  | 'TACTICAL_ANALYSIS'
  | 'OPPONENT_ANALYSIS'
  | 'COACH_STRATEGY'
  | 'PLAYER_SCOUTING'
  | 'MULTI_MATCH_COMPARISON'
  | 'EXECUTIVE_SUMMARY';

export type EvidenceCategory =
  | 'OBSERVED_TRACKING_TELEMETRY'
  | 'DETERMINISTIC_MODEL_ESTIMATE'
  | 'TACTICAL_INTERPRETATION'
  | 'HYPOTHETICAL_COACHING_ASSUMPTION';

export type ExportFormat = 'html' | 'pdf' | 'json';

export interface ReportClaim {
  claim_id: string;
  claim_text: string;
  claim_type: string;
  evidence_category: EvidenceCategory;
  source_match_id: string;
  sequence_ids: string[];
  supporting_metrics: Record<string, any>;
  assumptions: string[];
  limitations: string[];
}

export interface ReportVisualization {
  viz_id: string;
  title: string;
  viz_type: string;
  svg_content: string;
  metric_definition: string;
  units: string;
  source_reference: string;
  interpretation: string;
  width?: number;
  height?: number;
}

export interface ReportSection {
  section_id: string;
  section_number: number;
  title: string;
  subtitle?: string;
  content_markdown: string;
  claims: ReportClaim[];
  visualizations: ReportVisualization[];
  key_metrics: Record<string, any>;
  subsections: Record<string, any>[];
}

export interface ReportRecommendation {
  recommendation_id: string;
  headline: string;
  details: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  target_team: string;
  evidence_category: EvidenceCategory;
  supporting_sequences: string[];
  counter_risks: string[];
  expected_outcomes: string[];
}

export interface ReportMetadata {
  report_id: string;
  report_type: ReportType;
  report_version: string;
  title: string;
  subtitle: string;
  generated_at: string;
  target_match_id?: string;
  source_matches: string[];
  source_datasets: string[];
  dataset_compatibility?: Record<string, any>;
  target_team?: string;
  target_player_id?: string;
  methodology_version: string;
  analyst_signoff: string;
  confidentiality_notice: string;
}

export interface StandardTacticalReport {
  metadata: ReportMetadata;
  executive_summary: string;
  sections: ReportSection[];
  visualizations: ReportVisualization[];
  recommendations: ReportRecommendation[];
  supporting_sequences: string[];
  evidence_classifications: Record<string, number>;
  limitations: string[];
  export_links: Record<string, string>;
}

export interface ReportGenerationRequest {
  report_type: ReportType;
  match_id?: string;
  secondary_match_id?: string;
  team?: string;
  opponent_team?: string;
  player_id?: string;
  preferred_formation?: string;
  tactical_philosophy?: string;
  export_formats?: ExportFormat[];
  custom_title?: string;
}

export interface ReportGenerationResponse {
  report_id: string;
  report_type: ReportType;
  status: string;
  generated_at: string;
  summary: string;
  export_links: Record<string, string>;
  report_data?: StandardTacticalReport;
}

export interface ReportTypeDefinition {
  type: ReportType;
  title: string;
  description: string;
  required_parameters: string[];
  optional_parameters: string[];
}

export interface ReportTemplateDefinition {
  template_id: string;
  name: string;
  report_type: ReportType;
  match_id?: string;
  secondary_match_id?: string;
  team?: string;
  opponent_team?: string;
  player_id?: string;
  preferred_formation?: string;
  tactical_philosophy?: string;
}

export interface ReportHistoryItem {
  report_id: string;
  report_type: ReportType;
  title: string;
  subtitle: string;
  generated_at: string;
  source_matches: string[];
  target_team?: string;
  target_player_id?: string;
  export_links: Record<string, string>;
}
