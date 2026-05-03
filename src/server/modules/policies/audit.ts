import type { CurrentUser } from "../../auth/current-user";
import type { AuditLog } from "../audit/audit-log";
import type { PolicyEvaluationResult } from "./types";

export async function appendPolicyAudit(input: {
  audit: AuditLog;
  result: PolicyEvaluationResult;
  user: CurrentUser;
  objectType: string;
  objectId: string;
}) {
  await input.audit.append({
    agencyId: input.user.agencyId,
    actorType: input.user.role === "automation" ? "api_client" : "member",
    actorId: input.user.id,
    eventType: input.result.allow ? "policy.decision_allowed" : "policy.decision_denied",
    objectType: input.objectType,
    objectId: input.objectId,
    after: {
      decision: input.result.decision,
      result: input.result.audit.result,
      severity: input.result.severity,
      reasons: input.result.reasons,
      policySetId: input.result.audit.policySetId,
      policySetVersion: input.result.audit.policySetVersion,
      policyIds: input.result.audit.policyIds
    }
  });
}
