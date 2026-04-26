"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";
import { queueSummaries } from "./mock-data";

const navItems = [
  { href: "/admin", label: "Overview", count: null },
  { href: "/admin/signals", label: "Signals", count: queueSummaries[0].pending },
  { href: "/admin/drafts", label: "Drafts", count: queueSummaries[1].pending },
  { href: "/admin/dispatch", label: "Dispatch", count: queueSummaries[2].pending },
  { href: "/admin/replies", label: "Replies", count: queueSummaries[3].pending },
  { href: "/admin/workflows", label: "Workflows", count: queueSummaries[4].pending }
] as const;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin">
      {navItems.map((item) => {
        const isCurrent = isCurrentPath(pathname, item.href);

        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className={`${styles.navLink} ${isCurrent ? styles.navLinkCurrent : ""}`}
            href={item.href}
            key={item.href}
          >
            <span>{item.label}</span>
            {item.count !== null ? <span className={styles.navCount}>{item.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
