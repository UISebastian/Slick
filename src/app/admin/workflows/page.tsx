import {
  PageHeader,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { deadLetterItems, workflowRuns } from "@/components/admin/mock-data";

function workflowTone(status: string) {
  if (status === "succeeded") {
    return "teal";
  }

  if (status === "failed" || status === "open") {
    return "red";
  }

  if (status === "retry_scheduled") {
    return "amber";
  }

  return "neutral";
}

export default function WorkflowOperationsPage() {
  return (
    <>
      <PageHeader
        kicker="Operations"
        title="Workflows and dead letters"
        description="Redacted workflow run state and retryable failure items from the orchestration layer."
      />

      <div className={styles.grid}>
        <Section title="Workflow runs" meta={`${workflowRuns.length} recent executions`}>
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Workflow</th>
                  <th scope="col">Status</th>
                  <th scope="col">Started</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Correlation</th>
                  <th scope="col">Refs</th>
                </tr>
              </thead>
              <tbody>
                {workflowRuns.map((run) => (
                  <tr key={run.id}>
                    <td className={styles.strongCell}>{run.name}</td>
                    <td>
                      <StatusBadge tone={workflowTone(run.status)}>{run.status}</StatusBadge>
                    </td>
                    <td>{run.startedAt}</td>
                    <td>{run.duration}</td>
                    <td>
                      <span className={styles.truncate}>{run.correlationId}</span>
                    </td>
                    <td>{run.refs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section title="Dead letter items" meta={`${deadLetterItems.length} open or retry-scheduled items`}>
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Object</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Status</th>
                  <th scope="col">Retries</th>
                  <th scope="col">Next retry</th>
                  <th scope="col">Error</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {deadLetterItems.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.strongCell}>{item.object}</td>
                    <td>{item.stage}</td>
                    <td>
                      <StatusBadge tone={workflowTone(item.status)}>{item.status}</StatusBadge>
                    </td>
                    <td>{item.retryCount}</td>
                    <td>{item.nextRetryAt}</td>
                    <td>{item.error}</td>
                    <td>
                      <div className={styles.actionBar}>
                        <button className={`${styles.button} ${styles.buttonPrimary}`} type="button">
                          Retry
                        </button>
                        <button className={styles.button} type="button">
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>
      </div>
    </>
  );
}
