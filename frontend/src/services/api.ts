import {
  SequenceMeta,
  TrackingFrame,
  SpaceCreationData,
  DefensiveFrameAnalysis,
  PressingFrameAnalysis,
  PassingOption,
  PassingSynergyNetwork,
  DecisionEvaluation,
  PitchControlSurface
} from '../types/tactical';

const BASE_URL = '/api';

export async function fetchSequences(): Promise<SequenceMeta[]> {
  const res = await fetch(`${BASE_URL}/sequences`);
  if (!res.ok) throw new Error('Failed to load sequences');
  return res.json();
}

export async function fetchSequenceTracking(sequenceId: string): Promise<{
  sequence: SequenceMeta;
  tracking: {
    total_frames: number;
    fps: number;
    frames: TrackingFrame[];
  };
}> {
  const res = await fetch(`${BASE_URL}/sequences/${sequenceId}/tracking`);
  if (!res.ok) throw new Error(`Failed to load tracking for ${sequenceId}`);
  return res.json();
}

export async function fetchSpaceCreation(sequenceId: string): Promise<SpaceCreationData> {
  const res = await fetch(`${BASE_URL}/analytics/sequence/${sequenceId}/space-creation`);
  if (!res.ok) throw new Error('Failed to load space creation data');
  return res.json();
}

export async function fetchDefensiveVulnerability(
  sequenceId: string,
  frame: number,
  defendingTeam?: 'Home' | 'Away'
): Promise<{ frame: number; analysis: DefensiveFrameAnalysis }> {
  const teamParam = defendingTeam ? `&defending_team=${defendingTeam}` : '';
  const res = await fetch(`${BASE_URL}/analytics/sequence/${sequenceId}/defensive-vulnerability?frame=${frame}${teamParam}`);
  if (!res.ok) throw new Error('Failed to load defensive vulnerability');
  return res.json();
}

export async function fetchPressingAnalysis(
  sequenceId: string,
  frame: number
): Promise<PressingFrameAnalysis> {
  const res = await fetch(`${BASE_URL}/analytics/sequence/${sequenceId}/pressing?frame=${frame}`);
  if (!res.ok) throw new Error('Failed to load pressing analysis');
  return res.json();
}

export async function fetchPlayerInteractions(
  sequenceId: string,
  frame: number
): Promise<{
  sequence_id: string;
  frame: number;
  ball_carrier: { player_id: string; jersey_number: string; position: { x: number; y: number } };
  passing_options: PassingOption[];
  passing_network: PassingSynergyNetwork;
}> {
  const res = await fetch(`${BASE_URL}/analytics/sequence/${sequenceId}/player-interactions?frame=${frame}`);
  if (!res.ok) throw new Error('Failed to load player interactions');
  return res.json();
}

export async function fetchDecisions(
  sequenceId: string,
  frame?: number
): Promise<{ sequence_id: string; decision_evaluations: DecisionEvaluation[] }> {
  const url = frame
    ? `${BASE_URL}/analytics/sequence/${sequenceId}/decisions?frame=${frame}`
    : `${BASE_URL}/analytics/sequence/${sequenceId}/decisions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load decision intelligence');
  return res.json();
}

export async function fetchPitchControlSurface(
  homePlayers: any[],
  awayPlayers: any[],
  gridCellsX: number = 32,
  gridCellsY: number = 20
): Promise<PitchControlSurface> {
  const res = await fetch(`${BASE_URL}/analytics/pitch-control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      home_players: homePlayers,
      away_players: awayPlayers,
      grid_cells_x: gridCellsX,
      grid_cells_y: gridCellsY
    }),
  });
  if (!res.ok) throw new Error('Failed to compute pitch control surface');
  return res.json();
}

export async function validateSequencesComparison(sequenceIds: string[]): Promise<{
  is_all_valid: boolean;
  sequences: Record<string, any>;
}> {
  const res = await fetch(`${BASE_URL}/comparison/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence_ids: sequenceIds }),
  });
  if (!res.ok) throw new Error('Failed to validate sequences');
  return res.json();
}

export async function fetchSequenceComparison(seqA: string, seqB: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/comparison/sequences?seq_a=${seqA}&seq_b=${seqB}`);
  if (!res.ok) throw new Error(`Failed to compare sequences ${seqA} and ${seqB}`);
  return res.json();
}

export function getComparisonReportHtmlUrl(seqA: string, seqB: string): string {
  return `${BASE_URL}/comparison/report/html?seq_a=${seqA}&seq_b=${seqB}`;
}

export async function fetchMatchPatternSummary(): Promise<any> {
  const res = await fetch(`${BASE_URL}/patterns/match-summary`);
  if (!res.ok) throw new Error('Failed to load match pattern summary');
  return res.json();
}

export async function fetchSequencePatterns(sequenceId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/patterns/sequence/${sequenceId}`);
  if (!res.ok) throw new Error(`Failed to load patterns for sequence ${sequenceId}`);
  return res.json();
}

export async function fetchPatternComparison(seqA: string, seqB: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/patterns/compare?seq_a=${seqA}&seq_b=${seqB}`);
  if (!res.ok) throw new Error(`Failed to compare patterns for ${seqA} and ${seqB}`);
  return res.json();
}

export function getCommercialBriefingHtmlUrl(): string {
  return `${BASE_URL}/patterns/briefing/html`;
}
