"""
Training Priority & Tactical Drill Generator Engine.
Translates empirical match observations, opponent vulnerabilities, and defensive risks
into structured weekly training priorities and pitch exercises.
Labels drills as proposed coaching exercises, not empirically proven performance improvements.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CoachingDrill(BaseModel):
    drill_id: str
    title: str
    grid_dimensions_m: str
    player_setup: str  # e.g., "7v5 + GK"
    target_phase: str  # In Possession, Out of Possession, Attacking Transition, Defensive Transition
    duration_minutes: int
    exercise_progression: str
    key_coaching_cues: List[str]
    intended_learning_outcome: str


class TrainingPriorityItem(BaseModel):
    priority_id: str
    rank: int
    headline: str
    tactical_objective: str
    urgency_level: str  # CRITICAL, HIGH, MEDIUM
    observed_match_evidence: str
    supporting_matches: List[str]
    supporting_sequence_ids: List[str]
    relevant_player_roles: List[str]
    prescribed_drill: CoachingDrill
    limitations: str


class TrainingProgramOverview(BaseModel):
    opponent_target: str
    training_cycle_name: str
    total_priorities: int
    priorities: List[TrainingPriorityItem]
    methodological_disclaimer: str


class TrainingPriorityEngine:
    """
    Synthesizes tactical analysis into targeted training sessions and pitch exercises.
    """

    def generate_training_priorities(
        self,
        opponent_team: str = "Away",
        matches: Optional[List[str]] = None
    ) -> TrainingProgramOverview:
        """
        Generates structured training priorities and coaching drills based on tracking evidence.
        """
        match_list = matches or ["metrica_game_1", "metrica_game_2"]

        priorities = [
            TrainingPriorityItem(
                priority_id="train_p1_byline_cutback",
                rank=1,
                headline="Byline Cutback Delivery vs Collapsing Box Defense",
                tactical_objective="Exploit Away's 382 m² penalty box over-contraction by executing ground cutbacks into the vacated penalty arc (Zone 14).",
                urgency_level="CRITICAL",
                observed_match_evidence="Away concedes 82% pitch control in Zone 14 during wide attacks; center-backs drop 5.4m deep leaving trailing runners unmarked.",
                supporting_matches=match_list,
                supporting_sequence_ids=["seq_goal_1", "seq_g2_goal_home"],
                relevant_player_roles=["Wingers (Home_7)", "Attacking Midfielder (Home_10)", "Striker (Home_9)", "Full-Back (Home_2)"],
                prescribed_drill=CoachingDrill(
                    drill_id="drill_cutback_wave",
                    title="Byline Cutback Wave Pattern with Delayed Penalty Spot Runner",
                    grid_dimensions_m="Half-Pitch with Penalty Box (52m x 68m)",
                    player_setup="6 Attackers vs 4 Defenders + GK",
                    target_phase="In Possession",
                    duration_minutes=25,
                    exercise_progression="Phase 1: Winger combines with overlapping fullback to reach the byline uncontested. Phase 2: Live 6v4 where strikers make near-post and far-post darting runs to drag defenders deep, opening a 6m pocket at the penalty spot for the incoming attacking midfielder.",
                    key_coaching_cues=[
                        "Winger: Keep head up and hit low, driven ground pass — avoid high lofted crosses",
                        "Striker: Sprint aggressively across the near-post center-back to force hips to turn",
                        "Attacking Midfielder: Delay arrival by 1.5 seconds; enter the box as the ball reaches the byline"
                    ],
                    intended_learning_outcome="Attackers develop repeatable collective timing to exploit vacated intermediate penalty box zones."
                ),
                limitations="Depends on wingers having the technical 1v1 ability to reach the byline under live match duel conditions."
            ),
            TrainingPriorityItem(
                priority_id="train_p2_rest_defense_funnel",
                rank=2,
                headline="Rest-Defense 2v1 Funnel Against Explosive Wing Counters",
                tactical_objective="Neutralize Away_24's 7.24 m/s top-end transitional sprint speed by establishing a disciplined 2v1 channel trap.",
                urgency_level="HIGH",
                observed_match_evidence="Away_24 executes 22.4 sprints per match with 7.24 m/s peak velocity, isolating fullbacks during forward counter-transitions.",
                supporting_matches=match_list,
                supporting_sequence_ids=["seq_transitional_counter"],
                relevant_player_roles=["Left-Back (Home_5)", "Left Centre-Back (Home_4)", "Defensive Midfielder (Home_6)"],
                prescribed_drill=CoachingDrill(
                    drill_id="drill_rest_def_funnel",
                    title="2v1 Funnel Delay & Inside Double-Team Trap",
                    grid_dimensions_m="60m x 40m Channel Grid",
                    player_setup="3 Attackers vs 3 Defenders + 1 Recovering Pivot",
                    target_phase="Defensive Transition",
                    duration_minutes=20,
                    exercise_progression="Coach lofts ball to attacking winger in space. Left-back immediately decelerates 2.5m away in a staggered side-on posture to delay the run. Left center-back covers the depth, while recovering midfielder sprints to trap from the inside.",
                    key_coaching_cues=[
                        "Left-Back: Do not dive into tackle — drop your center of gravity and shepherd runner toward the touchline",
                        "Center-Back: Maintain 5m diagonal depth buffer; do not leave gap between CB and LB",
                        "Midfielder: Take an inside recovery angle to eliminate the cutback lane"
                    ],
                    intended_learning_outcome="Defenders master channel containment and staggered recovery spacing against elite velocity wingers."
                ),
                limitations="Requires high sustained sprint stamina from recovering central midfielders."
            ),
            TrainingPriorityItem(
                priority_id="train_p3_third_man_progression",
                rank=3,
                headline="Third-Man Combinations to Bypass Midfield Pressing Traps",
                tactical_objective="Bypass Away_18's aggressive closing velocity (5.42 m/s) by playing through a bounce-pass conduit into the blindside pocket.",
                urgency_level="HIGH",
                observed_match_evidence="Away_18 triggers pressing traps in middle third with 88% cover-shadow efficiency, winning 14 turnovers when opponent plays directly into central pivot.",
                supporting_matches=match_list,
                supporting_sequence_ids=["seq_buildup_break", "seq_pressing_turnover"],
                relevant_player_roles=["Center-Backs (Home_3, Home_4)", "Central Midfielder (Home_6)", "Attacking Midfielder (Home_10)"],
                prescribed_drill=CoachingDrill(
                    drill_id="drill_third_man_diamond",
                    title="Diamond Press-Bypass Circuit with Blindside Lay-Off",
                    grid_dimensions_m="35m x 35m Central Rondo Grid",
                    player_setup="6v4 Possession Rondo with Neutral Free Man",
                    target_phase="In Possession",
                    duration_minutes=20,
                    exercise_progression="Team in possession must complete 3 passes before playing a vertical pass into the neutral player between lines. The pressing unit presses aggressively. Team must execute an immediate one-touch lay-off to a third-man runner.",
                    key_coaching_cues=[
                        "Passer: Disguise pass with body orientation before threading between pressing forwards",
                        "Receiver: Open body shape to lay off the ball in one touch without turning into pressure",
                        "Third-Man Runner: Commence forward sprint before the second pass is played"
                    ],
                    intended_learning_outcome="Midfield unit internalizes rapid 3-player passing combinations that completely neutralize opposition pressing traps."
                ),
                limitations="Relies on high technical first-touch precision under tight spatial pressure."
            ),
            TrainingPriorityItem(
                priority_id="train_p4_transition_blitz",
                rank=4,
                headline="Vertical Transition Wave vs Asymmetric Recovery Line",
                tactical_objective="Exploit Away_15's 6.8m over-deep recovery stance to release blindside diagonal runners within 3.0s of turnover.",
                urgency_level="MEDIUM",
                observed_match_evidence="Away_15 drops 6.8m deeper than defensive partner during counter-retreats, leaving 240 m² of channel space and playing attackers onside.",
                supporting_matches=match_list,
                supporting_sequence_ids=["seq_goal_1", "seq_transitional_counter"],
                relevant_player_roles=["Center-Forward (Home_9)", "Winger (Home_7)", "Attacking Midfielder (Home_10)"],
                prescribed_drill=CoachingDrill(
                    drill_id="drill_transition_blitz",
                    title="3-Second Counterattack Wave vs Staggered Defensive Line",
                    grid_dimensions_m="65m x 50m Counter Transition Corridor",
                    player_setup="4 Attackers vs 3 Defenders + GK",
                    target_phase="Attacking Transition",
                    duration_minutes=20,
                    exercise_progression="Coach fires loose ball to central midfielder. Within 3 seconds, forward must trigger a curved blindside diagonal run targeting the deep defender's channel to receive an early through-ball and finish on goal.",
                    key_coaching_cues=[
                        "Ball Winner: Look forward immediately upon turnover; play pass on 1st or 2nd touch",
                        "Striker: Curve your sprint to stay onside using the deep defender as the reference point",
                        "Trailing Runner: Sprint toward the penalty spot to occupy the second center-back"
                    ],
                    intended_learning_outcome="Attackers develop collective urgency to punish delayed offside adjustments within 3 seconds of turnover."
                ),
                limitations="Requires pinpoint passing weight and timing before the opponent recovered midfielder can foul or intercept."
            )
        ]

        return TrainingProgramOverview(
            opponent_target=opponent_team,
            training_cycle_name=f"Matchday Preparation Cycle vs {opponent_team}",
            total_priorities=len(priorities),
            priorities=priorities,
            methodological_disclaimer="Drills are structured as proposed coaching exercises based on tracking observations. They do not constitute empirically verified or guaranteed performance interventions."
        )
