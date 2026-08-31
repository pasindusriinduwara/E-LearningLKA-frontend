import { fetchApi } from "@/lib/api";
import type { AuthUser } from "@/context/AuthContext";

export async function getCurrentUserProfile(): Promise<AuthUser> {
  return fetchApi<AuthUser>("/users/me");
}
