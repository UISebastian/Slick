import Link from "next/link";
import styles from "./mockups.module.css";

const queueItems = [
  {
    company: "Northstar Cart Labs",
    domain: "northstar-cart.example",
    summary: "Senior experimentation role mentions Shopify Plus checkout optimization.",
    sourceType: "ATS job post",
    sourceName: "Greenhouse",
    confidence: "High",
    trust: 92,
    risks: 1,
    evidence: 3,
    observed: "Today 09:18",
    status: "Needs review"
  },
  {
    company: "Helio Retail Group",
    domain: "helio-retail.example",
    summary: "Partner profile lists ecommerce growth, CRO and Klaviyo lifecycle services.",
    sourceType: "Partner directory",
    sourceName: "Klaviyo Connect",
    confidence: "High",
    trust: 89,
    risks: 0,
    evidence: 2,
    observed: "Today 08:42",
    status: "Ready"
  },
  {
    company: "Aster Supply",
    domain: "aster-supply.example",
    summary: "New case study references personalization testing across product pages.",
    sourceType: "Owned page",
    sourceName: "Agency case study",
    confidence: "Medium",
    trust: 73,
    risks: 2,
    evidence: 2,
    observed: "Yesterday 17:06",
    status: "Needs evidence"
  }
] as const;

const evidenceItems = [
  {
    source: "Greenhouse",
    type: "ATS job post",
    url: "https://boards.greenhouse.io/northstar/jobs/772",
    observed: "Today 09:18",
    excerpt: "Own the Shopify Plus experimentation roadmap and checkout funnel analysis.",
    trust: "First-party careers source"
  },
  {
    source: "Careers page",
    type: "Owned page",
    url: "https://northstar-cart.example/careers",
    observed: "Today 09:18",
    excerpt: "The role reports to VP Growth and partners with lifecycle and paid media.",
    trust: "Company-owned source"
  },
  {
    source: "Shopify partner profile",
    type: "Partner directory",
    url: "https://www.shopify.com/partners/directory/northstar",
    observed: "Yesterday 16:51",
    excerpt: "Listed services include ecommerce strategy, checkout optimization and CRO.",
    trust: "Platform-vetted directory"
  }
] as const;

const reviewChecks = [
  "Evidence URL opens and matches the signal",
  "Source type is trusted enough for outreach",
  "Offer bridge is specific and current",
  "Risks are acceptable or documented"
] as const;

const sourceRows = [
  {
    source: "Partner directories",
    trust: "Very high",
    volume: "Low",
    acceptRate: "82%",
    nextAction: "Use as primary trigger"
  },
  {
    source: "ATS job postings",
    trust: "High",
    volume: "Medium",
    acceptRate: "71%",
    nextAction: "Filter by role keywords"
  },
  {
    source: "Tech stack detection",
    trust: "Medium",
    volume: "High",
    acceptRate: "38%",
    nextAction: "Use as enrichment only"
  }
] as const;

function SourceBadge({ children }: { children: string }) {
  return <span className={styles.sourceBadge}>{children}</span>;
}

function ConfidenceBadge({ value }: { value: string }) {
  const tone = value === "High" ? styles.confidenceHigh : styles.confidenceMedium;

  return <span className={`${styles.confidenceBadge} ${tone}`}>{value}</span>;
}

function Metric({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <strong>{value}</strong>
      <span className={styles.metricMeta}>{meta}</span>
    </div>
  );
}

export default function SignalMockupsPage() {
  const selected = queueItems[0];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Signal review mockups</p>
          <h1>Admin workbench directions</h1>
          <p>Three MVP-ready interface directions for evidence-backed signal review.</p>
        </div>
        <Link className={styles.secondaryLink} href="/admin/signals">
          Current signals page
        </Link>
      </header>

      <section className={styles.mockupBlock} aria-labelledby="workbench-title">
        <div className={styles.mockupIntro}>
          <div>
            <p className={styles.kicker}>Direction A</p>
            <h2 id="workbench-title">Signal Review Workbench</h2>
          </div>
          <p>Best next MVP step: scan queue, inspect evidence, decide without leaving the page.</p>
        </div>

        <div className={styles.workbench}>
          <div className={styles.workbenchToolbar}>
            <div className={styles.segmented} aria-label="Signal status">
              <button className={styles.segmentActive} type="button">
                Ready
              </button>
              <button type="button">Needs evidence</button>
              <button type="button">Approved</button>
            </div>
            <div className={styles.filters}>
              <span>Source: Trusted</span>
              <span>Confidence: High</span>
              <span>Risk: Open</span>
            </div>
          </div>

          <div className={styles.workbenchGrid}>
            <div className={styles.queuePanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>Review queue</h3>
                  <p>9 pending, oldest 2h 14m</p>
                </div>
                <span className={styles.slaBadge}>3 due soon</span>
              </div>

              <div className={styles.queueList}>
                {queueItems.map((item, index) => (
                  <article className={`${styles.queueRow} ${index === 0 ? styles.queueRowSelected : ""}`} key={item.company}>
                    <div className={styles.queueMain}>
                      <div>
                        <h4>{item.company}</h4>
                        <p>{item.domain}</p>
                      </div>
                      <ConfidenceBadge value={item.confidence} />
                    </div>
                    <p className={styles.summary}>{item.summary}</p>
                    <div className={styles.rowMeta}>
                      <SourceBadge>{item.sourceType}</SourceBadge>
                      <span>{item.sourceName}</span>
                      <span>{item.evidence} evidence</span>
                      <span>{item.risks} risks</span>
                    </div>
                    <div className={styles.trustLine}>
                      <span style={{ width: `${item.trust}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className={styles.decisionPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3>{selected.company}</h3>
                  <p>{selected.status}</p>
                </div>
                <ConfidenceBadge value={selected.confidence} />
              </div>

              <div className={styles.whyBox}>
                <span>Why this matters</span>
                <p>
                  Hiring for experimentation and checkout optimization suggests near-term demand for a focused CRO audit.
                </p>
              </div>

              <div className={styles.breakdownGrid}>
                <Metric label="Source trust" value="92" meta="First-party ATS" />
                <Metric label="ICP fit" value="87" meta="Mid-market ecommerce" />
                <Metric label="Recency" value="Today" meta="Observed 09:18" />
              </div>

              <div className={styles.evidenceStack}>
                <h4>Evidence</h4>
                {evidenceItems.slice(0, 2).map((item) => (
                  <a className={styles.evidenceCard} href={item.url} key={item.url} rel="noreferrer" target="_blank">
                    <span>{item.type}</span>
                    <strong>{item.source}</strong>
                    <p>{item.excerpt}</p>
                    <small>{item.observed}</small>
                  </a>
                ))}
              </div>

              <div className={styles.checklist}>
                <h4>Decision checklist</h4>
                {reviewChecks.map((item, index) => (
                  <label key={item}>
                    <input defaultChecked={index < 3} type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>

              <div className={styles.decisionActions}>
                <button className={styles.approveButton} type="button">
                  Approve signal
                </button>
                <button type="button">Request evidence</button>
                <button className={styles.rejectButton} type="button">
                  Reject
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.mockupBlock} aria-labelledby="evidence-title">
        <div className={styles.mockupIntro}>
          <div>
            <p className={styles.kicker}>Direction B</p>
            <h2 id="evidence-title">Evidence Detail</h2>
          </div>
          <p>Best for deeper review: every source is visible, inspectable and tied to trust reasoning.</p>
        </div>

        <div className={styles.detailMockup}>
          <div className={styles.detailMain}>
            <div className={styles.detailHeader}>
              <div>
                <span className={styles.statusLabel}>Needs review</span>
                <h3>Northstar Cart Labs</h3>
                <p>Senior experimentation role with Shopify Plus checkout optimization requirements.</p>
              </div>
              <button className={styles.approveButton} type="button">
                Approve
              </button>
            </div>

            <div className={styles.evidenceTable}>
              {evidenceItems.map((item) => (
                <a className={styles.evidenceRow} href={item.url} key={item.url} rel="noreferrer" target="_blank">
                  <div>
                    <SourceBadge>{item.type}</SourceBadge>
                    <h4>{item.source}</h4>
                    <p>{item.excerpt}</p>
                  </div>
                  <div>
                    <strong>{item.observed}</strong>
                    <span>{item.trust}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <aside className={styles.detailAside}>
            <h3>Risk review</h3>
            <div className={styles.riskItem}>
              <strong>Contact not confirmed</strong>
              <span>Medium</span>
              <p>Signal is strong, but the buyer persona still needs a named recipient.</p>
            </div>
            <div className={styles.riskItem}>
              <strong>Domain normalized</strong>
              <span>Low</span>
              <p>Source text and website domain match after normalization.</p>
            </div>
            <h3>Activity</h3>
            <ol className={styles.activityList}>
              <li>
                <strong>Signal imported</strong>
                <span>09:18 from Apify job monitor</span>
              </li>
              <li>
                <strong>Dedupe checked</strong>
                <span>09:18 against domain and campaign</span>
              </li>
              <li>
                <strong>Review requested</strong>
                <span>09:20 assigned to reviewer pool</span>
              </li>
            </ol>
          </aside>
        </div>
      </section>

      <section className={styles.mockupBlock} aria-labelledby="sources-title">
        <div className={styles.mockupIntro}>
          <div>
            <p className={styles.kicker}>Direction C</p>
            <h2 id="sources-title">Source Quality Board</h2>
          </div>
          <p>Best after MVP: helps tune which sources are allowed to create review workload.</p>
        </div>

        <div className={styles.sourceBoard}>
          <div className={styles.sourceMetrics}>
            <Metric label="Accepted signals" value="74%" meta="Last 30 days" />
            <Metric label="Noisy sources" value="3" meta="Require corroboration" />
            <Metric label="Evidence coverage" value="96%" meta="URL present" />
          </div>

          <div className={styles.sourceTable}>
            {sourceRows.map((row) => (
              <div className={styles.sourceRow} key={row.source}>
                <strong>{row.source}</strong>
                <span>{row.trust}</span>
                <span>{row.volume}</span>
                <span>{row.acceptRate}</span>
                <p>{row.nextAction}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
