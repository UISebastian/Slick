import {
  EmptyState,
  PageHeader,
  ReviewActions,
  Section,
  StatusBadge,
  TableWrap,
  styles
} from "@/components/admin/admin-ui";
import { dispatchReviews } from "@/components/admin/mock-data";

function sendabilityTone(sendability: string) {
  if (sendability === "Ready") {
    return "teal";
  }

  if (sendability === "Blocked") {
    return "red";
  }

  return "amber";
}

export default function DispatchReviewQueuePage() {
  const readyCount = dispatchReviews.filter((review) => review.sendability === "Ready").length;

  return (
    <>
      <PageHeader
        kicker="Review queue"
        title="Dispatch review"
        description="Final approval surface before outbound messages can be queued for sending."
      />

      <div className={styles.grid}>
        <Section
          title="Dispatch approvals"
          meta={`${dispatchReviews.length} pending dispatch decisions - ${readyCount} ready`}
        >
          <TableWrap>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col">Recipient</th>
                  <th scope="col">Mailbox</th>
                  <th scope="col">Scheduled</th>
                  <th scope="col">Sendability</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {dispatchReviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <span className={styles.strongCell}>{review.account}</span>
                      <div className={styles.cellMeta}>{review.campaign}</div>
                    </td>
                    <td>{review.recipient}</td>
                    <td>{review.mailbox}</td>
                    <td>{review.scheduledFor}</td>
                    <td>
                      <StatusBadge tone={sendabilityTone(review.sendability)}>{review.sendability}</StatusBadge>
                    </td>
                    <td>
                      <ReviewActions approveLabel="Approve dispatch" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <div className={styles.detailGrid}>
          {dispatchReviews.map((review) => (
            <Section key={review.id} title={review.account} meta={review.status}>
              <ul className={styles.list}>
                {review.blockers.map((blocker) => (
                  <li className={styles.listItem} key={blocker}>
                    <p className={styles.listMeta}>{blocker}</p>
                  </li>
                ))}
              </ul>
            </Section>
          ))}
        </div>

        {dispatchReviews.length === 0 ? <EmptyState>No dispatch reviews are waiting.</EmptyState> : null}
      </div>
    </>
  );
}
