import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/pages/auth/hooks";

export interface UpdateProfileInput {
  alias?: string;
  name?: string;
  dateOfBirth?: string | null;
  gender?: "male" | "female" | "other" | "" | null;
}

async function updateProfileMutation(data: UpdateProfileInput) {
  const payload: Record<string, unknown> = {};
  if (data.alias !== undefined) payload.alias = data.alias;
  if (data.name !== undefined) payload.name = data.name;
  if (data.dateOfBirth !== undefined) payload.dateOfBirth = data.dateOfBirth ?? null;
  if (data.gender !== undefined) payload.gender = data.gender === "" ? null : data.gender;

  const res = await api.patch<string>("/api/user/update-profile", payload);
  return res.data;
}

export function useUpdateProfile() {
  const { checkAuth } = useAuth();

  const mutation = useMutation({
    mutationFn: updateProfileMutation,
    onSuccess: async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error("checkAuth failed after profile update", err);
      }
    },
  });

  const updateProfile = async (data: UpdateProfileInput) => {
    try {
      await mutation.mutateAsync(data);
      return { success: true as const };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr?.response?.data?.message ?? "Failed to update profile";
      return { success: false as const, message };
    }
  };

  return {
    updateProfile,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
