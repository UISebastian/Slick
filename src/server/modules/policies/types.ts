import type { Capability } from "../../auth/permissions";
import type { CurrentUser, UserRole } from "../../auth/current-user";
import type { WorkflowStatus } from "../status/status-machine";

export const policyDecisions = [
  "signal.approve",
  "signal.reject",
  "draft.approve",
  "draft.reject",
  "dispatch.approve",
  "dispatch.block",
  "reply.classify_outcome",
  "workflow.retry",
  "dead_letter.resolve",
  "dead_letter.ignore"
] as const;

export type PolicyDecision = (typeof policyDecisions)[number];

export type PolicySeverity = "info" | "low" | "medium" | "high" | "critical";

export type PolicyConditionOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "gte"
  | "lte"
  | "exists"
  | "missing";

export type PolicyScalar = string | number | boolean;

export type PolicyCondition = {
  code: string;
  path: string;
  operator: PolicyConditionOperator;
  value?: PolicyScalar | readonly PolicyScalar[];
  reason: string;
  severity?: PolicySeverity;
  optional?: boolean;
};

export type PolicyDefinition = {
  id: string;
  decision: PolicyDecision;
  description: string;
  requiredRole?: UserRole;
  requiredCapability?: Capability;
  constraints?: readonly PolicyCondition[];
  enabled?: boolean;
};

export type PolicySet = {
  id: string;
  version: number;
  policies: readonly PolicyDefinition[];
};

export type PolicyEvaluationContext = Record<string, unknown> & {
  objectType?: string;
  objectId?: string;
  status?: WorkflowStatus | string;
  targetStatus?: WorkflowStatus | string;
};

export type PolicyEvaluationReason = {
  code: string;
  message: string;
  severity: PolicySeverity;
  policyId?: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
};

export type PolicyAuditMetadata = {
  evaluatedAt: string;
  policySetId: string;
  policySetVersion: number;
  policyIds: string[];
  decision: PolicyDecision;
  result: "allow" | "deny";
  actor: {
    id: string;
    agencyId: string;
    role: CurrentUser["role"];
  };
  object?: {
    type?: string;
    id?: string;
    status?: string;
    targetStatus?: string;
  };
};

export type PolicyEvaluationResult = {
  allow: boolean;
  decision: PolicyDecision;
  requiredRole?: UserRole;
  requiredCapability?: Capability;
  severity: PolicySeverity;
  reasons: PolicyEvaluationReason[];
  audit: PolicyAuditMetadata;
};

export type PolicyEvaluationInput = {
  user: CurrentUser;
  decision: PolicyDecision;
  context?: PolicyEvaluationContext;
  policySet?: PolicySet;
  evaluatedAt?: string;
};
