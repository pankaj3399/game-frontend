import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "@/icons/figma-icons";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { useClubSubscriptionsOverview } from "@/pages/admin/hooks/useClubSubscriptionsOverview";
import {
  useUpdateClubSubscription,
  type UpdateClubSubscriptionInput,
} from "@/pages/clubs/hooks";
import { ClubSubscriptionForm } from "@/pages/admin/components/ClubSubscriptionForm";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";

export default function ClubSubscriptionDetailPage() {
  const { t } = useTranslation();
  const hasAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data, isLoading } = useClubSubscriptionsOverview(hasAccess);
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const updateClubSubscription = useUpdateClubSubscription(clubId ?? null);

  const selectedClub = useMemo(() => {
    const rows = data?.clubs ?? [];
    if (!clubId) return rows[0] ?? null;
    return rows.find((club) => club.id === clubId) ?? null;
  }, [clubId, data?.clubs]);

  const handleSave = async (input: UpdateClubSubscriptionInput) => {
    const response = await updateClubSubscription.mutateAsync(input);
    return response.club;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;
  if (!hasAccess) return <Navigate to="/profile" replace />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbf8]">
      <div className="mx-auto w-full max-w-[992px] px-5 pt-8 pb-10 md:px-6 md:pt-9">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/admin/clubs-subscriptions")}
          className="mb-[25px] inline-flex h-auto items-center gap-[6px] p-0 text-[14px] font-medium text-[#010a04] hover:bg-transparent"
        >
          <ChevronLeft className="size-3" />
          <span>{t("admin.clubSubscription.goBack")}</span>
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <InlineLoader />
          </div>
        ) : !selectedClub ? (
          <div className="rounded-[12px] border border-black/10 bg-white p-6 text-center text-sm text-[#010a04]/70">
            {t("admin.clubSubscription.clubNotFound")}
          </div>
        ) : (
          <ClubSubscriptionForm
            key={selectedClub.id}
            club={selectedClub}
            onSave={handleSave}
            isSaving={updateClubSubscription.isPending}
          />
        )}
      </div>
    </div>
  );
}
