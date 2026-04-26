CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"linkedin_url" text,
	"region" text,
	"industry" text,
	"employee_range" text,
	"tech_stack_json" jsonb,
	"source_refs_json" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "accounts_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"timezone" text DEFAULT 'Europe/Berlin' NOT NULL,
	"default_language" text DEFAULT 'de' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"settings_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" text,
	"event_type" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" uuid NOT NULL,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"icp_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"default_persona_id" uuid,
	"default_copy_framework_id" text DEFAULT 'default_signal_outreach_v1' NOT NULL,
	"owner_member_id" uuid NOT NULL,
	"notification_policy_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "campaigns_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"account_id" uuid,
	"name" text,
	"role_title" text,
	"persona_id" uuid,
	"email" text,
	"email_hash" text,
	"linkedin_url" text,
	"source_refs_json" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "contacts_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "context_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"signal_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"company_context_json" jsonb NOT NULL,
	"person_context_json" jsonb,
	"tech_stack_json" jsonb,
	"crm_context_json" jsonb,
	"offer_fit_json" jsonb NOT NULL,
	"bridge_hypothesis" text NOT NULL,
	"source_refs_json" jsonb NOT NULL,
	"risk_flags_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "context_snapshots_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "dead_letter_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"workflow_run_id" uuid,
	"object_type" text NOT NULL,
	"object_id" uuid NOT NULL,
	"failure_stage" text NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"error_code" text,
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "dead_letter_items_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "icps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"one_sentence_definition" text NOT NULL,
	"segment_cluster" text,
	"region" text,
	"industry" text,
	"platforms_json" jsonb,
	"size_criteria_json" jsonb,
	"pain_points_json" jsonb,
	"disqualifiers_json" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "icps_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_hash" text NOT NULL,
	"response_object_type" text,
	"response_object_id" uuid,
	"status" text DEFAULT 'started' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "idempotency_keys_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "integration_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"config_json" jsonb,
	"secret_ref" text,
	"last_healthcheck_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "integration_connections_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "message_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"signal_id" uuid NOT NULL,
	"context_snapshot_id" uuid NOT NULL,
	"status" text DEFAULT 'draft.ready' NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"sequence_step" integer DEFAULT 1 NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"supersedes_message_draft_id" uuid,
	"copy_framework_id" text DEFAULT 'default_signal_outreach_v1' NOT NULL,
	"quality_checks_json" jsonb NOT NULL,
	"model_metadata_json" jsonb,
	"approved_at" timestamp with time zone,
	"approved_by_member_id" uuid,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "message_drafts_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"stage" text NOT NULL,
	"target_icp_id" uuid,
	"scope" text NOT NULL,
	"outcomes_json" jsonb NOT NULL,
	"deliverables_json" jsonb NOT NULL,
	"proof_points_json" jsonb,
	"price_model" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "offers_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "outbound_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"message_draft_id" uuid NOT NULL,
	"account_id" uuid,
	"contact_id" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"recipient_email" text NOT NULL,
	"sender_email" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"send_attempt_count" integer DEFAULT 0 NOT NULL,
	"idempotency_key" text NOT NULL,
	"provider_message_id" text,
	"message_id_header" text,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "outbound_messages_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "outcome_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"signal_id" uuid,
	"reply_id" uuid,
	"outcome_type" text NOT NULL,
	"outcome_note" text,
	"logged_by_member_id" uuid NOT NULL,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"icp_id" uuid NOT NULL,
	"name" text NOT NULL,
	"persona_type" text NOT NULL,
	"responsibilities_json" jsonb,
	"likely_pains_json" jsonb,
	"value_angles_json" jsonb,
	"objection_patterns_json" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "personas_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"outbound_message_id" uuid,
	"campaign_id" uuid,
	"from_email" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text,
	"body_text" text NOT NULL,
	"message_id_header" text,
	"in_reply_to_header" text,
	"received_at" timestamp with time zone NOT NULL,
	"classification" text,
	"needs_human_action" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "replies_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"review_request_id" uuid NOT NULL,
	"decision" text NOT NULL,
	"decided_by_member_id" uuid NOT NULL,
	"decision_note" text,
	"changes_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"object_type" text NOT NULL,
	"object_id" uuid NOT NULL,
	"request_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" text DEFAULT 'system' NOT NULL,
	"assigned_to_member_id" uuid,
	"notification_sent_at" timestamp with time zone,
	"decision_due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "review_requests_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "signal_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tier" text NOT NULL,
	"source_type" text NOT NULL,
	"source_config_json" jsonb,
	"match_criteria_json" jsonb NOT NULL,
	"default_persona_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "signal_rules_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"signal_rule_id" uuid NOT NULL,
	"account_id" uuid,
	"contact_id" uuid,
	"status" text DEFAULT 'signal.detected' NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"source_run_id" text,
	"observed_at" timestamp with time zone NOT NULL,
	"company_name" text NOT NULL,
	"company_domain" text,
	"person_name" text,
	"person_role" text,
	"signal_summary" text NOT NULL,
	"evidence_json" jsonb NOT NULL,
	"icp_match_score" integer,
	"recommended_persona_id" uuid,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "signals_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "suppression_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"suppression_key" text NOT NULL,
	"redacted_value" text,
	"reason" text NOT NULL,
	"source_object_type" text,
	"source_object_id" uuid,
	"created_by" text DEFAULT 'system' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"workflow_name" text NOT NULL,
	"workflow_version" text,
	"trigger_type" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"correlation_id" text NOT NULL,
	"input_refs_json" jsonb,
	"output_refs_json" jsonb,
	"error_code" text,
	"error_summary" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "workflow_runs_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"notification_channels_json" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "workspace_members_agency_id_unique" UNIQUE("agency_id","id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_icp_tenant_fk" FOREIGN KEY ("agency_id","icp_id") REFERENCES "public"."icps"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_offer_tenant_fk" FOREIGN KEY ("agency_id","offer_id") REFERENCES "public"."offers"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_default_persona_tenant_fk" FOREIGN KEY ("agency_id","default_persona_id") REFERENCES "public"."personas"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_member_tenant_fk" FOREIGN KEY ("agency_id","owner_member_id") REFERENCES "public"."workspace_members"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_tenant_fk" FOREIGN KEY ("agency_id","account_id") REFERENCES "public"."accounts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_persona_tenant_fk" FOREIGN KEY ("agency_id","persona_id") REFERENCES "public"."personas"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_snapshots" ADD CONSTRAINT "context_snapshots_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_snapshots" ADD CONSTRAINT "context_snapshots_signal_tenant_fk" FOREIGN KEY ("agency_id","signal_id") REFERENCES "public"."signals"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dead_letter_items" ADD CONSTRAINT "dead_letter_items_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dead_letter_items" ADD CONSTRAINT "dead_letter_items_workflow_run_tenant_fk" FOREIGN KEY ("agency_id","workflow_run_id") REFERENCES "public"."workflow_runs"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "icps" ADD CONSTRAINT "icps_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_signal_tenant_fk" FOREIGN KEY ("agency_id","signal_id") REFERENCES "public"."signals"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_context_tenant_fk" FOREIGN KEY ("agency_id","context_snapshot_id") REFERENCES "public"."context_snapshots"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_supersedes_tenant_fk" FOREIGN KEY ("agency_id","supersedes_message_draft_id") REFERENCES "public"."message_drafts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_drafts" ADD CONSTRAINT "message_drafts_approved_by_tenant_fk" FOREIGN KEY ("agency_id","approved_by_member_id") REFERENCES "public"."workspace_members"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_target_icp_tenant_fk" FOREIGN KEY ("agency_id","target_icp_id") REFERENCES "public"."icps"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_draft_tenant_fk" FOREIGN KEY ("agency_id","message_draft_id") REFERENCES "public"."message_drafts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_account_tenant_fk" FOREIGN KEY ("agency_id","account_id") REFERENCES "public"."accounts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_messages" ADD CONSTRAINT "outbound_messages_contact_tenant_fk" FOREIGN KEY ("agency_id","contact_id") REFERENCES "public"."contacts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_logs" ADD CONSTRAINT "outcome_logs_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_logs" ADD CONSTRAINT "outcome_logs_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_logs" ADD CONSTRAINT "outcome_logs_signal_tenant_fk" FOREIGN KEY ("agency_id","signal_id") REFERENCES "public"."signals"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_logs" ADD CONSTRAINT "outcome_logs_reply_tenant_fk" FOREIGN KEY ("agency_id","reply_id") REFERENCES "public"."replies"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcome_logs" ADD CONSTRAINT "outcome_logs_member_tenant_fk" FOREIGN KEY ("agency_id","logged_by_member_id") REFERENCES "public"."workspace_members"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_icp_tenant_fk" FOREIGN KEY ("agency_id","icp_id") REFERENCES "public"."icps"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_outbound_message_tenant_fk" FOREIGN KEY ("agency_id","outbound_message_id") REFERENCES "public"."outbound_messages"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_request_tenant_fk" FOREIGN KEY ("agency_id","review_request_id") REFERENCES "public"."review_requests"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_member_tenant_fk" FOREIGN KEY ("agency_id","decided_by_member_id") REFERENCES "public"."workspace_members"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_assignee_tenant_fk" FOREIGN KEY ("agency_id","assigned_to_member_id") REFERENCES "public"."workspace_members"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_rules" ADD CONSTRAINT "signal_rules_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_rules" ADD CONSTRAINT "signal_rules_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signal_rules" ADD CONSTRAINT "signal_rules_default_persona_tenant_fk" FOREIGN KEY ("agency_id","default_persona_id") REFERENCES "public"."personas"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_campaign_tenant_fk" FOREIGN KEY ("agency_id","campaign_id") REFERENCES "public"."campaigns"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_signal_rule_tenant_fk" FOREIGN KEY ("agency_id","signal_rule_id") REFERENCES "public"."signal_rules"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_account_tenant_fk" FOREIGN KEY ("agency_id","account_id") REFERENCES "public"."accounts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_contact_tenant_fk" FOREIGN KEY ("agency_id","contact_id") REFERENCES "public"."contacts"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_recommended_persona_tenant_fk" FOREIGN KEY ("agency_id","recommended_persona_id") REFERENCES "public"."personas"("agency_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression_entries" ADD CONSTRAINT "suppression_entries_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_agency_dedupe_key_unique" ON "accounts" USING btree ("agency_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "accounts_agency_status_idx" ON "accounts" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "accounts_agency_domain_idx" ON "accounts" USING btree ("agency_id","domain");--> statement-breakpoint
CREATE INDEX "accounts_source_refs_gin_idx" ON "accounts" USING gin ("source_refs_json");--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_slug_unique" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agencies_status_idx" ON "agencies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_events_agency_created_idx" ON "audit_events" USING btree ("agency_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_agency_object_idx" ON "audit_events" USING btree ("agency_id","object_type","object_id");--> statement-breakpoint
CREATE INDEX "audit_events_agency_actor_idx" ON "audit_events" USING btree ("agency_id","actor_type","actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_agency_name_unique" ON "campaigns" USING btree ("agency_id","name");--> statement-breakpoint
CREATE INDEX "campaigns_agency_status_idx" ON "campaigns" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "campaigns_agency_owner_idx" ON "campaigns" USING btree ("agency_id","owner_member_id");--> statement-breakpoint
CREATE INDEX "campaigns_agency_icp_idx" ON "campaigns" USING btree ("agency_id","icp_id");--> statement-breakpoint
CREATE INDEX "campaigns_agency_offer_idx" ON "campaigns" USING btree ("agency_id","offer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_agency_email_hash_unique" ON "contacts" USING btree ("agency_id","email_hash") WHERE "contacts"."email_hash" is not null;--> statement-breakpoint
CREATE INDEX "contacts_agency_account_idx" ON "contacts" USING btree ("agency_id","account_id");--> statement-breakpoint
CREATE INDEX "contacts_agency_persona_idx" ON "contacts" USING btree ("agency_id","persona_id");--> statement-breakpoint
CREATE INDEX "contacts_agency_status_idx" ON "contacts" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "contacts_source_refs_gin_idx" ON "contacts" USING gin ("source_refs_json");--> statement-breakpoint
CREATE INDEX "context_snapshots_agency_status_idx" ON "context_snapshots" USING btree ("agency_id","status","created_at");--> statement-breakpoint
CREATE INDEX "context_snapshots_agency_signal_idx" ON "context_snapshots" USING btree ("agency_id","signal_id");--> statement-breakpoint
CREATE INDEX "context_snapshots_source_refs_gin_idx" ON "context_snapshots" USING gin ("source_refs_json");--> statement-breakpoint
CREATE INDEX "dead_letter_items_agency_status_retry_idx" ON "dead_letter_items" USING btree ("agency_id","status","next_retry_at");--> statement-breakpoint
CREATE INDEX "dead_letter_items_agency_object_idx" ON "dead_letter_items" USING btree ("agency_id","object_type","object_id");--> statement-breakpoint
CREATE INDEX "dead_letter_items_agency_workflow_run_idx" ON "dead_letter_items" USING btree ("agency_id","workflow_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "icps_agency_name_unique" ON "icps" USING btree ("agency_id","name");--> statement-breakpoint
CREATE INDEX "icps_agency_status_idx" ON "icps" USING btree ("agency_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_keys_agency_key_unique" ON "idempotency_keys" USING btree ("agency_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idempotency_keys_agency_operation_status_idx" ON "idempotency_keys" USING btree ("agency_id","operation","status");--> statement-breakpoint
CREATE INDEX "idempotency_keys_agency_response_idx" ON "idempotency_keys" USING btree ("agency_id","response_object_type","response_object_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_connections_agency_type_name_unique" ON "integration_connections" USING btree ("agency_id","type","name");--> statement-breakpoint
CREATE INDEX "integration_connections_agency_status_idx" ON "integration_connections" USING btree ("agency_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "message_drafts_agency_signal_version_unique" ON "message_drafts" USING btree ("agency_id","signal_id","version");--> statement-breakpoint
CREATE INDEX "message_drafts_agency_status_idx" ON "message_drafts" USING btree ("agency_id","status","created_at");--> statement-breakpoint
CREATE INDEX "message_drafts_agency_campaign_status_idx" ON "message_drafts" USING btree ("agency_id","campaign_id","status");--> statement-breakpoint
CREATE INDEX "message_drafts_agency_context_idx" ON "message_drafts" USING btree ("agency_id","context_snapshot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_agency_name_unique" ON "offers" USING btree ("agency_id","name");--> statement-breakpoint
CREATE INDEX "offers_agency_status_idx" ON "offers" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "offers_agency_target_icp_idx" ON "offers" USING btree ("agency_id","target_icp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_messages_agency_idempotency_unique" ON "outbound_messages" USING btree ("agency_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_messages_agency_message_id_header_unique" ON "outbound_messages" USING btree ("agency_id","message_id_header") WHERE "outbound_messages"."message_id_header" is not null;--> statement-breakpoint
CREATE INDEX "outbound_messages_agency_status_idx" ON "outbound_messages" USING btree ("agency_id","status","created_at");--> statement-breakpoint
CREATE INDEX "outbound_messages_agency_scheduled_idx" ON "outbound_messages" USING btree ("agency_id","status","scheduled_for");--> statement-breakpoint
CREATE INDEX "outbound_messages_agency_contact_campaign_idx" ON "outbound_messages" USING btree ("agency_id","contact_id","campaign_id");--> statement-breakpoint
CREATE INDEX "outcome_logs_agency_campaign_logged_idx" ON "outcome_logs" USING btree ("agency_id","campaign_id","logged_at");--> statement-breakpoint
CREATE INDEX "outcome_logs_agency_signal_idx" ON "outcome_logs" USING btree ("agency_id","signal_id");--> statement-breakpoint
CREATE INDEX "outcome_logs_agency_reply_idx" ON "outcome_logs" USING btree ("agency_id","reply_id");--> statement-breakpoint
CREATE UNIQUE INDEX "personas_agency_icp_name_unique" ON "personas" USING btree ("agency_id","icp_id","name");--> statement-breakpoint
CREATE INDEX "personas_agency_status_idx" ON "personas" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "personas_agency_icp_idx" ON "personas" USING btree ("agency_id","icp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "replies_agency_message_id_header_unique" ON "replies" USING btree ("agency_id","message_id_header") WHERE "replies"."message_id_header" is not null;--> statement-breakpoint
CREATE INDEX "replies_agency_outbound_idx" ON "replies" USING btree ("agency_id","outbound_message_id");--> statement-breakpoint
CREATE INDEX "replies_agency_campaign_received_idx" ON "replies" USING btree ("agency_id","campaign_id","received_at");--> statement-breakpoint
CREATE INDEX "replies_agency_in_reply_to_idx" ON "replies" USING btree ("agency_id","in_reply_to_header");--> statement-breakpoint
CREATE INDEX "review_decisions_agency_review_request_idx" ON "review_decisions" USING btree ("agency_id","review_request_id");--> statement-breakpoint
CREATE INDEX "review_decisions_agency_decided_by_idx" ON "review_decisions" USING btree ("agency_id","decided_by_member_id");--> statement-breakpoint
CREATE INDEX "review_requests_agency_status_idx" ON "review_requests" USING btree ("agency_id","status","created_at");--> statement-breakpoint
CREATE INDEX "review_requests_agency_assignee_status_idx" ON "review_requests" USING btree ("agency_id","assigned_to_member_id","status");--> statement-breakpoint
CREATE INDEX "review_requests_agency_object_idx" ON "review_requests" USING btree ("agency_id","object_type","object_id");--> statement-breakpoint
CREATE UNIQUE INDEX "signal_rules_agency_campaign_name_unique" ON "signal_rules" USING btree ("agency_id","campaign_id","name");--> statement-breakpoint
CREATE INDEX "signal_rules_agency_status_idx" ON "signal_rules" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "signal_rules_agency_source_type_idx" ON "signal_rules" USING btree ("agency_id","source_type");--> statement-breakpoint
CREATE INDEX "signal_rules_match_criteria_gin_idx" ON "signal_rules" USING gin ("match_criteria_json");--> statement-breakpoint
CREATE UNIQUE INDEX "signals_agency_dedupe_key_unique" ON "signals" USING btree ("agency_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "signals_agency_status_idx" ON "signals" USING btree ("agency_id","status","created_at");--> statement-breakpoint
CREATE INDEX "signals_agency_campaign_status_idx" ON "signals" USING btree ("agency_id","campaign_id","status");--> statement-breakpoint
CREATE INDEX "signals_agency_rule_idx" ON "signals" USING btree ("agency_id","signal_rule_id");--> statement-breakpoint
CREATE INDEX "signals_agency_account_idx" ON "signals" USING btree ("agency_id","account_id");--> statement-breakpoint
CREATE INDEX "signals_evidence_gin_idx" ON "signals" USING gin ("evidence_json");--> statement-breakpoint
CREATE UNIQUE INDEX "suppression_entries_agency_scope_key_unique" ON "suppression_entries" USING btree ("agency_id","scope","suppression_key");--> statement-breakpoint
CREATE INDEX "suppression_entries_agency_source_idx" ON "suppression_entries" USING btree ("agency_id","source_object_type","source_object_id");--> statement-breakpoint
CREATE INDEX "suppression_entries_agency_expires_idx" ON "suppression_entries" USING btree ("agency_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_runs_agency_correlation_unique" ON "workflow_runs" USING btree ("agency_id","correlation_id");--> statement-breakpoint
CREATE INDEX "workflow_runs_agency_status_idx" ON "workflow_runs" USING btree ("agency_id","status","started_at");--> statement-breakpoint
CREATE INDEX "workflow_runs_agency_name_started_idx" ON "workflow_runs" USING btree ("agency_id","workflow_name","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_agency_email_unique" ON "workspace_members" USING btree ("agency_id","email");--> statement-breakpoint
CREATE INDEX "workspace_members_agency_status_idx" ON "workspace_members" USING btree ("agency_id","status");