import Link from "next/link";
import {
  MetricCard,
  PageHeader,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { pipelineSnapshot, queueSummaries, summaryMetrics, workflowRuns } from "@/components/admin/mock-data";

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader
        kicker="MVP operations"
        title="Dashboard overview"
        description="Approval queues, reply follow-up, and workflow exceptions for the active agency workspace."
        actions={
          <>
            <Link className={`${styles.button} ${styles.buttonPrimary}`} href="/admin/signals">
              Open signal queue
            </Link>
            <Link className={styles.button} href="/admin/workflows">
              Dead letters
            </Link>
          </>
        }
      />

      <div className={styles.grid}>
        <section className={styles.metricGrid} aria-label="Queue metrics">
          {summaryMetrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} meta={metric.meta} value={metric.value} />
          ))}
        </section>

        <div className={styles.split}>
          <Section title="Review queues" meta="Pending dashboard decisions by workflow phase">
            <TableWrap>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Queue</th>
                    <th scope="col">State</th>
                    <th scope="col" className={styles.numeric}>
                      Pending
                    </th>
                    <th scope="col">Oldest</th>
                    <th scope="col">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {queueSummaries.map((queue) => (
                    <tr key={queue.href}>
                      <td>
                        <Link className={styles.strongCell} href={queue.href}>
                          {queue.label}
                        </Link>
                      </td>
                      <td>
                        <StatusBadge tone={queue.tone}>Pending</StatusBadge>
                      </td>
                      <td className={styles.numeric}>{queue.pending}</td>
                      <td>{queue.oldest}</td>
                      <td>{queue.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>

          <Section title="Workflow run health" meta="Recent redacted workflow execution metadata">
            <ul className={styles.timeline}>
              {workflowRuns.map((run) => (
                <li className={styles.timelineItem} key={run.id}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    <p className={styles.timelineTitle}>{run.name}</p>
                    <p className={styles.timelineMeta}>
                      {run.status} - {run.startedAt} - {run.duration}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title="Pipeline snapshot" meta="Static view of today's first-touch workflow">
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
