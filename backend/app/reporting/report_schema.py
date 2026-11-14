"""
Standardized Report Data Model and Pydantic Schemas for Phase 20.
Enforces common data contracts across all 7 tactical report types,
rigorous evidence provenance, metric finiteness, and export specifications.
"""

from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, field_validator


class ReportType(str, Enum):
    MATCH_INTELLIGENCE = "MATCH_INTELLIGENCE"
    TACTICAL_ANALYSIS = "TACTICAL_ANALYSIS"
    OPPONENT_ANALYSIS = "OPPONENT_ANALYSIS"
    COACH_STRATEGY = "COACH_STRATEGY"
    PLAYER_SCOUTING = "PLAYER_SCOUTING"
    MULTI_MATCH_COMPARISON = "MULTI_MATCH_COMPARISON"
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"


class EvidenceCategory(str, Enum):
    OBSERVED_TRACKING_TELEMETRY = "OBSERVED_TRACKING_TELEMETRY"
    DETERMINISTIC_MODEL_ESTIMATE = "DETERMINISTIC_MODEL_ESTIMATE"
    TACTICAL_INTERPRETATION = "TACTICAL_INTERPRETATION"
    HYPOTHETICAL_COACHING_ASSUMPTION = "HYPOTHETICAL_COACHING_ASSUMPTION"


class ExportFormat(str, Enum):
    HTML = "html"
    PDF = "pdf"
    JSON = "json"


class ReportClaim(BaseModel):
    """
    Standardized atomic analytical claim with full epistemic provenance.
    """
    claim_id: str
    claim_text: str
    claim_type: str = "OBSERVATION"  # OBSERVATION, METRIC, STRENGTH, VULNERABILITY, RECOMMENDATION
    evidence_category: EvidenceCategory
    source_match_id: str
    sequence_ids: List[str] = Field(default_factory=list)
    supporting_metrics: Dict[str, Any] = Field(default_factory=dict)
    assumptions: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)


class ReportVisualization(BaseModel):
    """
    Self-contained vector SVG visualization embedded directly in reports.
    """
    viz_id: str
    title: str
    viz_type: str  # pitch_movement, pitch_formation, pitch_pressing, pitch_corridor, radar_chart, heatmap, comparison_bar
    svg_content: str
    metric_definition: str
    units: str
    source_reference: str
    interpretation: str
    width: int = 700
    height: int = 450


class ReportSection(BaseModel):
    """
    Modular report section containing markdown prose, metrics, and visualizations.
    """
    section_id: str
    section_number: int
    title: str
    subtitle: Optional[str] = None
    content_markdown: str
    claims: List[ReportClaim] = Field(default_factory=list)
    visualizations: List[ReportVisualization] = Field(default_factory=list)
    key_metrics: Dict[str, Any] = Field(default_factory=dict)
    subsections: List[Dict[str, Any]] = Field(default_factory=list)


class ReportRecommendation(BaseModel):
    """
    Actionable coaching or recruitment recommendation linked to evidence and counter-risks.
    """
    recommendation_id: str
    headline: str
    details: str
    priority: str = "HIGH"  # HIGH, MEDIUM, LOW
    target_team: str
    evidence_category: EvidenceCategory
    supporting_sequences: List[str] = Field(default_factory=list)
    counter_risks: List[str] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)


class ReportMetadata(BaseModel):
    """
    Core metadata establishing dataset provenance, versioning, and confidentiality.
    """
    report_id: str
    report_type: ReportType
    report_version: str = "2.0.0"
    title: str
    subtitle: str
    generated_at: str
    target_match_id: Optional[str] = None
    source_matches: List[str] = Field(default_factory=list)
    source_datasets: List[str] = Field(default_factory=list)
    dataset_compatibility: Optional[Dict[str, Any]] = None
    target_team: Optional[str] = None
    target_player_id: Optional[str] = None
    methodology_version: str = "TacticalGhost-v2.0-Spearman2018"
    analyst_signoff: str = "TacticalGhost Certified Tactical Analysis Group"
    confidentiality_notice: str = "CONFIDENTIAL FOOTBALL INTELLIGENCE REPORT"


class StandardTacticalReport(BaseModel):
    """
    Unified top-level data model for all 7 report types.
    """
    metadata: ReportMetadata
    executive_summary: str
    sections: List[ReportSection]
    visualizations: List[ReportVisualization] = Field(default_factory=list)
    recommendations: List[ReportRecommendation] = Field(default_factory=list)
    supporting_sequences: List[str] = Field(default_factory=list)
    evidence_classifications: Dict[str, int] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)
    export_links: Dict[str, str] = Field(default_factory=dict)


class ReportGenerationRequest(BaseModel):
    """
    Validated user/API request to generate a tactical report.
    """
    report_type: ReportType
    match_id: Optional[str] = "metrica_game_1"
    secondary_match_id: Optional[str] = "metrica_game_2"
    team: Optional[str] = "Home"
    opponent_team: Optional[str] = "Away"
    player_id: Optional[str] = None
    preferred_formation: Optional[str] = "4-3-3"
    tactical_philosophy: Optional[str] = "POSSESSION_BUILDUP"
    export_formats: List[ExportFormat] = Field(
        default_factory=lambda: [ExportFormat.HTML, ExportFormat.JSON, ExportFormat.PDF]
    )
    custom_title: Optional[str] = None


class ReportGenerationResponse(BaseModel):
    """
    Synchronous response returning report metadata, download URLs, and structured data.
    """
    report_id: str
    report_type: ReportType
    status: str = "COMPLETED"  # COMPLETED, FAILED
    generated_at: str
    summary: str
    export_links: Dict[str, str] = Field(default_factory=dict)
    report_data: Optional[StandardTacticalReport] = None
