import type { WorkflowStatus } from "../status/status-machine";

export type SignalSourceType = "apify" | "api" | "manual_import" | "bulk_import";

export type SignalRecord = {
  id: string;
  agencyId: string;
  campaignId: string;
  signalRuleId: string;
  accountId?: string;
  contactId?: string;
  status: WorkflowStatus;
  sourceType: SignalSourceType;
  sourceUrl?: string;
  sourceRunId?: string;
  observedAt: string;
  companyName: string;
  companyDomain?: string;
  personName?: string;
  personRole?: string;
  signalSummary: string;
  evidence: unknown;
  icpMatchScore?: number;
  recommendedPersonaId?: string;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
};

export type ImportSignalCandidate = {
  campaignId: string;
  signalRuleId: string;
  accountId?: string;
  contactId?: string;
  sourceType: SignalSourceType;
  sourceUrl?: string;
  sourceRunId?: string;
  observedAt: string;
  companyName: string;
  companyDomain?: string;
  personName?: string;
  personRole?: string;
  signalSummary: string;
  evidence: unknown;
  icpMatchScore?: number;
  recommendedPersonaId?: string;
  dedupeKey: string;
};
