import { hasCapability, hasRole } from "../../auth/permissions";
import { defaultPolicySet } from "./default-policy-set";
import type {
  PolicyCondition,
  PolicyDefinition,
  PolicyEvaluationContext,
  PolicyEvaluationInput,
  PolicyEvaluationReason,
  PolicyEvaluationResult,
  PolicyScalar,
  PolicySet,
  PolicySeverity
} from "./types";

const severityRank: Record<PolicySeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export class PolicyDeniedError extends Error {
  readonly result: PolicyEvaluationResult;

  constructor(result: PolicyEvaluationResult) {
    super(result.reasons.map((reason) => reason.message).join("; "));
    this.name = "PolicyDeniedError";
    this.result = result;
  }
}

export function evaluatePolicy(input: PolicyEvaluationInput): PolicyEvaluationResult {
  const policySet = input.policySet ?? defaultPolicySet;
  const context = input.context ?? {};
  const policies = policySet.policies.filter(
    (policy) => policy.decision === input.decision && policy.enabled !== false
  );

  const requiredRole = policies.find((policy) => policy.requiredRole)?.requiredRole;
  const requiredCapability = policies.find(
    (policy) => policy.requiredCapability
  )?.requiredCapability;

  const reasons = policies.flatMap((policy) => evaluatePolicyDefinition(policy, input, context));

  if (policies.length === 0) {
    reasons.push({
      code: "policy.not_found",
      message: `No enabled policy definition exists for ${input.decision}.`,
      severity: "critical"
    });
  }

  const allow = reasons.length === 0;
  const severity = maxSeverity(reasons);
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const object = buildAuditObject(context);

  return {
    allow,
    decision: input.decision,
    requiredRole,
    requiredCapability,
    severity,
    reasons: allow
      ? [
          {
            code: "policy.allowed",
            message: "Decision allowed by policy.",
            severity: "info",
            policyId: policies.map((policy) => policy.id).join(",")
          }
        ]
      : reasons,
    audit: {
      evaluatedAt,
      policySetId: policySet.id,
      policySetVersion: policySet.version,
      policyIds: policies.map((policy) => policy.id),
      decision: input.decision,
      result: allow ? "allow" : "deny",
      actor: {
        id: input.user.id,
        agencyId: input.user.agencyId,
        role: input.user.role
      },
      ...(object ? { object } : {})
    }
  };
}

export function assertPolicyAllowed(input: PolicyEvaluationInput): PolicyEvaluationResult {
  const result = evaluatePolicy(input);
  if (!result.allow) {
    throw new PolicyDeniedError(result);
  }

  return result;
}

export function patchPolicy(
  policySet: PolicySet,
  policyId: string,
  patch: Partial<PolicyDefinition>
): PolicySet {
  return {
    ...policySet,
    version: policySet.version + 1,
    policies: policySet.policies.map((policy) =>
      policy.id === policyId ? { ...policy, ...patch, id: policy.id } : policy
    )
  };
}

function evaluatePolicyDefinition(
  policy: PolicyDefinition,
  input: PolicyEvaluationInput,
  context: PolicyEvaluationContext
): PolicyEvaluationReason[] {
  const reasons: PolicyEvaluationReason[] = [];

  if (policy.requiredRole && !hasRole(input.user, policy.requiredRole)) {
    reasons.push({
      code: "policy.role_required",
      message: `Requires ${policy.requiredRole} role.`,
      severity: "high",
      policyId: policy.id,
      expected: policy.requiredRole,
      actual: input.user.role
    });
  }

  if (policy.requiredCapability && !hasCapability(input.user, policy.requiredCapability)) {
    reasons.push({
      code: "policy.capability_required",
      message: `Requires ${policy.requiredCapability} capability.`,
      severity: "high",
      policyId: policy.id,
      expected: policy.requiredCapability,
      actual: input.user.role
    });
  }

  for (const condition of policy.constraints ?? []) {
    const reason = evaluateCondition(policy.id, condition, context);
    if (reason) {
      reasons.push(reason);
    }
  }

  return reasons;
}

function evaluateCondition(
  policyId: string,
  condition: PolicyCondition,
  context: PolicyEvaluationContext
): PolicyEvaluationReason | undefined {
  const actual = readPath(context, condition.path);
  const missing = actual === undefined || actual === null;

  if (condition.optional && missing) {
    return undefined;
  }

  if (matchesCondition(actual, condition)) {
    return undefined;
  }

  return {
    code: condition.code,
    message: condition.reason,
    severity: condition.severity ?? "medium",
    policyId,
    path: condition.path,
    expected: condition.value,
    actual
  };
}

function matchesCondition(actual: unknown, condition: PolicyCondition) {
  switch (condition.operator) {
    case "equals":
      return isPolicyScalar(actual) && actual === condition.value;
    case "notEquals":
      return isPolicyScalar(actual) && actual !== condition.value;
    case "in":
      return isPolicyScalar(actual) && isScalarList(condition.value) && condition.value.includes(actual);
    case "notIn":
      return isPolicyScalar(actual) && isScalarList(condition.value) && !condition.value.includes(actual);
    case "gte":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual >= condition.value
      );
    case "lte":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual <= condition.value
      );
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    case "missing":
      return actual === undefined || actual === null || actual === "";
  }
}

function readPath(context: PolicyEvaluationContext, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, context);
}

function isPolicyScalar(value: unknown): value is PolicyScalar {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isScalarList(value: unknown): value is readonly PolicyScalar[] {
  return Array.isArray(value) && value.every(isPolicyScalar);
}

function maxSeverity(reasons: readonly PolicyEvaluationReason[]): PolicySeverity {
  return reasons.reduce<PolicySeverity>((max, reason) => {
    return severityRank[reason.severity] > severityRank[max] ? reason.severity : max;
  }, "info");
}

function buildAuditObject(context: PolicyEvaluationContext) {
  if (!context.objectType && !context.objectId && !context.status && !context.targetStatus) {
    return undefined;
  }

  return {
    type: context.objectType,
    id: context.objectId,
    status: typeof context.status === "string" ? context.status : undefined,
    targetStatus: typeof context.targetStatus === "string" ? context.targetStatus : undefined
  };
}
