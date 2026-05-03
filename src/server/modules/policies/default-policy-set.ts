import type { PolicySet } from "./types";

export const defaultPolicySet: PolicySet = {
  id: "slick.mvp.policy-set",
  version: 1,
  policies: [
    {
      id: "signal.approve",
      decision: "signal.approve",
      description: "Signals can be approved only while triage is pending.",
      requiredRole: "reviewer",
      requiredCapability: "signals.review",
      constraints: [
        {
          code: "signal.status_triage_requested",
          path: "status",
          operator: "equals",
          value: "signal.triage_requested",
          reason: "Signal is not waiting for triage.",
          severity: "high"
        },
        {
          code: "review.status_pending",
          path: "review.status",
          operator: "equals",
          value: "pending",
          reason: "Review request is not pending.",
          severity: "medium",
          optional: true
        }
      ]
    },
    {
      id: "signal.reject",
      decision: "signal.reject",
      description: "Signals can be rejected only while triage is pending.",
      requiredRole: "reviewer",
      requiredCapability: "signals.review",
      constraints: [
        {
          code: "signal.status_triage_requested",
          path: "status",
          operator: "equals",
          value: "signal.triage_requested",
          reason: "Signal is not waiting for triage.",
          severity: "high"
        },
        {
          code: "review.status_pending",
          path: "review.status",
          operator: "equals",
          value: "pending",
          reason: "Review request is not pending.",
          severity: "medium",
          optional: true
        }
      ]
    },
    {
      id: "draft.approve",
      decision: "draft.approve",
      description: "Draft approvals require a pending draft review and minimum quality score.",
      requiredRole: "reviewer",
      requiredCapability: "drafts.review",
      constraints: [
        {
          code: "draft.status_review_requested",
          path: "status",
          operator: "equals",
          value: "draft.review_requested",
          reason: "Draft is not waiting for review.",
          severity: "high"
        },
        {
          code: "draft.quality_score_minimum",
          path: "quality.score",
          operator: "gte",
          value: 70,
          reason: "Draft quality score is below the approval threshold.",
          severity: "medium"
        }
      ]
    },
    {
      id: "draft.reject",
      decision: "draft.reject",
      description: "Draft rejections require a pending draft review.",
      requiredRole: "reviewer",
      requiredCapability: "drafts.review",
      constraints: [
        {
          code: "draft.status_review_requested",
          path: "status",
          operator: "equals",
          value: "draft.review_requested",
          reason: "Draft is not waiting for review.",
          severity: "high"
        }
      ]
    },
    {
      id: "dispatch.approve",
      decision: "dispatch.approve",
      description: "Dispatch approvals require sendability checks before outbound email is queued.",
      requiredRole: "reviewer",
      requiredCapability: "dispatch.review",
      constraints: [
        {
          code: "dispatch.status_review_requested",
          path: "status",
          operator: "equals",
          value: "dispatch.review_requested",
          reason: "Dispatch is not waiting for review.",
          severity: "high"
        },
        {
          code: "dispatch.has_email",
          path: "sendability.hasEmail",
          operator: "equals",
          value: true,
          reason: "Contact email is missing.",
          severity: "critical"
        },
        {
          code: "dispatch.not_suppressed",
          path: "sendability.suppressed",
          operator: "equals",
          value: false,
          reason: "Contact is suppressed.",
          severity: "critical"
        },
        {
          code: "dispatch.not_bounced",
          path: "sendability.bounced",
          operator: "equals",
          value: false,
          reason: "Contact is marked as bounced.",
          severity: "critical"
        },
        {
          code: "dispatch.not_unsubscribed",
          path: "sendability.unsubscribed",
          operator: "equals",
          value: false,
          reason: "Contact is unsubscribed.",
          severity: "critical"
        },
        {
          code: "dispatch.no_duplicate_first_touch",
          path: "sendability.duplicateFirstTouch",
          operator: "equals",
          value: false,
          reason: "A first-touch message already exists for this contact and campaign.",
          severity: "high"
        },
        {
          code: "dispatch.has_plain_text_body",
          path: "sendability.hasPlainTextBody",
          operator: "equals",
          value: true,
          reason: "Outbound message is missing a plain-text body.",
          severity: "high"
        },
        {
          code: "dispatch.has_opt_out",
          path: "sendability.hasOptOut",
          operator: "equals",
          value: true,
          reason: "Outbound message is missing an opt-out path.",
          severity: "high"
        }
      ]
    },
    {
      id: "dispatch.block",
      decision: "dispatch.block",
      description: "Dispatch can be blocked when a sendability or manual risk reason is present.",
      requiredCapability: "dispatch.block",
      constraints: [
        {
          code: "dispatch.blockable_status",
          path: "status",
          operator: "in",
          value: ["dispatch.review_requested", "dispatch.approved"],
          reason: "Dispatch is not in a blockable state.",
          severity: "high"
        },
        {
          code: "dispatch.block_reason_supported",
          path: "blockReason",
          operator: "in",
          value: [
            "suppressed",
            "bounced",
            "unsubscribed",
            "missing_email",
            "duplicate_first_touch",
            "missing_plain_text",
            "missing_opt_out",
            "manual_risk"
          ],
          reason: "Dispatch block reason is not supported.",
          severity: "medium"
        }
      ]
    },
    {
      id: "reply.classify_outcome",
      decision: "reply.classify_outcome",
      description: "Reply classifications must map to supported outcome categories.",
      requiredCapability: "replies.classify_outcome",
      constraints: [
        {
          code: "reply.classification_supported",
          path: "classification",
          operator: "in",
          value: [
            "positive",
            "neutral",
            "objection",
            "not_interested",
            "bounce",
            "auto_reply",
            "unknown"
          ],
          reason: "Reply classification is not supported.",
          severity: "medium"
        },
        {
          code: "reply.outcome_supported",
          path: "outcomeType",
          operator: "in",
          value: [
            "no_response",
            "positive_reply",
            "meeting_booked",
            "not_interested",
            "bad_fit",
            "bounced",
            "manual_follow_up",
            "won",
            "lost"
          ],
          reason: "Outcome type is not supported.",
          severity: "medium"
        },
        {
          code: "reply.classification_confidence_minimum",
          path: "classificationConfidence",
          operator: "gte",
          value: 0.65,
          reason: "Automated reply classification confidence is below the policy threshold.",
          severity: "low",
          optional: true
        }
      ]
    },
    {
      id: "workflow.retry",
      decision: "workflow.retry",
      description: "Technical workflow failures can be retried within the retry budget.",
      requiredCapability: "workflows.retry",
      constraints: [
        {
          code: "workflow.retryable_status",
          path: "deadLetter.status",
          operator: "in",
          value: ["open", "retry_scheduled"],
          reason: "Dead letter item is not retryable.",
          severity: "high"
        },
        {
          code: "workflow.failure_kind_technical",
          path: "failure.kind",
          operator: "equals",
          value: "technical",
          reason: "Only technical workflow failures can be retried automatically.",
          severity: "high"
        },
        {
          code: "workflow.retry_count_within_budget",
          path: "retryCount",
          operator: "lte",
          value: 3,
          reason: "Retry budget is exhausted.",
          severity: "medium"
        }
      ]
    },
    {
      id: "dead_letter.resolve",
      decision: "dead_letter.resolve",
      description: "Dead letter items can be resolved by operators after human review.",
      requiredRole: "operator",
      requiredCapability: "dead_letters.handle",
      constraints: [
        {
          code: "dead_letter.open_or_scheduled",
          path: "deadLetter.status",
          operator: "in",
          value: ["open", "retry_scheduled"],
          reason: "Dead letter item is not open.",
          severity: "medium"
        },
        {
          code: "dead_letter.resolution_note_present",
          path: "resolutionNote",
          operator: "exists",
          reason: "Resolution note is required.",
          severity: "low"
        }
      ]
    },
    {
      id: "dead_letter.ignore",
      decision: "dead_letter.ignore",
      description: "Dead letter items can be ignored by operators with an explicit reason.",
      requiredRole: "operator",
      requiredCapability: "dead_letters.handle",
      constraints: [
        {
          code: "dead_letter.open_or_scheduled",
          path: "deadLetter.status",
          operator: "in",
          value: ["open", "retry_scheduled"],
          reason: "Dead letter item is not open.",
          severity: "medium"
        },
        {
          code: "dead_letter.ignore_reason_present",
          path: "ignoreReason",
          operator: "exists",
          reason: "Ignore reason is required.",
          severity: "medium"
        }
      ]
    }
  ]
};
