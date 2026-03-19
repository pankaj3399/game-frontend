import { api } from "@/lib/api";

export interface PromoteToSuperAdminInput {
  username: string;
  password: string;
}

export interface PromoteToSuperAdminResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    alias: string | null;
    role: string;
  };
}

export async function promoteToSuperAdmin(payload: PromoteToSuperAdminInput) {
  const res = await api.post<PromoteToSuperAdminResponse>(
    "/api/admin/promote-super-admin",
    payload
  );

  return res.data;
}
