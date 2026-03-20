import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAdminClubs,
  useClubStaff,
  useUpdateClubSubscription,
} from "@/pages/clubs/hooks";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import InlineLoader from "@/components/shared/InlineLoader";
import { AddAdminOrganiserModal } from "@/pages/clubs/components/manage/AddAdminOrganiserModal";
import { ManageClubHeader } from "@/pages/clubs/components/manage/ManageClubHeader";
import { ManageClubSidebar } from "@/pages/clubs/components/manage/ManageClubSidebar";
import { ManageClubStaffSection } from "@/pages/clubs/components/manage/ManageClubStaffSection";
import { ManageClubSubscriptionBanners } from "@/pages/clubs/components/manage/ManageClubSubscriptionBanners";
import { RequestSubscriptionRenewalModal } from "@/pages/clubs/components/manage/RequestSubscriptionRenewalModal";
import {
  shouldShowSubscriptionBanner,
  useManageClubState,
} from "@/pages/clubs/hooks/useManageClubState";
import { isSubscriptionExpiredByLocalDay } from "@/utils/date";

export default function ManageClubPage() {
  const { t } = useTranslation();
  const hasAccess = useHasRoleOrAbove(ROLES.CLUB_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data: adminClubsData, isLoading: clubsLoading } = useAdminClubs(hasAccess);

  const clubs = adminClubsData?.clubs ?? [];
  const {
    selectedClub,
    effectiveClubId,
    mobileView,
    setMobileView,
    setSelectedClubId,
    addModalOpen,
    setAddModalOpen,
    premiumExpiryModalOpen,
    setPremiumExpiryModalOpen,
  } = useManageClubState(clubs);

  const { data: staffData, isLoading: staffLoading } = useClubStaff(effectiveClubId);
  const updateClubSubscription = useUpdateClubSubscription(effectiveClubId);
  const staff = staffData?.staff ?? [];
  const existingStaffIds = staff.map((s) => s.id);
  const showSubscriptionBanner = shouldShowSubscriptionBanner(staffData?.subscription);
  const showUpgradeBanner =
    staffData?.subscription?.plan === "free" && !showSubscriptionBanner;
  const canAddStaff =
    staffData != null && staffData.subscription?.plan !== "free";
  const subscriptionExpiryDate = staffData?.subscription?.expiresAt ?? null;

  const isExpired = isSubscriptionExpiredByLocalDay(subscriptionExpiryDate);
  const handleUpdateClubSubscription = async (selectedExpiryDate: Date) => {
    try {
      await updateClubSubscription.mutateAsync({
        plan: "premium",
        expiresAt: selectedExpiryDate,
      });
      toast.success(t("manageClub.premiumExpiryUpdated"));
      setPremiumExpiryModalOpen(false);
    } catch (error) {
      toast.error(
        getErrorMessage(error) || t("manageClub.premiumExpiryUpdateError")
      );
    }
  };

  const openPremiumExpiryModal = () => {
    setPremiumExpiryModalOpen(true);
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="flex w-full max-w-6xl flex-col lg:flex-row">
        <ManageClubSidebar
          clubs={clubs}
          clubsLoading={clubsLoading}
          effectiveClubId={effectiveClubId}
          mobileView={mobileView}
          onClubSelect={(clubId) => {
            setSelectedClubId(clubId);
            setMobileView("staff");
          }}
        />

        <main
          className={cn(
            "flex-1 p-4 lg:p-6",
            mobileView === "clubs" && "hidden lg:block"
          )}
        >
          {!effectiveClubId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">{t("manageClub.selectClubToManage")}</p>
            </div>
          ) : (
            <>
              <ManageClubHeader
                selectedClub={selectedClub}
                canAddStaff={canAddStaff}
                onBackToClubs={() => setMobileView("clubs")}
                onOpenAddModal={() => setAddModalOpen(true)}
              />

              <ManageClubStaffSection
                staff={staff}
                staffLoading={staffLoading}
                canAddStaff={canAddStaff}
                onOpenAddModal={() => setAddModalOpen(true)}
              />

              <ManageClubSubscriptionBanners
                showSubscriptionBanner={showSubscriptionBanner}
                showUpgradeBanner={showUpgradeBanner}
                subscriptionExpiryDate={staffData?.subscription?.expiresAt}
                isExpired={isExpired}
                onRenew={openPremiumExpiryModal}
                onUpgrade={openPremiumExpiryModal}
              />
            </>
          )}
        </main>
      </div>

      <AddAdminOrganiserModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        clubId={effectiveClubId ?? ""}
        existingStaffIds={existingStaffIds}
      />

      <RequestSubscriptionRenewalModal
        open={premiumExpiryModalOpen}
        onOpenChange={setPremiumExpiryModalOpen}
        currentExpiryDate={staffData?.subscription?.expiresAt}
        isSubmitting={updateClubSubscription.isPending}
        onConfirm={handleUpdateClubSubscription}
      />
    </div>
  );
}
