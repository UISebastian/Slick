import type { ReactNode } from "react";
import styles from "./admin.module.css";
import { AdminNav } from "./admin-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            S
          </div>
          <div>
            <p className={styles.brandName}>Slick</p>
            <p className={styles.brandMeta}>Admin Dashboard</p>
          </div>
        </div>

        <AdminNav />

        <div className={styles.sidebarFooter}>
          <strong>Agency:</strong> Demo Growth Studio
          <br />
          <strong>Workspace:</strong> MVP operations
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topbarTitle}>Review desk</p>
            <p className={styles.topbarMeta}>Signal, draft, dispatch, reply, and workflow approvals</p>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.healthPill}>
              <span className={styles.healthDot} aria-hidden="true" />
              Local mock data
            </span>
            <span className={styles.rolePill}>Owner</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
