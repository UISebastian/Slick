export const signalImportCommandExample = {
  schemaVersion: "2026-04-30",
  commandType: "signals.import",
  flow: "signals.import",
  correlationId: "corr-slick-local-001",
  idempotencyKey: "slick-local-import-001",
  attempt: 1,
  actor: {
    type: "n8n",
    id: "local-n8n"
  },
  payload: {
    signals: [
      {
        campaignId: "00000000-0000-4000-8000-000000000020",
        signalRuleId: "00000000-0000-4000-8000-000000000030",
        sourceType: "api",
        sourceUrl: "https://example.com/partners/northstar-cart-labs",
        sourceRunId: "n8n-local-001",
        observedAt: "2026-04-30T10:00:00.000Z",
        companyName: "Northstar Cart Labs",
        companyDomain: "northstar-cart.example",
        personRole: "Head of Ecommerce",
        signalSummary: "n8n imported a partner-directory style ecommerce growth signal.",
        evidence: {
          sourceType: "partner_directory",
          sourceName: "Local n8n smoke test",
          evidenceUrl: "https://example.com/partners/northstar-cart-labs",
          snippets: ["Partner profile references Shopify Plus checkout optimization and CRO services."]
        },
        icpMatchScore: 88,
        dedupeKey: "northstar-cart.example:n8n-local-001"
      }
    ]
  }
} as const;

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Slick Product API",
    version: "0.1.0",
    summary: "Automation-first Product API for Slick",
    description:
      "Slick is the Product API and system of record. n8n orchestrates external work, but every write goes through Slick for validation, idempotency, policy guards, status transitions, and audit."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Slick dev server"
    }
  ],
  tags: [
    {
      name: "Automation",
      description: "n8n command ingress and orchestration contracts."
    },
    {
      name: "Signals",
      description: "Signal import, queue inspection, and signal decisions."
    },
    {
      name: "Reviews",
      description: "Human or policy-gated approval requests."
    },
    {
      name: "Workflows",
      description: "Context build queue and operational health."
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Workflows"],
        operationId: "getHealth",
        summary: "Check API health",
        security: [],
        responses: {
          "200": {
            description: "Slick API is reachable.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/automation/commands": {
      post: {
        tags: ["Automation"],
        operationId: "postAutomationCommand",
        summary: "Submit an automation command",
        description:
          "Primary n8n ingress. The MVP dispatches signals.import. Other command types are validated by contract and return 422 until their use cases are implemented.",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            $ref: "#/components/parameters/IdempotencyKey"
          },
          {
            $ref: "#/components/parameters/CorrelationId"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AutomationCommand"
              },
              examples: {
                signalImport: {
                  summary: "n8n signal import command",
                  value: signalImportCommandExample
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Idempotent replay of a previously accepted command.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AutomationCommandResponse"
                }
              }
            }
          },
          "202": {
            description: "Command accepted and dispatched.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AutomationCommandResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PolicyDenied"
          },
          "409": {
            $ref: "#/components/responses/Conflict"
          },
          "422": {
            $ref: "#/components/responses/UnprocessableEntity"
          }
        }
      }
    },
    "/api/signals/import": {
      post: {
        tags: ["Signals"],
        operationId: "importSignals",
        summary: "Import signal candidates",
        description:
          "Imports deduplicated signal candidates and creates pending signal review requests. Prefer /api/automation/commands for new n8n workflows.",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            $ref: "#/components/parameters/IdempotencyKey"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ImportSignalsRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Idempotent replay of a previous signal import.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ImportSignalsResult"
                }
              }
            }
          },
          "201": {
            description: "Signals imported.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ImportSignalsResult"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          },
          "409": {
            $ref: "#/components/responses/Conflict"
          }
        }
      }
    },
    "/api/signals": {
      get: {
        tags: ["Signals"],
        operationId: "listSignals",
        summary: "List signals by status",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            name: "status",
            in: "query",
            schema: {
              $ref: "#/components/schemas/WorkflowStatus"
            },
            example: "signal.triage_requested"
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        ],
        responses: {
          "200": {
            description: "Signals returned.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ListSignalsResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/api/signals/{id}/approve": signalDecisionPath("approve"),
    "/api/signals/{id}/reject": signalDecisionPath("reject"),
    "/api/reviews": {
      get: {
        tags: ["Reviews"],
        operationId: "listReviews",
        summary: "List review requests",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            name: "status",
            in: "query",
            schema: {
              $ref: "#/components/schemas/ReviewRequestStatus"
            },
            example: "pending"
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        ],
        responses: {
          "200": {
            description: "Review requests returned.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ListReviewsResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/api/reviews/{id}/decision": {
      post: {
        tags: ["Reviews"],
        operationId: "decideReview",
        summary: "Approve, reject, or request changes for a review",
        description:
          "Decision endpoint guarded by the updateable Policy Engine. Policy denies return structured reasons.",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            $ref: "#/components/parameters/UuidPathId"
          },
          {
            $ref: "#/components/parameters/IdempotencyKey"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ReviewDecisionRequest"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Review decision applied.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: true
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/PolicyDenied"
          },
          "404": {
            $ref: "#/components/responses/NotFound"
          },
          "409": {
            $ref: "#/components/responses/Conflict"
          }
        }
      }
    },
    "/api/context-queue": {
      get: {
        tags: ["Workflows"],
        operationId: "listContextQueue",
        summary: "List signals ready for context build",
        description:
          "n8n polls this queue after signal approval. Returned items are source-backed and already policy-gated through signal review.",
        parameters: [
          {
            $ref: "#/components/parameters/RequestId"
          },
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        ],
        responses: {
          "200": {
            description: "Context queue items returned.",
            headers: standardResponseHeaders(),
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ContextQueueResponse"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "401": {
            $ref: "#/components/responses/Unauthorized"
          },
          "403": {
            $ref: "#/components/responses/Forbidden"
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API key"
      }
    },
    parameters: {
      IdempotencyKey: {
        name: "Idempotency-Key",
        in: "header",
        required: false,
        schema: {
          type: "string",
          minLength: 8,
          maxLength: 200
        },
        description: "Required for mutating automation commands and recommended for all decisions."
      },
      CorrelationId: {
        name: "X-Correlation-Id",
        in: "header",
        required: false,
        schema: {
          type: "string",
          minLength: 8,
          maxLength: 200
        },
        description: "Stable ID carried across n8n, Slick API, audit events, logs, and dead letters."
      },
      RequestId: {
        name: "X-Request-Id",
        in: "header",
        required: false,
        schema: {
          type: "string",
          minLength: 8,
          maxLength: 200
        },
        description:
          "Optional caller-generated request ID. Slick echoes it in X-Request-Id and error.requestId."
      },
      UuidPathId: {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          format: "uuid"
        }
      }
    },
    responses: {
      BadRequest: errorResponse("Request validation failed."),
      Unauthorized: errorResponse("Missing or invalid bearer token."),
      Forbidden: errorResponse("Authenticated client does not have access to this resource."),
      NotFound: errorResponse("Requested resource was not found."),
      Conflict: errorResponse("Request conflicts with current state or idempotency record."),
      PolicyDenied: errorResponse("Decision denied by policy."),
      InternalServerError: errorResponse("Unexpected API failure."),
      UnprocessableEntity: errorResponse("Valid command, unsupported or unprocessable operation.")
    },
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["ok", "service", "timestamp"],
        properties: {
          ok: {
            type: "boolean"
          },
          service: {
            type: "string",
            example: "slick"
          },
          timestamp: {
            type: "string",
            format: "date-time"
          }
        }
      },
      AutomationCommand: {
        oneOf: [
          {
            $ref: "#/components/schemas/SignalImportAutomationCommand"
          },
          {
            $ref: "#/components/schemas/ContextCompleteAutomationCommand"
          },
          {
            $ref: "#/components/schemas/ContextFailAutomationCommand"
          },
          {
            $ref: "#/components/schemas/DraftCompleteAutomationCommand"
          },
          {
            $ref: "#/components/schemas/DraftFailAutomationCommand"
          },
          {
            $ref: "#/components/schemas/DispatchRecordSentAutomationCommand"
          },
          {
            $ref: "#/components/schemas/DispatchFailAutomationCommand"
          },
          {
            $ref: "#/components/schemas/ReplyIngestAutomationCommand"
          },
          {
            $ref: "#/components/schemas/OutcomeLogAutomationCommand"
          }
        ],
        discriminator: {
          propertyName: "commandType"
        }
      },
      AutomationEnvelope: {
        type: "object",
        required: ["schemaVersion", "commandType", "flow", "correlationId", "idempotencyKey", "actor"],
        properties: {
          schemaVersion: {
            type: "string",
            const: "2026-04-30"
          },
          commandType: {
            type: "string"
          },
          flow: {
            $ref: "#/components/schemas/AutomationFlow"
          },
          correlationId: {
            type: "string",
            minLength: 8,
            maxLength: 200
          },
          idempotencyKey: {
            type: "string",
            minLength: 8,
            maxLength: 200
          },
          attempt: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 1
          },
          actor: {
            $ref: "#/components/schemas/AutomationActor"
          },
          occurredAt: {
            type: "string",
            format: "date-time"
          }
        }
      },
      SignalImportAutomationCommand: automationCommand("signals.import", "signals.import", {
        type: "object",
        required: ["signals"],
        properties: {
          signals: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: {
              $ref: "#/components/schemas/SignalCandidate"
            }
          }
        },
        additionalProperties: false
      }),
      ContextCompleteAutomationCommand: automationCommand("context.complete", "context.build", {
        $ref: "#/components/schemas/ContextCompletePayload"
      }),
      ContextFailAutomationCommand: automationCommand("context.fail", "context.build", {
        $ref: "#/components/schemas/FailurePayload"
      }),
      DraftCompleteAutomationCommand: automationCommand("draft.complete", "draft.generate", {
        $ref: "#/components/schemas/DraftCompletePayload"
      }),
      DraftFailAutomationCommand: automationCommand("draft.fail", "draft.generate", {
        $ref: "#/components/schemas/FailurePayload"
      }),
      DispatchRecordSentAutomationCommand: automationCommand("dispatch.record_sent", "dispatch.send", {
        $ref: "#/components/schemas/DispatchRecordSentPayload"
      }),
      DispatchFailAutomationCommand: automationCommand("dispatch.fail", "dispatch.send", {
        $ref: "#/components/schemas/FailurePayload"
      }),
      ReplyIngestAutomationCommand: automationCommand("reply.ingest", "replies.ingest", {
        $ref: "#/components/schemas/ReplyIngestPayload"
      }),
      OutcomeLogAutomationCommand: automationCommand("outcome.log", "outcomes.remind", {
        $ref: "#/components/schemas/OutcomeLogPayload"
      }),
      AutomationActor: {
        type: "object",
        required: ["type", "id"],
        properties: {
          type: {
            type: "string",
            enum: ["n8n", "api_client", "system"]
          },
          id: {
            type: "string",
            minLength: 1,
            maxLength: 200
          }
        },
        additionalProperties: false
      },
      AutomationFlow: {
        type: "string",
        enum: [
          "signals.collect",
          "signals.import",
          "context.build",
          "draft.generate",
          "review.notify",
          "dispatch.prepare",
          "dispatch.send",
          "replies.ingest",
          "outcomes.remind",
          "monitoring.health",
          "dead_letters.replay"
        ]
      },
      AutomationCommandResponse: {
        type: "object",
        required: ["commandType", "flow", "correlationId", "idempotencyKey", "result"],
        properties: {
          commandType: {
            type: "string"
          },
          flow: {
            $ref: "#/components/schemas/AutomationFlow"
          },
          correlationId: {
            type: "string"
          },
          idempotencyKey: {
            type: "string"
          },
          result: {
            type: "object",
            additionalProperties: true
          }
        }
      },
      ImportSignalsRequest: {
        type: "object",
        required: ["signals"],
        properties: {
          idempotencyKey: {
            type: "string"
          },
          correlationId: {
            type: "string"
          },
          signals: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: {
              $ref: "#/components/schemas/SignalCandidate"
            }
          }
        },
        additionalProperties: false
      },
      SignalCandidate: {
        type: "object",
        required: [
          "campaignId",
          "signalRuleId",
          "sourceType",
          "observedAt",
          "companyName",
          "signalSummary",
          "dedupeKey"
        ],
        properties: {
          campaignId: uuidSchema(),
          signalRuleId: uuidSchema(),
          accountId: uuidSchema(),
          contactId: uuidSchema(),
          sourceType: {
            type: "string",
            enum: ["apify", "api", "manual_import", "bulk_import"]
          },
          sourceUrl: {
            type: "string",
            format: "uri"
          },
          sourceRunId: {
            type: "string"
          },
          observedAt: {
            type: "string",
            format: "date-time"
          },
          companyName: {
            type: "string",
            minLength: 1,
            maxLength: 240
          },
          companyDomain: {
            type: "string",
            maxLength: 240
          },
          personName: {
            type: "string",
            maxLength: 240
          },
          personRole: {
            type: "string",
            maxLength: 240
          },
          signalSummary: {
            type: "string",
            minLength: 1,
            maxLength: 2000
          },
          evidence: {
            description: "Source-backed evidence. Store URLs, snippets, timestamps, and source names; never store secrets.",
            additionalProperties: true
          },
          icpMatchScore: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          recommendedPersonaId: uuidSchema(),
          dedupeKey: {
            type: "string",
            minLength: 1,
            maxLength: 500
          }
        },
        additionalProperties: false
      },
      ImportSignalsResult: {
        type: "object",
        required: ["signals", "importedCount", "dedupedCount", "idempotentReplay"],
        properties: {
          signals: {
            type: "array",
            items: {
              type: "object",
              required: ["signalId", "reviewRequestId", "dedupeKey", "status", "created"],
              properties: {
                signalId: uuidSchema(),
                reviewRequestId: uuidSchema(),
                dedupeKey: {
                  type: "string"
                },
                status: {
                  $ref: "#/components/schemas/WorkflowStatus"
                },
                created: {
                  type: "boolean"
                }
              }
            }
          },
          importedCount: {
            type: "integer"
          },
          dedupedCount: {
            type: "integer"
          },
          correlationId: {
            type: "string"
          },
          idempotentReplay: {
            type: "boolean"
          }
        }
      },
      SignalDecisionRequest: {
        type: "object",
        properties: {
          idempotencyKey: {
            type: "string"
          },
          decisionNote: {
            type: "string",
            maxLength: 2000
          }
        },
        additionalProperties: false
      },
      ReviewDecisionRequest: {
        type: "object",
        required: ["decision"],
        properties: {
          idempotencyKey: {
            type: "string"
          },
          decision: {
            type: "string",
            enum: ["approved", "rejected", "changes_requested"]
          },
          decisionNote: {
            type: "string",
            maxLength: 2000
          },
          changes: {
            additionalProperties: true
          }
        },
        additionalProperties: false
      },
      ListSignalsResponse: listResponseSchema("signals"),
      ListReviewsResponse: listResponseSchema("reviews"),
      ContextQueueResponse: listResponseSchema("items"),
      ReviewRequestStatus: {
        type: "string",
        enum: ["pending", "approved", "rejected", "changes_requested", "expired", "cancelled"]
      },
      WorkflowStatus: {
        type: "string",
        enum: [
          "signal.detected",
          "signal.triage_requested",
          "signal.approved",
          "signal.rejected",
          "context.queued",
          "context.ready",
          "context.failed",
          "draft.queued",
          "draft.ready",
          "draft.failed",
          "draft.review_requested",
          "draft.approved",
          "draft.rejected",
          "draft.changes_requested",
          "dispatch.review_requested",
          "dispatch.approved",
          "dispatch.rejected",
          "dispatch.blocked_suppressed",
          "dispatch.queued",
          "dispatch.sent",
          "dispatch.failed",
          "reply.received",
          "outcome.logged",
          "closed",
          "archived"
        ]
      },
      ContextCompletePayload: {
        type: "object",
        required: ["signalId", "sourceRefs", "quality"],
        properties: {
          signalId: uuidSchema(),
          accountContext: {
            type: "string",
            maxLength: 4000
          },
          personContext: {
            type: "string",
            maxLength: 4000
          },
          offerBridge: {
            type: "string",
            maxLength: 4000
          },
          sourceRefs: sourceRefsSchema(),
          quality: {
            $ref: "#/components/schemas/SourceQuality"
          }
        },
        additionalProperties: false
      },
      DraftCompletePayload: {
        type: "object",
        required: ["signalId", "subject", "bodyText", "quality"],
        properties: {
          signalId: uuidSchema(),
          contextSnapshotId: uuidSchema(),
          subject: {
            type: "string",
            minLength: 1,
            maxLength: 300
          },
          bodyText: {
            type: "string",
            minLength: 1,
            maxLength: 12000
          },
          model: {
            type: "string"
          },
          promptVersion: {
            type: "string"
          },
          sourceRefs: sourceRefsSchema(),
          quality: {
            $ref: "#/components/schemas/SourceQuality"
          }
        },
        additionalProperties: false
      },
      DispatchRecordSentPayload: {
        type: "object",
        required: ["dispatchId", "messageDraftId", "provider", "sentAt"],
        properties: {
          dispatchId: uuidSchema(),
          messageDraftId: uuidSchema(),
          provider: {
            type: "string"
          },
          providerMessageId: {
            type: "string"
          },
          messageIdHeader: {
            type: "string"
          },
          sentAt: {
            type: "string",
            format: "date-time"
          }
        },
        additionalProperties: false
      },
      ReplyIngestPayload: {
        type: "object",
        required: ["receivedAt", "bodyText"],
        properties: {
          receivedAt: {
            type: "string",
            format: "date-time"
          },
          provider: {
            type: "string"
          },
          providerMessageId: {
            type: "string"
          },
          messageIdHeader: {
            type: "string"
          },
          inReplyToHeader: {
            type: "string"
          },
          referencesHeader: {
            type: "string"
          },
          senderEmailHash: {
            type: "string",
            description: "Hashed sender email only. Do not transmit raw email addresses in automation logs."
          },
          subject: {
            type: "string"
          },
          bodyText: {
            type: "string",
            minLength: 1,
            maxLength: 20000
          },
          classification: {
            type: "string",
            enum: ["positive", "neutral", "objection", "unsubscribe", "bounce", "unknown"]
          }
        },
        additionalProperties: false
      },
      OutcomeLogPayload: {
        type: "object",
        required: ["object", "outcomeType", "occurredAt"],
        properties: {
          object: {
            $ref: "#/components/schemas/ObjectRef"
          },
          outcomeType: {
            type: "string",
            enum: [
              "meeting_booked",
              "meeting_completed",
              "opportunity_created",
              "won",
              "lost",
              "not_interested",
              "no_response",
              "manual_note"
            ]
          },
          occurredAt: {
            type: "string",
            format: "date-time"
          },
          notes: {
            type: "string",
            maxLength: 4000
          },
          sourceRefs: sourceRefsSchema()
        },
        additionalProperties: false
      },
      FailurePayload: {
        type: "object",
        properties: {
          signalId: uuidSchema(),
          dispatchId: uuidSchema(),
          messageDraftId: uuidSchema(),
          contextSnapshotId: uuidSchema(),
          failure: {
            $ref: "#/components/schemas/Failure"
          }
        },
        required: ["failure"],
        additionalProperties: false
      },
      Failure: {
        type: "object",
        required: ["code", "message", "retriable"],
        properties: {
          code: {
            type: "string"
          },
          message: {
            type: "string"
          },
          retriable: {
            type: "boolean"
          },
          provider: {
            type: "string"
          },
          details: {
            additionalProperties: true
          }
        },
        additionalProperties: false
      },
      SourceRef: {
        type: "object",
        required: ["sourceType", "observedAt"],
        properties: {
          sourceType: {
            type: "string",
            enum: ["apify", "api", "manual_import", "bulk_import", "mailserver", "llm"]
          },
          sourceUrl: {
            type: "string",
            format: "uri"
          },
          sourceRunId: {
            type: "string"
          },
          observedAt: {
            type: "string",
            format: "date-time"
          },
          title: {
            type: "string"
          },
          excerpt: {
            type: "string"
          },
          checksum: {
            type: "string"
          }
        },
        additionalProperties: false
      },
      SourceQuality: {
        type: "object",
        required: ["score", "verdict"],
        properties: {
          score: {
            type: "integer",
            minimum: 0,
            maximum: 100
          },
          verdict: {
            type: "string",
            enum: ["trusted", "usable", "weak", "blocked"]
          },
          reasons: {
            type: "array",
            items: {
              type: "string"
            }
          },
          checkedAt: {
            type: "string",
            format: "date-time"
          }
        },
        additionalProperties: false
      },
      ObjectRef: {
        type: "object",
        required: ["type", "id"],
        properties: {
          type: {
            type: "string",
            enum: [
              "signal",
              "review_request",
              "context_snapshot",
              "message_draft",
              "dispatch",
              "reply",
              "outcome",
              "workflow_run",
              "dead_letter_item"
            ]
          },
          id: uuidSchema()
        },
        additionalProperties: false
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "requestId", "correlationId"],
            properties: {
              code: {
                type: "string"
              },
              message: {
                type: "string"
              },
              details: {
                additionalProperties: true
              },
              requestId: {
                type: "string",
                description: "Stable request identifier returned in X-Request-Id."
              },
              correlationId: {
                type: "string",
                description: "Trace identifier returned in X-Correlation-Id and carried across automation work."
              }
            }
          }
        }
      }
    }
  }
} as const;

export type ApiEndpointDoc = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  tag: string;
  policy?: string;
  n8n?: boolean;
};

export const apiEndpointDocs: ApiEndpointDoc[] = [
  {
    method: "POST",
    path: "/api/automation/commands",
    title: "Automation command ingress",
    description: "Primary n8n endpoint. Validates envelopes, idempotency, correlation IDs, and dispatches supported commands.",
    tag: "Automation",
    policy: "Commands are Product API gated; business decisions remain policy-gated in Slick.",
    n8n: true
  },
  {
    method: "POST",
    path: "/api/signals/import",
    title: "Import signals",
    description: "Legacy/direct import endpoint for signal candidates. Prefer automation commands for new flows.",
    tag: "Signals",
    n8n: true
  },
  {
    method: "GET",
    path: "/api/signals",
    title: "List signals",
    description: "Read signal queues by workflow status, usually signal.triage_requested.",
    tag: "Signals"
  },
  {
    method: "POST",
    path: "/api/signals/{id}/approve",
    title: "Approve signal",
    description: "Queues context build after policy-gated signal approval.",
    tag: "Signals",
    policy: "Requires signals.review capability and signal.triage_requested status."
  },
  {
    method: "POST",
    path: "/api/signals/{id}/reject",
    title: "Reject signal",
    description: "Rejects a pending signal review request.",
    tag: "Signals",
    policy: "Requires signals.review capability and signal.triage_requested status."
  },
  {
    method: "GET",
    path: "/api/reviews",
    title: "List review requests",
    description: "Returns pending or resolved review requests for Admin work queues.",
    tag: "Reviews"
  },
  {
    method: "POST",
    path: "/api/reviews/{id}/decision",
    title: "Decide review",
    description: "Generic review decision endpoint for approve, reject, or changes_requested.",
    tag: "Reviews",
    policy: "Guarded by object-specific policies for signals, drafts, dispatches, and outcomes."
  },
  {
    method: "GET",
    path: "/api/context-queue",
    title: "Context build queue",
    description: "n8n polls approved signals that are ready for context enrichment.",
    tag: "Workflows",
    n8n: true
  },
  {
    method: "GET",
    path: "/api/health",
    title: "Health check",
    description: "Simple operational health endpoint for local and workflow checks.",
    tag: "Workflows"
  }
];

function signalDecisionPath(action: "approve" | "reject") {
  return {
    post: {
      tags: ["Signals"],
      operationId: `${action}Signal`,
      summary: `${capitalize(action)} signal`,
      description: "Signal decisions are evaluated by updateable Slick policies before status changes.",
      parameters: [
        {
          $ref: "#/components/parameters/RequestId"
        },
        {
          $ref: "#/components/parameters/UuidPathId"
        },
        {
          $ref: "#/components/parameters/IdempotencyKey"
        }
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SignalDecisionRequest"
            }
          }
        }
      },
      responses: {
        "200": {
          description: `Signal ${action} decision applied.`,
          headers: standardResponseHeaders(),
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: true
              }
            }
          }
        },
        "400": {
          $ref: "#/components/responses/BadRequest"
        },
        "401": {
          $ref: "#/components/responses/Unauthorized"
        },
        "403": {
          $ref: "#/components/responses/PolicyDenied"
        },
        "404": {
          $ref: "#/components/responses/NotFound"
        },
        "409": {
          $ref: "#/components/responses/Conflict"
        }
      }
    }
  };
}

function automationCommand(commandType: string, flow: string, payloadSchema: unknown) {
  return {
    allOf: [
      {
        $ref: "#/components/schemas/AutomationEnvelope"
      },
      {
        type: "object",
        required: ["commandType", "flow", "payload"],
        properties: {
          commandType: {
            type: "string",
            const: commandType
          },
          flow: {
            type: "string",
            const: flow
          },
          payload: payloadSchema
        }
      }
    ]
  };
}

function errorResponse(description: string) {
  return {
    description,
    headers: standardResponseHeaders(),
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/ErrorResponse"
        }
      }
    }
  };
}

function standardResponseHeaders() {
  return {
    "X-Request-Id": {
      description: "Request ID echoed from X-Request-Id or generated by Slick.",
      schema: {
        type: "string"
      }
    },
    "X-Correlation-Id": {
      description: "Correlation ID echoed from X-Correlation-Id or derived from the request ID.",
      schema: {
        type: "string"
      }
    }
  };
}

function uuidSchema() {
  return {
    type: "string",
    format: "uuid"
  };
}

function sourceRefsSchema() {
  return {
    type: "array",
    maxItems: 50,
    items: {
      $ref: "#/components/schemas/SourceRef"
    }
  };
}

function listResponseSchema(key: string) {
  return {
    type: "object",
    required: [key, "count"],
    properties: {
      [key]: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true
        }
      },
      count: {
        type: "integer",
        minimum: 0
      }
    }
  };
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
