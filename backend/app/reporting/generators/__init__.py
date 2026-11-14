"""
Generators package initialization for all 7 report types.
"""

from app.reporting.generators.match_report import MatchIntelligenceReportGenerator
from app.reporting.generators.tactical_report import TacticalAnalysisReportGenerator
from app.reporting.generators.opponent_report import OpponentAnalysisReportGenerator
from app.reporting.generators.coach_report import CoachStrategyReportGenerator
from app.reporting.generators.scouting_report import PlayerScoutingReportGenerator
from app.reporting.generators.comparison_report import MultiMatchComparisonReportGenerator
from app.reporting.generators.executive_report import ExecutiveSummaryReportGenerator
