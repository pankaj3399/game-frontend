import { useMutation } from "@tanstack/react-query";
import {
  promoteToSuperAdmin,
  type PromoteToSuperAdminInput,
  type PromoteToSuperAdminResponse,
} from "./handler";

export type { PromoteToSuperAdminInput, PromoteToSuperAdminResponse };

export function usePromoteToSuperAdmin() {
  return useMutation<PromoteToSuperAdminResponse, unknown, PromoteToSuperAdminInput>({
    mutationFn: promoteToSuperAdmin,
  });
}
