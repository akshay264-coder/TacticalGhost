import {
  PlayerScoutingProfile,
  OffBallContribution,
  RoleClassificationResult,
  PlayerComparisonResult,
  PlayerTacticalFitResult,
  ShortlistCandidate,
  ShortlistDossierExport
} from '../types/scouting';

const BASE_URL = '/api/scouting';

export async function fetchScoutedPlayers(team?: string, role?: string, minQuality?: number): Promise<PlayerScoutingProfile[]> {
  const params = new URLSearchParams();
  if (team) params.append('team', team);
  if (role) params.append('role', role);
  if (minQuality && minQuality > 0) params.append('min_quality', minQuality.toString());

  const url = `${BASE_URL}/players${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch scouted players: ${res.statusText}`);
  return res.json();
}

export async function fetchPlayerProfile(playerId: string): Promise<PlayerScoutingProfile> {
  const res = await fetch(`${BASE_URL}/players/${playerId}`);
  if (!res.ok) throw new Error(`Failed to fetch profile for ${playerId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPlayerOffBall(playerId: string): Promise<OffBallContribution[]> {
  const res = await fetch(`${BASE_URL}/players/${playerId}/off-ball`);
  if (!res.ok) throw new Error(`Failed to fetch off-ball contributions for ${playerId}: ${res.statusText}`);
  return res.json();
}

export async function fetchPlayerRole(playerId: string): Promise<RoleClassificationResult> {
  const res = await fetch(`${BASE_URL}/players/${playerId}/role`);
  if (!res.ok) throw new Error(`Failed to fetch role classification for ${playerId}: ${res.statusText}`);
  return res.json();
}

export async function comparePlayersApi(
  playerAId: string,
  playerBId: string,
  applyRoleNormalization: boolean = true
): Promise<PlayerComparisonResult> {
  const res = await fetch(`${BASE_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_a_id: playerAId,
      player_b_id: playerBId,
      apply_role_normalization: applyRoleNormalization
    })
  });
  if (!res.ok) throw new Error(`Failed to compare players: ${res.statusText}`);
  return res.json();
}

export async function evaluateTacticalFitApi(
  playerId: string,
  philosophyKey: string,
  customWeights?: Record<string, number>
): Promise<PlayerTacticalFitResult> {
  const res = await fetch(`${BASE_URL}/tactical-fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_id: playerId,
      philosophy_key: philosophyKey,
      custom_weights: customWeights
    })
  });
  if (!res.ok) throw new Error(`Failed to evaluate tactical fit: ${res.statusText}`);
  return res.json();
}

export async function fetchShortlist(): Promise<ShortlistCandidate[]> {
  const res = await fetch(`${BASE_URL}/shortlist`);
  if (!res.ok) throw new Error(`Failed to fetch shortlist: ${res.statusText}`);
  return res.json();
}

export async function addToShortlistApi(
  playerId: string,
  notes: string = '',
  tags: string[] = [],
  targetPhilosophy: string = 'HIGH_PRESS_HIGH_LINE',
  fitScore: number = 85.0
): Promise<ShortlistCandidate> {
  const res = await fetch(`${BASE_URL}/shortlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player_id: playerId,
      notes,
      tags,
      target_philosophy: targetPhilosophy,
      fit_score: fitScore
    })
  });
  if (!res.ok) throw new Error(`Failed to add ${playerId} to shortlist: ${res.statusText}`);
  return res.json();
}

export async function updateShortlistNotesApi(
  playerId: string,
  notes: string,
  tags?: string[]
): Promise<ShortlistCandidate> {
  const res = await fetch(`${BASE_URL}/shortlist/${playerId}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes, tags })
  });
  if (!res.ok) throw new Error(`Failed to update notes for ${playerId}: ${res.statusText}`);
  return res.json();
}

export async function removeFromShortlistApi(playerId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/shortlist/${playerId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to remove ${playerId} from shortlist: ${res.statusText}`);
  return true;
}

export async function exportShortlistApi(): Promise<ShortlistDossierExport> {
  const res = await fetch(`${BASE_URL}/shortlist/export`);
  if (!res.ok) throw new Error(`Failed to export shortlist: ${res.statusText}`);
  return res.json();
}
