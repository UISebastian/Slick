import type { CurrentUser } from "./current-user";

const roleRank: Record<CurrentUser["role"], number> = {
  viewer: 0,
  reviewer: 1,
  admin: 2,
  owner: 3
};

export function hasRole(user: CurrentUser, minimumRole: CurrentUser["role"]) {
  return roleRank[user.role] >= roleRank[minimumRole];
}

export function assertRole(user: CurrentUser, minimumRole: CurrentUser["role"]) {
  if (!hasRole(user, minimumRole)) {
    throw new Error(`Requires ${minimumRole} role`);
  }
}
