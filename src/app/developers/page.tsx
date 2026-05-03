import type { Metadata } from "next";
import Link from "next/link";
import { apiEndpointDocs, signalImportCommandExample } from "@/server/openapi/spec";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: "Developer Portal | Slick",
  description: "Slick Product API reference for n8n and automation clients"
};

const baseHeaders = [
  {
    name: "Authorization",
    value: "Bearer <service-account-token>",
    note: "Production auth. Local dev currently uses the stubbed workspace owner."
  },
  {
    name: "Idempotency-Key",
    value: "stable-key-per-write",
    note: "Required for automation commands and signal imports."
  },
  {
    name: "X-Correlation-Id",
    value: "corr-flow-object-attempt",
    note: "Carries one trace across n8n, Slick, audit, logs, and dead letters."
  },
  {
    name: "X-Request-Id",
    value: "req-client-generated-id",
    note: "Optional. Echoed on every response and included in structured errors."
  }
] as const;

const flowSteps = [
  "n8n builds a command envelope",
  "Slick validates schema and idempotency",
  "Policy guards protect decisions",
  "Use cases write status and audit",
  "Admin monitors queues and exceptions"
] as const;

const automationCommandHeaders = [
  {
    label: "Required",
    name: "Authorization",
    value: "Bearer <service-account-token>",
    note: "Use a service account token in production. Local dev currently uses the stubbed workspace owner."
  },
  {
    label: "Required",
    name: "Content-Type",
    value: "application/json",
    note: "Send a JSON automation command envelope."
  },
  {
    label: "Required",
    name: "Idempotency-Key",
    value: "stable-key-per-command",
    note: "Reuse the same key when retrying the same command; a changed body with the same key returns 409."
  },
  {
    label: "Recommended",
    name: "X-Correlation-Id",
    value: "corr-flow-object-attempt",
    note: "Also include the same value in body.correlationId so logs, audit, and dead letters stay connected."
  },
  {
    label: "Recommended",
    name: "X-Request-Id",
    value: "req-client-generated-id",
    note: "Echoed on the response and included in structured errors."
  }
] as const;

const automationCommandResponses = [
  ["202", "Command accepted and dispatched."],
  ["200", "Idempotent replay of a previously accepted command."],
  ["400", "Request validation failed."],
  ["401", "Missing or invalid bearer token."],
  ["403", "Policy denied the command."],
  ["409", "Idempotency key conflicts with a different request body."],
  ["422", "Command type is valid by contract but not implemented yet."]
] as const;

export default function DeveloperPortalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Slick Developer Portal</p>
          <h1>Product API for n8n automation</h1>
          <p>
            Build flows against Slick as the system of record. n8n orchestrates; Slick validates,
            guards, writes, and audits.
          </p>
        </div>
        <nav className={styles.headerActions} aria-label="Developer resources">
          <Link className={styles.primaryLink} href="/docs/api">
            API docs
          </Link>
          <Link
            className={styles.secondaryLink}
            href="/api/openapi.json?download=1"
            download="slick-openapi.json"
          >
            OpenAPI JSON
          </Link>
          <Link className={styles.secondaryLink} href="/admin">
            Admin cockpit
          </Link>
        </nav>
      </header>

      <section className={styles.statusBand} aria-label="API status">
        <div>
          <span>Base URL</span>
          <strong>http://localhost:3000</strong>
        </div>
        <div>
          <span>n8n callback URL</span>
          <strong>http://host.docker.internal:3000</strong>
        </div>
        <div>
          <span>Spec</span>
          <strong>/api/openapi.json</strong>
        </div>
        <div>
          <span>Automation ingress</span>
          <strong>POST /api/automation/commands</strong>
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="API guide">
          <a href="#quickstart">Quickstart</a>
          <a href="#headers">Headers</a>
          <a href="#errors">Errors</a>
          <a href="#endpoints">Endpoints</a>
          <a href="#example">n8n example</a>
          <a href="#policies">Policy gates</a>
        </aside>

        <div className={styles.content}>
          <section className={styles.section} id="quickstart">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Quickstart</p>
              <h2>Connect n8n to Slick</h2>
            </div>
            <div className={styles.flowList}>
              {flowSteps.map((step, index) => (
                <div className={styles.flowStep} key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} id="headers">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Request contract</p>
              <h2>Headers</h2>
            </div>
            <div className={styles.headerGrid}>
              {baseHeaders.map((header) => (
                <article className={styles.headerCard} key={header.name}>
                  <h3>{header.name}</h3>
                  <code>{header.value}</code>
                  <p>{header.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section} id="errors">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Failure contract</p>
              <h2>Structured errors</h2>
            </div>
            <pre className={styles.codeBlock}>
              <code>{JSON.stringify(
                {
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
                },
                null,
                2
              )}</code>
            </pre>
          </section>

          <section className={styles.section} id="endpoints">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>API reference</p>
              <h2>Endpoints</h2>
            </div>
            <div className={styles.endpointGrid}>
              {apiEndpointDocs.map((endpoint) => (
                endpoint.path === "/api/automation/commands" ? (
                  <details
                    className={`${styles.endpointCard} ${styles.endpointDetails}`}
                    key={`${endpoint.method} ${endpoint.path}`}
                  >
                    <summary className={styles.endpointSummary}>
                      <span className={styles.endpointTopline}>
                        <span className={styles.postMethod}>{endpoint.method}</span>
                        <span>{endpoint.tag}</span>
                        <span>n8n</span>
                      </span>
                      <span className={styles.endpointTitle}>{endpoint.title}</span>
                      <code>{endpoint.path}</code>
                      <span className={styles.endpointDescription}>{endpoint.description}</span>
                      <span className={styles.expandHint}>command contract</span>
                    </summary>

                    <div className={styles.endpointDetailPanel}>
                      <div className={styles.detailGrid}>
                        <section className={styles.detailBlock} aria-labelledby="automation-purpose">
                          <h4 id="automation-purpose">Purpose</h4>
                          <p>
                            Primary ingress for n8n. Slick validates the command envelope, applies
                            idempotency and correlation rules, then dispatches supported commands.
                            The MVP supports <code>signals.import</code>.
                          </p>
                        </section>

                        <section className={styles.detailBlock} aria-labelledby="automation-auth">
                          <h4 id="automation-auth">Auth note</h4>
                          <p>
                            Production requests must use bearer auth from a Slick service account.
                            Authorization is checked before policy gates and command dispatch.
                          </p>
                        </section>
                      </div>

                      <section className={styles.detailBlock} aria-labelledby="automation-headers">
                        <h4 id="automation-headers">Headers</h4>
                        <div className={styles.contractTable} role="table" aria-label="Automation command headers">
                          {automationCommandHeaders.map((header) => (
                            <div className={styles.contractRow} role="row" key={header.name}>
                              <span role="cell">{header.label}</span>
                              <code role="cell">{header.name}</code>
                              <code role="cell">{header.value}</code>
                              <span role="cell">{header.note}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className={styles.detailBlock} aria-labelledby="automation-idempotency">
                        <h4 id="automation-idempotency">Idempotency and correlation</h4>
                        <p>
                          Use one stable <code>Idempotency-Key</code> per logical write. Retries
                          with the same body replay the accepted response; the same key with a
                          different body is rejected. Keep <code>X-Correlation-Id</code> aligned
                          with <code>correlationId</code> in the body so every workflow attempt can
                          be traced across n8n, Slick audit, logs, and dead letters.
                        </p>
                      </section>

                      <section className={styles.detailBlock} aria-labelledby="automation-body">
                        <h4 id="automation-body">Request body example</h4>
                        <pre className={styles.inlineCodeBlock}>
                          <code>{JSON.stringify(signalImportCommandExample, null, 2)}</code>
                        </pre>
                      </section>

                      <section className={styles.detailBlock} aria-labelledby="automation-responses">
                        <h4 id="automation-responses">Response codes</h4>
                        <div className={styles.responseList}>
                          {automationCommandResponses.map(([code, meaning]) => (
                            <p key={code}>
                              <code>{code}</code>
                              <span>{meaning}</span>
                            </p>
                          ))}
                        </div>
                      </section>

                      <Link className={styles.referenceLink} href="/docs/api">
                        Full API reference
                      </Link>
                    </div>
                  </details>
                ) : (
                  <article className={styles.endpointCard} key={`${endpoint.method} ${endpoint.path}`}>
                    <div className={styles.endpointTopline}>
                      <span className={endpoint.method === "GET" ? styles.getMethod : styles.postMethod}>
                        {endpoint.method}
                      </span>
                      <span>{endpoint.tag}</span>
                      {endpoint.n8n ? <span>n8n</span> : null}
                    </div>
                    <h3>{endpoint.title}</h3>
                    <code>{endpoint.path}</code>
                    <p>{endpoint.description}</p>
                    {endpoint.policy ? <p className={styles.policyNote}>{endpoint.policy}</p> : null}
                  </article>
                )
              ))}
            </div>
          </section>

          <section className={styles.section} id="example">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>n8n payload</p>
              <h2>Signal import command</h2>
            </div>
            <pre className={styles.codeBlock}>
              <code>{JSON.stringify(signalImportCommandExample, null, 2)}</code>
            </pre>
          </section>

          <section className={styles.section} id="policies">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Decision safety</p>
              <h2>Policy-gated automation</h2>
            </div>
            <div className={styles.policyGrid}>
              <article>
                <h3>n8n can prepare work</h3>
                <p>Imports, context work, draft completion, dispatch sent records, reply ingestion, and outcome logs use command contracts.</p>
              </article>
              <article>
                <h3>Slick owns decisions</h3>
                <p>Approvals, dispatch gates, role checks, policy denies, retries, and audit events stay inside the Product API.</p>
              </article>
              <article>
                <h3>Admin sees exceptions</h3>
                <p>The cockpit shows pending approvals, policy denies, dead letters, source quality, and workflow health in one place.</p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
