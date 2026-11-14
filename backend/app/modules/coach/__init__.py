"""
Coach Decision Support System Module Package.
"""

from app.modules.coach.coach_decision_engine import CoachDecisionEngine, MatchPreparationReport, TacticalApproachOption
from app.modules.coach.formation_recommender import FormationRecommender, CandidateFormationEvaluation, FormationSlot
from app.modules.coach.player_selection_engine import PlayerSelectionEngine, StartingXIPlan, SelectedPlayerSlot
from app.modules.coach.opponent_exploitation import OpponentExploitationEngine, OpponentExploitationOverview, ExploitationPlanItem
from app.modules.coach.defensive_countermeasure import DefensiveCountermeasureEngine, DefensiveCountermeasureOverview, CountermeasurePlanItem
from app.modules.coach.tactical_scenario import TacticalScenarioSimulator, TacticalScenarioResult, ScenarioAdjustmentParams
from app.modules.coach.in_game_intelligence import InGameIntelligenceEngine, InGameMonitoringSummary, TacticalAlertItem
from app.modules.coach.training_priority import TrainingPriorityEngine, TrainingProgramOverview, TrainingPriorityItem
from app.modules.coach.decision_explanation import DecisionExplanationEngine, DecisionExplanationAudit
from app.modules.coach.match_strategy_report import MatchStrategyReportGenerator

__all__ = [
    "CoachDecisionEngine",
    "MatchPreparationReport",
    "TacticalApproachOption",
    "FormationRecommender",
    "CandidateFormationEvaluation",
    "FormationSlot",
    "PlayerSelectionEngine",
    "StartingXIPlan",
    "SelectedPlayerSlot",
    "OpponentExploitationEngine",
    "OpponentExploitationOverview",
    "ExploitationPlanItem",
    "DefensiveCountermeasureEngine",
    "DefensiveCountermeasureOverview",
    "CountermeasurePlanItem",
    "TacticalScenarioSimulator",
    "TacticalScenarioResult",
    "ScenarioAdjustmentParams",
    "InGameIntelligenceEngine",
    "InGameMonitoringSummary",
    "TacticalAlertItem",
    "TrainingPriorityEngine",
    "TrainingProgramOverview",
    "TrainingPriorityItem",
    "DecisionExplanationEngine",
    "DecisionExplanationAudit",
    "MatchStrategyReportGenerator"
]
