"""
Player Selection and Tactical Role Assignment Engine.
Selects Starting XI and Bench candidates from empirical player scouting profiles.
Evaluates role compatibility, kinematic output, space creation, pressing contributions,
and generates replacement comparisons without inventing medical, fitness, or biographical data.
"""

from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from app.modules.scouting.scouting_profile import ScoutingProfileEngine, PlayerScoutingProfile
from app.modules.scouting.player_comparison import PlayerComparisonEngine
from app.modules.coach.formation_recommender import FormationRecommender, FormationSlot


class SelectedPlayerSlot(BaseModel):
    slot_id: str
    slot_role: str
    tactical_duty: str
    assigned_player_id: str
    jersey_number: str
    team: str
    primary_role: str
    hybrid_classification: str
    role_fit_score: float  # [0, 100]
    data_quality_score: float
    is_provisional: bool = True
    identity_confidence: float = 0.85
    key_strengths: List[str]
    tactical_justification: str


class BenchCandidate(BaseModel):
    player_id: str
    jersey_number: str
    primary_role: str
    hybrid_classification: str
    tactical_role_utility: str  # e.g., "Impact Winger", "Defensive Closer", "Midfield Controller"
    data_quality_score: float
    is_provisional: bool = True
    identity_confidence: float = 0.85
    replacement_target_slots: List[str]


class ReplacementScenarioResult(BaseModel):
    target_slot_id: str
    incumbent_player_id: str
    replacement_player_id: str
    incumbent_role_fit: float
    replacement_role_fit: float
    progression_delta_m: float
    space_creation_delta: float
    pressing_velocity_delta_mps: float
    tactical_tradeoff_verdict: str
    tactical_recommendation: str


class StartingXIPlan(BaseModel):
    formation_name: str
    total_squad_size: int
    starting_xi: List[SelectedPlayerSlot]
    bench: List[BenchCandidate]
    squad_tactical_balance_score: float  # [0, 100]
    unfilled_slots: List[str]
    analytical_disclaimers: str


class PlayerSelectionEngine:
    """
    Selects and evaluates Starting XI and tactical bench options for a specified formation.
    """

    def __init__(
        self,
        profile_engine: Optional[ScoutingProfileEngine] = None,
        formation_recommender: Optional[FormationRecommender] = None,
        comparison_engine: Optional[PlayerComparisonEngine] = None
    ):
        self._profile_engine = profile_engine or ScoutingProfileEngine()
        self._formation_recommender = formation_recommender or FormationRecommender(self._profile_engine)
        self._comparison_engine = comparison_engine or PlayerComparisonEngine(self._profile_engine)

    def generate_starting_xi(
        self,
        formation_name: str = "4-3-3",
        team: str = "Home",
        excluded_player_ids: Optional[List[str]] = None
    ) -> StartingXIPlan:
        """
        Plans the Starting XI and bench using greedy role-fit matching from available tracking profiles.
        """
        excluded = set(excluded_player_ids or [])
        slots = self._formation_recommender.get_formation_slots(formation_name)
        all_players = [p for p in self._profile_engine.list_all_profiles(team=team) if p.identity.player_id not in excluded]

        assigned_players: set = set()
        starting_xi: List[SelectedPlayerSlot] = []
        unfilled_slots: List[str] = []

        # Sort slots to match specialized positions first (GK, CF, AM, DM)
        priority_order = ["GK", "CF", "RCF", "LCF", "AM", "DM", "RDM", "LDM", "RW", "LW", "RM", "LM", "RB", "LB", "RWB", "LWB", "CCB", "RCB", "LCB", "RCM", "LCM", "CM"]
        sorted_slots = sorted(slots, key=lambda s: priority_order.index(s.slot_id) if s.slot_id in priority_order else 99)

        for slot in sorted_slots:
            best_candidate: Optional[PlayerScoutingProfile] = None
            best_score = -1.0

            for p in all_players:
                if p.identity.player_id in assigned_players:
                    continue

                # Calculate slot suitability score
                score = 40.0
                if slot.slot_id == "GK":
                    score = 98.0 if p.identity.player_id == "Home_11" or "GK" in p.hybrid_classification.upper() else 20.0
                elif p.primary_role.lower() == slot.archetype_required.lower():
                    score = p.role_confidence
                elif p.secondary_role and p.secondary_role.lower() == slot.archetype_required.lower():
                    score = p.role_confidence * 0.85
                elif "midfielder" in p.primary_role.lower() and "midfielder" in slot.archetype_required.lower():
                    score = p.role_confidence * 0.75
                elif "back" in p.primary_role.lower() and "back" in slot.archetype_required.lower():
                    score = p.role_confidence * 0.75
                elif "forward" in p.primary_role.lower() and "forward" in slot.archetype_required.lower():
                    score = p.role_confidence * 0.80
                elif "wing" in p.primary_role.lower() and "wing" in slot.archetype_required.lower():
                    score = p.role_confidence * 0.82
                elif p.primary_role.lower() == "attacking midfielder" and slot.archetype_required.lower() in ["winger", "second striker", "central midfielder"]:
                    score = p.role_confidence * 0.80
                elif slot.archetype_required.lower() in ["winger", "full-back", "wing-back"] and ("wing" in p.primary_role.lower() or "back" in p.primary_role.lower()):
                    score = p.role_confidence * 0.72

                # Preference bonus for higher data quality
                score += (p.data_quality.overall_quality_score - 90.0) * 0.2

                if score > best_score:
                    best_score = score
                    best_candidate = p

            if best_candidate and best_score >= 50.0:
                assigned_players.add(best_candidate.identity.player_id)
                is_prov = getattr(best_candidate.identity, "is_provisional", None)
                if is_prov is None:
                    tier = getattr(best_candidate.identity, "identity_confidence_tier", "PROVISIONAL_ANONYMOUS_TAG")
                    is_prov = (tier == "PROVISIONAL_ANONYMOUS_TAG")
                id_conf = getattr(best_candidate.identity, "identity_confidence", 0.85)

                starting_xi.append(SelectedPlayerSlot(
                    slot_id=slot.slot_id,
                    slot_role=slot.role_name,
                    tactical_duty=slot.tactical_duty,
                    assigned_player_id=best_candidate.identity.player_id,
                    jersey_number=best_candidate.identity.jersey_number,
                    team=best_candidate.identity.team,
                    primary_role=best_candidate.primary_role,
                    hybrid_classification=best_candidate.hybrid_classification,
                    role_fit_score=round(min(99.0, max(50.0, best_score)), 1),
                    data_quality_score=best_candidate.data_quality.overall_quality_score,
                    is_provisional=is_prov,
                    identity_confidence=id_conf,
                    key_strengths=best_candidate.tactical_profile.tactical_strengths[:2],
                    tactical_justification=f"Selected for {slot.role_name} based on {best_candidate.primary_role} classification ({round(best_score, 1)} fit score) and {best_candidate.tactical_profile.tactical_strengths[0]}."
                ))
            else:
                unfilled_slots.append(slot.slot_id)

        # Second pass: if any slots remain unfilled and unassigned players exist, allocate best available
        unassigned = [p for p in all_players if p.identity.player_id not in assigned_players]
        for slot_id in list(unfilled_slots):
            if not unassigned:
                break
            slot = next(s for s in slots if s.slot_id == slot_id)
            unassigned.sort(key=lambda p: p.role_confidence, reverse=True)
            p = unassigned.pop(0)
            assigned_players.add(p.identity.player_id)
            unfilled_slots.remove(slot_id)
            is_prov_p = getattr(p.identity, "is_provisional", None)
            if is_prov_p is None:
                tier_p = getattr(p.identity, "identity_confidence_tier", "PROVISIONAL_ANONYMOUS_TAG")
                is_prov_p = (tier_p == "PROVISIONAL_ANONYMOUS_TAG")
            id_conf_p = getattr(p.identity, "identity_confidence", 0.85)

            starting_xi.append(SelectedPlayerSlot(
                slot_id=slot.slot_id,
                slot_role=slot.role_name,
                tactical_duty=slot.tactical_duty,
                assigned_player_id=p.identity.player_id,
                jersey_number=p.identity.jersey_number,
                team=p.identity.team,
                primary_role=p.primary_role,
                hybrid_classification=p.hybrid_classification,
                role_fit_score=round(max(50.0, p.role_confidence * 0.70), 1),
                data_quality_score=p.data_quality.overall_quality_score,
                is_provisional=is_prov_p,
                identity_confidence=id_conf_p,
                key_strengths=p.tactical_profile.tactical_strengths[:2],
                tactical_justification=f"Adapted for {slot.role_name} from natural {p.primary_role} to ensure tactical shape completion."
            ))

        # Restore original formation order for starting_xi
        slot_order_map = {s.slot_id: idx for idx, s in enumerate(slots)}
        starting_xi.sort(key=lambda s: slot_order_map.get(s.slot_id, 0))

        # Bench candidates: remaining unselected players
        bench: List[BenchCandidate] = []
        for p in all_players:
            if p.identity.player_id not in assigned_players:
                # Determine bench utility
                if "winger" in p.primary_role.lower() or "forward" in p.primary_role.lower():
                    utility = "Impact Attacker / Direct Threat"
                    target_slots = ["RW", "LW", "CF", "AM"]
                elif "midfielder" in p.primary_role.lower():
                    utility = "Midfield Tempo Controller / Press Resistor"
                    target_slots = ["RCM", "LCM", "DM", "AM"]
                else:
                    utility = "Defensive Closer / Rest-Defense Anchor"
                    target_slots = ["RB", "LB", "RCB", "LCB", "DM"]

                is_prov_b = getattr(p.identity, "is_provisional", None)
                if is_prov_b is None:
                    tier_b = getattr(p.identity, "identity_confidence_tier", "PROVISIONAL_ANONYMOUS_TAG")
                    is_prov_b = (tier_b == "PROVISIONAL_ANONYMOUS_TAG")
                id_conf_b = getattr(p.identity, "identity_confidence", 0.85)

                bench.append(BenchCandidate(
                    player_id=p.identity.player_id,
                    jersey_number=p.identity.jersey_number,
                    primary_role=p.primary_role,
                    hybrid_classification=p.hybrid_classification,
                    tactical_role_utility=utility,
                    data_quality_score=p.data_quality.overall_quality_score,
                    is_provisional=is_prov_b,
                    identity_confidence=id_conf_b,
                    replacement_target_slots=target_slots
                ))

        # Squad balance score
        avg_fit = sum(s.role_fit_score for s in starting_xi) / max(1, len(starting_xi))
        balance_score = round(avg_fit * (len(starting_xi) / 11.0), 1)

        disclaimer = "Starting XI selections are computed strictly from spatiotemporal tracking telemetry and archetype norms; tactical success requires squad communication and live coaching oversight. No medical or fitness inferences are made."
        if len(all_players) < 11:
            disclaimer += f" INSUFFICIENT SQUAD NOTICE: Only {len(all_players)} players were available. Exactly {len(starting_xi)} slots were filled; {len(unfilled_slots)} slots remain unfilled ({', '.join(unfilled_slots)}). No fictional players were fabricated."

        return StartingXIPlan(
            formation_name=formation_name,
            total_squad_size=len(all_players),
            starting_xi=starting_xi,
            bench=bench,
            squad_tactical_balance_score=balance_score,
            unfilled_slots=unfilled_slots,
            analytical_disclaimers=disclaimer
        )

    def simulate_player_replacement(
        self,
        target_slot_id: str,
        incumbent_player_id: str,
        replacement_player_id: str,
        formation_name: str = "4-3-3"
    ) -> ReplacementScenarioResult:
        """
        Simulates replacing an incumbent player with a bench candidate in a tactical slot.
        """
        p_inc = self._profile_engine.get_player_profile(incumbent_player_id)
        p_rep = self._profile_engine.get_player_profile(replacement_player_id)

        if not p_inc:
            raise ValueError(f"Incumbent player '{incumbent_player_id}' not found.")
        if not p_rep:
            raise ValueError(f"Replacement player '{replacement_player_id}' not found.")

        # Metric deltas
        prog_delta = round(p_rep.tactical_profile.attacking.forward_progression_m - p_inc.tactical_profile.attacking.forward_progression_m, 1)
        space_delta = round(p_rep.tactical_profile.attacking.space_creation_rating - p_inc.tactical_profile.attacking.space_creation_rating, 1)
        speed_delta = round(p_rep.tactical_profile.pressing.peak_closing_velocity_mps - p_inc.tactical_profile.pressing.peak_closing_velocity_mps, 2)

        # Slot fit comparison
        slots = self._formation_recommender.get_formation_slots(formation_name)
        target_slot = next((s for s in slots if s.slot_id == target_slot_id), slots[0])
        req_arch = target_slot.archetype_required.lower()

        inc_fit = p_inc.role_confidence if p_inc.primary_role.lower() == req_arch else p_inc.role_confidence * 0.80
        rep_fit = p_rep.role_confidence if p_rep.primary_role.lower() == req_arch else p_rep.role_confidence * 0.80

        if rep_fit > inc_fit + 5.0:
            verdict = f"{replacement_player_id} provides a superior natural archetype fit (+{round(rep_fit - inc_fit, 1)} pts) for {target_slot.role_name}."
            rec = f"Start {replacement_player_id} in {target_slot.slot_id} to maximize role fidelity."
        elif rep_fit < inc_fit - 5.0:
            verdict = f"{incumbent_player_id} remains the tactically superior choice for {target_slot.role_name}; {replacement_player_id} serves as an impact substitute."
            rec = f"Retain {incumbent_player_id} as the starter; introduce {replacement_player_id} after minute 65 if tactical tempo demands fresh legs."
        else:
            verdict = f"Near-parity between {incumbent_player_id} and {replacement_player_id} in {target_slot.role_name} ({round(abs(rep_fit - inc_fit), 1)} pt margin)."
            rec = "Base final selection on specific match tactical requirements: choose higher progression vs defensive rest-structure."

        return ReplacementScenarioResult(
            target_slot_id=target_slot_id,
            incumbent_player_id=incumbent_player_id,
            replacement_player_id=replacement_player_id,
            incumbent_role_fit=round(inc_fit, 1),
            replacement_role_fit=round(rep_fit, 1),
            progression_delta_m=prog_delta,
            space_creation_delta=space_delta,
            pressing_velocity_delta_mps=speed_delta,
            tactical_tradeoff_verdict=verdict,
            tactical_recommendation=rec
        )
