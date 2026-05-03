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
