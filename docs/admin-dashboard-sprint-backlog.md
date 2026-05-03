# Admin Dashboard Sprint Backlog

Dieser Backlog uebersetzt die UX-Spezifikation in umsetzbare Sprints. Er ist bewusst MVP-orientiert und setzt auf bestehende Next.js Admin-Seiten, Review Queues, Statusmaschine, Rollenmodell und Mock-Daten als Startpunkt.

## Sprint 1: Cockpit MVP sofort

### Sprint-Ziel

Das bestehende Admin Dashboard wird als Automation Cockpit erkennbar: Overview priorisiert Arbeit, Signal Review wird zur Workbench, und alle Queue-Oberflaechen zeigen Policy/Risk/Confidence als Entscheidungskontext.

### Epic 1: Overview als One-Glance Cockpit

User Story:

Als Admin will ich auf der Overview sofort sehen, welche Automation, Policy oder Entscheidung gerade Aufmerksamkeit braucht, damit ich nicht jede Queue einzeln pruefen muss.

Tasks:

- Attention Strip fuer Policy Blockers, Workflow Failures, Approvals Due und Risk Spikes spezifizieren/umsetzen.
- Automation State Map entlang der Statusmaschine anzeigen.
- Decision Queue Tabelle nach Risiko/SLA/Impact statt nur nach Count priorisieren.
- Workflow Health und Source Quality Snapshot aufnehmen.
- Policy Gate Summary als rechte Cockpit-Spalte einfuehren.

Acceptance Criteria:

- Overview beantwortet "Was braucht jetzt Aufmerksamkeit?" ohne Scroll-Zwang auf Desktop.
- Jede Kachel fuehrt zu einer handlungsorientierten Zielansicht.
- Counts unterscheiden pending, overdue, blocked und failed.

### Epic 2: Signal Review Workbench

User Story:

Als Reviewer will ich ein Signal anhand von Evidence, Confidence, Risk und Policy-State pruefen, damit Approve/Reject nachvollziehbar und schnell ist.

Tasks:

- Signal Queue mit Filtern fuer Campaign, Source, Policy-State, Confidence, Risk, SLA und Owner definieren.
- Detailansicht in Queue Rail, Evidence Canvas und Decision Panel strukturieren.
- Evidence Cards mit Source, URL, observedAt, extracted facts und trust/freshness markieren.
- Confidence Faktoren statt nur Score anzeigen.
- Risk Flags in Blocker, Warning und Info unterscheiden.
- Policy-State `allowed`, `review_required`, `blocked` anzeigen.
- Decision Actions um Request Enrichment, Mark Duplicate, Assign und Comment spezifizieren.

Acceptance Criteria:

- Approve ist bei Blocker deaktiviert.
- Reject verlangt Reason Code.
- Jede Confidence/Risk-Aussage verweist auf Evidence oder Policy.
- Timeline zeigt Actor, Statuswechsel und Correlation/Source Referenzen.

### Epic 3: Begriffe und visuelle Dichte

User Story:

Als Nutzer will ich stabile, sachliche Begriffe und ein ruhiges Interface sehen, damit ich Slick als vertrauenswuerdiges Operations-Tool nutze.

Tasks:

- Einheitliche Labels definieren: Gate, Policy-State, Evidence, Confidence, Risk, Source Quality.
- Queue Counts und Badges semantisch trennen.
- Primaeraktionen pro View festlegen.
- Keine Hero-/Marketing-Kompositionen verwenden.

Acceptance Criteria:

- Kein View wirkt wie Landingpage.
- Tabellen und Panels sind dicht, aber scanbar.
- Status wird immer mit Text angezeigt, nicht nur ueber Farbe.

## Sprint 2: Policy und Betriebsvertrauen

### Sprint-Ziel

Nutzer koennen verstehen und testen, was Slick autonom darf, wer entscheiden darf und warum Objekte blockiert werden.

### Epic 1: Policies/Roles Navigation und Overview

User Story:

Als Owner will ich Policies als Cards sehen, damit ich Automation bewusst steuern kann.

Tasks:

- Policies/Roles als Hauptnavigation aufnehmen.
- Policy Cards fuer Signal Confidence, Source Trust, Draft Approval, Dispatch Approval, Suppression, Role Gate, Dead Letter Retry und Service Account Scope definieren.
- Policy Detail mit Rule Summary, Scope, Thresholds, Impact und Change History spezifizieren.

Acceptance Criteria:

- Jede Policy Card zeigt Status, Scope, Gate, Last Changed und Recent Impact.
- Nutzer erkennt, ob eine Policy aktiv, draft, disabled oder test_only ist.

### Epic 2: Test Mode

User Story:

Als Admin will ich Policy-Aenderungen gegen historische Objekte simulieren, damit ich Autonomie nicht blind aktiviere.

Tasks:

- Test Inputs: Zeitraum, Campaign, Source, Object Type, Role, Automation Mode.
- Dry-run Output: newly allowed, newly review_required, newly blocked, no change.
- Beispielobjekte und Risiko-Hinweise anzeigen.

Acceptance Criteria:

- Test Mode schreibt keine produktiven Statuswechsel.
- Policy-Aktivierung zeigt Impact Preview.
- Nutzer kann Report speichern oder verwerfen.

### Epic 3: Effective Permissions und Service Accounts

User Story:

Als Owner will ich effektive Rechte von Menschen und Service Accounts sehen, damit Least Privilege praktisch kontrollierbar ist.

Tasks:

- Permissions Matrix fuer Rollen und Aktionen definieren.
- Service Account Cards mit Scopes, last used, key age, rotation due und status.
- API/n8n Actor in Audit Trail sichtbar machen.

Acceptance Criteria:

- Matrix zeigt effektive Rechte, nicht nur Rollennamen.
- Service Account hat keinen UI-Login und keine menschlichen Entscheidungen.
- Disable/Rotate Aktionen sind sichtbar und auditierbar.

## Sprint 3: Source Quality und Automation Scaling

### Sprint-Ziel

Slick kann mehr Automation zulassen, weil Source Quality, Confidence Drift und Outcomes kontrollierbar werden.

### Epic 1: Source Quality Page

User Story:

Als Admin will ich die Qualitaet von Quellen sehen, damit schlechte Inputs nicht unbemerkt in Reviews und Drafts wandern.

Tasks:

- Source Scorecards fuer Apify, API, Manual Import und Bulk Import.
- Quality Trends fuer confidence drift, rejection rate, duplicate rate und stale evidence.
- Sample Review Modul fuer Import-Stichproben.
- Actions: pause source, lower trust, inspect samples, open affected signals.

Acceptance Criteria:

- Degraded Source erzeugt Dashboard Risk Spike.
- Source Score erklaert sich aus sichtbaren Kennzahlen.
- Admin kann betroffene Signale aus Source Quality oeffnen.

### Epic 2: Structured Review Feedback

User Story:

Als Product Owner will ich Reject- und Change-Reasons strukturiert erfassen, damit Source Quality und spaeterer Learning Loop moeglich werden.

Tasks:

- Reason Codes fuer Signal Reject, Draft Change, Dispatch Block und Reply Outcome vereinheitlichen.
- Review Feedback an Source, Campaign, Policy und Workflow Stage binden.
- Dashboard-Metriken fuer Reject Rate by Source und Override Rate by Policy anzeigen.

Acceptance Criteria:

- Jeder Reject/Block hat Reason Code.
- Source Quality kann nach Reason Code aggregieren.
- Outcome Logging bleibt schnell genug fuer Operator.

### Epic 3: Guarded Bulk und Workflow Priorisierung

User Story:

Als Reviewer will ich risikoarme High-confidence Signale gesammelt entscheiden, ohne Policy oder Evidence zu umgehen.

Tasks:

- Bulk Review nur bei gleicher Campaign, high confidence, keinem Blocker und kompatibler Policy erlauben.
- Bulk Preview mit gemeinsamer Policy-Auswertung und Stichprobe.
- Workflow Dead Letters nach Stage, Retry Pressure und Impact priorisieren.

Acceptance Criteria:

- Bulk Approve ist bei Low/Medium Confidence oder Blocker nicht verfuegbar.
- Bulk Actions erzeugen Audit Events pro Objekt.
- Dead Letter Tabelle zeigt, welche Items Pipeline blockieren.

## Uebergreifende DoD

- Jede neue UI beantwortet eine konkrete Betriebsfrage.
- Evidence, Confidence, Risk und Policy-State bleiben getrennte Konzepte.
- Audit-Kontext ist bei Gate-Entscheidungen sichtbar.
- Rollen-/Policy-bedingt unzulaessige Aktionen sind deaktiviert und erklaert.
- Keine unredacted Payloads, Prompts, Mailbodies oder Roh-Scrapes anzeigen.
- Desktop ist dicht und scanbar, Mobile bleibt bedienbar.
- Keine fremden Code- oder Style-Aenderungen ausserhalb des jeweiligen Sprint-Scopes.
