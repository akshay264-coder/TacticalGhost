/**
 * TacticalGhost — Phase 19 Coach Decision Support System API Client.
 */

import {
  CandidateFormationEvaluation,
  StartingXIPlan,
  ReplacementScenarioResult,
  OpponentExploitationOverview,
  DefensiveCountermeasureOverview,
  TacticalScenarioResult,
  ScenarioAdjustmentParams,
  InGameMonitoringSummary,
  TrainingProgramOverview,
  MatchPreparationReport
} from '../types/coach';

const API_BASE = '/api/coach';

export async function fetchCoachStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Failed to fetch coach status: ${res.statusText}`);
  return res.json();
}

export async function generateMatchPreparation(params: {
  opponent_team?: string;
  matches?: string[];
  preferred_formation?: string;
  tactical_philosophy?: string;
}): Promise<MatchPreparationReport> {
  const res = await fetch(`${API_BASE}/preparation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      matches: params.matches || ['metrica_game_1', 'metrica_game_2'],
      preferred_formation: params.preferred_formation || '4-3-3',
      tactical_philosophy: params.tactical_philosophy || 'POSSESSION_BUILDUP'
    })
  });
  if (!res.ok) throw new Error(`Failed to generate match preparation: ${res.statusText}`);
  return res.json();
}

export async function evaluateFormations(params: {
  opponent_team?: string;
  preferred_philosophy?: string;
  formation_name?: string;
}): Promise<CandidateFormationEvaluation[]> {
  const res = await fetch(`${API_BASE}/formation/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      preferred_philosophy: params.preferred_philosophy || 'POSSESSION_BUILDUP',
      formation_name: params.formation_name
    })
  });
  if (!res.ok) throw new Error(`Failed to evaluate formations: ${res.statusText}`);
  return res.json();
}

export async function planPlayerSelection(params: {
  formation_name?: string;
  team?: string;
  excluded_player_ids?: string[];
}): Promise<StartingXIPlan> {
  const res = await fetch(`${API_BASE}/player-selection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formation_name: params.formation_name || '4-3-3',
      team: params.team || 'Home',
      excluded_player_ids: params.excluded_player_ids || []
    })
  });
  if (!res.ok) throw new Error(`Failed to plan player selection: ${res.statusText}`);
  return res.json();
}

export async function simulatePlayerReplacement(params: {
  target_slot_id: string;
  incumbent_player_id: string;
  replacement_player_id: string;
  formation_name?: string;
}): Promise<ReplacementScenarioResult> {
  const res = await fetch(`${API_BASE}/player-selection/replacement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_slot_id: params.target_slot_id,
      incumbent_player_id: params.incumbent_player_id,
      replacement_player_id: params.replacement_player_id,
      formation_name: params.formation_name || '4-3-3'
    })
  });
  if (!res.ok) throw new Error(`Failed to simulate replacement: ${res.statusText}`);
  return res.json();
}

export async function planOpponentExploitation(params: {
  opponent_team?: string;
  matches?: string[];
}): Promise<OpponentExploitationOverview> {
  const res = await fetch(`${API_BASE}/exploitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      matches: params.matches || ['metrica_game_1', 'metrica_game_2']
    })
  });
  if (!res.ok) throw new Error(`Failed to plan opponent exploitation: ${res.statusText}`);
  return res.json();
}

export async function planDefensiveCountermeasures(params: {
  opponent_team?: string;
  matches?: string[];
}): Promise<DefensiveCountermeasureOverview> {
  const res = await fetch(`${API_BASE}/countermeasures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      matches: params.matches || ['metrica_game_1', 'metrica_game_2']
    })
  });
  if (!res.ok) throw new Error(`Failed to plan defensive countermeasures: ${res.statusText}`);
  return res.json();
}

export async function simulateTacticalScenario(params: {
  adjustment_params: ScenarioAdjustmentParams;
  scenario_name?: string;
}): Promise<TacticalScenarioResult> {
  const res = await fetch(`${API_BASE}/scenario/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      params: params.adjustment_params,
      scenario_name: params.scenario_name || 'Custom Tactical Scenario'
    })
  });
  if (!res.ok) throw new Error(`Failed to simulate scenario: ${res.statusText}`);
  return res.json();
}

export async function monitorInGameReplay(
  sequenceId: string = 'seq_goal_1',
  startFrame: number = 2200,
  endFrame: number = 2320
): Promise<InGameMonitoringSummary> {
  const res = await fetch(`${API_BASE}/in-game/replay-monitor?sequence_id=${sequenceId}&start_frame=${startFrame}&end_frame=${endFrame}`);
  if (!res.ok) throw new Error(`Failed to fetch in-game replay monitoring: ${res.statusText}`);
  return res.json();
}

export async function planTrainingPriorities(params: {
  opponent_team?: string;
  matches?: string[];
}): Promise<TrainingProgramOverview> {
  const res = await fetch(`${API_BASE}/training/priorities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      matches: params.matches || ['metrica_game_1', 'metrica_game_2']
    })
  });
  if (!res.ok) throw new Error(`Failed to plan training priorities: ${res.statusText}`);
  return res.json();
}

export async function fetchMatchStrategyReportJson(params: {
  opponent_team?: string;
  preferred_formation?: string;
  tactical_philosophy?: string;
  matches?: string[];
}): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/report/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opponent_team: params.opponent_team || 'Away',
      preferred_formation: params.preferred_formation || '4-3-3',
      tactical_philosophy: params.tactical_philosophy || 'POSSESSION_BUILDUP',
      matches: params.matches || ['metrica_game_1', 'metrica_game_2']
    })
  });
  if (!res.ok) throw new Error(`Failed to fetch match report JSON: ${res.statusText}`);
  return res.json();
}
