import type { Metadata } from "next";
import Link from "next/link";
import { openApiSpec } from "@/server/openapi/spec";
import styles from "./reference.module.css";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type JsonObject = Record<string, unknown>;

type ApiOperation = {
  method: HttpMethod;
  path: string;
  tag: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: JsonObject[];
  requestBody?: JsonObject;
  responses: Record<string, JsonObject>;
};

export const metadata: Metadata = {
  title: "API Documentation | Slick",
  description: "Comprehensive OpenAPI-powered documentation for Slick Product API consumers"
};

const methods: HttpMethod[] = ["get", "post", "put", "patch", "delete"];
const operations = getOperations();
const tags = openApiSpec.tags.map((tag) => ({
  name: tag.name,
  description: tag.description,
  operations: operations.filter((operation) => operation.tag === tag.name)
}));
const schemaEntries = Object.entries(openApiSpec.components.schemas);

const n8nFlowStages = [
  {
    step: "01",
    owner: "n8n",
    title: "Collect and normalize a signal",
    status: "Runnable locally",
    contract: "Build signals.import command envelope",
    detail:
      "n8n starts from a schedule, webhook, or manual trigger, collects source evidence, computes dedupeKey, correlationId, and idempotencyKey, then builds the Slick automation command."
  },
  {
    step: "02",
    owner: "Slick API",
    title: "Import through Product API",
    status: "Implemented",
    contract: "POST /api/automation/commands",
    detail:
      "Slick validates the OpenAPI/Zod contract, checks idempotency headers against body fields, dispatches signals.import, creates the signal, and opens a review request."
  },
  {
    step: "03",
    owner: "Slick Policy",
    title: "Route approval to Admin or AI",
    status: "Architecture",
    contract: "signal.route_approval policy",
    detail:
      "Slick evaluates admin-editable policies against the signal, review request, source quality, evidence confidence, freshness, ICP score, and risk flags. The route is Admin, AI, shadow AI, or blocked."
  },
  {
    step: "04",
    owner: "Admin or AI",
    title: "Approve or reject by policy",
    status: "Policy-routed",
    contract: "signal.approve / signal.reject",
    detail:
      "Admins can decide through the dashboard. AI can decide only when policy explicitly allows it and all thresholds pass; otherwise Slick escalates to Admin with reasons and audit metadata."
  },
  {
    step: "05",
    owner: "n8n",
    title: "Poll context queue",
    status: "Implemented",
    contract: "GET /api/context-queue?limit=50",
    detail:
      "After approval, n8n polls approved signals that are ready for enrichment and carries the same correlation model into downstream work."
  },
  {
    step: "06",
    owner: "n8n",
    title: "Build context",
    status: "Contracted",
    contract: "context.complete / context.fail",
    detail:
      "The command schema exists for source-backed context completion and failure reporting. The dispatcher currently returns 422 until the use case is implemented."
  },
  {
    step: "07",
    owner: "n8n + Slick",
    title: "Draft, review, dispatch, reply, outcome",
    status: "Contracted",
    contract: "draft.complete, dispatch.record_sent, reply.ingest, outcome.log",
    detail:
      "The full lifecycle is modeled as automation commands with policy-gated Slick decisions between automated preparation steps."
  }
] as const;

const n8nRunbookSteps = [
  "Start Slick with npm run dev.",
  "Start n8n with docker compose -f docker-compose.n8n.yml up -d.",
  "Import n8n/workflows/slick-local-signal-import.json into n8n.",
  "Run the workflow manually; it posts signals.import to /api/automation/commands.",
  "Open /admin or /api/reviews?status=pending to inspect the created review request.",
  "Approve the signal in Slick, or later let an AI decision pass the policy route, then poll /api/context-queue?limit=50."
] as const;

const policyRoutingPrinciples = [
  "Admins edit policies as thresholds and scopes, not ad hoc workflow logic.",
  "Slick evaluates route eligibility before any Admin or AI decision is applied.",
  "AI may approve or reject only when source quality, evidence confidence, freshness, ICP, model confidence, and risk thresholds pass.",
  "Failed or missing policy coverage escalates to Admin with reason codes.",
  "Every route, AI attempt, Admin decision, override, and policy version is audit-linked."
] as const;

const n8nCommandCoverage = [
  ["signals.import", "signals.import", "Implemented", "Creates pending signal review requests."],
  ["context.complete", "context.build", "Schema ready", "Dispatcher returns 422 until context persistence exists."],
  ["context.fail", "context.build", "Schema ready", "Failure payload and retry metadata are contracted."],
  ["draft.complete", "draft.generate", "Schema ready", "Draft payload is contracted; approval remains Slick-owned."],
  ["draft.fail", "draft.generate", "Schema ready", "Draft failure payload is contracted."],
  ["dispatch.record_sent", "dispatch.send", "Schema ready", "Provider send result can be recorded after dispatch approval."],
  ["dispatch.fail", "dispatch.send", "Schema ready", "Provider failure result can be recorded."],
  ["reply.ingest", "replies.ingest", "Schema ready", "Replies can be normalized without exposing raw mailbox secrets."],
  ["outcome.log", "outcomes.remind", "Schema ready", "Outcome events can be logged after reply or follow-up workflows."]
] as const;

export default function ApiDocumentationPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Slick API Documentation</p>
          <h1>Product API Reference</h1>
          <p>
            OpenAPI-backed documentation for frontend, automation, internal service, and future
            external developer consumers.
          </p>
        </div>
        <nav className={styles.headerActions} aria-label="API documentation resources">
          <Link
            className={styles.primaryLink}
            href="/api/openapi.json?download=1"
            download="slick-openapi.json"
          >
            OpenAPI JSON
          </Link>
          <Link className={styles.secondaryLink} href="/developers">
            Developer portal
          </Link>
        </nav>
      </header>

      <section className={styles.summaryBand} aria-label="API summary">
        <div>
          <span>Base URL</span>
          <strong>{openApiSpec.servers[0].url}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>{openApiSpec.info.version}</strong>
        </div>
        <div>
          <span>Endpoints</span>
          <strong>{operations.length}</strong>
        </div>
        <div>
          <span>Contract</span>
          <strong>OpenAPI {openApiSpec.openapi}</strong>
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="API documentation navigation">
          <a href="#overview">Overview</a>
          <a href="#auth">Auth</a>
          <a href="#errors">Errors</a>
          <a href="#n8n-flow">n8n flow</a>
          <a href="#endpoints">Endpoints</a>
          <a href="#schemas">Schemas</a>
        </aside>

        <div className={styles.content}>
          <section className={styles.section} id="overview">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Overview</p>
              <h2>{openApiSpec.info.summary}</h2>
              <p>{openApiSpec.info.description}</p>
            </div>
            <div className={styles.tagGrid}>
              {tags.map((tag) => (
                <article className={styles.tagCard} key={tag.name}>
                  <div>
                    <h3>{tag.name}</h3>
                    <span>{tag.operations.length} endpoints</span>
                  </div>
                  <p>{tag.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="auth">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Security model</p>
              <h2>Authentication and request headers</h2>
              <p>
                Mutating requests should carry idempotency and correlation metadata. Slick echoes
                request IDs and correlation IDs on responses for operational traceability.
              </p>
            </div>
            <div className={styles.contractGrid}>
              <ContractBlock title="Security scheme" value={openApiSpec.components.securitySchemes} />
              <ContractBlock title="Reusable parameters" value={openApiSpec.components.parameters} />
            </div>
          </section>

          <section className={styles.section} id="errors">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Failure behavior</p>
              <h2>Standard error contract</h2>
              <p>
                API failures use consistent status codes and a structured error body. Validation
                details are returned in `details.issues` when available.
              </p>
            </div>
            <div className={styles.responseGrid}>
              {Object.entries(openApiSpec.components.responses).map(([name, response]) => (
                <article className={styles.responseCard} key={name}>
                  <h3>{name}</h3>
                  <p>{String(response.description)}</p>
                </article>
              ))}
            </div>
            <CodeBlock
              value={{
                error: {
                  code: "bad_request",
                  message: "Request validation failed",
                  details: {
                    issues: [
                      {
                        path: "signals.0.companyName",
                        message: "Too small: expected string to have >=1 characters"
                      }
                    ]
                  },
                  requestId: "req-client-generated-id",
                  correlationId: "corr-flow-object-attempt"
                }
              }}
            />
          </section>

          <section className={styles.section} id="n8n-flow">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>End-to-end orchestration</p>
              <h2>n8n drives work, Slick owns decisions</h2>
              <p>
                This is the complete automation boundary from signal ingestion to downstream
                context, draft, dispatch, reply, and outcome work. The first four steps are runnable
                in the local MVP; the remaining commands are already contracted for implementation.
              </p>
            </div>

            <div className={styles.flowTimeline}>
              {n8nFlowStages.map((stage) => (
                <article className={styles.flowStage} key={stage.step}>
                  <div className={styles.flowStageTopline}>
                    <span>{stage.step}</span>
                    <strong>{stage.owner}</strong>
                    <em>{stage.status}</em>
                  </div>
                  <h3>{stage.title}</h3>
                  <code>{stage.contract}</code>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>

            <div className={styles.flowSplit}>
              <article className={styles.runbookCard}>
                <h3>Local runbook</h3>
                <ol>
                  {n8nRunbookSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>

              <article className={styles.runbookCard}>
                <h3>Implementation artifacts</h3>
                <dl className={styles.artifactList}>
                  <div>
                    <dt>Workflow export</dt>
                    <dd>
                      <code>n8n/workflows/slick-local-signal-import.json</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Payload fixture</dt>
                    <dd>
                      <code>n8n/payloads/slick-local-signal-import-command.json</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Runbook</dt>
                    <dd>
                      <code>docs/n8n-end-to-end-flow.md</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Policy routing architecture</dt>
                    <dd>
                      <code>docs/policy-routed-approval-architecture.md</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Contract source</dt>
                    <dd>
                      <code>src/server/modules/automation/schemas.ts</code>
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <article className={styles.runbookCard}>
              <h3>Policy-routed approval principles</h3>
              <ul className={styles.principleList}>
                {policyRoutingPrinciples.map((principle) => (
                  <li key={principle}>{principle}</li>
                ))}
              </ul>
            </article>

            <div className={styles.subsection}>
              <h4>Command coverage</h4>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Command</th>
                      <th>Flow</th>
                      <th>Status</th>
                      <th>Capability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {n8nCommandCoverage.map(([command, flow, status, capability]) => (
                      <tr key={command}>
                        <td>
                          <code>{command}</code>
                        </td>
                        <td>
                          <code>{flow}</code>
                        </td>
                        <td>{status}</td>
                        <td>{capability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className={styles.section} id="endpoints">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Swagger-style reference</p>
              <h2>Endpoints and capabilities</h2>
              <p>
                Each operation below is generated from the OpenAPI contract, including parameters,
                request body schemas, examples, and response codes.
              </p>
            </div>

            <div className={styles.endpointGroups}>
              {tags.map((tag) =>
                tag.operations.length > 0 ? (
                  <section className={styles.endpointGroup} key={tag.name} aria-label={tag.name}>
                    <div className={styles.groupHeader}>
                      <h3>{tag.name}</h3>
                      <p>{tag.description}</p>
                    </div>
                    <div className={styles.operationList}>
                      {tag.operations.map((operation) => (
                        <OperationDetails operation={operation} key={`${operation.method} ${operation.path}`} />
                      ))}
                    </div>
                  </section>
                ) : null
              )}
            </div>
          </section>

          <section className={styles.section} id="schemas">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Schema catalog</p>
              <h2>Components</h2>
              <p>
                Shared objects used by requests and responses. These names map directly to
                `#/components/schemas/*` references in the OpenAPI document.
              </p>
            </div>
            <div className={styles.schemaList}>
              {schemaEntries.map(([name, schema]) => (
                <details className={styles.schemaDetails} key={name}>
                  <summary>{name}</summary>
                  <CodeBlock value={schema} />
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function OperationDetails({ operation }: { operation: ApiOperation }) {
  const requestContent = getJsonContent(operation.requestBody);

  return (
    <details className={styles.operationDetails}>
      <summary>
        <span className={styles.methodBadge} data-method={operation.method}>
          {operation.method.toUpperCase()}
        </span>
        <code>{operation.path}</code>
        <strong>{operation.summary}</strong>
      </summary>
      <div className={styles.operationBody}>
        {operation.description ? <p>{operation.description}</p> : null}
        <dl className={styles.metaList}>
          <div>
            <dt>Operation ID</dt>
            <dd>{operation.operationId ?? "Not specified"}</dd>
          </div>
          <div>
            <dt>Tag</dt>
            <dd>{operation.tag}</dd>
          </div>
        </dl>

        {operation.parameters.length > 0 ? (
          <div className={styles.subsection}>
            <h4>Parameters</h4>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Required</th>
                    <th>Description</th>
                    <th>Schema</th>
                  </tr>
                </thead>
                <tbody>
                  {operation.parameters.map((parameter, index) => (
                    <tr key={`${String(parameter.name)}-${index}`}>
                      <td>
                        <code>{String(parameter.name)}</code>
                      </td>
                      <td>{String(parameter.in)}</td>
                      <td>{parameter.required === true ? "Yes" : "No"}</td>
                      <td>{String(parameter.description ?? "")}</td>
                      <td>
                        <InlineSchema value={parameter.schema} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {requestContent ? (
          <div className={styles.subsection}>
            <h4>Request body</h4>
            <CodeBlock value={requestContent.schema} />
            {requestContent.examples ? (
              <div className={styles.examples}>
                <h5>Examples</h5>
                <CodeBlock value={requestContent.examples} />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.subsection}>
          <h4>Responses</h4>
          <div className={styles.responseList}>
            {Object.entries(operation.responses).map(([status, response]) => (
              <article className={styles.responseItem} key={status}>
                <div>
                  <strong>{status}</strong>
                  <span>{String(response.description ?? "Response")}</span>
                </div>
                {"content" in response || "headers" in response ? <CodeBlock value={response} /> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

function ContractBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <article className={styles.contractBlock}>
      <h3>{title}</h3>
      <CodeBlock value={value} />
    </article>
  );
}

function InlineSchema({ value }: { value: unknown }) {
  if (!value) {
    return <span>Not specified</span>;
  }

  if (isRef(value)) {
    return <code>{value.$ref}</code>;
  }

  if (isJsonObject(value) && typeof value.type === "string") {
    return <code>{value.type}</code>;
  }

  return <code>{JSON.stringify(value)}</code>;
}

function CodeBlock({ value }: { value: unknown }) {
  return (
    <pre className={styles.codeBlock}>
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}

function getOperations(): ApiOperation[] {
  return Object.entries(openApiSpec.paths).flatMap(([path, pathItem]) =>
    methods.flatMap((method) => {
      const operation = (pathItem as Record<string, unknown>)[method];
      if (!isJsonObject(operation)) {
        return [];
      }

      const tag = Array.isArray(operation.tags) && typeof operation.tags[0] === "string" ? operation.tags[0] : "General";

      const requestBody = resolveRef(operation.requestBody);

      return [
        {
          method,
          path,
          tag,
          operationId: typeof operation.operationId === "string" ? operation.operationId : undefined,
          summary: typeof operation.summary === "string" ? operation.summary : undefined,
          description: typeof operation.description === "string" ? operation.description : undefined,
          parameters: getResolvedParameters(operation.parameters),
          requestBody: isJsonObject(requestBody) ? requestBody : undefined,
          responses: getResolvedResponses(operation.responses)
        }
      ];
    })
  );
}

function getResolvedParameters(parameters: unknown) {
  if (!Array.isArray(parameters)) {
    return [];
  }

  return parameters.map((parameter) => resolveRef(parameter)).filter(isJsonObject);
}

function getResolvedResponses(responses: unknown) {
  if (!isJsonObject(responses)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(responses)
      .map(([status, response]) => [status, resolveRef(response)])
      .filter((entry): entry is [string, JsonObject] => isJsonObject(entry[1]))
  );
}

function getJsonContent(requestBody: unknown) {
  if (!isJsonObject(requestBody) || !isJsonObject(requestBody.content)) {
    return undefined;
  }

  const content = requestBody.content["application/json"];
  return isJsonObject(content) ? content : undefined;
}

function resolveRef(value: unknown): unknown {
  if (!isRef(value)) {
    return value;
  }

  const [, section, name] = value.$ref.match(/^#\/components\/([^/]+)\/(.+)$/) ?? [];
  if (!section || !name) {
    return value;
  }

  const components = openApiSpec.components as unknown as Record<string, Record<string, unknown>>;
  return components[section]?.[name] ?? value;
}

function isRef(value: unknown): value is { $ref: string } {
  return isJsonObject(value) && typeof value.$ref === "string";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
