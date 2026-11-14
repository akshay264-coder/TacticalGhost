/**
 * TacticalGhost — Phase 20 Automated Professional Tactical Reporting API Client.
 */

import {
  ReportTypeDefinition,
  ReportTemplateDefinition,
  ReportHistoryItem,
  ReportGenerationRequest,
  ReportGenerationResponse,
  StandardTacticalReport
} from '../types/reporting';

const API_BASE = '/api/reports';

export async function fetchReportingStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Failed to fetch reporting status: ${res.statusText}`);
  return res.json();
}

export async function fetchReportTypes(): Promise<ReportTypeDefinition[]> {
  const res = await fetch(`${API_BASE}/types`);
  if (!res.ok) throw new Error(`Failed to fetch report types: ${res.statusText}`);
  return res.json();
}

export async function fetchReportTemplates(): Promise<ReportTemplateDefinition[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) throw new Error(`Failed to fetch report templates: ${res.statusText}`);
  return res.json();
}

export async function fetchReportHistory(): Promise<ReportHistoryItem[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error(`Failed to fetch report history: ${res.statusText}`);
  return res.json();
}

export async function generateTacticalReport(
  request: ReportGenerationRequest
): Promise<ReportGenerationResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to generate report');
  }
  return res.json();
}

export async function previewTacticalReport(
  request: ReportGenerationRequest
): Promise<StandardTacticalReport> {
  const res = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to preview report');
  }
  return res.json();
}

export async function fetchReportById(reportId: string): Promise<StandardTacticalReport> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(reportId)}`);
  if (!res.ok) throw new Error(`Failed to fetch report ${reportId}: ${res.statusText}`);
  return res.json();
}

export async function deleteReportById(reportId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(reportId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete report: ${res.statusText}`);
  return res.json();
}

export function getReportHtmlUrl(reportId: string): string {
  return `${API_BASE}/${encodeURIComponent(reportId)}/html`;
}

export function getReportPdfUrl(reportId: string): string {
  return `${API_BASE}/${encodeURIComponent(reportId)}/pdf`;
}

export function getReportJsonUrl(reportId: string): string {
  return `${API_BASE}/${encodeURIComponent(reportId)}/json`;
}
