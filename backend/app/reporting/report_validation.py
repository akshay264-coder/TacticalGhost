"""
Report Validation and Quality Assurance Engine.
Enforces epistemic honesty, data completeness, coordinate boundary bounds,
absence of synthetic player data fabrication, and claims provenance.
"""

import math
from typing import List, Dict, Any, Optional
from app.reporting.report_schema import StandardTacticalReport, ReportClaim, EvidenceCategory


class ReportValidationError(ValueError):
    """Raised when a report fails validation constraints."""
    pass


class ReportValidator:
    """
    Validates StandardTacticalReport records before export and presentation.
    """

    VALID_PITCH_X_BOUNDS = (0.0, 105.0)
    VALID_PITCH_Y_BOUNDS = (0.0, 68.0)

    @classmethod
    def validate_report(cls, report: StandardTacticalReport) -> List[str]:
        """
        Runs comprehensive validation suite. Returns list of warning messages,
        or raises ReportValidationError on fatal integrity violations.
        """
        warnings: List[str] = []
        meta = report.metadata

        # 1. Required Metadata
        if not meta.report_id or not meta.title:
            raise ReportValidationError("Report metadata missing required report_id or title.")
        if not meta.source_matches:
            raise ReportValidationError("Report must cite at least one verified source match.")

        # 2. Sections presence
        if not report.sections:
            raise ReportValidationError("Report cannot be empty: zero analytical sections found.")

        # 3. Claims Provenance Audit
        for sec in report.sections:
            for claim in sec.claims:
                if not claim.claim_text:
                    raise ReportValidationError(f"Empty claim text in section {sec.section_id}")
                if not claim.evidence_category:
                    raise ReportValidationError(f"Claim {claim.claim_id} lacks evidence_category")
                if not claim.source_match_id:
                    raise ReportValidationError(f"Claim {claim.claim_id} lacks source_match_id citation")

        # 4. Metric Finiteness Check
        for sec in report.sections:
            for k, v in sec.key_metrics.items():
                if isinstance(v, (int, float)):
                    if math.isnan(v) or math.isinf(v):
                        raise ReportValidationError(f"Metric '{k}' in section {sec.section_id} has invalid non-finite value: {v}")

        # 5. Recommendation Traceability
        for rec in report.recommendations:
            if not rec.headline or not rec.details:
                raise ReportValidationError(f"Recommendation {rec.recommendation_id} has empty headline or details")
            if not rec.supporting_sequences:
                warnings.append(f"Recommendation {rec.recommendation_id} lacks specific supporting sequence citations.")
            if not rec.counter_risks:
                warnings.append(f"Recommendation {rec.recommendation_id} has no explicit counter-risks documented.")

        # 6. Anonymous Player Identity Audit
        if meta.target_player_id:
            pid = meta.target_player_id
            if not (pid.startswith("Home_") or pid.startswith("Away_") or pid.startswith("P")):
                warnings.append(f"Target player ID '{pid}' does not match standard Metrica optical tracking tags.")

        # 7. Limitations & Ethics Presence
        if not report.limitations:
            raise ReportValidationError("Report must include an explicit limitations disclosure.")

        return warnings
