import { env } from "@/server/env";

export type CurrentUser = {
  id: string;
  agencyId: string;
  email: string;
  role: "owner" | "admin" | "reviewer" | "viewer";
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    agencyId: "00000000-0000-4000-8000-000000000010",
    email: env.AUTH_DEV_USER_EMAIL,
    role: "owner"
  };
}
