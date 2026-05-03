import Link from "next/link";
import {
  MetricCard,
  PageHeader,
  PolicyGateBadge,
  Section,
  ScoreBar,
  StatusBadge,
  StatusDot,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import {
  automationHealth,
  deadLetterItems,
  n8nFlowRuns,
  pipelineSnapshot,
  policyDecisions,
  policyDenies,
  slaQueues,
  sourceQuality,
  summaryMetrics
} from "@/components/admin/mock-data";
import type { BadgeTone } from "@/components/admin/mock-data";

const summaryMetricTones = ["amber", "red", "teal", "red", "amber"] satisfies BadgeTone[];

function workflowTone(status: string): BadgeTone {
  if (status === "succeeded") {
    return "teal";
  }

  if (status === "failed") {
    return "red";
  }

  if (status === "waiting" || status === "retry_scheduled") {
    return "amber";
  }

  return "neutral";
}

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        kicker="Admin operations"
        title="Automation cockpit"
        description="Workspace automation, policy gate, and workflow health snapshot."
        actions={
          <>
            <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/admin/signals">
              Signal queue
            </Link>
            <Link className={styles.button} href="/admin/workflows">
              Dead letters
            </Link>
          </>
        }
      />

      <div className={styles.grid}>
        <section className={styles.metricGrid} aria-label="Automation cockpit metrics">
          {summaryMetrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              meta={metric.meta}
              tone={summaryMetricTones[index] ?? "neutral"}
              value={metric.value}
            />
          ))}
        </section>

        <div className={styles.cockpitColumns}>
          <Section
            title="Automation health"
            meta={`${automationHealth.length} monitored control points`}
            actions={<StatusBadge tone="red">Attention</StatusBadge>}
          >
            <div className={styles.healthList}>
              {automationHealth.map((item) => (
                <div className={styles.healthRow} key={item.label}>
                  <div className={styles.statusLine}>
                    <StatusDot tone={item.tone} />
                    <div>
                      <p className={styles.rowTitle}>{item.label}</p>
                      <p className={styles.rowMeta}>{item.status}</p>
                    </div>
                  </div>
                  <span className={styles.healthValue}>{item.value}</span>
                  <p className={styles.rowMeta}>{item.detail}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="SLA and queue age" meta="Oldest pending work by owner">
            <div className={styles.slaList}>
              {slaQueues.map((queue) => (
                <div className={styles.slaRow} key={queue.queue}>
                  <div className={styles.statusLine}>
                    <StatusDot tone={queue.tone} />
                    <div>
                      <p className={styles.rowTitle}>{queue.queue}</p>
                      <p className={styles.rowMeta}>{queue.owner}</p>
                    </div>
                  </div>
                  <div className={styles.slaMetrics}>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>Pending</span>
                      <span className={styles.miniMetricValue}>{queue.pending}</span>
                    </span>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>Oldest</span>
                      <span className={styles.miniMetricValue}>{queue.age}</span>
                    </span>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>SLA</span>
                      <span className={styles.miniMetricValue}>{queue.sla}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className={styles.policyColumns}>
          <Section title="Pending policy-gated decisions" meta={`${policyDecisions.length} active decisions`}>
            <TableWrap>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    <th scope="col">Gate</th>
                    <th scope="col">Policy</th>
                    <th scope="col">Role</th>
                    <th scope="col">Age</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {policyDecisions.map((decision) => (
                    <tr key={decision.id}>
                      <td>
                        <span className={styles.strongCell}>{decision.account}</span>
                        <div className={styles.cellMeta}>{decision.stage}</div>
                      </td>
                      <td>
                        <PolicyGateBadge state={decision.gate} />
                        <div className={styles.cellMeta}>{decision.reason}</div>
                      </td>
                      <td>
                        <span className={styles.strongCell}>{decision.policy}</span>
                      </td>
                      <td>
                        <span>{decision.role}</span>
                        <div className={styles.cellMeta}>{decision.owner}</div>
                      </td>
                      <td>{decision.age}</td>
                      <td>
                        <Link className={styles.button} href={decision.route}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>

          <div className={styles.railStack}>
            <Section title="Policy denies" meta={`${policyDenies.length} active deny rules`}>
              <div className={styles.compactList}>
                {policyDenies.map((deny) => (
                  <div className={styles.compactRow} key={deny.id}>
                    <div>
                      <p className={styles.rowTitle}>{deny.rule}</p>
                      <p className={styles.rowMeta}>
                        {deny.stage} - {deny.owner} - {deny.latest}
                      </p>
                    </div>
                    <StatusBadge tone={deny.tone}>{deny.count} denies</StatusBadge>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Dead letters" meta={`${deadLetterItems.length} open or retry-scheduled`}>
              <div className={styles.compactList}>
                {deadLetterItems.map((item) => (
                  <div className={styles.compactRow} key={item.id}>
                    <div>
                      <p className={styles.rowTitle}>{item.object}</p>
                      <p className={styles.rowMeta}>
                        {item.stage} - retry {item.retryCount} - {item.nextRetryAt}
                      </p>
                    </div>
                    <StatusBadge tone={workflowTone(item.status)}>{item.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        <div className={styles.opsColumns}>
          <Section title="n8n flow runs" meta={`${n8nFlowRuns.length} recent orchestration runs`}>
            <TableWrap>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Workflow</th>
                    <th scope="col">Status</th>
                    <th scope="col">Gate</th>
                    <th scope="col">Trigger</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Refs</th>
                  </tr>
                </thead>
                <tbody>
                  {n8nFlowRuns.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <span className={styles.strongCell}>{run.workflow}</span>
                        <div className={styles.cellMeta}>{run.correlationId}</div>
                      </td>
                      <td>
                        <StatusBadge tone={workflowTone(run.status)}>{run.status}</StatusBadge>
                        <div className={styles.cellMeta}>{run.startedAt}</div>
                      </td>
                      <td>
                        <PolicyGateBadge state={run.gate} />
                      </td>
                      <td>{run.trigger}</td>
                      <td>{run.attempts}</td>
                      <td>{run.duration}</td>
                      <td>{run.refs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>

          <Section title="Source quality" meta={`${sourceQuality.length} source checks`}>
            <div className={styles.sourceQualityList}>
              {sourceQuality.map((source) => (
                <div className={styles.sourceQualityRow} key={source.source}>
                  <div className={styles.sourceQualityHeader}>
                    <div className={styles.statusLine}>
                      <StatusDot tone={source.tone} />
                      <div>
                        <p className={styles.rowTitle}>{source.source}</p>
                        <p className={styles.rowMeta}>{source.lastRun}</p>
                      </div>
                    </div>
                    <StatusBadge tone={source.tone}>{source.score}%</StatusBadge>
                  </div>
                  <ScoreBar label="Quality" value={source.score} />
                  <div className={styles.sourceStats}>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>Accepted</span>
                      <span className={styles.miniMetricValue}>{source.accepted}</span>
                    </span>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>Rejected</span>
                      <span className={styles.miniMetricValue}>{source.rejected}</span>
                    </span>
                    <span className={styles.miniMetric}>
                      <span className={styles.miniMetricLabel}>Stale</span>
                      <span className={styles.miniMetricValue}>{source.stale}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Automation pipeline" meta="First-touch workflow volume today">
          <div className={styles.pipeline}>
            {pipelineSnapshot.map((step) => (
              <div className={styles.pipelineStep} key={step.label}>
                <span>{step.label}</span>
                <div className={styles.barTrack} aria-hidden="true">
                  <div className={styles.barFill} style={{ width: `${step.percent}%` }} />
                </div>
                <span className={styles.numeric}>{step.count}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
