import type { CurrentUser } from "../auth/current-user";
import { getCurrentUser } from "../auth/current-user";
import { requireRole } from "../modules/workflows/authorization";

export async function requireCurrentUser(minimumRole: CurrentUser["role"]) {
  const user = await getCurrentUser();
  requireRole(user, minimumRole);
  return user;
}
