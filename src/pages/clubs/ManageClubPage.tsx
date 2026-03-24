import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAdminClubs,
  useClubStaff,
  useUpdateClubSubscription,
} from "@/pages/clubs/hooks";
import {
  useClubSubscriptionsOverview,
  type ClubSubscriptionStatus,
} from "@/pages/admin/hooks";
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
import { MainContentSkeleton } from "@/pages/clubs/components/manage/MainContentSkeleton";
import { SidebarSkeleton } from "@/pages/clubs/components/manage/SidebarSkeleton";
import type {
  ManageClubSidebarClub,
  SidebarStatusFilter,
} from "@/pages/clubs/components/manage/ManageClubSidebar";
import {
  shouldShowSubscriptionBanner,
  useManageClubState,
} from "@/pages/clubs/hooks/useManageClubState";
import { isSubscriptionExpiredByLocalDay } from "@/utils/date";

function deriveSubscriptionStatus(
  plan: "free" | "premium",
  expiresAt: Date | null
): ClubSubscriptionStatus {
  if (plan === "free") {
    return "nothing";
  }

  if (!expiresAt || isSubscriptionExpiredByLocalDay(expiresAt)) {
    return "renewal_needed";
  }

  return "subscribed";
}

export default function ManageClubPage() {
  const { t } = useTranslation();
  const hasAccess = useHasRoleOrAbove(ROLES.ORGANISER);
  const hasSuperAdminAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { user, isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data: adminClubsData, isLoading: clubsLoading } = useAdminClubs(hasAccess);
  const { data: clubSubscriptionsData, isLoading: subscriptionsLoading } =
    useClubSubscriptionsOverview(hasSuperAdminAccess);
  const isSidebarDataLoading =
    clubsLoading || (hasSuperAdminAccess && subscriptionsLoading);
  const [statusFilter, setStatusFilter] = useState<SidebarStatusFilter>("all");

  const clubs = adminClubsData?.clubs ?? [];
  const subscriptionsByClubId = new Map(
    (clubSubscriptionsData?.clubs ?? []).map((club) => [
      club.id,
      {
        status: club.subscription.status,
        expiresAt: club.subscription.expiresAt,
      },
    ])
  );

  let clubsWithSubscriptionStatus: ManageClubSidebarClub[];
  if (!hasSuperAdminAccess) {
    clubsWithSubscriptionStatus = clubs;
  } else {
    clubsWithSubscriptionStatus = clubs.map((club) => {
      const subscription = subscriptionsByClubId.get(club.id);

      return {
        id: club.id,
        name: club.name,
        membersCount: club.membersCount,
        eventsCount: club.eventsCount,
        courtCount: club.courtCount,
        subscriptionStatus: subscription?.status,
        subscriptionExpiresAt: subscription?.expiresAt ?? null,
      };
    });
  }

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
  } = useManageClubState(isSidebarDataLoading ? [] : clubsWithSubscriptionStatus);

  const { data: staffData, isLoading: staffLoading } = useClubStaff(
    isSidebarDataLoading ? null : effectiveClubId
  );
  const isInitialClubDetailLoading =
    !isSidebarDataLoading &&
    effectiveClubId !== null &&
    staffLoading &&
    staffData === undefined;
  const updateClubSubscription = useUpdateClubSubscription(effectiveClubId);

  const clubsWithResolvedSubscription = useMemo(() => {
    if (!hasSuperAdminAccess || !effectiveClubId || !staffData?.subscription) {
      return clubsWithSubscriptionStatus;
    }

    const resolvedStatus = deriveSubscriptionStatus(
      staffData.subscription.plan,
      staffData.subscription.expiresAt
    );

    return clubsWithSubscriptionStatus.map((club) => {
      if (club.id !== effectiveClubId) {
        return club;
      }

      return {
        ...club,
        subscriptionStatus: resolvedStatus,
        subscriptionExpiresAt:
          staffData.subscription.plan === "premium"
            ? staffData.subscription.expiresAt
            : null,
      };
    });
  }, [
    clubsWithSubscriptionStatus,
    effectiveClubId,
    hasSuperAdminAccess,
    staffData?.subscription,
  ]);

  const visibleClubs = useMemo(() => {
    if (!hasSuperAdminAccess || statusFilter === "all") {
      return clubsWithResolvedSubscription;
    }

    return clubsWithResolvedSubscription.filter(
      (club) => (club.subscriptionStatus ?? "nothing") === statusFilter
    );
  }, [clubsWithResolvedSubscription, hasSuperAdminAccess, statusFilter]);
  const staff = staffData?.staff ?? [];
  const existingStaffIds = staff.map((s) => s.id);
  const showSubscriptionBanner = shouldShowSubscriptionBanner(staffData?.subscription);
  const showPremiumBanner =
    hasSuperAdminAccess && staffData?.subscription?.plan === "premium";
  const canAddStaff =
    staffData != null && staffData.subscription?.plan !== "free";
  const isClubAdminOrOrganiserOnly =
    user?.role === ROLES.CLUB_ADMIN || user?.role === ROLES.ORGANISER;

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

  const handleRequestSubscriptionRenewal = async (_selectedExpiryDate: Date) => {
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
        {isSidebarDataLoading ? (
          <>
            <SidebarSkeleton />
            <main className="flex-1">
              <MainContentSkeleton />
            </main>
          </>
        ) : (
          <>
            <ManageClubSidebar
              clubs={visibleClubs}
              clubsLoading={false}
              effectiveClubId={effectiveClubId}
              mobileView={mobileView}
              isSuperAdminView={hasSuperAdminAccess}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
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
              ) : isInitialClubDetailLoading ? (
                <MainContentSkeleton />
              ) : (
                <>
                  <div className="rounded-[12px] border border-black/8 bg-white px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] lg:px-3 lg:py-5">
                    <ManageClubHeader
                      selectedClub={selectedClub}
                      showClubCrown={staffData?.subscription?.plan === "premium"}
                      canUpdateExpiry={hasSuperAdminAccess}
                      canAddStaff={canAddStaff}
                      onOpenExpiryModal={openPremiumExpiryModal}
                      onOpenAddModal={() => setAddModalOpen(true)}
                    />

                    <ManageClubStaffSection
                      staff={staff}
                      staffLoading={staffLoading}
                      canAddStaff={canAddStaff}
                      onOpenAddModal={() => setAddModalOpen(true)}
                    />

                    <ManageClubSubscriptionBanners
                      roleMode={
                        hasSuperAdminAccess
                          ? "super_admin"
                          : "club_admin_or_organiser"
                      }
                      showPremiumBanner={showPremiumBanner}
                      showSubscriptionBanner={showSubscriptionBanner}
                      subscription={staffData?.subscription}
                      onRenew={openPremiumExpiryModal}
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
          </>
        )}
      </div>

      <AddAdminOrganiserModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        clubId={effectiveClubId ?? ""}
        existingStaffIds={existingStaffIds}
      />

      {isClubAdminOrOrganiserOnly ? (
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
