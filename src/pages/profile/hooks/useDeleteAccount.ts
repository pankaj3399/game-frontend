import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface UseDeleteAccountOptions {
  onSuccess?: () => void;
}

async function deleteAccountMutation() {
  const res = await api.delete<{ message: string }>("/api/user/delete-account");
  return res.data;
}

export function useDeleteAccount({ onSuccess }: UseDeleteAccountOptions = {}) {
  const mutation = useMutation({
    mutationFn: deleteAccountMutation,
  });

  const deleteAccount = async () => {
    try {
      await mutation.mutateAsync();
      try {
        onSuccess?.();
      } catch {
        // Swallow errors from onSuccess - mutation succeeded, return success
      }
      return { success: true as const };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message =
        axiosErr?.response?.data?.message ?? "Failed to delete account";
      return { success: false as const, message };
    }
  };

  return {
    deleteAccount,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
