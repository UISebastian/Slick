import type { Route } from "next";
import {
  ButtonLink,
  PageHeader,
  PriorityBadge,
  ReviewActions,
  ScoreBar,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { signalReviews } from "@/components/admin/mock-data";

export default function SignalReviewQueuePage() {
  const selectedSignal = signalReviews[0];

  return (
    <>
      <PageHeader
        kicker="Review queue"
        title="Signal review"
        description="Incoming buying signals waiting for approve or reject decisions before context build."
      />

      <div className={styles.split}>
        <Section title="Signals awaiting triage" meta={`${signalReviews.length} pending review requests`}>
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Signal</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Fit</th>
                  <th scope="col">Due</th>
                  <th scope="col">Detail</th>
                </tr>
              </thead>
              <tbody>
                {signalReviews.map((signal) => (
                  <tr key={signal.id}>
                    <td>
                      <span className={styles.strongCell}>{signal.company}</span>
                      <div className={styles.cellMeta}>{signal.domain}</div>
                    </td>
                    <td>
                      <div className={styles.truncate}>{signal.signalSummary}</div>
                      <div className={styles.cellMeta}>{signal.campaign}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={signal.priority} />
                    </td>
                    <td>{signal.fitScore}%</td>
                    <td>{signal.dueAt}</td>
                    <td>
                      <ButtonLink href={`/admin/signals/${signal.id}` as Route}>Open</ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section
          title="Selected signal"
          meta={`${selectedSignal.company} - ${selectedSignal.status}`}
          actions={<StatusBadge tone="amber">Triage</StatusBadge>}
        >
          <div className={styles.rowStack}>
            <p className={styles.listTitle}>{selectedSignal.signalSummary}</p>
            <ScoreBar label="ICP fit" value={selectedSignal.fitScore} />
            <div className={styles.keyValueGrid}>
              <div className={styles.keyValue}>
                <span className={styles.label}>Persona</span>
                <span className={styles.value}>{selectedSignal.persona}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Source</span>
                <span className={styles.value}>{selectedSignal.source}</span>
              </div>
            </div>
            <ul className={styles.list}>
              {selectedSignal.evidence.slice(0, 2).map((item) => (
                <li className={styles.listItem} key={item}>
                  <p className={styles.listMeta}>{item}</p>
                </li>
              ))}
            </ul>
            <ReviewActions approveLabel="Approve signal" />
          </div>
        </Section>
      </div>
    </>
  );
}
