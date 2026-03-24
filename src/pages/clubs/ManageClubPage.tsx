import { Navigate, useNavigate } from "react-router-dom";
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
import { UpdatePremiumExpiryModal } from "@/pages/clubs/components/manage/UpdatePremiumExpiryModal";
import { ManageClubInfoCard } from "@/pages/clubs/components/manage/ManageClubInfoCard";
import {
  shouldShowSubscriptionBanner,
  useManageClubState,
} from "@/pages/clubs/hooks/useManageClubState";

export default function ManageClubPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAccess = useHasRoleOrAbove(ROLES.ORGANISER);
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
  const canManagePremiumExpiry = useHasRoleOrAbove(ROLES.SUPER_ADMIN);

  const handleUpdateClubSubscription = async (selectedExpiryDate: Date) => {
    try {
      await updateClubSubscription.mutateAsync({
        plan: "premium",
        expiresAt: selectedExpiryDate,
      });
      toast.success(t("manageClub.premiumExpiryUpdated"));
      return true;
    } catch (error) {
      toast.error(
        getErrorMessage(error) || t("manageClub.premiumExpiryUpdateError")
      );
      return false;
    }
  };

  const openPremiumExpiryModal = () => {
    setPremiumExpiryModalOpen(true);
  };

  const handleRequestSubscriptionRenewal = async () => {
    // Notification-only: no API accepts this date yet for club-admin renewal requests.
    toast.success(t("manageClub.renewRequestSent"));
    setPremiumExpiryModalOpen(false);
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
    <div className="flex min-h-[calc(100vh-60px)] justify-center bg-[#f8fbf8] px-6 py-[22px]">
      <div className="flex w-full max-w-[1088px] flex-col gap-[25px] lg:flex-row lg:gap-[34px]">
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
            "flex-1",
            mobileView === "clubs" && "hidden lg:block"
          )}
        >
          {!effectiveClubId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">{t("manageClub.selectClubToManage")}</p>
            </div>
          ) : (
            <>
              <div className="rounded-[12px] border border-black/8 bg-white px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] lg:px-3 lg:py-5">
                <ManageClubHeader
                  selectedClub={selectedClub}
                  canAddStaff={canAddStaff}
                  canViewSponsors={Boolean(effectiveClubId)}
                  onOpenAddModal={() => setAddModalOpen(true)}
                  onViewSponsors={() => {
                    if (!effectiveClubId) return;
                    navigate(`/clubs/manage/sponsors/${effectiveClubId}`);
                  }}
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
                  subscription={staffData?.subscription}
                  onRenew={openPremiumExpiryModal}
                  onUpgrade={openPremiumExpiryModal}
                />
              </div>

              {mobileView === "staff" && (
                <div className="mt-[25px] lg:hidden">
                  <ManageClubInfoCard />
                </div>
              )}
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

      {!canManagePremiumExpiry ? (
        <RequestSubscriptionRenewalModal
          open={premiumExpiryModalOpen}
          onOpenChange={setPremiumExpiryModalOpen}
          onConfirm={handleRequestSubscriptionRenewal}
        />
      ) : (
        <UpdatePremiumExpiryModal
          open={premiumExpiryModalOpen}
          onOpenChange={setPremiumExpiryModalOpen}
          currentExpiryDate={staffData?.subscription?.expiresAt}
          isSubmitting={updateClubSubscription.isPending}
          onConfirm={handleUpdateClubSubscription}
        />
      )}
    </div>
  );
}
