import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Suspense, lazy, useState } from "react";
import { ShareTextButton } from "@/components/shared/ShareTextButton";
import { ChevronLeft, PencilEdit01Icon, Upload01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { shareDataWithUrlInText } from "@/lib/webShare";
import { useAuth, useRequireAuth } from "@/pages/auth/hooks";
import { TournamentDetailsPageSkeleton } from "@/pages/tournaments/components/TournamentDetailsLoadingSkeletons";
import { TournamentDetailsTabs } from "@/pages/tournaments/components/details-tabs/TournamentDetailsTabs";
import { resolveTournamentDetailsTab } from "@/pages/tournaments/components/details-tabs/tabConfig";
import {
  useTournamentById,
  useJoinTournament,
  useLeaveTournament,
  useUpdateTournament,
} from "@/pages/tournaments/hooks";
import { getErrorMessage, isUnauthorizedError } from "@/lib/errors";
import { getSafeLink } from "@/lib/url";
import type { TournamentSponsor } from "@/models/tournament/types";
import type { TFunction } from "i18next";
import { toast } from "sonner";

const CreateTournamentModal = lazy(() =>
  import("@/pages/tournaments/components/CreateTournamentModal").then((mod) => ({
    default: mod.CreateTournamentModal,
  })),
);

function TournamentHeaderSponsorLogo({
  sponsor,
  websiteUrl,
  t,
}: {
  sponsor: TournamentSponsor;
  websiteUrl: string | null;
  t: TFunction;
}) {
  const logoBoxClass =
    "flex h-[45px] w-[45px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-[2.5px] border-white bg-[#d9d9d9] shadow-[0_2px_3px_rgba(143,143,143,0.1),0_6px_6px_rgba(143,143,143,0.09)]";

  const inner = sponsor.logoUrl ? (
    <img src={sponsor.logoUrl} alt={sponsor.name} className="h-full w-full object-cover" />
  ) : (
    <span className="px-1 text-center text-[11px] font-semibold leading-tight text-[#6b7280]">
      {sponsor.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word: string) => word.charAt(0).toUpperCase())
        .join("") || "?"}
    </span>
  );

  if (websiteUrl) {
    return (
      <a
        href={websiteUrl}
        target="_blank"
        rel="noreferrer noopener"
        className={`${logoBoxClass} outline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a9f43]`}
        aria-label={t("tournaments.openSponsorWebsite", { name: sponsor.name })}
      >
        {inner}
      </a>
    );
  }

  return <div className={logoBoxClass}>{inner}</div>;
}

export default function TournamentDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [showLeaveWoConfirm, setShowLeaveWoConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const joinTournament = useJoinTournament();
  const leaveTournament = useLeaveTournament();
  const updateTournament = useUpdateTournament();

  const { data, isLoading, isError, error } = useTournamentById(id ?? null, Boolean(id));

  if (!id) return <Navigate to="/tournaments" replace />;

  if (isLoading) {
    return (
      <TournamentDetailsPageSkeleton
        activeTab={resolveTournamentDetailsTab(searchParams.get("tab"), t)}
      />
    );
  }

  if (isError || !data?.tournament) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">{t("tournaments.tournamentNotFound")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {getErrorMessage(error) ?? t("tournaments.failedToLoadDetails")}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/tournaments">{t("tournaments.goBack")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const tournament = data.tournament;
  const tournamentLogoUrl = tournament.logoUrl?.trim() ?? "";
  const sponsorWebsiteUrl = tournament.sponsor ? getSafeLink(tournament.sponsor.link) : null;
  const canEditTournament = tournament.permissions.canEdit;
  const onParticipationAction = async () => {
    if (!requireAuth()) return;

    const isParticipant = tournament.permissions.isParticipant;

    try {
      if (isParticipant) {
        await leaveTournament.mutateAsync({ id: tournament.id });
        toast.success(t("tournaments.left"));
      } else {
        await joinTournament.mutateAsync({ id: tournament.id });
        toast.success(t("tournaments.joined"));
      }
    } catch (participationError: unknown) {
      if (isUnauthorizedError(participationError)) {
        requireAuth();
        return;
      }
      const normalizedMessage = getErrorMessage(participationError);
      if (isParticipant && normalizedMessage === "LEAVE_CONFIRM_WO_REQUIRED") {
        setShowLeaveWoConfirm(true);
        return;
      }
      toast.error(
        normalizedMessage ??
          (isParticipant ? t("tournaments.leaveError") : t("tournaments.joinError"))
      );
    }
  };

  const confirmLeaveWithWalkover = async () => {
    if (!requireAuth()) return;

    try {
      await leaveTournament.mutateAsync({
        id: tournament.id,
        confirmLeaveWithWalkover: true,
      });
      setShowLeaveWoConfirm(false);
      toast.success(t("tournaments.left"));
    } catch (error: unknown) {
      if (isUnauthorizedError(error)) {
        requireAuth();
        return;
      }
      toast.error(getErrorMessage(error) ?? t("tournaments.leaveError"));
    }
  };

  const onPublish = async () => {
    try {
      await updateTournament.mutateAsync({
        id: tournament.id,
        data: { status: "active" },
      });
      toast.success(t("tournaments.published"));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  };

  const onShare = async () => {
    const url = window.location.href;
    const shareData = shareDataWithUrlInText({
      textBeforeUrl: tournament.descriptionInfo?.trim() || tournament.name,
      url,
    });
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        // Fall back to clipboard when share is unavailable or fails.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("tournaments.linkCopied"));
    } catch {
      toast.error(t("tournaments.shareError"));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center bg-[#f8fbf8]">
      <div className="w-full max-w-6xl px-5 pb-10 pt-7 sm:px-6 sm:pt-8 lg:px-6">
        <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-3 sm:mb-7">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group h-auto w-fit gap-1.5 px-1 text-[14px] font-medium text-[#010a04]/70 hover:bg-transparent hover:text-[#010a04]"
          >
            <Link
              to={
                tournament.status === "draft"
                  ? "/tournaments?view=drafts"
                  : "/tournaments"
              }
            >
              <ChevronLeft size={16} className="text-[#010a04]/70 group-hover:text-[#010a04]" />
              {t("tournaments.goBack")}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {tournament.status === "draft" && tournament.permissions.canEdit && (
              <Button
                variant="brand"
                size="sm"
                onClick={onPublish}
                disabled={updateTournament.isPending}
                className="h-9 px-3 text-[13px]"
              >
                <Upload01Icon size={15} className="mr-1 text-white" />
                {t("tournaments.publish")}
              </Button>
            )}
            <ShareTextButton label={t("tournaments.share")} onClick={onShare} />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-3 sm:gap-6 sm:pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full min-w-0 flex-1 items-center justify-between gap-4 sm:gap-5">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#e4dbcc]">
                <img
                  src={tournamentLogoUrl || "/tennis-ball.png"}
                  alt={tournament.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="truncate text-[20px] font-semibold leading-[1.2] text-[#010a04] sm:text-[26px] lg:text-[34px]">
                {tournament.name}
              </h1>
            </div>
            
            {canEditTournament && (
              <Button
                type="button"
                variant="brand"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="h-8 shrink-0 gap-1.5 px-3 text-[13px]"
              >
                <PencilEdit01Icon size={14} className="text-white" />
                {t("tournaments.editInfo")}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
            {tournament.sponsor ? (
              <div className="flex min-w-0 items-center gap-[10px]">
                <p className="text-[14px] font-normal text-[#010a04]/60">{t("tournaments.sponsoredBy")}:</p>
                <TournamentHeaderSponsorLogo
                  sponsor={tournament.sponsor}
                  websiteUrl={sponsorWebsiteUrl}
                  t={t}
                />
              </div>
            ) : null}
          </div>
        </div>

        <TournamentDetailsTabs
          tournament={tournament}
          currentUserId={user?.id ?? null}
          onParticipationAction={onParticipationAction}
          onRequireAuth={requireAuth}
        />

        {showEditModal ? (
          <Suspense fallback={null}>
            <CreateTournamentModal
              open={showEditModal}
              onOpenChange={setShowEditModal}
              mode="edit"
              tournamentId={tournament.id}
            />
          </Suspense>
        ) : null}

        <AlertDialog open={showLeaveWoConfirm} onOpenChange={setShowLeaveWoConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("tournaments.leaveWithUnfinishedMatchesConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("tournaments.leaveWithUnfinishedMatchesConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={leaveTournament.isPending}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void confirmLeaveWithWalkover();
                }}
                disabled={leaveTournament.isPending}
              >
                {leaveTournament.isPending
                  ? t("common.loading")
                  : t("tournaments.leaveWithUnfinishedMatchesConfirmAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
