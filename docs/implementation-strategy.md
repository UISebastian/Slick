# Slick Implementation Strategy

## Purpose

Dieses Dokument beschreibt, wie der MVP implementiert werden soll: Stack, DevOps/GitOps, Branching, Commit-Strategie und Design Patterns. Die fachliche Zielarchitektur steht in `docs/architecture-sketch.md`; die MVP-Systemarchitektur steht in `docs/mvp-architecture.md`.

## Accepted Implementation Decisions

- TypeScript monorepo.
- Next.js fuer Admin Dashboard und Product API.
- Postgres als primaere Datenbank.
- Docker Postgres lokal, managed Postgres fuer spaetere Umgebungen.
- Drizzle als typed DB layer, nah an SQL und passend zu expliziten Postgres-Migrationen.
- Shared domain validation mit Zod oder vergleichbarer Schema-Library.
- Auth-Abstraktion von Beginn an; fuer den MVP darf Auth lokal/seeding-basiert starten, aber Rollenchecks muessen echt sein.
- n8n integriert zuerst ueber API-Polling und Webhooks, nicht ueber direkten DB-Zugriff.
- Provider-neutrale Adapter fuer Mailserver, LLM und Apify.
- Keine echten Secrets im Repository. `.env.example` nur mit Platzhaltern.

## Architecture Style

Slick startet als modularer Monolith.

Das bedeutet:

- ein deploybares Product/API/Admin-System
- klare interne Module statt Microservices
- Postgres als gemeinsames System of Record
- externe Systeme nur ueber Adapter
- n8n als Orchestrator ausserhalb des Domain-Kerns

Microservices, Event-Streaming und getrennte Datenbanken sind Post-MVP.

## Design Patterns

### Modular Monolith

Code wird nach fachlichen Modulen geschnitten, nicht nach technischen Schichten allein.

Initiale Module:

- `agencies`
- `campaigns`
- `icps`
- `offers`
- `personas`
- `accounts`
- `contacts`
- `signals`
- `context`
- `drafts`
- `reviews`
- `dispatch`
- `replies`
- `outcomes`
- `integrations`
- `audit`

Jedes Modul besitzt seine eigenen Schemas, Use Cases und Persistence-Zugriffe. Direkte Cross-Module-Zugriffe auf Tabellen sollen vermieden werden; andere Module werden ueber Use Cases oder explizite Query-Funktionen genutzt.

### Hexagonal Boundaries

Externe Systeme werden hinter Ports versteckt:

- `ApifyPort`
- `MailSenderPort`
- `MailboxReaderPort`
- `LlmDraftingPort`
- `NotificationPort`
- `N8nWorkflowPort`

Konkrete Adapter implementieren diese Ports:

- `ApifyAdapter`
- `SmtpMailSender`
- `ImapMailboxReader`
- `OpenAiDraftingAdapter` oder ein anderer LLM-Adapter
- `SlackNotificationAdapter`
- `EmailNotificationAdapter`

Der Domain- und Application-Code darf keine SDKs externer Anbieter direkt importieren.

### Use Case / Command Handler Pattern

Statuswechsel und fachliche Aktionen laufen ueber explizite Use Cases:

- `ImportSignals`
- `ApproveSignal`
- `CreateContextSnapshot`
- `GenerateMessageDraft`
- `RequestDraftReview`
- `ApproveDraft`
- `ApproveDispatch`
- `RunSendabilityCheck`
- `RecordOutboundMessage`
- `IngestReply`
- `LogOutcome`

Jeder Use Case:

- validiert Input
- prueft Rollen/Rechte
- laedt benoetigte Daten
- fuehrt fachliche Regeln aus
- schreibt in einer Transaktion
- erzeugt Audit Events
- gibt ein kleines Ergebnisobjekt zurueck

### Transaction Script First

Fuer den MVP sind klare Transaction Scripts besser als ein schweres Domain-Model. Wenn sich echte Wiederholung oder Komplexitaet zeigt, kann Logik spaeter in Domain Services extrahiert werden.

### Repository / Query Pattern

DB-Zugriffe werden pro Modul gekapselt:

- Repositories fuer mutationsnahe Operationen
- Query-Funktionen fuer Dashboard-Listen und Queue-Endpunkte
- keine freien SQL/ORM-Zugriffe quer durch die App

### State Machine Pattern

Workflow-Status werden ueber eine zentrale Transition-Tabelle oder Transition-Funktion validiert. Statusstrings duerfen nicht ad hoc gesetzt werden.

Regel:

- ein Use Case darf nur erlaubte Transitionen ausfuehren
- jede Transition schreibt ein Audit Event
- technische Fehler gehen in retry-faehige Fehlerpfade oder `dead_letter_items`

### Transactional Outbox Lite

Wenn ein Use Case eine nachgelagerte n8n-Aktion ausloesen soll, schreibt er zuerst persistente Queue-/Outbox-Daten in Postgres. n8n pollt diese Daten ueber API-Endpunkte.

Kein direkter "DB write succeeded, webhook failed, state lost"-Pfad.

### Idempotency Pattern

Alle n8n-Write-Calls und externen Imports verwenden Idempotency Keys.

Betroffen:

- Signal Import
- Contact Import
- Context Snapshot Creation
- Draft Creation
- Outbound Recording
- Reply Ingestion
- Outcome Logging

### Adapter Fakes For Development

Fuer lokale Entwicklung gibt es Fake-Adapter:

- fake LLM drafting
- fake Apify dataset
- fake SMTP/IMAP
- fake Slack notification

Damit kann der erste vertikale Slice ohne echte Drittanbieter-Secrets laufen.

## DevOps Strategy

### Environments

Minimum:

- `local`: Docker Compose fuer Postgres, optional n8n.
- `preview`: pro Pull Request oder pro Branch, sobald Hosting steht.
- `staging`: automatisches Deploy von `main`.
- `production`: manuelle Promotion oder tagged release.

### Local Development

Local dev sollte mit einem Befehl startbar sein:

- App/API/Admin
- Postgres
- Migrationen
- Seed-Daten
- Fake-Adapter

Secrets lokal nur ueber `.env.local`, nie committed. Das Repository enthaelt nur `.env.example`.

### CI

Jeder Pull Request muss mindestens ausfuehren:

- install
- format check
- lint
- typecheck
- unit tests
- DB migration validation
- build

Sobald API-Vertraege stabil sind:

- API contract tests
- integration tests gegen Test-Postgres
- basic Playwright smoke test fuer Admin Dashboard

### CD

Empfohlener Ablauf:

- Merge nach `main` deployt nach `staging`.
- Production deploy erfolgt ueber Git tag oder manuelle Promotion.
- Migrationen laufen in der Pipeline vor oder waehrend des Deployments kontrolliert.
- Rollback-Strategie: App rollback plus forward migration fix. Keine destruktiven Migrationen ohne Expand/Contract.

### Database Migrations

Migrationen sind Teil des Codes.

Regeln:

- forward-only bevorzugt
- keine manuelle DB-Aenderung ausser Break-glass
- destruktive Aenderungen nur mit Expand/Contract-Plan
- Backups vor riskanten Production-Migrationen
- Migrationen muessen lokal und in CI gegen eine frische DB laufen
- Seed-Daten duerfen keine echten personenbezogenen Daten enthalten

### Observability

MVP-Baseline:

- strukturierte Logs ohne sensible Daten
- Correlation IDs fuer API/n8n Workflows
- `workflow_runs` und `dead_letter_items`
- Health endpoint
- Error reporting mit redacted payloads

Post-MVP:

- Metrics
- tracing
- SLOs fuer Queue-Latenz, Send-Failures und Reply-Ingestion

## GitOps Strategy

Infrastructure and workflow desired state should live in the repository when it becomes stable enough.

Repository-owned state:

- app source
- DB migrations
- environment templates
- sanitized n8n workflow exports
- deployment manifests or IaC
- CI/CD workflows

Not repository-owned:

- secrets
- provider credentials
- production database dumps
- raw n8n execution data
- raw email payload exports

n8n workflows should be exported without credentials and reviewed like code before promotion.

## Branching Strategy

Use trunk-based development with short-lived feature branches.

Rules:

- `main` is protected and always releasable.
- Work happens in short-lived branches named `feat/...`, `fix/...`, `docs/...`, `chore/...`.
- Pull requests should stay small and focused.
- Prefer one vertical slice per PR over broad horizontal scaffolding.
- Merge via squash merge using a Conventional Commit PR title.
- Long-running branches are avoided.

Avoid GitFlow for the MVP. It adds process without solving a current problem.

## Commit Strategy

Use Conventional Commits:

- `feat: add signal import endpoint`
- `fix: prevent duplicate outbound messages`
- `docs: add mvp architecture`
- `test: cover dispatch approval transition`
- `refactor: isolate mail adapter`
- `chore: add postgres docker compose`

Commit rules:

- commits should be atomic and explain one logical change
- no secrets, generated credential files, local DB dumps, or `.env.local`
- no mixed formatting churn with feature changes
- migrations and code using them should land together
- tests should land with behavior changes when practical

## Pull Request Strategy

Each PR should include:

- short problem statement
- summary of implementation
- verification steps
- migration notes when applicable
- security/data-sensitivity notes when applicable

Review focus:

- domain boundary respected
- no direct provider SDK imports outside adapters
- no direct n8n writes to Postgres
- status transitions go through Use Cases
- no sensitive data in logs, tests, snapshots, or fixtures
- migrations are reversible by forward fix or explicitly safe

## Initial Vertical Slice

The first implementation slice should be:

1. Project scaffold
2. Postgres connection and migrations
3. Seeded local agency/member/campaign
4. Signal import endpoint
5. Signal review screen
6. Approve/reject signal use case
7. Audit event creation
8. Queue endpoint for context build

This proves the core shape:

- Admin Dashboard talks to Product API
- Product API writes Postgres
- status transition rules are real
- n8n can poll the API
- audit and auth boundaries exist

Only after that should we add context snapshots, draft generation, dispatch, replies, and outcome logging.
