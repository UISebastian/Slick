import { notFound } from "next/navigation";
import {
  ButtonLink,
  PageHeader,
  PriorityBadge,
  ReviewActions,
  ScoreBar,
  Section,
  StatusBadge,
  styles
} from "@/components/admin/admin-ui";
import { getSignalReview, signalReviews } from "@/components/admin/mock-data";

export function generateStaticParams() {
  return signalReviews.map((signal) => ({
    signalId: signal.id
  }));
}

export default async function SignalReviewDetailPage({
  params
}: {
  params: Promise<{ signalId: string }>;
}) {
  const { signalId } = await params;
  const signal = getSignalReview(signalId);

  if (!signal) {
    notFound();
  }

  return (
    <>
      <PageHeader
        kicker="Signal detail"
        title={signal.company}
        description={signal.signalSummary}
        actions={
          <>
            <ButtonLink href="/admin/signals">Back to queue</ButtonLink>
            <PriorityBadge priority={signal.priority} />
          </>
        }
      />

      <div className={styles.split}>
        <div className={styles.grid}>
          <Section title="Review packet" meta={`${signal.campaign} - ${signal.observedAt}`}>
            <div className={styles.detailGrid}>
              <div className={styles.keyValue}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>{signal.status}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Owner</span>
                <span className={styles.value}>{signal.owner}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Domain</span>
                <span className={styles.value}>{signal.domain}</span>
              </div>
              <div className={styles.keyValue}>
                <span className={styles.label}>Persona</span>
                <span className={styles.value}>{signal.persona}</span>
              </div>
            </div>
          </Section>

          <Section title="Evidence" meta="Source excerpts and extracted facts">
            <ul className={styles.list}>
              {signal.evidence.map((item) => (
                <li className={styles.listItem} key={item}>
                  <p className={styles.listTitle}>{item}</p>
                  <p className={styles.listMeta}>{signal.source}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Bridge hypothesis" meta="Signal-to-offer rationale">
            <p className={styles.messageBody}>{signal.bridgeHypothesis}</p>
          </Section>
        </div>

        <div className={styles.grid}>
          <Section title="Decision" meta={signal.dueAt} actions={<StatusBadge tone="amber">Pending</StatusBadge>}>
            <div className={styles.rowStack}>
              <ScoreBar label="ICP match" value={signal.fitScore} />
              <ReviewActions approveLabel="Approve signal" />
            </div>
          </Section>

          <Section title="Risk flags" meta={`${signal.riskFlags.length} review notes`}>
            <ul className={styles.list}>
              {signal.riskFlags.map((flag) => (
                <li className={styles.listItem} key={flag}>
                  <p className={styles.listMeta}>{flag}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Timeline" meta="Review request history">
            <ul className={styles.timeline}>
              {signal.timeline.map((item) => (
                <li className={styles.timelineItem} key={item.title}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    <p className={styles.timelineTitle}>{item.title}</p>
                    <p className={styles.timelineMeta}>{item.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
