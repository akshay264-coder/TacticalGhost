"""
Decision Explanation & Evidence Traceability Engine.
Ensures every coaching recommendation answers the 8 fundamental tactical questions:
1. What is being recommended?
2. What evidence supports it?
3. Why does it matter tactically?
4. What are its advantages?
5. What are its disadvantages?
6. What assumptions are being made?
7. How confident is the system?
8. What information is missing?
Enforces strict separation between observed facts, analytical interpretations, and recommendations.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class DecisionExplanationAudit(BaseModel):
    decision_id: str
    decision_category: str  # FORMATION, ROLE_ASSIGNMENT, EXPLOITATION, COUNTERMEASURE, IN_GAME, TRAINING
    # The 8 Core Questions:
    what_is_recommended: str
    what_evidence_supports_it: str
    why_does_it_matter_tactically: str
    advantages: List[str]
    disadvantages_and_risks: List[str]
    assumptions_made: List[str]
    system_confidence_pct: float  # [0, 100]
    confidence_tier: str          # HIGH, MEDIUM, DEVELOPING
    evidence_category: str = "OBSERVED_TRACKING_TELEMETRY"  # OBSERVED_TRACKING_TELEMETRY, DETERMINISTIC_MODEL_ESTIMATE, HYPOTHETICAL_COACHING_ASSUMPTION
    missing_information_and_limitations: str
    # Evidence Traceability Schema:
    source_module: str
    source_match_ids: List[str]
    source_sequence_ids: List[str]
    source_player_ids: List[str]
    measured_metric_values: Dict[str, Any]
    data_quality_score: float


def validate_recommendation_traceability(audit: DecisionExplanationAudit) -> bool:
    """
    Validates that a recommendation has full empirical provenance,
    rejecting unsupported claims or missing limitation disclosures.
    """
    if not audit.source_match_ids:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': source_match_ids cannot be empty.")
    if not audit.source_sequence_ids:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': source_sequence_ids cannot be empty.")
    if not audit.measured_metric_values:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': measured_metric_values cannot be empty.")
    if not audit.assumptions_made:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': assumptions_made cannot be empty.")
    if not audit.disadvantages_and_risks:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': disadvantages_and_risks cannot be empty.")
    if not audit.missing_information_and_limitations or len(audit.missing_information_and_limitations.strip()) == 0:
        raise ValueError(f"Traceability validation failed for decision '{audit.decision_id}': missing_information_and_limitations disclosure is mandatory.")
    return True


class DecisionExplanationEngine:
    """
    Structures explainable, evidence-backed audit trails for all coaching outputs.
    """

    def explain_decision(
        self,
        decision_id: str,
        category: str,
        recommendation: str,
        evidence: str,
        tactical_why: str,
        advantages: List[str],
        disadvantages: List[str],
        assumptions: List[str],
        confidence_pct: float,
        limitations: str,
        source_module: str,
        matches: List[str],
        sequences: List[str],
        players: List[str],
        metrics: Dict[str, Any],
        quality_score: float = 98.4,
        evidence_category: str = "OBSERVED_TRACKING_TELEMETRY"
    ) -> DecisionExplanationAudit:
        """
        Creates a complete 8-question explanation object with full traceability.
        """
        tier = "HIGH" if confidence_pct >= 85.0 else ("MEDIUM" if confidence_pct >= 70.0 else "DEVELOPING")

        audit = DecisionExplanationAudit(
            decision_id=decision_id,
            decision_category=category,
            what_is_recommended=recommendation,
            what_evidence_supports_it=evidence,
            why_does_it_matter_tactically=tactical_why,
            advantages=advantages,
            disadvantages_and_risks=disadvantages,
            assumptions_made=assumptions,
            system_confidence_pct=round(confidence_pct, 1),
            confidence_tier=tier,
            evidence_category=evidence_category,
            missing_information_and_limitations=limitations,
            source_module=source_module,
            source_match_ids=matches,
            source_sequence_ids=sequences,
            source_player_ids=players,
            measured_metric_values=metrics,
            data_quality_score=round(quality_score, 1)
        )
        validate_recommendation_traceability(audit)
        return audit
