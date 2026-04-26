import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { createdAtOnly, mutableColumns, runtimeMutableColumns } from "./columns";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export const agencies = pgTable(
  "agencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    timezone: text("timezone").notNull().default("Europe/Berlin"),
    defaultLanguage: text("default_language").notNull().default("de"),
    status: text("status").notNull().default("active"),
    settingsJson: jsonb("settings_json").$type<JsonObject>(),
    ...mutableColumns()
  },
  (table) => [
    uniqueIndex("agencies_slug_unique").on(table.slug),
    index("agencies_status_idx").on(table.status)
  ]
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default("viewer"),
    notificationChannelsJson: jsonb("notification_channels_json").$type<JsonObject>(),
    status: text("status").notNull().default("active"),
    ...mutableColumns()
  },
  (table) => [
    unique("workspace_members_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("workspace_members_agency_email_unique").on(table.agencyId, table.email),
    index("workspace_members_agency_status_idx").on(table.agencyId, table.status),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "workspace_members_agency_id_fk"
    })
  ]
);

export const icps = pgTable(
  "icps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    name: text("name").notNull(),
    oneSentenceDefinition: text("one_sentence_definition").notNull(),
    segmentCluster: text("segment_cluster"),
    region: text("region"),
    industry: text("industry"),
    platformsJson: jsonb("platforms_json").$type<JsonValue>(),
    sizeCriteriaJson: jsonb("size_criteria_json").$type<JsonObject>(),
    painPointsJson: jsonb("pain_points_json").$type<JsonValue>(),
    disqualifiersJson: jsonb("disqualifiers_json").$type<JsonValue>(),
    status: text("status").notNull().default("draft"),
    ...mutableColumns()
  },
  (table) => [
    unique("icps_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("icps_agency_name_unique").on(table.agencyId, table.name),
    index("icps_agency_status_idx").on(table.agencyId, table.status),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "icps_agency_id_fk"
    })
  ]
);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    name: text("name").notNull(),
    stage: text("stage").notNull(),
    targetIcpId: uuid("target_icp_id"),
    scope: text("scope").notNull(),
    outcomesJson: jsonb("outcomes_json").$type<JsonValue>().notNull(),
    deliverablesJson: jsonb("deliverables_json").$type<JsonValue>().notNull(),
    proofPointsJson: jsonb("proof_points_json").$type<JsonValue>(),
    priceModel: text("price_model"),
    status: text("status").notNull().default("draft"),
    ...mutableColumns()
  },
  (table) => [
    unique("offers_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("offers_agency_name_unique").on(table.agencyId, table.name),
    index("offers_agency_status_idx").on(table.agencyId, table.status),
    index("offers_agency_target_icp_idx").on(table.agencyId, table.targetIcpId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "offers_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.targetIcpId],
      foreignColumns: [icps.agencyId, icps.id],
      name: "offers_target_icp_tenant_fk"
    })
  ]
);

export const personas = pgTable(
  "personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    icpId: uuid("icp_id").notNull(),
    name: text("name").notNull(),
    personaType: text("persona_type").notNull(),
    responsibilitiesJson: jsonb("responsibilities_json").$type<JsonValue>(),
    likelyPainsJson: jsonb("likely_pains_json").$type<JsonValue>(),
    valueAnglesJson: jsonb("value_angles_json").$type<JsonValue>(),
    objectionPatternsJson: jsonb("objection_patterns_json").$type<JsonValue>(),
    status: text("status").notNull().default("draft"),
    ...mutableColumns()
  },
  (table) => [
    unique("personas_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("personas_agency_icp_name_unique").on(table.agencyId, table.icpId, table.name),
    index("personas_agency_status_idx").on(table.agencyId, table.status),
    index("personas_agency_icp_idx").on(table.agencyId, table.icpId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "personas_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.icpId],
      foreignColumns: [icps.agencyId, icps.id],
      name: "personas_icp_tenant_fk"
    })
  ]
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    name: text("name").notNull(),
    objective: text("objective").notNull(),
    status: text("status").notNull().default("draft"),
    icpId: uuid("icp_id").notNull(),
    offerId: uuid("offer_id").notNull(),
    defaultPersonaId: uuid("default_persona_id"),
    defaultCopyFrameworkId: text("default_copy_framework_id")
      .notNull()
      .default("default_signal_outreach_v1"),
    ownerMemberId: uuid("owner_member_id").notNull(),
    notificationPolicyJson: jsonb("notification_policy_json").$type<JsonObject>(),
    ...mutableColumns()
  },
  (table) => [
    unique("campaigns_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("campaigns_agency_name_unique").on(table.agencyId, table.name),
    index("campaigns_agency_status_idx").on(table.agencyId, table.status),
    index("campaigns_agency_owner_idx").on(table.agencyId, table.ownerMemberId),
    index("campaigns_agency_icp_idx").on(table.agencyId, table.icpId),
    index("campaigns_agency_offer_idx").on(table.agencyId, table.offerId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "campaigns_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.icpId],
      foreignColumns: [icps.agencyId, icps.id],
      name: "campaigns_icp_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.offerId],
      foreignColumns: [offers.agencyId, offers.id],
      name: "campaigns_offer_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.defaultPersonaId],
      foreignColumns: [personas.agencyId, personas.id],
      name: "campaigns_default_persona_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.ownerMemberId],
      foreignColumns: [workspaceMembers.agencyId, workspaceMembers.id],
      name: "campaigns_owner_member_tenant_fk"
    })
  ]
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    name: text("name").notNull(),
    domain: text("domain"),
    linkedinUrl: text("linkedin_url"),
    region: text("region"),
    industry: text("industry"),
    employeeRange: text("employee_range"),
    techStackJson: jsonb("tech_stack_json").$type<JsonValue>(),
    sourceRefsJson: jsonb("source_refs_json").$type<JsonValue>(),
    status: text("status").notNull().default("active"),
    dedupeKey: text("dedupe_key").notNull(),
    ...mutableColumns()
  },
  (table) => [
    unique("accounts_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("accounts_agency_dedupe_key_unique").on(table.agencyId, table.dedupeKey),
    index("accounts_agency_status_idx").on(table.agencyId, table.status),
    index("accounts_agency_domain_idx").on(table.agencyId, table.domain),
    index("accounts_source_refs_gin_idx").using("gin", table.sourceRefsJson),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "accounts_agency_id_fk"
    })
  ]
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    accountId: uuid("account_id"),
    name: text("name"),
    roleTitle: text("role_title"),
    personaId: uuid("persona_id"),
    email: text("email"),
    emailHash: text("email_hash"),
    linkedinUrl: text("linkedin_url"),
    sourceRefsJson: jsonb("source_refs_json").$type<JsonValue>(),
    status: text("status").notNull().default("active"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    ...mutableColumns()
  },
  (table) => [
    unique("contacts_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("contacts_agency_email_hash_unique")
      .on(table.agencyId, table.emailHash)
      .where(sql`${table.emailHash} is not null`),
    index("contacts_agency_account_idx").on(table.agencyId, table.accountId),
    index("contacts_agency_persona_idx").on(table.agencyId, table.personaId),
    index("contacts_agency_status_idx").on(table.agencyId, table.status),
    index("contacts_source_refs_gin_idx").using("gin", table.sourceRefsJson),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "contacts_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.accountId],
      foreignColumns: [accounts.agencyId, accounts.id],
      name: "contacts_account_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.personaId],
      foreignColumns: [personas.agencyId, personas.id],
      name: "contacts_persona_tenant_fk"
    })
  ]
);

export const suppressionEntries = pgTable(
  "suppression_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    scope: text("scope").notNull(),
    suppressionKey: text("suppression_key").notNull(),
    redactedValue: text("redacted_value"),
    reason: text("reason").notNull(),
    sourceObjectType: text("source_object_type"),
    sourceObjectId: uuid("source_object_id"),
    createdBy: text("created_by").notNull().default("system"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...createdAtOnly()
  },
  (table) => [
    uniqueIndex("suppression_entries_agency_scope_key_unique").on(
      table.agencyId,
      table.scope,
      table.suppressionKey
    ),
    index("suppression_entries_agency_source_idx").on(
      table.agencyId,
      table.sourceObjectType,
      table.sourceObjectId
    ),
    index("suppression_entries_agency_expires_idx").on(table.agencyId, table.expiresAt),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "suppression_entries_agency_id_fk"
    })
  ]
);

export const signalRules = pgTable(
  "signal_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    name: text("name").notNull(),
    tier: text("tier").notNull(),
    sourceType: text("source_type").notNull(),
    sourceConfigJson: jsonb("source_config_json").$type<JsonObject>(),
    matchCriteriaJson: jsonb("match_criteria_json").$type<JsonValue>().notNull(),
    defaultPersonaId: uuid("default_persona_id"),
    status: text("status").notNull().default("draft"),
    ...mutableColumns()
  },
  (table) => [
    unique("signal_rules_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("signal_rules_agency_campaign_name_unique").on(
      table.agencyId,
      table.campaignId,
      table.name
    ),
    index("signal_rules_agency_status_idx").on(table.agencyId, table.status),
    index("signal_rules_agency_source_type_idx").on(table.agencyId, table.sourceType),
    index("signal_rules_match_criteria_gin_idx").using("gin", table.matchCriteriaJson),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "signal_rules_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "signal_rules_campaign_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.defaultPersonaId],
      foreignColumns: [personas.agencyId, personas.id],
      name: "signal_rules_default_persona_tenant_fk"
    })
  ]
);

export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    signalRuleId: uuid("signal_rule_id").notNull(),
    accountId: uuid("account_id"),
    contactId: uuid("contact_id"),
    status: text("status").notNull().default("signal.detected"),
    sourceType: text("source_type").notNull(),
    sourceUrl: text("source_url"),
    sourceRunId: text("source_run_id"),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    companyName: text("company_name").notNull(),
    companyDomain: text("company_domain"),
    personName: text("person_name"),
    personRole: text("person_role"),
    signalSummary: text("signal_summary").notNull(),
    evidenceJson: jsonb("evidence_json").$type<JsonValue>().notNull(),
    icpMatchScore: integer("icp_match_score"),
    recommendedPersonaId: uuid("recommended_persona_id"),
    dedupeKey: text("dedupe_key").notNull(),
    ...mutableColumns()
  },
  (table) => [
    unique("signals_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("signals_agency_dedupe_key_unique").on(table.agencyId, table.dedupeKey),
    index("signals_agency_status_idx").on(table.agencyId, table.status, table.createdAt),
    index("signals_agency_campaign_status_idx").on(table.agencyId, table.campaignId, table.status),
    index("signals_agency_rule_idx").on(table.agencyId, table.signalRuleId),
    index("signals_agency_account_idx").on(table.agencyId, table.accountId),
    index("signals_evidence_gin_idx").using("gin", table.evidenceJson),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "signals_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "signals_campaign_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.signalRuleId],
      foreignColumns: [signalRules.agencyId, signalRules.id],
      name: "signals_signal_rule_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.accountId],
      foreignColumns: [accounts.agencyId, accounts.id],
      name: "signals_account_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.contactId],
      foreignColumns: [contacts.agencyId, contacts.id],
      name: "signals_contact_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.recommendedPersonaId],
      foreignColumns: [personas.agencyId, personas.id],
      name: "signals_recommended_persona_tenant_fk"
    })
  ]
);

export const contextSnapshots = pgTable(
  "context_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    signalId: uuid("signal_id").notNull(),
    status: text("status").notNull().default("queued"),
    companyContextJson: jsonb("company_context_json").$type<JsonValue>().notNull(),
    personContextJson: jsonb("person_context_json").$type<JsonValue>(),
    techStackJson: jsonb("tech_stack_json").$type<JsonValue>(),
    crmContextJson: jsonb("crm_context_json").$type<JsonValue>(),
    offerFitJson: jsonb("offer_fit_json").$type<JsonValue>().notNull(),
    bridgeHypothesis: text("bridge_hypothesis").notNull(),
    sourceRefsJson: jsonb("source_refs_json").$type<JsonValue>().notNull(),
    riskFlagsJson: jsonb("risk_flags_json").$type<JsonValue>(),
    ...mutableColumns()
  },
  (table) => [
    unique("context_snapshots_agency_id_unique").on(table.agencyId, table.id),
    index("context_snapshots_agency_status_idx").on(table.agencyId, table.status, table.createdAt),
    index("context_snapshots_agency_signal_idx").on(table.agencyId, table.signalId),
    index("context_snapshots_source_refs_gin_idx").using("gin", table.sourceRefsJson),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "context_snapshots_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.signalId],
      foreignColumns: [signals.agencyId, signals.id],
      name: "context_snapshots_signal_tenant_fk"
    })
  ]
);

export const messageDrafts = pgTable(
  "message_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    signalId: uuid("signal_id").notNull(),
    contextSnapshotId: uuid("context_snapshot_id").notNull(),
    status: text("status").notNull().default("draft.ready"),
    channel: text("channel").notNull().default("email"),
    sequenceStep: integer("sequence_step").notNull().default(1),
    subject: text("subject"),
    body: text("body").notNull(),
    version: integer("version").notNull().default(1),
    supersedesMessageDraftId: uuid("supersedes_message_draft_id"),
    copyFrameworkId: text("copy_framework_id").notNull().default("default_signal_outreach_v1"),
    qualityChecksJson: jsonb("quality_checks_json").$type<JsonValue>().notNull(),
    modelMetadataJson: jsonb("model_metadata_json").$type<JsonObject>(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByMemberId: uuid("approved_by_member_id"),
    createdBy: text("created_by").notNull().default("system"),
    ...mutableColumns()
  },
  (table) => [
    unique("message_drafts_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("message_drafts_agency_signal_version_unique").on(
      table.agencyId,
      table.signalId,
      table.version
    ),
    index("message_drafts_agency_status_idx").on(table.agencyId, table.status, table.createdAt),
    index("message_drafts_agency_campaign_status_idx").on(
      table.agencyId,
      table.campaignId,
      table.status
    ),
    index("message_drafts_agency_context_idx").on(table.agencyId, table.contextSnapshotId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "message_drafts_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "message_drafts_campaign_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.signalId],
      foreignColumns: [signals.agencyId, signals.id],
      name: "message_drafts_signal_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.contextSnapshotId],
      foreignColumns: [contextSnapshots.agencyId, contextSnapshots.id],
      name: "message_drafts_context_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.supersedesMessageDraftId],
      foreignColumns: [table.agencyId, table.id],
      name: "message_drafts_supersedes_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.approvedByMemberId],
      foreignColumns: [workspaceMembers.agencyId, workspaceMembers.id],
      name: "message_drafts_approved_by_tenant_fk"
    })
  ]
);

export const reviewRequests = pgTable(
  "review_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    requestType: text("request_type").notNull(),
    status: text("status").notNull().default("pending"),
    requestedBy: text("requested_by").notNull().default("system"),
    assignedToMemberId: uuid("assigned_to_member_id"),
    notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
    decisionDueAt: timestamp("decision_due_at", { withTimezone: true }),
    ...runtimeMutableColumns()
  },
  (table) => [
    unique("review_requests_agency_id_unique").on(table.agencyId, table.id),
    index("review_requests_agency_status_idx").on(table.agencyId, table.status, table.createdAt),
    index("review_requests_agency_assignee_status_idx").on(
      table.agencyId,
      table.assignedToMemberId,
      table.status
    ),
    index("review_requests_agency_object_idx").on(table.agencyId, table.objectType, table.objectId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "review_requests_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.assignedToMemberId],
      foreignColumns: [workspaceMembers.agencyId, workspaceMembers.id],
      name: "review_requests_assignee_tenant_fk"
    })
  ]
);

export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    reviewRequestId: uuid("review_request_id").notNull(),
    decision: text("decision").notNull(),
    decidedByMemberId: uuid("decided_by_member_id").notNull(),
    decisionNote: text("decision_note"),
    changesJson: jsonb("changes_json").$type<JsonObject>(),
    ...createdAtOnly()
  },
  (table) => [
    index("review_decisions_agency_review_request_idx").on(
      table.agencyId,
      table.reviewRequestId
    ),
    index("review_decisions_agency_decided_by_idx").on(table.agencyId, table.decidedByMemberId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "review_decisions_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.reviewRequestId],
      foreignColumns: [reviewRequests.agencyId, reviewRequests.id],
      name: "review_decisions_request_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.decidedByMemberId],
      foreignColumns: [workspaceMembers.agencyId, workspaceMembers.id],
      name: "review_decisions_member_tenant_fk"
    })
  ]
);

export const outboundMessages = pgTable(
  "outbound_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    messageDraftId: uuid("message_draft_id").notNull(),
    accountId: uuid("account_id"),
    contactId: uuid("contact_id"),
    status: text("status").notNull().default("queued"),
    recipientEmail: text("recipient_email").notNull(),
    senderEmail: text("sender_email").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sendAttemptCount: integer("send_attempt_count").notNull().default(0),
    idempotencyKey: text("idempotency_key").notNull(),
    providerMessageId: text("provider_message_id"),
    messageIdHeader: text("message_id_header"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    ...runtimeMutableColumns()
  },
  (table) => [
    unique("outbound_messages_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("outbound_messages_agency_idempotency_unique").on(
      table.agencyId,
      table.idempotencyKey
    ),
    uniqueIndex("outbound_messages_agency_message_id_header_unique")
      .on(table.agencyId, table.messageIdHeader)
      .where(sql`${table.messageIdHeader} is not null`),
    index("outbound_messages_agency_status_idx").on(table.agencyId, table.status, table.createdAt),
    index("outbound_messages_agency_scheduled_idx").on(
      table.agencyId,
      table.status,
      table.scheduledFor
    ),
    index("outbound_messages_agency_contact_campaign_idx").on(
      table.agencyId,
      table.contactId,
      table.campaignId
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "outbound_messages_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "outbound_messages_campaign_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.messageDraftId],
      foreignColumns: [messageDrafts.agencyId, messageDrafts.id],
      name: "outbound_messages_draft_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.accountId],
      foreignColumns: [accounts.agencyId, accounts.id],
      name: "outbound_messages_account_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.contactId],
      foreignColumns: [contacts.agencyId, contacts.id],
      name: "outbound_messages_contact_tenant_fk"
    })
  ]
);

export const replies = pgTable(
  "replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    outboundMessageId: uuid("outbound_message_id"),
    campaignId: uuid("campaign_id"),
    fromEmail: text("from_email").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject"),
    bodyText: text("body_text").notNull(),
    messageIdHeader: text("message_id_header"),
    inReplyToHeader: text("in_reply_to_header"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    classification: text("classification"),
    needsHumanAction: boolean("needs_human_action").notNull().default(true),
    ...createdAtOnly()
  },
  (table) => [
    unique("replies_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("replies_agency_message_id_header_unique")
      .on(table.agencyId, table.messageIdHeader)
      .where(sql`${table.messageIdHeader} is not null`),
    index("replies_agency_outbound_idx").on(table.agencyId, table.outboundMessageId),
    index("replies_agency_campaign_received_idx").on(
      table.agencyId,
      table.campaignId,
      table.receivedAt
    ),
    index("replies_agency_in_reply_to_idx").on(table.agencyId, table.inReplyToHeader),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "replies_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.outboundMessageId],
      foreignColumns: [outboundMessages.agencyId, outboundMessages.id],
      name: "replies_outbound_message_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "replies_campaign_tenant_fk"
    })
  ]
);

export const outcomeLogs = pgTable(
  "outcome_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    signalId: uuid("signal_id"),
    replyId: uuid("reply_id"),
    outcomeType: text("outcome_type").notNull(),
    outcomeNote: text("outcome_note"),
    loggedByMemberId: uuid("logged_by_member_id").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
    ...createdAtOnly()
  },
  (table) => [
    index("outcome_logs_agency_campaign_logged_idx").on(
      table.agencyId,
      table.campaignId,
      table.loggedAt
    ),
    index("outcome_logs_agency_signal_idx").on(table.agencyId, table.signalId),
    index("outcome_logs_agency_reply_idx").on(table.agencyId, table.replyId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "outcome_logs_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.campaignId],
      foreignColumns: [campaigns.agencyId, campaigns.id],
      name: "outcome_logs_campaign_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.signalId],
      foreignColumns: [signals.agencyId, signals.id],
      name: "outcome_logs_signal_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.replyId],
      foreignColumns: [replies.agencyId, replies.id],
      name: "outcome_logs_reply_tenant_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.loggedByMemberId],
      foreignColumns: [workspaceMembers.agencyId, workspaceMembers.id],
      name: "outcome_logs_member_tenant_fk"
    })
  ]
);

export const integrationConnections = pgTable(
  "integration_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    configJson: jsonb("config_json").$type<JsonObject>(),
    secretRef: text("secret_ref"),
    lastHealthcheckAt: timestamp("last_healthcheck_at", { withTimezone: true }),
    lastError: text("last_error"),
    ...mutableColumns()
  },
  (table) => [
    unique("integration_connections_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("integration_connections_agency_type_name_unique").on(
      table.agencyId,
      table.type,
      table.name
    ),
    index("integration_connections_agency_status_idx").on(table.agencyId, table.status),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "integration_connections_agency_id_fk"
    })
  ]
);

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    workflowName: text("workflow_name").notNull(),
    workflowVersion: text("workflow_version"),
    triggerType: text("trigger_type").notNull(),
    status: text("status").notNull().default("running"),
    correlationId: text("correlation_id").notNull(),
    inputRefsJson: jsonb("input_refs_json").$type<JsonValue>(),
    outputRefsJson: jsonb("output_refs_json").$type<JsonValue>(),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...runtimeMutableColumns()
  },
  (table) => [
    unique("workflow_runs_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("workflow_runs_agency_correlation_unique").on(table.agencyId, table.correlationId),
    index("workflow_runs_agency_status_idx").on(table.agencyId, table.status, table.startedAt),
    index("workflow_runs_agency_name_started_idx").on(
      table.agencyId,
      table.workflowName,
      table.startedAt
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "workflow_runs_agency_id_fk"
    })
  ]
);

export const deadLetterItems = pgTable(
  "dead_letter_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    workflowRunId: uuid("workflow_run_id"),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    failureStage: text("failure_stage").notNull(),
    retryCount: integer("retry_count").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    status: text("status").notNull().default("open"),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    ...runtimeMutableColumns()
  },
  (table) => [
    unique("dead_letter_items_agency_id_unique").on(table.agencyId, table.id),
    index("dead_letter_items_agency_status_retry_idx").on(
      table.agencyId,
      table.status,
      table.nextRetryAt
    ),
    index("dead_letter_items_agency_object_idx").on(table.agencyId, table.objectType, table.objectId),
    index("dead_letter_items_agency_workflow_run_idx").on(table.agencyId, table.workflowRunId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "dead_letter_items_agency_id_fk"
    }),
    foreignKey({
      columns: [table.agencyId, table.workflowRunId],
      foreignColumns: [workflowRuns.agencyId, workflowRuns.id],
      name: "dead_letter_items_workflow_run_tenant_fk"
    })
  ]
);

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    operation: text("operation").notNull(),
    requestHash: text("request_hash").notNull(),
    responseObjectType: text("response_object_type"),
    responseObjectId: uuid("response_object_id"),
    status: text("status").notNull().default("started"),
    ...runtimeMutableColumns()
  },
  (table) => [
    unique("idempotency_keys_agency_id_unique").on(table.agencyId, table.id),
    uniqueIndex("idempotency_keys_agency_key_unique").on(table.agencyId, table.idempotencyKey),
    index("idempotency_keys_agency_operation_status_idx").on(
      table.agencyId,
      table.operation,
      table.status
    ),
    index("idempotency_keys_agency_response_idx").on(
      table.agencyId,
      table.responseObjectType,
      table.responseObjectId
    ),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "idempotency_keys_agency_id_fk"
    })
  ]
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agencyId: uuid("agency_id").notNull(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    eventType: text("event_type").notNull(),
    objectType: text("object_type").notNull(),
    objectId: uuid("object_id").notNull(),
    beforeJson: jsonb("before_json").$type<JsonObject>(),
    afterJson: jsonb("after_json").$type<JsonObject>(),
    ...createdAtOnly()
  },
  (table) => [
    index("audit_events_agency_created_idx").on(table.agencyId, table.createdAt),
    index("audit_events_agency_object_idx").on(table.agencyId, table.objectType, table.objectId),
    index("audit_events_agency_actor_idx").on(table.agencyId, table.actorType, table.actorId),
    foreignKey({
      columns: [table.agencyId],
      foreignColumns: [agencies.id],
      name: "audit_events_agency_id_fk"
    })
  ]
);
