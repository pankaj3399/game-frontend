import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAdminClubs,
  useClubStaff,
  useRequestClubSubscriptionRenewal,
  useUpdateClubSubscription,
  useUpdateClubStaffRole,
  useSetClubMainAdmin,
  useRemoveClubStaff,
  type ClubStaffMember,
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
import { EditStaffRoleModal } from "@/pages/clubs/components/manage/EditStaffRoleModal";
import { RemoveStaffDialog } from "@/pages/clubs/components/manage/RemoveStaffDialog";
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
  const hasSuperAdminAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { user, isAuthenticated, isProfileComplete, loading } = useAuth();
  const {
    data: adminClubsData,
    isLoading: clubsLoading,
    isError: clubsError,
    isSuccess: clubsSuccess,
  } = useAdminClubs(true);
  const { data: clubSubscriptionsData, isLoading: subscriptionsLoading } =
    useClubSubscriptionsOverview(hasSuperAdminAccess);
  const isSidebarDataLoading =
    clubsLoading || (hasSuperAdminAccess && subscriptionsLoading);
  const [statusFilter, setStatusFilter] = useState<SidebarStatusFilter>("all");
  const [editingMember, setEditingMember] = useState<ClubStaffMember | null>(null);
  const [removingMember, setRemovingMember] = useState<ClubStaffMember | null>(null);
  const [requestRenewalModalOpen, setRequestRenewalModalOpen] = useState(false);

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
  const requestClubSubscriptionRenewal =
    useRequestClubSubscriptionRenewal(effectiveClubId);
  const updateClubSubscription = useUpdateClubSubscription(effectiveClubId);
  const updateClubStaffRole = useUpdateClubStaffRole();
  const setClubMainAdmin = useSetClubMainAdmin();
  const removeClubStaff = useRemoveClubStaff();

  let clubsWithResolvedSubscription: ManageClubSidebarClub[];
  if (!hasSuperAdminAccess || !effectiveClubId || !staffData?.subscription) {
    clubsWithResolvedSubscription = clubsWithSubscriptionStatus;
  } else {
    const resolvedStatus = deriveSubscriptionStatus(
      staffData.subscription.plan,
      staffData.subscription.expiresAt
    );

    clubsWithResolvedSubscription = clubsWithSubscriptionStatus.map((club) => {
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
  }

  const visibleClubs =
    !hasSuperAdminAccess || statusFilter === "all"
      ? clubsWithResolvedSubscription
      : clubsWithResolvedSubscription.filter(
          (club) => (club.subscriptionStatus ?? "nothing") === statusFilter
        );
  const staff = staffData?.staff ?? [];
  const currentMainAdminId =
    staff.find((member) => member.role === "default_admin")?.id ?? null;
  const canSetMainAdmin =
    hasSuperAdminAccess ||
    (user != null && currentMainAdminId != null && user.id === currentMainAdminId);
  const existingStaffIds = staff.map((s) => s.id);
  const showSubscriptionBanner = shouldShowSubscriptionBanner(staffData?.subscription);
  const showPremiumBanner =
    hasSuperAdminAccess && staffData?.subscription?.plan === "premium";
  const isRenewalRequested = staffData?.subscription?.renewalRequestedAt != null;
  const canAddStaff =
    staffData != null && staffData.subscription?.plan !== "free";
  const isClubAdminOrOrganiserOnly =
    !hasSuperAdminAccess;

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
    if (!hasSuperAdminAccess) {
      return;
    }

    setPremiumExpiryModalOpen(true);
  };

  const openRequestRenewalModal = () => {
    if (hasSuperAdminAccess) {
      return;
    }

    if (isRenewalRequested) {
      return;
    }

    setRequestRenewalModalOpen(true);
  };

  const handleRequestSubscriptionRenewal = async () => {
    try {
      await requestClubSubscriptionRenewal.mutateAsync();
      toast.success(t("manageClub.renewRequestSent"));
    } catch (error) {
      toast.error(getErrorMessage(error) || t("manageClub.renewRequestError"));
      throw error;
    }
  };

  const handleEditStaffRole = async (role: "admin" | "organiser") => {
    if (!effectiveClubId || !editingMember) {
      return;
    }

    try {
      await updateClubStaffRole.mutateAsync({
        clubId: effectiveClubId,
        staffId: editingMember.id,
        role,
      });

      toast.success(t("manageClub.editRoleSuccess"));
      setEditingMember(null);
    } catch (error) {
      toast.error(getErrorMessage(error) || t("manageClub.editRoleError"));
    }
  };

  const handleRemoveStaff = async () => {
    if (!effectiveClubId || !removingMember) {
      return;
    }

    try {
      await removeClubStaff.mutateAsync({
        clubId: effectiveClubId,
        staffId: removingMember.id,
      });

      toast.success(t("manageClub.removeMemberSuccess"));
      setRemovingMember(null);
    } catch (error) {
      toast.error(getErrorMessage(error) || t("manageClub.removeMemberError"));
    }
  };

  const handleSetMainAdmin = async (newMainAdminId: string) => {
    if (!effectiveClubId) {
      return false;
    }

    try {
      await setClubMainAdmin.mutateAsync({
        clubId: effectiveClubId,
        userId: newMainAdminId,
      });

      toast.success(t("manageClub.mainAdminUpdateSuccess"));
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || t("manageClub.mainAdminUpdateError"));
      return false;
    }
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
  if (
    !clubsLoading &&
    clubsSuccess &&
    !clubsError &&
    !hasSuperAdminAccess &&
    clubs.length === 0
  ) {
    return <Navigate to="/clubs" replace />;
  }

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
                      staffLoading={isInitialClubDetailLoading}
                      canAddStaff={canAddStaff}
                      canSetMainAdmin={canSetMainAdmin}
                      currentMainAdminId={currentMainAdminId}
                      onOpenAddModal={() => setAddModalOpen(true)}
                      onMainAdminChange={handleSetMainAdmin}
                      onMenuAction={(action, member) => {
                        if (action === "edit") {
                          setEditingMember(member);
                          return;
                        }

                        setRemovingMember(member);
                      }}
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
                      onRequestRenewal={openRequestRenewalModal}
                      isRenewalRequested={isRenewalRequested}
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

      <EditStaffRoleModal
        key={editingMember?.id ?? "edit-staff-role-closed"}
        open={editingMember !== null}
        member={editingMember}
        isSubmitting={updateClubStaffRole.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMember(null);
          }
        }}
        onConfirm={handleEditStaffRole}
      />

      <RemoveStaffDialog
        open={removingMember !== null}
        member={removingMember}
        isRemoving={removeClubStaff.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingMember(null);
          }
        }}
        onConfirm={handleRemoveStaff}
      />

      {isClubAdminOrOrganiserOnly && (
        <RequestSubscriptionRenewalModal
          open={requestRenewalModalOpen}
          onOpenChange={setRequestRenewalModalOpen}
          isSubmitting={requestClubSubscriptionRenewal.isPending}
          onConfirm={handleRequestSubscriptionRenewal}
        />
      )}

      {hasSuperAdminAccess && (
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
