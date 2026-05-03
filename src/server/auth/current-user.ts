import { env } from "@/server/env";

export const userRoles = ["owner", "admin", "reviewer", "operator", "viewer", "automation"] as const;

export type UserRole = (typeof userRoles)[number];

export type CurrentUser = {
  id: string;
  agencyId: string;
  email: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    agencyId: "00000000-0000-4000-8000-000000000010",
    email: env.AUTH_DEV_USER_EMAIL,
    role: "owner"
  };
}
