import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import styles from "./admin.module.css";
import type { BadgeTone, PolicyGateState } from "./mock-data";

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: styles.badgeNeutral,
  teal: styles.badgeTeal,
  amber: styles.badgeAmber,
  red: styles.badgeRed,
  blue: styles.badgeBlue,
  purple: styles.badgePurple
};

const metricToneClass: Record<BadgeTone, string> = {
  neutral: styles.metricCardNeutral,
  teal: styles.metricCardTeal,
  amber: styles.metricCardAmber,
  red: styles.metricCardRed,
  blue: styles.metricCardBlue,
  purple: styles.metricCardPurple
};

const statusDotToneClass: Record<BadgeTone, string> = {
  neutral: styles.statusDotNeutral,
  teal: styles.statusDotTeal,
  amber: styles.statusDotAmber,
  red: styles.statusDotRed,
  blue: styles.statusDotBlue,
  purple: styles.statusDotPurple
};

const gateTone: Record<PolicyGateState, BadgeTone> = {
  allowed: "teal",
  blocked: "red",
  needs_approval: "amber"
};

const gateLabel: Record<PolicyGateState, string> = {
  allowed: "Allowed",
  blocked: "Blocked",
  needs_approval: "Needs approval"
};

export function PageHeader({
  kicker,
  title,
  description,
  actions
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.pageTitle}>{title}</h1>
        {description ? <p className={styles.pageDescription}>{description}</p> : null}
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  meta,
  actions,
  children
}: {
  title: string;
  meta?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.surface}>
      <div className={styles.surfaceHeader}>
        <div>
          <h2 className={styles.surfaceTitle}>{title}</h2>
          {meta ? <p className={styles.surfaceMeta}>{meta}</p> : null}
        </div>
        {actions ? <div className={styles.actionBar}>{actions}</div> : null}
      </div>
      <div className={styles.surfaceBody}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  meta,
  tone = "neutral"
}: {
  label: string;
  value: string;
  meta: string;
  tone?: BadgeTone;
}) {
  return (
    <article className={`${styles.metricCard} ${metricToneClass[tone]}`}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      <p className={styles.metricMeta}>{meta}</p>
    </article>
  );
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`${styles.badge} ${badgeToneClass[tone]}`}>{children}</span>;
}

export function StatusDot({ tone = "neutral" }: { tone?: BadgeTone }) {
  return <span className={`${styles.statusDot} ${statusDotToneClass[tone]}`} aria-hidden="true" />;
}

export function PolicyGateBadge({ state }: { state: PolicyGateState }) {
  return <StatusBadge tone={gateTone[state]}>{gateLabel[state]}</StatusBadge>;
}

export function PriorityBadge({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const tone: BadgeTone = priority === "High" ? "red" : priority === "Medium" ? "amber" : "neutral";

  return <StatusBadge tone={tone}>{priority}</StatusBadge>;
}

export function ButtonLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link className={styles.button} href={href}>
      {children}
    </Link>
  );
}

export function ReviewActions({ approveLabel = "Approve" }: { approveLabel?: string }) {
  return (
    <div className={styles.actionBar} aria-label="Review actions">
      <button className={`${styles.button} ${styles.buttonPrimary}`} type="button">
        {approveLabel}
      </button>
      <button className={`${styles.button} ${styles.buttonSubtle}`} type="button">
        Request changes
      </button>
      <button className={`${styles.button} ${styles.buttonDanger}`} type="button">
        Reject
      </button>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.scoreBlock}>
      <div className={styles.scoreHeader}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className={styles.tableWrap}>{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={styles.emptyState}>{children}</div>;
}

export { styles };
