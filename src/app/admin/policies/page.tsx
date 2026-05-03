"use client";

import { useMemo, useState } from "react";
import { PageHeader, Section, StatusBadge, StatusDot, TableWrap, styles } from "@/components/admin/admin-ui";
import type { BadgeTone } from "@/components/admin/mock-data";

type PolicyStatus = "active" | "draft" | "archived";
type RouteMode = "admin_only" | "ai_eligible" | "shadow_ai" | "blocked";
type EndpointRisk = "low" | "medium" | "high";

type ThresholdConstraint = {
  key: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  operator: ">=" | "<=";
};

type PolicyAuditEvent = {
  actor: string;
  action: string;
  at: string;
  note: string;
};

type ApiPolicy = {
  id: string;
  name: string;
  endpointIds: string[];
  version: number;
  status: PolicyStatus;
  routeMode: RouteMode;
  adminRole: string;
  aiModel: string;
  aiDecisionLimit: number;
  owner: string;
  updatedAt: string;
  effectiveAt: string;
  archivedAt?: string;
  description: string;
  constraints: string[];
  thresholds: ThresholdConstraint[];
  audit: PolicyAuditEvent[];
};

type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  group: string;
  description: string;
  owner: string;
  risk: EndpointRisk;
  volume: string;
  lastDecision: string;
};

const routeModeCopy: Record<RouteMode, { label: string; description: string; tone: BadgeTone }> = {
  admin_only: {
    label: "Admin only",
    description: "Every decision queues for the owning role before command dispatch.",
    tone: "amber"
  },
  ai_eligible: {
    label: "AI eligible",
    description: "AI may approve when all thresholds pass; exceptions escalate to Admin.",
    tone: "teal"
  },
  shadow_ai: {
    label: "Shadow AI",
    description: "AI records a recommendation while Admin remains the decision authority.",
    tone: "blue"
  },
  blocked: {
    label: "Blocked",
    description: "No automated or Admin approval can release this endpoint until unblocked.",
    tone: "red"
  }
};

const statusTone: Record<PolicyStatus, BadgeTone> = {
  active: "teal",
  draft: "blue",
  archived: "neutral"
};

const riskTone: Record<EndpointRisk, BadgeTone> = {
  low: "teal",
  medium: "amber",
  high: "red"
};

const apiEndpoints: ApiEndpoint[] = [
  {
    id: "signal-approve",
    method: "POST",
    path: "/api/signals/{id}/approve",
    group: "Signal review",
    description: "Approves source-backed signal review and queues context build.",
    owner: "Reviewer pool",
    risk: "medium",
    volume: "42/day",
    lastDecision: "Today 09:20"
  },
  {
    id: "signal-reject",
    method: "POST",
    path: "/api/signals/{id}/reject",
    group: "Signal review",
    description: "Rejects source-backed signal review before downstream automation starts.",
    owner: "Reviewer pool",
    risk: "medium",
    volume: "9/day",
    lastDecision: "Today 08:52"
  },
  {
    id: "review-decision",
    method: "POST",
    path: "/api/reviews/{id}/decision",
    group: "Review decisions",
    description: "Applies generic approve, reject, or changes_requested decisions to policy-gated reviews.",
    owner: "Policy reviewer",
    risk: "medium",
    volume: "31/day",
    lastDecision: "Today 09:16"
  },
  {
    id: "automation-command",
    method: "POST",
    path: "/api/automation/commands",
    group: "Automation",
    description: "Accepts n8n command envelopes and dispatches implemented automation use cases.",
    owner: "Automation owner",
    risk: "high",
    volume: "86/day",
    lastDecision: "Today 09:31"
  },
  {
    id: "context-queue",
    method: "GET",
    path: "/api/context-queue",
    group: "Workflows",
    description: "Lists approved signals ready for n8n context enrichment.",
    owner: "Ops",
    risk: "low",
    volume: "120/day",
    lastDecision: "Today 09:28"
  },
  {
    id: "signal-import",
    method: "POST",
    path: "/api/signals/import",
    group: "Signals",
    description: "Legacy/direct signal import endpoint retained for Product API compatibility.",
    owner: "Ops",
    risk: "high",
    volume: "4/day",
    lastDecision: "Today 07:44"
  }
];

const initialPolicies: ApiPolicy[] = [
  {
    id: "pol-signal-routing-v4",
    name: "Signal approval routing",
    endpointIds: ["signal-approve", "signal-reject", "review-decision"],
    version: 4,
    status: "active",
    routeMode: "ai_eligible",
    adminRole: "Policy reviewer",
    aiModel: "Slick Review AI",
    aiDecisionLimit: 62,
    owner: "Mara",
    updatedAt: "Today 08:41",
    effectiveAt: "Today 08:45",
    description: "Allows AI approval for clean inbound signals while escalating weak evidence or stale source runs.",
    constraints: ["Fresh source run required", "No normalized-domain warning", "Reviewer override is audit-linked"],
    thresholds: [
      {
        key: "fitScore",
        label: "ICP fit score",
        description: "Minimum account fit for AI approval.",
        value: 72,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "evidenceConfidence",
        label: "Evidence confidence",
        description: "Minimum confidence across source evidence.",
        value: 84,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "sourceAge",
        label: "Source freshness",
        description: "Maximum age for source evidence.",
        value: 72,
        min: 1,
        max: 168,
        step: 1,
        unit: "h",
        operator: "<="
      }
    ],
    audit: [
      { actor: "Mara", action: "Activated v4", at: "Today 08:45", note: "Raised evidence confidence threshold." },
      { actor: "Slick", action: "Evaluated", at: "Today 09:20", note: "AI approved sig-1048 with audit trace." }
    ]
  },
  {
    id: "pol-dispatch-v7",
    name: "Automation command guardrail",
    endpointIds: ["automation-command", "signal-import"],
    version: 7,
    status: "active",
    routeMode: "admin_only",
    adminRole: "Delivery desk",
    aiModel: "Disabled",
    aiDecisionLimit: 0,
    owner: "Jonas",
    updatedAt: "Yesterday 17:12",
    effectiveAt: "Yesterday 17:20",
    description: "Restricts n8n writes to validated command envelopes with matching idempotency and correlation metadata.",
    constraints: ["Idempotency key required", "Correlation header must match body", "Unsupported commands return 422"],
    thresholds: [
      {
        key: "sendability",
        label: "Command schema confidence",
        description: "Minimum validation confidence for accepting automation writes.",
        value: 91,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "suppressionMatch",
        label: "Idempotency conflict rate",
        description: "Maximum accepted conflict rate before route is blocked.",
        value: 0,
        min: 0,
        max: 10,
        step: 1,
        unit: "%",
        operator: "<="
      },
      {
        key: "mailboxDailyLoad",
        label: "Daily command replay cap",
        description: "Maximum accepted idempotent replays before operator review.",
        value: 32,
        min: 0,
        max: 80,
        step: 1,
        unit: "",
        operator: "<="
      }
    ],
    audit: [
      { actor: "Jonas", action: "Activated v7", at: "Yesterday 17:20", note: "Locked automation commands to Product API validation." },
      { actor: "Slick", action: "Denied", at: "Today 09:16", note: "Header idempotency key did not match command body." }
    ]
  },
  {
    id: "pol-draft-grounding-v3",
    name: "Generic review decision policy",
    endpointIds: ["review-decision"],
    version: 3,
    status: "draft",
    routeMode: "shadow_ai",
    adminRole: "Copy review",
    aiModel: "Slick Copy AI",
    aiDecisionLimit: 24,
    owner: "Lea",
    updatedAt: "Today 09:04",
    effectiveAt: "Not active",
    description: "Tests shadow recommendations for generic review decisions while Admin remains the final authority.",
    constraints: ["Object-specific policy must pass", "Changes requested requires a note", "Admin override records rationale"],
    thresholds: [
      {
        key: "qualityScore",
        label: "Decision confidence",
        description: "Minimum composite score for AI recommendation.",
        value: 86,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "claimSupport",
        label: "Policy reason coverage",
        description: "Minimum share of policy reasons backed by structured evidence.",
        value: 95,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "toneRisk",
        label: "Decision risk",
        description: "Maximum permitted review decision risk.",
        value: 7,
        min: 0,
        max: 25,
        step: 1,
        unit: "%",
        operator: "<="
      }
    ],
    audit: [
      { actor: "Lea", action: "Created draft v3", at: "Today 09:04", note: "Prepared shadow AI rollout." }
    ]
  },
  {
    id: "pol-reply-v2",
    name: "Context queue access policy",
    endpointIds: ["context-queue"],
    version: 2,
    status: "active",
    routeMode: "ai_eligible",
    adminRole: "Account owner",
    aiModel: "Slick Reply AI",
    aiDecisionLimit: 80,
    owner: "Nora",
    updatedAt: "Yesterday 13:08",
    effectiveAt: "Yesterday 13:10",
    description: "Lets n8n poll approved context work while routing stale or high-risk queue items to operators.",
    constraints: ["Only approved signals enter queue", "Stale queue items escalate", "Manual override records rationale"],
    thresholds: [
      {
        key: "classificationConfidence",
        label: "Source quality",
        description: "Minimum source quality for automated context pickup.",
        value: 88,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        operator: ">="
      },
      {
        key: "sentimentRisk",
        label: "Queue age risk",
        description: "Maximum queue age risk n8n may handle.",
        value: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        operator: "<="
      }
    ],
    audit: [{ actor: "Nora", action: "Activated v2", at: "Yesterday 13:10", note: "Added positive reply escalation." }]
  },
  {
    id: "pol-workflow-v1",
    name: "Legacy import policy",
    endpointIds: ["signal-import"],
    version: 1,
    status: "archived",
    routeMode: "blocked",
    adminRole: "Ops",
    aiModel: "Disabled",
    aiDecisionLimit: 0,
    owner: "Ops",
    updatedAt: "Apr 30, 16:10",
    effectiveAt: "Archived",
    archivedAt: "May 01, 09:30",
    description: "Former direct import policy archived after automation commands became the preferred ingress.",
    constraints: ["Direct import disabled for new flows", "Archive retained for audit"],
    thresholds: [
      {
        key: "retryCount",
        label: "Retry count",
        description: "Maximum retry attempts before blocking.",
        value: 1,
        min: 0,
        max: 5,
        step: 1,
        unit: "",
        operator: "<="
      }
    ],
    audit: [
      { actor: "Ops", action: "Archived v1", at: "May 01, 09:30", note: "Replaced by manual retry process." }
    ]
  }
];

function cloneThresholds(thresholds: ThresholdConstraint[]) {
  return thresholds.map((threshold) => ({ ...threshold }));
}

function todayStamp() {
  return "Today, draft session";
}

function getPolicyEndpointCoverage(policy: ApiPolicy) {
  return `${policy.endpointIds.length} endpoint${policy.endpointIds.length === 1 ? "" : "s"}`;
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<ApiPolicy[]>(initialPolicies);
  const [selectedEndpointId, setSelectedEndpointId] = useState(apiEndpoints[0].id);
  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicies[0].id);
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | "all">("all");
  const [query, setQuery] = useState("");

  const selectedEndpoint = apiEndpoints.find((endpoint) => endpoint.id === selectedEndpointId) ?? apiEndpoints[0];

  const attachedPolicies = useMemo(
    () =>
      policies
        .filter((policy) => policy.endpointIds.includes(selectedEndpoint.id))
        .sort((a, b) => {
          const statusOrder: Record<PolicyStatus, number> = { active: 0, draft: 1, archived: 2 };
          return statusOrder[a.status] - statusOrder[b.status] || b.version - a.version;
        }),
    [policies, selectedEndpoint.id]
  );

  const selectedPolicy = policies.find((policy) => policy.id === selectedPolicyId) ?? attachedPolicies[0] ?? policies[0];
  const draftCount = policies.filter((policy) => policy.status === "draft").length;
  const activeCount = policies.filter((policy) => policy.status === "active").length;
  const aiRoutedCount = policies.filter((policy) => policy.routeMode === "ai_eligible").length;

  const filteredEndpoints = apiEndpoints.filter((endpoint) => {
    const haystack = `${endpoint.method} ${endpoint.path} ${endpoint.group} ${endpoint.description}`.toLowerCase();
    const hasQuery = haystack.includes(query.trim().toLowerCase());
    const endpointPolicies = policies.filter((policy) => policy.endpointIds.includes(endpoint.id));
    const hasStatus = statusFilter === "all" || endpointPolicies.some((policy) => policy.status === statusFilter);

    return hasQuery && hasStatus;
  });

  function selectEndpoint(endpointId: string) {
    const endpointPolicies = policies.filter((policy) => policy.endpointIds.includes(endpointId));
    setSelectedEndpointId(endpointId);
    setSelectedPolicyId(endpointPolicies[0]?.id ?? policies[0].id);
  }

  function createDraftFromScratch() {
    const activePolicy = attachedPolicies.find((policy) => policy.status === "active") ?? selectedPolicy;
    const nextVersion = Math.max(0, ...attachedPolicies.map((policy) => policy.version)) + 1;
    const draft: ApiPolicy = {
      ...activePolicy,
      id: `pol-${selectedEndpoint.id}-draft-${Date.now()}`,
      name: `${selectedEndpoint.group} policy`,
      endpointIds: [selectedEndpoint.id],
      version: nextVersion,
      status: "draft",
      routeMode: activePolicy.routeMode === "blocked" ? "admin_only" : activePolicy.routeMode,
      aiDecisionLimit: activePolicy.routeMode === "admin_only" ? 0 : activePolicy.aiDecisionLimit,
      owner: "Current admin",
      updatedAt: todayStamp(),
      effectiveAt: "Not active",
      archivedAt: undefined,
      description: `Draft policy for ${selectedEndpoint.path}.`,
      thresholds: cloneThresholds(activePolicy.thresholds),
      audit: [{ actor: "Current admin", action: `Created draft v${nextVersion}`, at: todayStamp(), note: "Mock draft only." }]
    };

    setPolicies((current) => [draft, ...current]);
    setSelectedPolicyId(draft.id);
  }

  function duplicateSelectedPolicy() {
    const nextVersion = Math.max(0, ...attachedPolicies.map((policy) => policy.version)) + 1;
    const duplicate: ApiPolicy = {
      ...selectedPolicy,
      id: `${selectedPolicy.id}-copy-${Date.now()}`,
      name: `${selectedPolicy.name} copy`,
      version: nextVersion,
      status: "draft",
      owner: "Current admin",
      updatedAt: todayStamp(),
      effectiveAt: "Not active",
      archivedAt: undefined,
      thresholds: cloneThresholds(selectedPolicy.thresholds),
      audit: [
        { actor: "Current admin", action: `Duplicated as v${nextVersion}`, at: todayStamp(), note: `Copied from v${selectedPolicy.version}.` },
        ...selectedPolicy.audit
      ]
    };

    setPolicies((current) => [duplicate, ...current]);
    setSelectedPolicyId(duplicate.id);
  }

  function updatePolicy(changes: Partial<ApiPolicy>) {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === selectedPolicy.id
          ? {
              ...policy,
              ...changes,
              updatedAt: policy.status === "draft" ? todayStamp() : policy.updatedAt
            }
          : policy
      )
    );
  }

  function updateThreshold(key: string, value: number) {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === selectedPolicy.id
          ? {
              ...policy,
              updatedAt: policy.status === "draft" ? todayStamp() : policy.updatedAt,
              thresholds: policy.thresholds.map((threshold) =>
                threshold.key === key ? { ...threshold, value } : threshold
              )
            }
          : policy
      )
    );
  }

  function activateSelectedPolicy() {
    setPolicies((current) =>
      current.map((policy) => {
        if (policy.id === selectedPolicy.id) {
          return {
            ...policy,
            status: "active",
            effectiveAt: "Today, pending publish",
            updatedAt: todayStamp(),
            archivedAt: undefined,
            audit: [
              { actor: "Current admin", action: `Activated v${policy.version}`, at: todayStamp(), note: "Mock publish event." },
              ...policy.audit
            ]
          };
        }

        if (policy.endpointIds.includes(selectedEndpoint.id) && policy.status === "active") {
          return {
            ...policy,
            status: "archived",
            archivedAt: "Today, replaced",
            audit: [
              { actor: "Current admin", action: `Archived v${policy.version}`, at: todayStamp(), note: `Replaced by ${selectedPolicy.name}.` },
              ...policy.audit
            ]
          };
        }

        return policy;
      })
    );
  }

  function archiveSelectedPolicy() {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === selectedPolicy.id
          ? {
              ...policy,
              status: "archived",
              archivedAt: "Today, archived draft",
              updatedAt: todayStamp(),
              audit: [
                { actor: "Current admin", action: `Archived v${policy.version}`, at: todayStamp(), note: "Mock archive event." },
                ...policy.audit
              ]
            }
          : policy
      )
    );
  }

  function saveSelectedDraft() {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === selectedPolicy.id && policy.status === "draft"
          ? {
              ...policy,
              updatedAt: todayStamp(),
              audit: [
                { actor: "Current admin", action: `Saved draft v${policy.version}`, at: todayStamp(), note: "Mock save event." },
                ...policy.audit
              ]
            }
          : policy
      )
    );
  }

  const canEdit = selectedPolicy.status === "draft";

  return (
    <>
      <PageHeader
        kicker="Policy administration"
        title="Endpoint policies"
        description="Admin CRUD for endpoint-level policies, draft versions, threshold constraints, AI routing, activation state, and audit history."
        actions={
          <>
            <button className={`${styles.button} ${styles.buttonPrimary}`} type="button" onClick={createDraftFromScratch}>
              New draft
            </button>
            <button className={styles.button} type="button" onClick={duplicateSelectedPolicy}>
              Duplicate
            </button>
          </>
        }
      />

      <div className={styles.metricGrid} aria-label="Policy administration metrics">
        <article className={`${styles.metricCard} ${styles.metricCardTeal}`}>
          <p className={styles.metricLabel}>Active policies</p>
          <p className={styles.metricValue}>{activeCount}</p>
          <p className={styles.metricMeta}>Endpoint routes currently enforcing a policy</p>
        </article>
        <article className={`${styles.metricCard} ${styles.metricCardBlue}`}>
          <p className={styles.metricLabel}>Draft versions</p>
          <p className={styles.metricValue}>{draftCount}</p>
          <p className={styles.metricMeta}>Editable mock drafts pending activation</p>
        </article>
        <article className={`${styles.metricCard} ${styles.metricCardAmber}`}>
          <p className={styles.metricLabel}>AI-routed policies</p>
          <p className={styles.metricValue}>{aiRoutedCount}</p>
          <p className={styles.metricMeta}>AI can decide only inside threshold limits</p>
        </article>
      </div>

      <div className={styles.policyConsole}>
        <Section
          title="API endpoint coverage"
          meta={`${filteredEndpoints.length} endpoints shown`}
          actions={
            <div className={styles.filterBar}>
              <label className={styles.srOnly} htmlFor="policy-search">
                Search endpoints
              </label>
              <input
                className={styles.inputLike}
                id="policy-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search endpoint or group"
                type="search"
                value={query}
              />
              <label className={styles.srOnly} htmlFor="policy-status-filter">
                Filter by policy status
              </label>
              <select
                className={styles.inputLike}
                id="policy-status-filter"
                onChange={(event) => setStatusFilter(event.target.value as PolicyStatus | "all")}
                value={statusFilter}
              >
                <option value="all">All states</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          }
        >
          <TableWrap>
            <table className={`${styles.table} ${styles.endpointTable}`}>
              <thead>
                <tr>
                  <th scope="col">Endpoint</th>
                  <th scope="col">Risk</th>
                  <th scope="col">Attached policies</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Last decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredEndpoints.map((endpoint) => {
                  const endpointPolicies = policies.filter((policy) => policy.endpointIds.includes(endpoint.id));
                  const activePolicy = endpointPolicies.find((policy) => policy.status === "active");
                  const isSelected = endpoint.id === selectedEndpoint.id;

                  return (
                    <tr className={isSelected ? styles.selectedTableRow : ""} key={endpoint.id}>
                      <td>
                        <button
                          aria-pressed={isSelected}
                          className={styles.endpointSelectButton}
                          onClick={() => selectEndpoint(endpoint.id)}
                          type="button"
                        >
                          <span className={styles.methodPath}>
                            <span className={styles.methodBadge}>{endpoint.method}</span>
                            <span className={styles.strongCell}>{endpoint.path}</span>
                          </span>
                          <span className={styles.cellMeta}>{endpoint.description}</span>
                        </button>
                      </td>
                      <td>
                        <StatusBadge tone={riskTone[endpoint.risk]}>{endpoint.risk}</StatusBadge>
                        <div className={styles.cellMeta}>{endpoint.volume}</div>
                      </td>
                      <td>
                        <div className={styles.statusLine}>
                          <StatusDot tone={activePolicy ? routeModeCopy[activePolicy.routeMode].tone : "neutral"} />
                          <span className={styles.strongCell}>{endpointPolicies.length}</span>
                        </div>
                        <div className={styles.cellMeta}>{activePolicy ? routeModeCopy[activePolicy.routeMode].label : "No active policy"}</div>
                      </td>
                      <td>{endpoint.owner}</td>
                      <td>{endpoint.lastDecision}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section
          title="Attached policy versions"
          meta={`${selectedEndpoint.method} ${selectedEndpoint.path}`}
          actions={<StatusBadge tone={riskTone[selectedEndpoint.risk]}>{selectedEndpoint.risk} risk</StatusBadge>}
        >
          <div className={styles.policyVersionList}>
            {attachedPolicies.map((policy) => {
              const isSelected = policy.id === selectedPolicy.id;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.policyVersionButton} ${isSelected ? styles.policyVersionButtonCurrent : ""}`}
                  key={policy.id}
                  onClick={() => setSelectedPolicyId(policy.id)}
                  type="button"
                >
                  <span>
                    <span className={styles.rowTitle}>{policy.name}</span>
                    <span className={styles.rowMeta}>
                      v{policy.version} - {policy.owner} - {getPolicyEndpointCoverage(policy)}
                    </span>
                  </span>
                  <StatusBadge tone={statusTone[policy.status]}>{policy.status}</StatusBadge>
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      <div className={styles.policyEditorGrid}>
        <Section
          title="Policy editor"
          meta={`${selectedPolicy.name} - v${selectedPolicy.version}`}
          actions={
            <>
              <StatusBadge tone={statusTone[selectedPolicy.status]}>{selectedPolicy.status}</StatusBadge>
              <button className={styles.button} type="button" onClick={saveSelectedDraft} disabled={!canEdit}>
                Save draft
              </button>
              <button className={styles.button} type="button" onClick={activateSelectedPolicy} disabled={selectedPolicy.status === "active"}>
                Activate
              </button>
              <button
                className={`${styles.button} ${styles.buttonDanger}`}
                type="button"
                onClick={archiveSelectedPolicy}
                disabled={selectedPolicy.status === "archived"}
              >
                Archive
              </button>
            </>
          }
        >
          <div className={styles.policyEditorBody}>
            <div className={styles.formGrid}>
              <label>
                <span className={styles.label}>Policy name</span>
                <input
                  className={styles.inputLike}
                  disabled={!canEdit}
                  onChange={(event) => updatePolicy({ name: event.target.value })}
                  value={selectedPolicy.name}
                />
              </label>
              <label>
                <span className={styles.label}>Admin role</span>
                <select
                  className={styles.inputLike}
                  disabled={!canEdit}
                  onChange={(event) => updatePolicy({ adminRole: event.target.value })}
                  value={selectedPolicy.adminRole}
                >
                  <option>Policy reviewer</option>
                  <option>Copy review</option>
                  <option>Delivery desk</option>
                  <option>Account owner</option>
                  <option>Ops</option>
                </select>
              </label>
              <label>
                <span className={styles.label}>AI decision cap</span>
                <input
                  className={styles.inputLike}
                  disabled={!canEdit || selectedPolicy.routeMode === "admin_only" || selectedPolicy.routeMode === "blocked"}
                  min={0}
                  max={100}
                  onChange={(event) => updatePolicy({ aiDecisionLimit: Number(event.target.value) })}
                  type="number"
                  value={selectedPolicy.aiDecisionLimit}
                />
              </label>
              <label className={styles.formWide}>
                <span className={styles.label}>Policy description</span>
                <textarea
                  className={styles.textareaLike}
                  disabled={!canEdit}
                  onChange={(event) => updatePolicy({ description: event.target.value })}
                  value={selectedPolicy.description}
                />
              </label>
            </div>

            <fieldset className={styles.routeFieldset} disabled={!canEdit}>
              <legend className={styles.label}>AI/Admin routing</legend>
              <div className={styles.routeGrid}>
                {(Object.keys(routeModeCopy) as RouteMode[]).map((mode) => {
                  const route = routeModeCopy[mode];
                  const isSelected = selectedPolicy.routeMode === mode;

                  return (
                    <label className={`${styles.routeOption} ${isSelected ? styles.routeOptionSelected : ""}`} key={mode}>
                      <input
                        checked={isSelected}
                        name="route-mode"
                        onChange={() => updatePolicy({ routeMode: mode, aiDecisionLimit: mode === "admin_only" || mode === "blocked" ? 0 : selectedPolicy.aiDecisionLimit })}
                        type="radio"
                        value={mode}
                      />
                      <span>
                        <span className={styles.routeOptionTitle}>{route.label}</span>
                        <span className={styles.routeOptionMeta}>{route.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <div className={styles.policySubhead}>
                <h3>Threshold constraints</h3>
                <p>{canEdit ? "Editable in this draft." : "Create or duplicate a draft to edit thresholds."}</p>
              </div>
              <div className={styles.thresholdList}>
                {selectedPolicy.thresholds.map((threshold) => (
                  <div className={styles.thresholdRow} key={threshold.key}>
                    <div>
                      <p className={styles.rowTitle}>{threshold.label}</p>
                      <p className={styles.rowMeta}>
                        {threshold.description} Rule: {threshold.operator} {threshold.value}
                        {threshold.unit}
                      </p>
                    </div>
                    <div className={styles.thresholdControls}>
                      <input
                        aria-label={`${threshold.label} slider`}
                        disabled={!canEdit}
                        max={threshold.max}
                        min={threshold.min}
                        onChange={(event) => updateThreshold(threshold.key, Number(event.target.value))}
                        step={threshold.step}
                        type="range"
                        value={threshold.value}
                      />
                      <input
                        aria-label={threshold.label}
                        className={styles.inputLike}
                        disabled={!canEdit}
                        max={threshold.max}
                        min={threshold.min}
                        onChange={(event) => updateThreshold(threshold.key, Number(event.target.value))}
                        step={threshold.step}
                        type="number"
                        value={threshold.value}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <div className={styles.railStack}>
          <Section title="Activation status" meta={`Updated ${selectedPolicy.updatedAt}`}>
            <div className={styles.keyValueGrid}>
              <div className={styles.keyValue}>
                <span className={styles.label}>Effective</span>
                <span className={styles.value}>{selectedPolicy.effectiveAt}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>AI profile</span>
                <span className={styles.value}>{selectedPolicy.aiModel}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Admin route</span>
                <span className={styles.value}>{selectedPolicy.adminRole}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Decision cap</span>
                <span className={styles.value}>{selectedPolicy.aiDecisionLimit}%</span>
              </div>
            </div>
          </Section>

          <Section title="Hard constraints" meta={`${selectedPolicy.constraints.length} enforced checks`}>
            <div className={styles.constraintList}>
              {selectedPolicy.constraints.map((constraint) => (
                <label className={styles.constraintRow} key={constraint}>
                  <input checked readOnly type="checkbox" />
                  <span>{constraint}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Audit trail" meta={`${selectedPolicy.audit.length} events`}>
            <ol className={styles.auditTrail}>
              {selectedPolicy.audit.map((event) => (
                <li className={styles.auditItem} key={`${event.action}-${event.at}`}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    <p className={styles.timelineTitle}>{event.action}</p>
                    <p className={styles.timelineMeta}>
                      {event.actor} - {event.at}
                    </p>
                    <p className={styles.rowMeta}>{event.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </>
  );
}
