import type { CurrentUser } from "../../auth/current-user";
import { evaluatePolicy } from "./engine";
import type {
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicySet,
  PolicyDecision
} from "./types";

type GuardInput = {
  user: CurrentUser;
  context?: PolicyEvaluationContext;
  policySet?: PolicySet;
  evaluatedAt?: string;
};

type ReviewAction = "approve" | "reject";

export function guardSignalDecision(input: GuardInput & { action: ReviewAction }) {
  return evaluatePolicy({
    ...input,
    decision: mapDecision("signal", input.action)
  });
}

export function guardDraftDecision(input: GuardInput & { action: ReviewAction }) {
  return evaluatePolicy({
    ...input,
    decision: mapDecision("draft", input.action)
  });
}

export function guardDispatchDecision(input: GuardInput & { action: "approve" | "block" }) {
  return evaluatePolicy({
    ...input,
    decision: input.action === "approve" ? "dispatch.approve" : "dispatch.block"
  });
}

export function guardReplyOutcomeClassification(input: GuardInput) {
  return evaluatePolicy({
    ...input,
    decision: "reply.classify_outcome"
  });
}

export function guardWorkflowRetry(input: GuardInput) {
  return evaluatePolicy({
    ...input,
    decision: "workflow.retry"
  });
}

export function guardDeadLetterHandling(input: GuardInput & { action: "resolve" | "ignore" }) {
  return evaluatePolicy({
    ...input,
    decision: input.action === "resolve" ? "dead_letter.resolve" : "dead_letter.ignore"
  });
}

export function isPolicyAllowed(result: PolicyEvaluationResult) {
  return result.allow;
}

function mapDecision(scope: "signal" | "draft", action: ReviewAction): PolicyDecision {
  return `${scope}.${action}` as PolicyDecision;
}
