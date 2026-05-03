import type { CurrentUser, UserRole } from "./current-user";

export const capabilities = [
  "policies.manage",
  "queues.read",
  "audit.read",
  "signals.review",
  "drafts.review",
  "dispatch.review",
  "dispatch.block",
  "replies.classify_outcome",
  "workflows.retry",
  "dead_letters.handle"
] as const;

export type Capability = (typeof capabilities)[number];

const roleGrants: Record<UserRole, readonly UserRole[]> = {
  owner: ["owner", "admin", "reviewer", "operator", "viewer", "automation"],
  admin: ["admin", "reviewer", "operator", "viewer"],
  reviewer: ["reviewer", "viewer"],
  operator: ["operator", "viewer"],
  viewer: ["viewer"],
  automation: ["automation", "viewer"]
};

export const roleCapabilities: Record<UserRole, readonly Capability[]> = {
  owner: capabilities,
  admin: [
    "queues.read",
    "audit.read",
    "signals.review",
    "drafts.review",
    "dispatch.review",
    "dispatch.block",
    "replies.classify_outcome",
    "workflows.retry",
    "dead_letters.handle"
  ],
  reviewer: [
    "queues.read",
    "audit.read",
    "signals.review",
    "drafts.review",
    "dispatch.review",
    "replies.classify_outcome"
  ],
  operator: [
    "queues.read",
    "audit.read",
    "dispatch.block",
    "replies.classify_outcome",
    "workflows.retry",
    "dead_letters.handle"
  ],
  viewer: ["queues.read", "audit.read"],
  automation: [
    "queues.read",
    "dispatch.block",
    "replies.classify_outcome",
    "workflows.retry"
  ]
};

export function hasRole(user: CurrentUser, minimumRole: CurrentUser["role"]) {
  return roleGrants[user.role].includes(minimumRole);
}

export function assertRole(user: CurrentUser, minimumRole: CurrentUser["role"]) {
  if (!hasRole(user, minimumRole)) {
    throw new Error(`Requires ${minimumRole} role`);
  }
}

export function hasCapability(user: CurrentUser, capability: Capability) {
  return roleCapabilities[user.role].includes(capability);
}

export function assertCapability(user: CurrentUser, capability: Capability) {
  if (!hasCapability(user, capability)) {
    throw new Error(`Requires ${capability} capability`);
  }
}
