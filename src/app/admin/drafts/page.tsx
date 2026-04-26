import {
  PageHeader,
  ReviewActions,
  ScoreBar,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { draftReviews } from "@/components/admin/mock-data";

export default function DraftReviewQueuePage() {
  const selectedDraft = draftReviews[0];

  return (
    <>
      <PageHeader
        kicker="Review queue"
        title="Draft review"
        description="Generated first-touch emails waiting for approval, changes, or rejection."
      />

      <div className={styles.split}>
        <Section title="Drafts awaiting review" meta={`${draftReviews.length} message drafts`}>
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Version</th>
                  <th scope="col">Quality</th>
                  <th scope="col">Requested</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {draftReviews.map((draft) => (
                  <tr key={draft.id}>
                    <td>
                      <span className={styles.strongCell}>{draft.account}</span>
                      <div className={styles.cellMeta}>{draft.recipient}</div>
                    </td>
                    <td>
                      <span>{draft.subject}</span>
                      <div className={styles.cellMeta}>{draft.campaign}</div>
                    </td>
                    <td>v{draft.version}</td>
                    <td>{draft.qualityScore}%</td>
                    <td>{draft.requestedAt}</td>
                    <td>
                      <StatusBadge tone="blue">Draft</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section
          title="Draft packet"
          meta={`${selectedDraft.account} - v${selectedDraft.version}`}
          actions={<StatusBadge tone="blue">{selectedDraft.status}</StatusBadge>}
        >
          <div className={styles.rowStack}>
            <ScoreBar label="Quality checks" value={selectedDraft.qualityScore} />
            <div className={styles.messagePreview}>
              <p className={styles.messageSubject}>{selectedDraft.subject}</p>
              <p className={styles.messageBody}>{selectedDraft.body}</p>
            </div>
            <ul className={styles.list}>
              {selectedDraft.checks.map((check) => (
                <li className={styles.listItem} key={check}>
                  <p className={styles.listMeta}>{check}</p>
                </li>
              ))}
            </ul>
            <ReviewActions approveLabel="Approve draft" />
          </div>
        </Section>
      </div>
    </>
  );
}
