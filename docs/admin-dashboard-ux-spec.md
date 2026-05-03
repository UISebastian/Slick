# Slick Admin Dashboard UX-Spezifikation

## 1. Zielbild

Das Slick Admin Dashboard wird als Automation Cockpit verstanden: ein ruhiges, dichtes, vertrauenswuerdiges Arbeitsinstrument, das zeigt, was die Automation gerade tut, wo sie durch Policies gestoppt ist und welche menschliche Entscheidung als naechstes den groessten Hebel hat.

Nicht Ziel ist ein generisches CRM, eine Marketing-Landingpage oder eine lose Sammlung von Tabellen. Das Dashboard ist die Steuerungsoberflaeche fuer einen halb- bis vollautomatisierten Growth-Workflow mit API/n8n im Hintergrund und Product API als autoritativer Schicht fuer Validierung, Statuswechsel, Rollen und Audit.

### Produktversprechen

Ein Admin kann in unter 30 Sekunden beantworten:

1. Laeuft die Automation gesund?
2. Welche Entscheidungen blockieren heute Pipeline oder Versand?
3. Welche Objekte sind policy-blocked, riskant oder ueberfaellig?
4. Welche Quelle, Kampagne oder Rolle erzeugt Qualitaetsprobleme?
5. Was darf Slick autonom tun und wo ist menschliche Freigabe Pflicht?

### UX-Prinzipien

- **Automation sichtbar machen:** Jeder Queue-Eintrag zeigt Herkunft, naechsten Status, verantwortliche Rolle, Policy-State und Audit-Kontext.
- **Entscheidungen priorisieren:** Die UI sortiert nicht nur nach Zeit, sondern nach Risiko, SLA, Business-Prioritaet und Pipeline-Impact.
- **Evidence before action:** Keine Approve-Aktion ohne sichtbare Evidenz, Confidence, Risiko und Policy-Auswirkung.
- **Policy-gated by default:** Autonomie wird ueber Policies erklaert, getestet und auditiert. Unklare Faelle werden gestoppt, nicht versteckt.
- **Operator-tauglich:** Dichte Tabellen, klare Filter, schnelle Review-Workbenches, Bulk nur fuer risikoarme Faelle.
- **Auditierbar:** Jede Entscheidung ist nachvollziehbar: Wer, wann, warum, aus welcher Evidenz, mit welcher Policy-Version.
- **Realistischer MVP:** Fokus auf Signal Review, Draft Review, Dispatch Gate, Replies, Workflow Exceptions, Rollen und Source Quality. Kein eigenes CRM, kein autonomes Reply-Handling.

### Workflow-Sicht

Der Cockpit-Fluss folgt der vorhandenen Statusmaschine:

`signal.detected -> signal.triage_requested -> signal.approved/rejected -> context.queued -> context.ready -> draft.queued -> draft.ready -> draft.review_requested -> draft.approved/rejected/changes_requested -> dispatch.review_requested -> dispatch.approved/rejected/blocked_suppressed -> dispatch.queued -> dispatch.sent -> reply.received -> outcome.logged -> closed`

n8n fuehrt Arbeit aus. Das Dashboard entscheidet Gates. Die REST API bleibt Produktgrenze.

## 2. Personas und Jobs to be Done

| Persona | Kontext | Haupt-JTBD | Kritische Entscheidungen | UX-Bedarf | MVP-Rechte |
| --- | --- | --- | --- | --- | --- |
| Owner | Gruender oder Growth Lead der Agentur | "Ich will wissen, ob Slick messbar Pipeline erzeugt, ohne Brand-, Compliance- oder Deliverability-Risiko zu erhoehen." | Policies setzen, Rollen vergeben, Automation-Level freigeben, Kampagnen pausieren | Executive-tauglicher One-Glance-Status plus Detailtiefe bei Risiko | Alles, inklusive Policy-Edit, Rollen, Service Accounts |
| Admin | Operativer Systemverantwortlicher | "Ich will Queues, Integrationen und Workflows stabil halten." | Dead letters retry/resolve, Source pausieren, Dispatch blocken, Rollen konfigurieren | Health, SLA, Exceptions, Audit, klare technische Referenzen | Alles ausser Owner-only Break-glass |
| Reviewer | Fachlicher Reviewer fuer Signale und Drafts | "Ich will schnell entscheiden, ob ein Anlass echt, relevant und gut begruendet ist." | Signal approve/reject, Draft approve/reject/changes_requested | Evidence, Confidence, Risk, Bridge zur Offer, Tastatur- und Filterfluss | Signal/Draft Review, Kommentare, Assignments |
| Operator | Delivery-/Ops-Rolle | "Ich will offene Arbeit abarbeiten und blockierte Faelle an die richtige Person geben." | Dispatch-Vorbereitung, Reply Outcome, Requeue, Assignment | Queue-Listen, SLA, klare Blocker, wenig Ablenkung | Dispatch vorbereiten, Replies loggen, Workflow-Items bearbeiten je nach Policy |
| Viewer | Stakeholder ohne Schreibrechte | "Ich will Status, Pipeline und Risiken sehen, ohne versehentlich Prozesse zu aendern." | Keine produktiven Entscheidungen | Read-only Cockpit, Audit, Export/Share spaeter | Lesen, Filtern, Audit einsehen |
| Automation Service Account | n8n/API-Identitaet | "Ich will nur die minimal noetigen API-Aktionen ausfuehren duerfen." | Keine menschlichen Entscheidungen, nur technische Status- und Importaktionen | Klare Scope-Anzeige, Last-used, Rotation, Fehlerdiagnose | Scoped API-Rechte, kein Dashboard-Login, kein Policy-Edit |

### Rollendefinition im MVP

- `owner`: Policy, Rollen, Service Accounts, alle Entscheidungen.
- `admin`: operative Einstellungen, Workflow-Handling, Dispatch, Source Quality, Review-Override im Rahmen der Policy.
- `reviewer`: Signal- und Draft-Entscheidungen, Review-Kommentare, Changes Requested.
- `operator`: Replies, Dispatch-Vorbereitung, Workflow-Queue triagieren, keine Policy-Aenderungen.
- `viewer`: read-only.
- `service_account`: API/n8n, scoped, kein UI-Login, alle Aktionen auditierbar.

Die bestehende Rollenlogik (`viewer`, `reviewer`, `admin`, `owner`) bleibt MVP-Basis. `operator` und `service_account` koennen zunaechst als UI-/Policy-Konzept spezifiziert und spaeter technisch umgesetzt werden. Bis dahin werden Operator-Rechte ueber `reviewer` oder `admin` abgebildet, Service Accounts ueber API Keys mit dokumentierten Scopes.

## 3. Informationsarchitektur

Die Navigation bleibt arbeitsorientiert. Jede Seite beantwortet eine konkrete Betriebsfrage.

| Bereich | Primaere Frage | Hauptmodule | Primaere Aktionen | MVP-Prioritaet |
| --- | --- | --- | --- | --- |
| Overview | "Was braucht jetzt Aufmerksamkeit?" | Attention Strip, Automation State Map, Decision Queues, Workflow Health, Policy Gate Summary, Source Quality Snapshot, Audit Activity | Queue oeffnen, Blocker untersuchen, Kampagne pausieren | P0 |
| Signals | "Welche Signale verdienen Kontext und Drafting?" | Review Queue, Signal Workbench, Evidence, Confidence, Risk, Policy-State, Timeline | Approve, Reject, Request Enrichment, Mark Duplicate, Assign | P0 |
| Drafts | "Sind generierte Nachrichten spezifisch, korrekt und sendbar?" | Draft Queue, Message Preview, Quality Checks, Evidence Binding, Change Request | Approve, Reject, Request Changes, Edit Note | P1 |
| Dispatch | "Darf diese Nachricht jetzt versendet werden?" | Dispatch Queue, Sendability, Suppression, Mailbox Limits, Schedule, Recipient Readiness | Approve Dispatch, Reject, Block, Reschedule | P1 |
| Replies | "Welche eingehenden Antworten brauchen menschliche Handlung und Outcome?" | Reply Queue, Classification, Thread Snippet, Outcome Form, Suppression Action | Log Outcome, Suppress Contact/Domain, Assign Follow-up | P1 |
| Workflows | "Welche Automationen sind fehlerhaft, langsam oder blockiert?" | Workflow Runs, Dead Letters, Correlation IDs, Retry State, Error Summary | Retry, Resolve, Assign, Pause Workflow | P0 |
| Policies/Roles | "Was darf Slick autonom tun, wer darf entscheiden, und warum?" | Policy Cards, Test Mode, Effective Permissions, Service Accounts, Audit Trail | Policy testen, speichern, deaktivieren, Rolle aendern, API Key rotieren | P0.5 |
| Source Quality | "Welche Quellen liefern brauchbare, aktuelle und vertrauenswuerdige Signale?" | Source Scorecards, Confidence Drift, False Positives, Extraction Health, Coverage | Source pausieren, Trust senken, Samples pruefen, Incident oeffnen | P1 |

### Navigationsregeln

- Links stehen fuer Arbeitsraeume, nicht fuer Datenobjekte.
- Counts in der Navigation zeigen nur handlungsrelevante offene Items, nicht Gesamtvolumen.
- Jeder Count hat einen Tooltip oder Detailtext im Zielbereich: pending, overdue, blocked, high risk.
- Policies/Roles und Source Quality gehoeren in die Hauptnavigation, nicht tief in Settings. Sie sind Kontrollflaechen der Automation.
- Detailseiten muessen immer "Back to queue" und den aktuellen Filterkontext erhalten.

## 4. One-Glance Dashboard Layout

### Layout-Konzept

Desktop ab 1280 px: 12-Spalten-Grid mit dichter Informationshierarchie.

- Kopfzeile: Workspace, Zeitraum, Kampagnenfilter, Automation Mode, Policy Health.
- Links oben: wichtigste Aufmerksamkeit.
- Mitte: Pipeline- und Queue-Lage.
- Rechts: Health, Policy und Source Quality.
- Unten: Audit Activity und Trends.

Mobile/kleine Viewports: Priorisierte Stapelung: Attention, Decision Queues, Workflow Health, Pipeline, Policy, Source Quality.

### Dashboard-Module in Prioritaet

#### 1. Attention Strip

Position: erste Zeile, volle Breite.

Inhalt:

- `P0 Policy blockers`: Anzahl Objekte, bei denen Policy Versand/Automation stoppt.
- `P0 Workflow failures`: Dead letters mit Pipeline-Impact.
- `P1 Approvals due`: Entscheidungen faellig in den naechsten 4 Stunden.
- `P1 Risk spikes`: Quelle/Kampagne mit auffaellig niedriger Confidence oder hohem Reject-Anteil.

Darstellung:

- Vier kompakte Status-Segmente mit Count, Trend, aeltestem Item und direktem Link.
- Farbcode nur fuer Zustand: Rot = blockiert/failed, Amber = faellig/risiko, Gruen/Teal = gesund, Neutral = leer.
- Kein grosses Hero-Element.

#### 2. Automation State Map

Position: zweite Zeile links/mitte, 8 Spalten.

Inhalt:

- Funnel/State Map entlang der Statusmaschine:
  - Detected
  - Triage requested
  - Signal approved
  - Context ready
  - Draft review
  - Dispatch review
  - Queued/Sent
  - Reply received
  - Outcome logged
- Pro Status: Count, SLA, Blocker-Anteil, Click-to-filter.
- Markierung fuer Status mit ungewoehnlich hoher Verweildauer.

Zweck:

- Nicht "Performance Dashboard", sondern Betriebslandkarte.
- Zeigt, wo Automation steht und wo Menschen bremsen muessen.

#### 3. Decision Queues

Position: zweite Zeile rechts oder dritte Zeile volle Breite bei weniger Platz.

Inhalt:

| Queue | Count | Overdue | Highest risk | Oldest | Owner | Primary action |
| --- | --- | --- | --- | --- | --- | --- |
| Signals | 9 | 2 | Domain mismatch | 2h 14m | Reviewer pool | Open queue |
| Drafts | 7 | 0 | Unsupported claim | 1h 03m | Copy review | Review drafts |
| Dispatch | 3 | 1 | Suppression | 44m | Delivery desk | Approve/block |
| Replies | 5 | 3 | Positive waiting | 5h 22m | Account owner | Log outcome |
| Workflows | 2 | 1 | Retry exhausted | 31m | Ops | Resolve |

Sortierung:

1. P0 Policy/Compliance/Deliverability Blocker.
2. Overdue SLA.
3. Pipeline-Impact.
4. Aeltestes Item.

#### 4. Policy Gate Summary

Position: rechte Spalte.

Inhalt:

- Aktueller Automation Mode:
  - `Manual gates`: alle Review Gates aktiv.
  - `Assisted`: risikoarme Signale duerfen auto-context erzeugen, Draft/Dispatch bleiben gated.
  - `Controlled auto`: definierte Low-risk Schritte duerfen automatisch laufen.
- Aktive Gates:
  - Signal Triage
  - Draft Approval
  - Dispatch Approval
  - Suppression
  - Source Trust
  - Role Override
- Letzte Policy-Aenderung mit Person und Zeitpunkt.
- Link: `Open policy test mode`.

#### 5. Workflow Health

Position: rechte Spalte unter Policy oder eigene Zeile.

Inhalt:

- Recent n8n/API Runs mit Status, Duration, Correlation ID, Object refs.
- Dead letter count nach Stage: signal_import, context_build, llm_draft, dispatch_send, reply_polling.
- Retry pressure: Anzahl Items mit retry_count >= 2.
- Redacted error summary.

Aktionen:

- Retry einzelnes Item.
- Resolve mit Pflichtnotiz.
- Pause workflow, nur Admin/Owner.

#### 6. Source Quality Snapshot

Position: dritte/vierte Zeile.

Inhalt:

- Source scorecards fuer Apify, API, Manual Import, Bulk Import.
- Kennzahlen:
  - Valid extraction rate
  - Duplicate rate
  - Rejected after review
  - Average confidence
  - Stale source Anteil
  - Last successful run
- Top 3 Quellen mit Qualitaetsabfall.

#### 7. Replies and Outcomes

Position: unter Decision Queues oder eigene Zeile.

Inhalt:

- Positive replies waiting.
- Not interested / suppression candidates.
- Auto-replies to ignore or snooze.
- Missing outcome by campaign.

#### 8. Audit Activity

Position: untere Zeile.

Inhalt:

- Letzte 10 relevante Ereignisse:
  - Policy changed
  - Signal approved/rejected
  - Dispatch blocked
  - Workflow retry resolved
  - Service account key rotated
- Filter: user, service account, object type, severity.

### Dashboard-Kennzahlen

MVP-Kennzahlen muessen handlungsrelevant sein:

- Pending approvals by gate.
- Oldest pending by gate.
- Overdue decisions.
- Policy-blocked objects.
- Automation coverage: Anteil Schritte, die ohne manuelle Intervention abgeschlossen wurden.
- Manual intervention rate by stage.
- Dead letters by workflow stage.
- Source rejection rate.
- Dispatch readiness.
- Positive replies waiting for follow-up.

Nicht priorisieren:

- Reine Vanity-KPIs wie Gesamtanzahl gesendeter Mails ohne Risiko- oder Outcome-Bezug.
- Grosse Charts ohne konkrete Aktion.
- Marketinghafte Wachstumskacheln.

## 5. Signal Review Workbench

### Zweck

Die Signal Review Workbench ist der wichtigste MVP-Arbeitsplatz. Sie reduziert die Entscheidung "Signal freigeben oder ablehnen" auf eine klare Pruefung:

1. Ist das Signal echt und aktuell?
2. Passt es zum ICP und zur Kampagne?
3. Gibt es eine plausible Bridge zur Offer?
4. Sind Risiken oder Policies verletzt?
5. Darf die Automation Kontext/Draft fortsetzen?

### Layout

Desktop: Drei Zonen.

1. **Queue Rail links:** kompakte Liste der Signale mit Filtern.
2. **Evidence Canvas mitte:** Unternehmen, Signal, Quelle, Evidence, Bridge, Confidence.
3. **Decision Panel rechts:** Policy-State, Risk Flags, Aktionen, Timeline.

Tablet/Mobile: Queue oben, Evidence und Decision als Tabs. Aktionen bleiben sticky am unteren Rand.

### Queue Rail

Filter:

- Campaign
- Signal type / signal rule
- Source type: Apify, API, Manual, Bulk
- Policy-State: allowed, review_required, blocked
- Confidence band: high, medium, low
- Risk: none, warning, blocker
- SLA: due soon, overdue
- Owner: me, reviewer pool, unassigned
- Duplicate candidates

List Item:

- Company + domain
- Signal summary, max 2 Zeilen
- Campaign
- Confidence band
- Risk icon/text
- Due time
- Owner
- Source type

Sortierung default:

1. Policy blocked or high risk.
2. Overdue.
3. High business priority.
4. Highest confidence.
5. Oldest.

### Evidence Canvas

Header:

- Company name, domain, account/contact mapping.
- Campaign, signal rule, recommended persona.
- Status und row version.
- Observed at, imported at, source run/correlation.

Signal Summary:

- Eine praezise Zusammenfassung in 1 bis 2 Saetzen.
- Kennzeichnung, ob Text von Quelle, LLM-Extraktion oder Reviewer stammt.

Evidence Cards:

Jede Evidence Card zeigt:

- Source label und type.
- Source URL, falls vorhanden.
- Observed at / fetched at.
- Source run id oder correlation id.
- Extracted facts als strukturierte Liste.
- Excerpt, maximal so lang wie fuer Review noetig.
- Trust marker: first-party, third-party, scraped, manual, unknown.
- Freshness marker: fresh, acceptable, stale.

Regeln:

- Raw scraped content ist untrusted input und wird nicht als Systeminstruction dargestellt.
- Excerpts zeigen nur den Beleg, nicht lange Rohdaten.
- Jede extrahierte Behauptung muss auf eine Evidence Card zurueckfuehren.
- Unsichere Extraktionen werden nicht versteckt, sondern als `needs verification` markiert.

Bridge Hypothesis:

- Zeigt die Verbindung `Signal -> Pain/Timing -> Offer`.
- Muss zwischen belegtem Signal und vorgeschlagener Nachricht unterscheiden.
- Zeigt "unsupported leaps", wenn die Bridge Annahmen enthaelt, die nicht aus Evidenz folgen.

### Confidence

Confidence ist kein einzelner dekorativer Score. Die UI zeigt einen zusammengesetzten Confidence-State:

| Faktor | Frage | Beispielanzeige |
| --- | --- | --- |
| Source reliability | Ist die Quelle vertrauenswuerdig? | First-party careers page: high |
| Recency | Ist der Anlass aktuell? | Observed 2h ago: high |
| Extraction certainty | Ist die relevante Tatsache klar extrahiert? | Job post mentions Shopify Plus: high |
| ICP match | Passt Account/Signal zum ICP? | 87 percent: high |
| Persona match | Ist die vorgeschlagene Persona plausibel? | Head of Ecommerce: medium |
| Dedupe certainty | Ist es ein neuer Anlass? | Domain/campaign key unique: high |
| Bridge strength | Traegt die Verbindung zur Offer? | CRO hiring -> audit offer: medium |

Bands:

- `High`: Automation darf naechsten nicht-riskanten Schritt vorbereiten, sofern Policy es erlaubt.
- `Medium`: menschlicher Review bleibt Pflicht.
- `Low`: Review mit Warnung, keine Bulk-Approve-Aktion.

### Risk Flags

Risk Flags sind priorisiert:

- `Blocker`: Suppression match, missing required evidence, duplicate confirmed, policy violation, invalid domain, prompt-injection pattern in source, legal/compliance flag.
- `Warning`: stale source, weak bridge, no named contact, normalized domain uncertain, persona inferred, source credibility medium.
- `Info`: manual import, low business priority, enrichment pending.

Jede Flag zeigt:

- Severity.
- Warum sie existiert.
- Welche Aktion sie blockiert.
- Wie sie geloest werden kann.

### Policy-State

Policy-State wird pro Signal als klare Ampel mit Erklaerung gezeigt:

- `Allowed`: Policy erlaubt naechsten Schritt nach Approve.
- `Review required`: Menschliche Entscheidung erforderlich.
- `Blocked`: Naechster Schritt nicht moeglich, bis Blocker geloest oder Policy-Override erfolgt.

Policy Panel:

- Matching policy cards: z.B. Source Trust, Confidence Threshold, Suppression, Role Gate.
- Policy version.
- Last evaluated at.
- Evaluation result.
- Override eligibility: wer darf, mit welcher Pflichtnotiz.

Beispiel:

| Policy | Result | Grund | Effekt |
| --- | --- | --- | --- |
| Source Trust | Review required | Apify source, confidence medium | Signal braucht Reviewer |
| Suppression | Pass | Keine Domain-/Contact-Suppression | Dispatch spaeter moeglich |
| Confidence Threshold | Pass | Composite high, ICP 87 | Context build erlaubt |
| Role Gate | Pass | Reviewer darf Signal entscheiden | Approve aktiv |

### Decision Actions

Primaere Aktionen:

- `Approve signal`: erlaubt Transition zu `signal.approved`, danach `context.queued`.
- `Reject signal`: Pflichtgrund, danach `signal.rejected` und spaeter `archived`.
- `Request enrichment`: bleibt in Review, erzeugt Context/Enrichment-Aufgabe oder Kommentar.
- `Mark duplicate`: verknuepft Original, blockiert Fortsetzung.
- `Assign`: setzt owner oder reviewer pool.
- `Comment`: Audit-relevanter Review-Kommentar.

Bulk Actions:

- Nur fuer gleiche Campaign, gleiche Policy-State `Allowed` oder `Review required`, keine Blocker, Confidence high.
- Bulk Approve zeigt vor Ausfuehrung Anzahl, Policies, gemeinsame Risiken und Stichprobe.
- Kein Bulk Reject ohne Pflichtgrund und Preview.

Decision Requirements:

- Reject braucht Reason Code: not ICP, weak signal, duplicate, stale source, bad source, suppression, other.
- Override braucht Owner/Admin und Pflichtnotiz.
- Approve bei Warning zeigt kompakte Warnliste, blockiert aber nicht.
- Approve bei Blocker ist deaktiviert.

### Audit und Timeline

Timeline pro Signal:

- imported
- dedupe checked
- policy evaluated
- review requested
- assigned
- decision made
- context queued

Jedes Event zeigt:

- Zeitpunkt.
- Actor: member oder service account.
- Correlation ID.
- Policy version, falls relevant.
- Redacted payload reference, nicht Rohdaten.

### Mindest-Daten fuer MVP

Bestehende Felder koennen genutzt werden:

- id, agencyId, campaignId, signalRuleId
- status
- sourceType, sourceUrl, sourceRunId
- observedAt
- companyName, companyDomain, personName, personRole
- signalSummary, evidence
- icpMatchScore, recommendedPersonaId
- dedupeKey
- createdAt, updatedAt, rowVersion

Ergaenzende UI-/API-Felder fuer volle Workbench-Wirkung:

- `confidenceBand`
- `confidenceFactors`
- `riskFlags`
- `policyEvaluation`
- `decisionDueAt`
- `assignedToMemberId`
- `bridgeHypothesis`
- `evidenceCards`
- `auditTimeline`

## 6. Draft, Dispatch und Replies im Cockpit

### Draft Review

Ziel: Reviewer prueft, ob die Nachricht spezifisch, korrekt, belegt und im Stil akzeptabel ist.

Pflichtmodule:

- Message preview mit Subject und Body.
- Evidence binding: Welche Saetze beziehen sich auf welches Signal?
- Quality checks:
  - Signal cited
  - No unsupported claims
  - Specific CTA
  - No hard guarantee
  - No generic AI-sales phrasing
  - Tone within sender style
- Change request composer mit strukturierten Reason Codes.
- Version history mit Diff zwischen Draft-Versionen.

Aktionen:

- Approve draft.
- Request changes.
- Reject draft.
- Add reviewer note.

### Dispatch Review

Ziel: Letzter kontrollierter Gate vor Versand.

Pflichtmodule:

- Recipient readiness: email present, role, consent/suppression state.
- Mailbox readiness: daily limit, warmup/health, schedule window.
- Suppression check: contact/domain/account/global.
- Sendability status: Ready, Suppression check, Blocked.
- Message summary mit Link zum approved Draft.
- Policy result.

Aktionen:

- Approve dispatch.
- Reject dispatch.
- Reschedule.
- Block due to suppression.
- Request missing recipient enrichment.

Regel:

- Dispatch ist nie nur "Approve button in table". Jeder Blocker muss sichtbar sein.

### Replies und Outcomes

Ziel: Mensch uebernimmt ab Reply, Slick loggt Outcome fuer spaeteren Learning Loop.

Pflichtmodule:

- Reply classification: positive, not_interested, objection, auto_reply, bounce, unknown.
- Thread snippet, redacted wenn noetig.
- Original campaign, signal, draft, sent time.
- Recommended outcome, aber keine autonome Antwort.
- Outcome form:
  - manual_follow_up
  - positive_reply
  - meeting_booked
  - not_interested
  - bounced
  - no_response
  - unsubscribe/suppress
- Suppression action mit Scope: contact, domain, account.

## 7. Policies/Roles UI Spezifikation

### Ziel

Policies/Roles ist keine versteckte Settings-Seite. Es ist die Steuerzentrale fuer Vertrauen, Autonomie und Haftung. Nutzer muessen verstehen:

- Welche Schritte sind automatisiert?
- Welche Schritte brauchen welche Rolle?
- Warum wurde ein Objekt blockiert?
- Was wuerde sich aendern, wenn eine Policy angepasst wird?
- Welche Rechte hat ein Mensch oder Service Account effektiv?

### Seitenstruktur

1. Policy Overview
2. Policy Detail
3. Test Mode
4. Roles and Permissions
5. Service Accounts
6. Audit Trail

### Policy Cards

Jede Policy Card zeigt:

- Name.
- Scope: workspace, campaign, source, mailbox, role.
- Status: active, draft, disabled, test_only.
- Gate: signal, draft, dispatch, reply, workflow, source.
- Rule summary in natuerlicher Sprache.
- Thresholds.
- Last changed by/at.
- Last evaluated at.
- Recent impact: allowed, review_required, blocked.
- Owner.
- Risk level.

MVP-Policy Cards:

| Policy | Zweck | Default |
| --- | --- | --- |
| Signal confidence threshold | Steuert, wann Signal Review Pflicht ist | Medium oder niedriger = Review required |
| Source trust | Bewertet Quellen nach Typ und Historie | Unknown/manual bulk = Review required |
| Draft approval | Verhindert Versand ungepruefter Messages | Draft Approval immer Pflicht |
| Dispatch approval | Letztes Versandgate | Dispatch Approval immer Pflicht |
| Suppression | Blockt Contact/Domain/Account | Blocker, kein Override fuer Reviewer |
| Role gate | Definiert Mindestrolle pro Entscheidung | reviewer fuer Signal/Draft, admin fuer Dispatch Override |
| Dead letter retry | Steuert Retry/Resolve-Rechte | admin fuer Resolve, operator/admin fuer Retry |
| Service account scope | Schuetzt API/n8n Aktionen | Least privilege |

### Policy Detail

Module:

- Human-readable rule.
- Structured rule fields.
- Applies to.
- Exceptions.
- Current impact preview.
- Change history.
- Rollback to previous version, nur Owner/Admin.
- Linked audit events.

Interaction:

- Jede Aenderung erzeugt erst Draft.
- Vor Aktivierung muss Test Mode ausgefuehrt werden.
- Aktivierung braucht Summary: "Diese Policy haette in den letzten 14 Tagen X Signale blockiert, Y Review Requests erzeugt, Z automatisch erlaubt."

### Test Mode

Ziel: Policies koennen gefahrlos gegen echte oder historische Objekte simuliert werden.

Test Inputs:

- Zeitraum.
- Campaign.
- Source.
- Object type: signal, draft, dispatch.
- Role/actor.
- Automation mode.

Output:

- Diff zur aktiven Policy:
  - newly allowed
  - newly review_required
  - newly blocked
  - no change
- Beispielobjekte mit Grund.
- Risiko-Hinweise.
- Empfohlene naechste Aktion.

Regeln:

- Test Mode schreibt keine Statuswechsel.
- Ergebnisse sind speicherbar als Policy evaluation report.
- Policy-Aktivierung ohne Test Mode ist fuer Owner sichtbar als Warnung, im MVP aber nur mit Pflichtbestaetigung erlaubt.

### Effective Permissions

Darstellung:

- Matrix: Rollen/Personen/Service Accounts gegen Aktionen.
- Zeigt effektive Rechte, nicht nur zugewiesene Rolle.
- Beruecksichtigt Policy Overrides und Scope.

MVP-Aktionen:

| Aktion | Viewer | Reviewer | Operator | Admin | Owner | Service Account |
| --- | --- | --- | --- | --- | --- | --- |
| View dashboard | Ja | Ja | Ja | Ja | Ja | Scoped read |
| Approve signal | Nein | Ja | Optional | Ja | Ja | Nein |
| Reject signal | Nein | Ja | Optional | Ja | Ja | Nein |
| Approve draft | Nein | Ja | Nein | Ja | Ja | Nein |
| Approve dispatch | Nein | Nein | Optional | Ja | Ja | Nein |
| Override policy blocker | Nein | Nein | Nein | Admin je Policy | Ja | Nein |
| Log outcome | Nein | Ja | Ja | Ja | Ja | API scope optional |
| Retry dead letter | Nein | Nein | Ja | Ja | Ja | Scoped |
| Resolve dead letter | Nein | Nein | Nein | Ja | Ja | Nein |
| Edit policy | Nein | Nein | Nein | Ja | Ja | Nein |
| Manage roles | Nein | Nein | Nein | Nein | Ja | Nein |
| Import signals | Nein | Nein | Nein | Ja | Ja | Ja, scoped |

### Service Accounts

Service Account Card:

- Name.
- Purpose.
- Scopes.
- Allowed endpoints/actions.
- Last used.
- Last error.
- Key age.
- Rotation due.
- Created by.
- Status: active, disabled, rotation required.

Regeln:

- Kein UI-Login.
- Keine menschlichen Entscheidungen.
- Keine Policy-Aenderungen.
- Jede API-Aktion schreibt Actor = service account.
- Scopes werden als menschenlesbare Liste angezeigt.
- "Disable now" ist prominent, aber mit Bestaetigung.

### Audit Trail

Audit Trail zeigt:

- Actor.
- Role/effective permission.
- Object.
- Action.
- Before/after state.
- Policy version.
- Correlation ID.
- Decision note.
- Timestamp.

Filter:

- Actor.
- Object type.
- Action.
- Policy.
- Service account.
- Date range.
- Severity.

Audit ist append-only. Die UI darf keine "delete audit entry"-Aktion anbieten.

## 8. Source Quality UI Spezifikation

### Ziel

Source Quality zeigt, ob die Automation aus guten Quellen lernt oder schlechte Inputs in Review-Queues drueckt. Es ist die Fruehwarnanlage gegen false positives, stale evidence und unsaubere Scrapes.

### Module

#### Source Scorecards

Pro Source:

- Source name/type.
- Status: healthy, degraded, paused, failing.
- Last successful run.
- Valid extraction rate.
- Average confidence.
- Review rejection rate.
- Duplicate rate.
- Stale evidence rate.
- Dead letters linked to source.

#### Quality Trends

- Confidence drift ueber 7/14/30 Tage.
- Rejection rate by campaign.
- Extraction failures by field: company, domain, signal summary, source URL, observedAt.
- False-positive reasons: weak signal, stale, duplicate, not ICP, bad source.

#### Sample Review

- Zufalls- oder risikobasierte Samples der letzten Imports.
- Vergleich: Raw source reference, extracted facts, reviewer outcome.
- "Mark source issue" erzeugt Incident oder Source Note.

#### Actions

- Pause source.
- Lower trust level.
- Raise trust level, nur Admin/Owner.
- Open linked Workflows.
- Open affected Signals.
- Create source incident note.

### Source Policy Integration

Source Quality beeinflusst Policy-State:

- Degraded source -> neue Signale mindestens `review_required`.
- Failing source -> Import pausieren oder Dead letter.
- High false-positive rate -> Dashboard Risk Spike.
- Stale evidence rate ueber Threshold -> keine Bulk Approves.

## 9. Visuelle Leitlinien

### Charakter

Slick Admin ist B2B-operational:

- dicht
- ruhig
- hochvertrauenswuerdig
- praezise
- schnell scanbar
- nicht dekorativ
- nicht marketinghaft

### Layout

- Kein Hero, keine Landingpage, keine grossen dekorativen Illustrationen.
- Startscreen ist das Cockpit.
- Vollbreite Arbeitsflaechen mit klaren Sektionen.
- Cards nur fuer einzelne, wiederholbare Objekte oder kompakte Statusmodule. Keine Cards in Cards.
- Tabellen sind primare Arbeitsform fuer Queues.
- Detailseiten verwenden Split Layouts mit sticky Decision Panel.
- Feste Hoehen fuer Queue Items und Aktionsleisten, damit Inhalte nicht springen.

### Typografie

- Kleine, klare Hierarchie.
- Keine viewport-skalierenden Fonts.
- Keine negative Letter Spacing.
- Page Titles funktional, nicht werblich.
- Labels kurz und stabil.
- Lange Texte werden in Message Preview oder Evidence Cards sauber begrenzt.

### Farbe und Status

- Neutrale Basis: Off-white/near-white Hintergrund, dunkler Text, feine Border.
- Statusfarben sparsam:
  - Rot: blockiert, failed, suppression, destructive.
  - Amber: review required, due soon, warning.
  - Teal/Gruen: healthy, ready, passed.
  - Blau: informational, draft.
  - Neutral: inactive, empty, no risk.
- Keine dominante Ein-Farb-Palette.
- Keine dekorativen Farbverlaeufe oder Orbs.
- Farbstatus immer mit Text/Icon kombinieren, nie Farbe allein.

### Komponenten

- Buttons:
  - Primaer nur fuer naechste fachliche Hauptaktion.
  - Sekundaer fuer Navigation oder harmlose Aktionen.
  - Destructive Actions mit Bestaetigung und Pflichtgrund.
- Icons:
  - Fuer wiederkehrende Tool-Aktionen einsetzen.
  - Tooltips fuer nicht selbsterklaerende Icons.
- Filter:
  - Als kompakte Controls oberhalb von Tabellen.
  - Persistieren pro Workspace/User.
- Badges:
  - Fuer Status, Risk, Policy-State, Confidence.
  - Nicht als Dekoration.
- Tables:
  - Dichte Zeilen, sticky Header bei langen Listen.
  - Sortierung klar sichtbar.
  - Mehrzeilige Zellen nur fuer Summary/Meta.

### Text und Microcopy

- "Approve signal" statt "Continue".
- "Blocked by suppression policy" statt "Error".
- "Review required: source confidence medium" statt "Needs attention".
- "Request enrichment" statt "Fix later".
- Copy ist sachlich, nicht emotionalisierend.

### Accessibility und Trust

- Alle Statusinformationen sind textuell verfuegbar.
- Tastatur-Navigation fuer Queues und Entscheidungen.
- Focus States sichtbar.
- Tabellen mit semantischen Headers.
- Audit und Policy-Grund immer sichtbar, nicht nur Tooltip.

## 10. Scrum-artiger Iterationsplan

### Sprint 1: Cockpit MVP sofort

Ziel: Aus dem bestehenden Admin Dashboard ein klares Automation Cockpit machen, ohne neue Backend-Komplexitaet vorauszusetzen.

Scope:

- Overview neu strukturieren nach One-Glance Layout.
- Navigation um Policies/Roles und Source Quality als sichtbare Zielstruktur ergaenzen, auch wenn anfangs mit Mock-/Read-only-Daten.
- Signal Review Workbench als wichtigste Detailerfahrung definieren und UI-seitig priorisieren.
- Queue-Tabellen um Policy-State, Confidence, Risk und Due/Owner erweitern.
- Decision Panel mit Evidence, Confidence, Risk, Policy-State und Timeline.
- Begriffe vereinheitlichen: Automation, Gate, Policy, Evidence, Confidence, Risk, Source Quality.

Akzeptanzkriterien:

- Ein Admin erkennt auf Overview innerhalb von 30 Sekunden offene P0/P1-Arbeit.
- Signal Detail zeigt Evidence, Confidence, Risk, Policy-State und eindeutige Actions.
- Approve/Reject wirken wie Gates, nicht wie generische Buttons.
- Keine Marketing- oder Landingpage-Anmutung.
- Rollen und Policies sind im UI als Konzepte sichtbar.

Nicht in Sprint 1:

- Vollstaendige Policy Engine.
- Echte Source Quality Analytics.
- Autonomer Versand.
- Eigener Learning Loop.

### Sprint 2: Policy und Betriebsvertrauen

Ziel: Policies/Roles wird nutzbar genug, um Autonomie kontrolliert zu konfigurieren und zu erklaeren.

Scope:

- Policy Cards mit aktiven Gates und menschenlesbaren Regeln.
- Effective Permissions Matrix fuer Rollen und Service Accounts.
- Policy evaluation Anzeige an Signal, Draft und Dispatch.
- Test Mode als Dry-run UI mit historischen/mock Evaluationen.
- Audit Trail fuer Entscheidungen und Policy-Aenderungen sichtbar machen.
- Service Account Uebersicht mit Scope, last used, rotation state.

Akzeptanzkriterien:

- Nutzer kann erklaeren, warum ein konkretes Objekt allowed, review_required oder blocked ist.
- Nutzer sieht, welche Rolle welche Aktion effektiv darf.
- Policy-Aenderung zeigt erwartete Auswirkung vor Aktivierung.
- Service Account kann auf einen Blick als least-privilege oder riskant bewertet werden.

Nicht in Sprint 2:

- Komplexer Rule Builder fuer beliebige Bedingungen.
- Mehrmandanten-Policy-Vererbung.
- Automatisches Policy-Tuning.

### Sprint 3: Source Quality und Automation Scaling

Ziel: Die Automation kann kontrolliert erweitert werden, weil Quelle, Confidence und Outcomes sichtbar werden.

Scope:

- Source Quality Seite mit Scorecards, Trends und Sample Review.
- Dashboard Risk Spikes aus Source Quality.
- Confidence Faktoren und Reject-Reasons als strukturierte Daten in Review-Flows.
- Bulk Review fuer risikoarme, high-confidence Signale mit Guardrails.
- Reply Outcome Analytics als Vorbereitung fuer spaeteren Learning Loop.
- Workflow Health mit Stage-spezifischen Retry/Resolve-Patterns.

Akzeptanzkriterien:

- Admin erkennt Quelle/Kampagne mit Qualitaetsproblemen ohne manuelle Tabellenanalyse.
- Reviewer kann Bulk nur ausfuehren, wenn Policy und Risk dies erlauben.
- Outcome Logging ist konsistent genug fuer spaetere Lernschleifen.
- Workflow Exceptions sind nach Stage, Impact und Retry Pressure priorisiert.

Nicht in Sprint 3:

- Autonome Reply-Beantwortung.
- Echtzeit-Optimierung von ICP/Offer.
- Vollautomatisches Policy-Learning.

## 11. Definition of Done fuer UX/UI-Umsetzung

Eine Admin-Dashboard-Aenderung ist erst fertig, wenn:

- Die Seite eine klare Betriebsfrage beantwortet.
- Die primaere Aktion pro View eindeutig ist.
- Status, Risk, Confidence und Policy-State nicht verwechselt werden.
- Jede Gate-Entscheidung Evidence und Audit-Kontext zeigt.
- Tabellen auf Desktop dicht und auf Mobile bedienbar bleiben.
- Keine Texte oder Controls ueberlappen.
- Leere, Loading-, Error- und Blocked-States gestaltet sind.
- Rollenrechte in der UI sichtbar oder sauber deaktiviert sind.
- Keine sensiblen Rohdaten oder unredacted Payloads in der UI angezeigt werden.
- Design ruhig, B2B-operational und nicht marketinghaft bleibt.

## 12. MVP-Messung

Nach Umsetzung sollten folgende UX-/Produktmetriken beobachtet werden:

- Time to first correct action auf Overview.
- Signal review decision time.
- Reject rate by source.
- Override rate by policy.
- Overdue approvals by gate.
- Dead letter time to resolution.
- Share of dispatches blocked by suppression/sendability.
- Positive replies waiting longer than SLA.
- Manual intervention rate by workflow stage.

Diese Metriken dienen nicht als Vanity Dashboard, sondern als Betriebsdiagnose fuer die naechsten Automatisierungsstufen.
