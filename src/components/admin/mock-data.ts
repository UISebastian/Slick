export type BadgeTone = "neutral" | "teal" | "amber" | "red" | "blue" | "purple";

export type QueueSummary = {
  href: string;
  label: string;
  pending: number;
  oldest: string;
  owner: string;
  tone: BadgeTone;
};

export type SignalReview = {
  id: string;
  company: string;
  domain: string;
  campaign: string;
  status: string;
  priority: "High" | "Medium" | "Low";
  source: string;
  observedAt: string;
  dueAt: string;
  signalSummary: string;
  persona: string;
  fitScore: number;
  owner: string;
  bridgeHypothesis: string;
  evidence: string[];
  riskFlags: string[];
  timeline: Array<{
    title: string;
    meta: string;
  }>;
};

export type DraftReview = {
  id: string;
  account: string;
  recipient: string;
  campaign: string;
  status: string;
  subject: string;
  body: string;
  version: number;
  qualityScore: number;
  checks: string[];
  requestedAt: string;
};

export type DispatchReview = {
  id: string;
  account: string;
  recipient: string;
  mailbox: string;
  campaign: string;
  status: string;
  scheduledFor: string;
  sendability: string;
  blockers: string[];
};

export type ReplyOutcome = {
  id: string;
  account: string;
  from: string;
  classification: string;
  receivedAt: string;
  status: string;
  snippet: string;
  outcome: string;
};

export type WorkflowRun = {
  id: string;
  name: string;
  status: string;
  startedAt: string;
  duration: string;
  correlationId: string;
  refs: string;
};

export type PolicyGateState = "allowed" | "blocked" | "needs_approval";

export type AutomationHealthItem = {
  label: string;
  value: string;
  status: string;
  detail: string;
  tone: BadgeTone;
};

export type N8nFlowRun = {
  id: string;
  workflow: string;
  status: string;
  trigger: string;
  startedAt: string;
  duration: string;
  attempts: number;
  gate: PolicyGateState;
  correlationId: string;
  refs: string;
};

export type PolicyDecision = {
  id: string;
  account: string;
  stage: string;
  policy: string;
  gate: PolicyGateState;
  role: string;
  owner: string;
  age: string;
  route: string;
  reason: string;
};

export type PolicyDeny = {
  id: string;
  rule: string;
  count: number;
  latest: string;
  stage: string;
  owner: string;
  tone: BadgeTone;
};

export type SourceQualityItem = {
  source: string;
  score: number;
  accepted: number;
  rejected: number;
  stale: number;
  lastRun: string;
  tone: BadgeTone;
};

export type SlaQueueItem = {
  queue: string;
  pending: number;
  age: string;
  sla: string;
  owner: string;
  tone: BadgeTone;
};

export type DeadLetterItem = {
  id: string;
  object: string;
  stage: string;
  status: string;
  retryCount: number;
  nextRetryAt: string;
  error: string;
};

export const summaryMetrics = [
  {
    label: "Policy-gated decisions",
    value: "24",
    meta: "9 need human approval"
  },
  {
    label: "Blocked automations",
    value: "5",
    meta: "3 policy denies, 2 dead letters"
  },
  {
    label: "n8n run success",
    value: "96.8%",
    meta: "1 failed run in last 24h"
  },
  {
    label: "Oldest queue age",
    value: "5h 22m",
    meta: "Reply outcome SLA breach"
  },
  {
    label: "Source quality",
    value: "84%",
    meta: "Apify monitor down 7 pts"
  }
] as const;

export const queueSummaries: QueueSummary[] = [
  {
    href: "/admin/signals",
    label: "Signal review",
    pending: 9,
    oldest: "2h 14m",
    owner: "Reviewer pool",
    tone: "amber"
  },
  {
    href: "/admin/drafts",
    label: "Draft review",
    pending: 7,
    oldest: "1h 03m",
    owner: "Copy review",
    tone: "blue"
  },
  {
    href: "/admin/dispatch",
    label: "Dispatch review",
    pending: 3,
    oldest: "44m",
    owner: "Delivery desk",
    tone: "teal"
  },
  {
    href: "/admin/replies",
    label: "Replies and outcomes",
    pending: 5,
    oldest: "5h 22m",
    owner: "Account owner",
    tone: "purple"
  },
  {
    href: "/admin/workflows",
    label: "Workflow dead letters",
    pending: 2,
    oldest: "31m",
    owner: "Ops",
    tone: "red"
  }
];

export const pipelineSnapshot = [
  { label: "Detected", count: 18, percent: 82 },
  { label: "Signal approved", count: 11, percent: 64 },
  { label: "Draft ready", count: 7, percent: 48 },
  { label: "Dispatch queued", count: 4, percent: 32 },
  { label: "Sent", count: 21, percent: 74 }
] as const;

export const automationHealth: AutomationHealthItem[] = [
  {
    label: "Automation health",
    value: "Degraded",
    status: "draft_generation failing",
    detail: "1 failed n8n run, 2 retryable dead letters",
    tone: "red"
  },
  {
    label: "Policy engine",
    value: "Gated",
    status: "human approval queue active",
    detail: "9 approvals waiting, 3 hard denies",
    tone: "amber"
  },
  {
    label: "Dispatch guardrails",
    value: "Holding",
    status: "suppression checks active",
    detail: "2 sends blocked before mailbox handoff",
    tone: "amber"
  },
  {
    label: "Source ingestion",
    value: "Stable",
    status: "4 sources within freshness target",
    detail: "Apify job monitor needs review",
    tone: "teal"
  }
];

export const n8nFlowRuns: N8nFlowRun[] = [
  {
    id: "n8n-9042",
    workflow: "signal_collection",
    status: "succeeded",
    trigger: "schedule",
    startedAt: "Today 09:00",
    duration: "3m 42s",
    attempts: 1,
    gate: "allowed",
    correlationId: "corr_sig_20260426_0900",
    refs: "18 signals"
  },
  {
    id: "n8n-9041",
    workflow: "draft_generation",
    status: "failed",
    trigger: "policy_release",
    startedAt: "Today 08:48",
    duration: "1m 08s",
    attempts: 2,
    gate: "blocked",
    correlationId: "corr_draft_2208",
    refs: "draft-2208"
  },
  {
    id: "n8n-9040",
    workflow: "dispatch_prepare",
    status: "waiting",
    trigger: "review_event",
    startedAt: "Today 08:31",
    duration: "24m wait",
    attempts: 1,
    gate: "needs_approval",
    correlationId: "corr_disp_3316",
    refs: "disp-3316"
  },
  {
    id: "n8n-9039",
    workflow: "reply_polling",
    status: "succeeded",
    trigger: "schedule",
    startedAt: "Today 08:00",
    duration: "54s",
    attempts: 1,
    gate: "allowed",
    correlationId: "corr_reply_0800",
    refs: "3 replies"
  }
];

export const policyDecisions: PolicyDecision[] = [
  {
    id: "gate-771",
    account: "Aster Supply",
    stage: "dispatch_prepare",
    policy: "recipient_required",
    gate: "blocked",
    role: "Ops admin",
    owner: "Delivery desk",
    age: "44m",
    route: "/admin/dispatch",
    reason: "Recipient email missing"
  },
  {
    id: "gate-770",
    account: "Helio Retail Group",
    stage: "dispatch_prepare",
    policy: "suppression_review",
    gate: "needs_approval",
    role: "Policy reviewer",
    owner: "Mara",
    age: "31m",
    route: "/admin/dispatch",
    reason: "Domain suppression match"
  },
  {
    id: "gate-769",
    account: "Northstar Cart Labs",
    stage: "draft_generation",
    policy: "claim_grounding",
    gate: "needs_approval",
    role: "Copy review",
    owner: "Reviewer pool",
    age: "18m",
    route: "/admin/drafts",
    reason: "Timeline claim needs review"
  },
  {
    id: "gate-768",
    account: "Vector Loom",
    stage: "reply_outcome",
    policy: "manual_positive_reply",
    gate: "allowed",
    role: "Account owner",
    owner: "Account owner",
    age: "12m",
    route: "/admin/replies",
    reason: "Manual follow-up permitted"
  }
];

export const policyDenies: PolicyDeny[] = [
  {
    id: "deny-140",
    rule: "missing_recipient",
    count: 2,
    latest: "Today 09:16",
    stage: "dispatch_prepare",
    owner: "Delivery desk",
    tone: "red"
  },
  {
    id: "deny-139",
    rule: "unsupported_claim",
    count: 1,
    latest: "Today 08:52",
    stage: "draft_generation",
    owner: "Copy review",
    tone: "amber"
  },
  {
    id: "deny-138",
    rule: "domain_suppression",
    count: 1,
    latest: "Today 08:31",
    stage: "dispatch_prepare",
    owner: "Policy reviewer",
    tone: "amber"
  }
];

export const sourceQuality: SourceQualityItem[] = [
  {
    source: "Apify job monitor",
    score: 78,
    accepted: 14,
    rejected: 4,
    stale: 1,
    lastRun: "Today 09:00",
    tone: "amber"
  },
  {
    source: "Manual imports",
    score: 92,
    accepted: 5,
    rejected: 1,
    stale: 0,
    lastRun: "Today 08:42",
    tone: "teal"
  },
  {
    source: "Reply mailbox",
    score: 88,
    accepted: 3,
    rejected: 0,
    stale: 0,
    lastRun: "Today 08:00",
    tone: "teal"
  },
  {
    source: "Suppression lookup",
    score: 81,
    accepted: 11,
    rejected: 2,
    stale: 1,
    lastRun: "Today 07:55",
    tone: "blue"
  }
];

export const slaQueues: SlaQueueItem[] = [
  {
    queue: "Replies and outcomes",
    pending: 5,
    age: "5h 22m",
    sla: "4h",
    owner: "Account owner",
    tone: "red"
  },
  {
    queue: "Signal review",
    pending: 9,
    age: "2h 14m",
    sla: "3h",
    owner: "Reviewer pool",
    tone: "amber"
  },
  {
    queue: "Draft review",
    pending: 7,
    age: "1h 03m",
    sla: "4h",
    owner: "Copy review",
    tone: "blue"
  },
  {
    queue: "Workflow dead letters",
    pending: 2,
    age: "31m",
    sla: "1h",
    owner: "Ops",
    tone: "red"
  }
];

export const signalReviews: SignalReview[] = [
  {
    id: "sig-1048",
    company: "Northstar Cart Labs",
    domain: "northstar-cart.example",
    campaign: "CRO job posting signal Q2",
    status: "signal.triage_requested",
    priority: "High",
    source: "Apify job monitor",
    observedAt: "Today 09:18",
    dueAt: "Today 13:30",
    signalSummary:
      "Opened a senior experimentation role with explicit Shopify Plus and checkout optimization requirements.",
    persona: "Head of Ecommerce",
    fitScore: 87,
    owner: "Reviewer pool",
    bridgeHypothesis:
      "Hiring for experimentation suggests a near-term conversion program where a focused audit offer can de-risk the first tests.",
    evidence: [
      "Job post mentions Shopify Plus, checkout funnel analysis, and experimentation roadmap ownership.",
      "Company careers page lists the role as reporting to the VP Growth.",
      "Recent source run references the DACH ecommerce signal rule."
    ],
    riskFlags: ["Company domain normalized from source text", "No named contact confirmed yet"],
    timeline: [
      { title: "Signal imported", meta: "09:18 from Apify actor run apify-run-8f3" },
      { title: "Dedupe checked", meta: "09:18 against campaign and domain key" },
      { title: "Review requested", meta: "09:20 assigned to reviewer pool" }
    ]
  },
  {
    id: "sig-1047",
    company: "Helio Retail Group",
    domain: "helio-retail.example",
    campaign: "Platform migration trigger",
    status: "signal.triage_requested",
    priority: "Medium",
    source: "Manual import",
    observedAt: "Today 08:42",
    dueAt: "Today 15:00",
    signalSummary:
      "Public roadmap notes a move from a custom storefront to a composable commerce stack.",
    persona: "VP Digital",
    fitScore: 74,
    owner: "Mara",
    bridgeHypothesis:
      "Migration planning creates a narrow window for checkout measurement and launch-readiness support.",
    evidence: [
      "Roadmap excerpt references Q3 storefront migration.",
      "Imported source URL is a company-owned product update.",
      "ICP tags match mid-market retail and DACH operations."
    ],
    riskFlags: ["Migration scope not confirmed", "Offer fit depends on timeline"],
    timeline: [
      { title: "Signal imported", meta: "08:42 by manual import" },
      { title: "Review requested", meta: "08:45 assigned to Mara" }
    ]
  },
  {
    id: "sig-1046",
    company: "Aster Supply",
    domain: "aster-supply.example",
    campaign: "CRO job posting signal Q2",
    status: "signal.triage_requested",
    priority: "Low",
    source: "Apify job monitor",
    observedAt: "Yesterday 17:06",
    dueAt: "Today 12:00",
    signalSummary: "Hiring a lifecycle marketer with onsite personalization and retention testing ownership.",
    persona: "Growth Lead",
    fitScore: 61,
    owner: "Reviewer pool",
    bridgeHypothesis:
      "Lifecycle scope may support a light audit, but the current evidence is weaker than the checkout-focused campaign.",
    evidence: [
      "Role description includes personalization tests.",
      "No source excerpt directly mentions conversion rate optimization.",
      "Company profile aligns to ecommerce ICP."
    ],
    riskFlags: ["Weak signal-to-offer bridge", "Could be retention-only work"],
    timeline: [
      { title: "Signal imported", meta: "Yesterday 17:06 from Apify actor run apify-run-8ef" },
      { title: "Review requested", meta: "Yesterday 17:08 assigned to reviewer pool" }
    ]
  }
];

export const draftReviews: DraftReview[] = [
  {
    id: "draft-2209",
    account: "Northstar Cart Labs",
    recipient: "Head of Ecommerce",
    campaign: "CRO job posting signal Q2",
    status: "draft.review_requested",
    subject: "Shopify Plus experimentation role",
    body:
      "Hi,\n\nI noticed Northstar is hiring for Shopify Plus experimentation and checkout optimization. That usually means the first few tests need clean evidence and a practical way to prioritize ideas.\n\nWe help ecommerce teams turn signals like this into a focused conversion audit and test plan without overloading the team that is still hiring.\n\nWould it be useful to compare the role requirements against a short launch-readiness checklist?",
    version: 1,
    qualityScore: 91,
    checks: ["Signal cited", "No unsupported claims", "Soft CTA", "No hard guarantee"],
    requestedAt: "Today 10:06"
  },
  {
    id: "draft-2208",
    account: "Helio Retail Group",
    recipient: "VP Digital",
    campaign: "Platform migration trigger",
    status: "draft.review_requested",
    subject: "Migration readiness and checkout risk",
    body:
      "Hi,\n\nYour public roadmap mentions a move toward a composable commerce stack. Teams often use that window to clean up measurement and prioritize checkout risks before launch.\n\nWe run focused audits for ecommerce teams that need practical recommendations before a migration hardens.\n\nWould a short comparison of common launch risks be useful?",
    version: 2,
    qualityScore: 84,
    checks: ["Signal cited", "Bridge present", "CTA is specific", "Timeline claim needs review"],
    requestedAt: "Today 09:41"
  }
];

export const dispatchReviews: DispatchReview[] = [
  {
    id: "disp-3318",
    account: "Northstar Cart Labs",
    recipient: "h***@northstar-cart.example",
    mailbox: "growth@slick.local",
    campaign: "CRO job posting signal Q2",
    status: "dispatch.review_requested",
    scheduledFor: "Today 16:00",
    sendability: "Ready",
    blockers: ["Daily mailbox limit available", "No matching suppression", "Recipient present"]
  },
  {
    id: "disp-3317",
    account: "Aster Supply",
    recipient: "missing",
    mailbox: "growth@slick.local",
    campaign: "CRO job posting signal Q2",
    status: "dispatch.review_requested",
    scheduledFor: "Not scheduled",
    sendability: "Blocked",
    blockers: ["Recipient email missing", "Needs contact enrichment before send"]
  },
  {
    id: "disp-3316",
    account: "Helio Retail Group",
    recipient: "v***@helio-retail.example",
    mailbox: "growth@slick.local",
    campaign: "Platform migration trigger",
    status: "dispatch.review_requested",
    scheduledFor: "Tomorrow 09:15",
    sendability: "Suppression check",
    blockers: ["Domain suppression match requires reviewer confirmation"]
  }
];

export const replyOutcomes: ReplyOutcome[] = [
  {
    id: "reply-5012",
    account: "Vector Loom",
    from: "m***@vector-loom.example",
    classification: "positive",
    receivedAt: "Today 08:12",
    status: "reply.received",
    snippet: "This is relevant. Can you send the checklist before Thursday?",
    outcome: "manual_follow_up"
  },
  {
    id: "reply-5011",
    account: "Kitewheel Goods",
    from: "ops@kitewheel.example",
    classification: "not_interested",
    receivedAt: "Yesterday 15:44",
    status: "reply.received",
    snippet: "Please remove us from this sequence.",
    outcome: "not_interested"
  },
  {
    id: "reply-5010",
    account: "Maven & Co.",
    from: "auto-reply@maven.example",
    classification: "auto_reply",
    receivedAt: "Yesterday 11:09",
    status: "reply.received",
    snippet: "I am away until Monday and will respond when I return.",
    outcome: "no_response"
  }
];

export const workflowRuns: WorkflowRun[] = [
  {
    id: "run-8804",
    name: "signal_collection",
    status: "succeeded",
    startedAt: "Today 09:00",
    duration: "3m 42s",
    correlationId: "corr_sig_20260426_0900",
    refs: "18 signals"
  },
  {
    id: "run-8803",
    name: "draft_generation",
    status: "failed",
    startedAt: "Today 08:48",
    duration: "1m 08s",
    correlationId: "corr_draft_2208",
    refs: "draft-2208"
  },
  {
    id: "run-8802",
    name: "reply_polling",
    status: "succeeded",
    startedAt: "Today 08:00",
    duration: "54s",
    correlationId: "corr_reply_0800",
    refs: "3 replies"
  }
];

export const deadLetterItems: DeadLetterItem[] = [
  {
    id: "dlq-118",
    object: "message_draft draft-2208",
    stage: "llm_draft",
    status: "open",
    retryCount: 1,
    nextRetryAt: "Today 10:40",
    error: "Provider timeout after redacted retry window"
  },
  {
    id: "dlq-117",
    object: "dispatch disp-3316",
    stage: "smtp_send",
    status: "retry_scheduled",
    retryCount: 2,
    nextRetryAt: "Today 11:15",
    error: "Suppression validation requires fresh lookup"
  }
];

export function getSignalReview(id: string) {
  return signalReviews.find((signal) => signal.id === id);
}
