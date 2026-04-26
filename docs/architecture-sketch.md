# Slick Architecture Sketch

## Basis

Diese Skizze basiert auf dem Agency Growth Playbook aus Tolaria und dem dort dokumentierten Slick-Verstaendnis. Die Loesung soll keinen generischen Outreach-Automaten bauen, sondern ein Growth-Operating-System fuer CRO- und Performance-Agenturen mit 5 bis 25 Mitarbeitenden.

## Annahmen

- Slick unterstuetzt Agenturgruender und spaetere Sales-/Growth-Rollen beim Aufbau eines wiederholbaren Neugeschaeftsmotors.
- Der Kernnutzen liegt in Spezifitaet: ICP, Offer, Signale, Kontext, Voice, Copy-Writing basierend auf austauschbaren und testbaren Frameworks und Sequenzen muessen als wiederverwendbare Artefakte gepflegt werden.
- Menschen bleiben an den Stellen im Loop an denen Sie Input liefern müssen: Initialer Aufsatz der Kampagne inklusive ICP, Offer, mögliche Signale, passendem Kontext und Copy-Framework und Reply-Handling.
- Das erste Produkt sollte lean starten und externe Tools integrieren, statt CRM, Outreach, Enrichment und Workflow-Automation komplett selbst zu bauen.

## Systemgrenzen

Slick ist zunaechst der Steuerungs- und Assistenzlayer ueber bestehenden Tools:

- Quellen: LinkedIn, Sales Navigator, Jobboards, Funding-News, Website-/Tech-Stack-Signale, Partnerdaten, CRM.
- Enrichment: BuiltWith, Apollo, Clay oder vergleichbare Anbieter.
- Workflow: n8n oder interner Job-Orchestrator.
- Outreach/CRM: Smartlead, HubSpot, Pipedrive oder aehnliche Systeme.
- AI: LLM-basierte Analyse, Strukturierung, Drafting und Qualitaetspruefung.

## Zielarchitektur

```mermaid
flowchart LR
    A["Agency Workspace"] --> B["Growth OS Core"]
    B --> C["ICP & Offer Repository"]
    B --> D["Signal Engine"]
    B --> E["Context Engine"]
    B --> F["Message Studio"]
    B --> G["Human Review Gates"]
    B --> H["CRM / Outreach Sync"]
    B --> I["Learning Loop"]

    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> C
    I --> D
    I --> F

    J["Partner Layer"] --> C
    J --> E
    J --> H
```

## Hauptmodule

### 1. Agency Workspace

Mandantenfaehiger Arbeitsraum pro Agentur. Haelt Agenturprofil, Teamrollen, Integrationen, bevorzugte Tools, aktive Offers und aktuelle 90-Tage-Ziele.

### 2. Growth OS Core

Der zentrale Applikationskern. Er orchestriert Workflows, Berechtigungen, Artefakte, Statusuebergaenge und Audit-Historie. Er entscheidet nicht autonom ueber Versand, sondern fuehrt Arbeit bis zu menschlichen Freigabepunkten.

### 3. ICP & Offer Repository

Strukturierte Ablage fuer:

- ICP-Satz und Segment-Cluster
- Personas: Champion, Economic Buyer, Technical Validator
- Productized Offers: Done-for-you, Done-with-you, Enable
- Preise, Scope, Outcomes und Proof Points
- Copy-Frameworks und Sequenzen
Dieses Modul ist die Quelle fuer alle spaeteren Signal-, Kontext- und Message-Entscheidungen.

### 4. Signal Engine

Sammelt und bewertet externe Signale. Beispiele:

- Tier 1: CRO-Jobposting, Funding, Migration, neuer CMO, Tooling-Wechsel
- Tier 2: Peak-Season-Vorbereitung oder Traffic-Wachstum
- Tier 3: LinkedIn-Aktivitaet, Awards, Netzwerknaehe

Ausgabe ist kein fertiger Lead, sondern ein strukturierter Signal Record mit Quelle, Aktualitaet, Relevanz, ICP-Match und empfohlener Persona.

### 5. Context Engine

Reichert freigegebene Signale an:

- Unternehmenskontext
- Personen- und Rolleninformationen
- Tech Stack
- CRM-Historie
- relevante Offer-Stufe
- Partnerbezug
- moegliche Bridge zwischen Signal und Offer

Die Context Engine bereitet die Grundlage fuer spezifische, nicht generische Nachrichten.

### 6. Message Studio

Erstellt signalbasierte Sequenzentwuerfe nach Copy-Framework Input und hält vordefinierte Regeln ein:

- Im MVP nutzt Slick ein Default-Copy-Framework.
- Kundenseitiges Hochladen und Bearbeiten eigener Frameworks ist Post-MVP.
- Die konkreten MVP-Regeln sind in `docs/mvp-architecture.md` beschrieben.

Das Studio nutzt den freigegebenen Kontext und prueft aktiv gegen generische AI-Sales-Muster wie austauschbare Rollen-Pains, substanzloses Lob oder Follow-up-Floskeln.

### 7. Human Review Gates

Explizite Freigabepunkte:

- Signal-Triage: lohnt sich dieser Anlass?
- Draft-Review: ist die Nachricht spezifisch, korrekt und im Stil des Senders?
- Dispatch Approval: darf die Sequenz ins Outreach-Tool?
- Reply Handling: ab der ersten Antwort uebernimmt der Mensch.

Diese Gates sind Produktbestandteil, kein Compliance-Anhaengsel.

### 8. CRM / Outreach Sync

Synchronisiert freigegebene Daten mit bestehenden Tools:

- Mailserver fuer Versand und Replies
- Slick REST API als Product API
- Apify als Scraping- und Kontextquelle
- Postgres als primaere MVP-Datenbank
- n8n als Orchestrator

Slick sollte in der ersten Version nicht versuchen, CRM oder Outreach-Tool zu ersetzen.

### 9. Learning Loop

Fuehrt Ergebnisse zurueck in das System. Im MVP bedeutet das nur Outcome Logging; ein echter Learning Loop ist Post-MVP:

- Reply Rates nach Signal-Tier
- Meeting Rates nach Persona
- Stage Conversion
- Sales Cycle
- Win/Loss-Muster
- Message Feedback
- Signalqualitaet

### 10. Consensus Layer

Post-MVP.

Wichtige Voraussetzung: Der Learning Loop muss spaeter entsprechend designed sein.

 Vergleicht Input für Context Engine auf Basis: 

  - ICP-Satz und Segment-Cluster
  - Personas: Champion, Economic Buyer, Technical Validator
  - Outcomes und Proof Points
  - Copy-Frameworks und Sequenzen
    
im Sinne eines geschäftsneutralen Beraters.


Slick sollte in der ersten Version nicht versuchen, den Consensus Layer zu implementieren. Spaeter verbessert der Learning Loop ICP, Offer, Signaltaxonomie, Sequenzen und Partnerstrategie.

## Datenmodell grob

```mermaid
erDiagram
    Agency ||--o{ WorkspaceMember : has
    Agency ||--o{ Offer : owns
    Agency ||--o{ ICP : defines
    ICP ||--o{ Persona : contains
    ICP ||--o{ SignalRule : uses
    SignalRule ||--o{ Signal : detects
    Signal ||--o{ ContextSnapshot : enriched_by
    ContextSnapshot ||--o{ MessageDraft : creates
    MessageDraft ||--o{ ReviewDecision : receives
    ReviewDecision ||--o{ OutreachSequence : approves
    OutreachSequence ||--o{ Reply : receives
    Reply ||--o{ LearningEvent : produces
    Partner ||--o{ Offer : supports
    Partner ||--o{ LearningEvent : informs
```

## Kernworkflow

```mermaid
sequenceDiagram
    participant Founder as Founder / Growth Lead
    participant Slick as Slick
    participant Sources as Signal Sources
    participant LLM as LLM Layer
    participant CRM as CRM / Outreach Tool

    Founder->>Slick: ICP, Offer, Voice Samples, Partnerkontext pflegen
    Slick->>Sources: Signale beobachten
    Sources-->>Slick: Signal-Kandidaten
    Slick->>Founder: Signal-Triage vorschlagen
    Founder-->>Slick: Freigabe oder Ablehnung
    Slick->>LLM: Kontext + Offer + Voice + Signal
    LLM-->>Slick: Sequenzentwurf + Qualitaetscheck
    Slick->>Founder: Draft zur Review
    Founder-->>Slick: Freigabe / Edit / Reject
    Slick->>CRM: Sequenz und Tasks synchronisieren
    CRM-->>Founder: Replies
    Founder->>Slick: Outcome markieren
    Slick->>Slick: Learning Loop aktualisieren
```

## MVP-Schnitt

Die konkret zu implementierende MVP-Architektur ist in `docs/mvp-architecture.md` beschrieben.

Der erste sinnvolle Schnitt sollte nicht "alles automatisieren", sondern den Sales-Motor sichtbar machen:

1. Agency Workspace mit ICP-, Persona- und Offer-Artefakten.
2. Manuell oder halbautomatisch importierbare Signal Records.
3. Context Builder fuer einzelne Signale.
4. Message Studio mit Voice Samples und Review-Gate.
5. Export oder einfache Synchronisation zu CRM/Outreach.


Bewusst nicht im MVP:

- vollautomatischer Versand ohne Review
- eigenes CRM
- eigene umfangreiche Enrichment-Datenbank
- autonome Reply-Beantwortung
- komplexe Multi-Partner-Marktplatzlogik
- Partner Layer Implementierung
- Consensus Layer
- echter Learning Loop ueber Signal-Tier, Persona, Reply und Meeting Outcome.

## Architekturprinzipien

- Artefakt zuerst: ICP, Offer, Persona, Signal, Kontext und Voice sind eigene Datenobjekte, keine Prompt-Texte.
- Anyone-in-the-loop by design: Freigaben sind Teil des Workflows und können je nach Art der Freigabe von Menschen oder automatisiert erfolgen.
- Integrationsfreundlich: externe Tools anbinden, nicht sofort ersetzen.
- Auditierbar: jede AI-Ableitung muss auf Signal, Kontext und Offer zurueckfuehrbar sein.
- Lernfaehig: Outcomes verbessern Regeln und Vorlagen, nicht nur Dashboards.
- Lean start: erst nach echten Lernschleifen mehr Automatisierung bauen.
- Security first: Least Privilege, Defense in Depth, Multi-Tenancy, Zero Trust, Secure by Design & Default, and Assume Breach. Secrets werden zur Laufzeit aus einem sicheren Vault oder Pipeline-Environments injiziert. Zielarchitektur sind Secret Vaults hinter Private Endpoints mit starker Authentifizierung. Sensible Daten duerfen nicht in Logs landen.

## Offene Produktfragen

- Soll Slick zuerst als Web-App, lokaler Workspace-Assistent oder n8n-naher Workflow-Layer starten?
-> Zuerst als n8n-Workflow-Layer.
- Welches CRM/Outreach-Tool ist fuer die erste Zielagentur gesetzt?
-> Mailserver, RestAPI, Apify und Postgres
- Sind Signale im ersten Schritt manuell importiert, via APIs angebunden oder durch Scraping/Monitoring gesammelt?
-> Apify hat Agents, die für dich Scrapen. Daher kommt der Kontext. Es sollte auch möglich sein eine API dafür anzubieten.
- Soll Slick mehrere Agenturen frueh mandantenfaehig bedienen oder zunaechst als Single-Agency-System wachsen?
-> Mandantenfaehigkeit ist ein wichtiger langfristiger Aspekt. Er muss an- und mitgedacht aber nicht implementiert werden.
