import type { CurrentUser } from "../../auth/current-user";
import { hasRole } from "../../auth/permissions";
import { forbidden } from "./errors";

export function requireRole(user: CurrentUser, minimumRole: CurrentUser["role"]) {
  if (!hasRole(user, minimumRole)) {
    throw forbidden(`Requires ${minimumRole} role`);
  }
}
