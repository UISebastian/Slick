import {
  PageHeader,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { replyOutcomes } from "@/components/admin/mock-data";

function classificationTone(classification: string) {
  if (classification === "positive") {
    return "teal";
  }

  if (classification === "not_interested") {
    return "red";
  }

  if (classification === "auto_reply") {
    return "neutral";
  }

  return "amber";
}

export default function RepliesAndOutcomesPage() {
  const selectedReply = replyOutcomes[0];

  return (
    <>
      <PageHeader
        kicker="Review queue"
        title="Replies and outcomes"
        description="Inbound replies that need human action and outcome logging."
      />

      <div className={styles.split}>
        <Section title="Replies requiring outcome" meta={`${replyOutcomes.length} open reply records`}>
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Classification</th>
                  <th scope="col">Received</th>
                  <th scope="col">Snippet</th>
                  <th scope="col">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {replyOutcomes.map((reply) => (
                  <tr key={reply.id}>
                    <td>
                      <span className={styles.strongCell}>{reply.account}</span>
                      <div className={styles.cellMeta}>{reply.from}</div>
                    </td>
                    <td>
                      <StatusBadge tone={classificationTone(reply.classification)}>{reply.classification}</StatusBadge>
                    </td>
                    <td>{reply.receivedAt}</td>
                    <td>
                      <div className={styles.truncate}>{reply.snippet}</div>
                    </td>
                    <td>{reply.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section
          title="Outcome log"
          meta={`${selectedReply.account} - ${selectedReply.status}`}
          actions={<StatusBadge tone={classificationTone(selectedReply.classification)}>{selectedReply.classification}</StatusBadge>}
        >
          <div className={styles.formGrid}>
            <label>
              <span className={styles.label}>Outcome type</span>
              <select className={styles.inputLike} defaultValue={selectedReply.outcome}>
                <option value="manual_follow_up">Manual follow-up</option>
                <option value="positive_reply">Positive reply</option>
                <option value="meeting_booked">Meeting booked</option>
                <option value="not_interested">Not interested</option>
                <option value="bounced">Bounced</option>
              </select>
            </label>
            <label>
              <span className={styles.label}>Outcome note</span>
              <textarea className={styles.textareaLike} defaultValue={selectedReply.snippet} />
            </label>
            <div className={styles.actionBar}>
              <button className={`${styles.button} ${styles.buttonPrimary}`} type="button">
                Log outcome
              </button>
              <button className={styles.button} type="button">
                Suppress contact
              </button>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
