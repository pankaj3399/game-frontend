import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Share2 } from "@/icons/figma-icons";
import { Upload01Icon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import InlineLoader from "@/components/shared/InlineLoader";
import { useAuth } from "@/pages/auth/hooks";
import { TournamentDetailsTabs } from "@/pages/tournaments/components/details-tabs/TournamentDetailsTabs";
import {
  useTournamentById,
  useJoinTournament,
  usePublishTournament,
} from "@/pages/tournaments/hooks/tournament";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export default function TournamentDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const joinTournament = useJoinTournament();
  const publishTournament = usePublishTournament();

  const { data, isLoading, isError, error } = useTournamentById(id ?? null, Boolean(id));

  if (!id) return <Navigate to="/tournaments" replace />;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
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
  const onJoin = async () => {
    try {
      await joinTournament.mutateAsync({ id: tournament.id });
      toast.success(t("tournaments.joined"));
    } catch (joinError: unknown) {
      toast.error(getErrorMessage(joinError) ?? t("tournaments.joinError"));
    }
  };

  const onPublish = async () => {
    try {
      await publishTournament.mutateAsync({
        id: tournament.id,
        data: {},
      });
      toast.success(t("tournaments.published"));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) ?? t("tournaments.publishError"));
    }
  };

  const onShare = async () => {
    const shareData = {
      title: tournament.name,
      text: tournament.descriptionInfo || tournament.name,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall back to clipboard when share is aborted/unavailable.
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("tournaments.linkCopied"));
    } catch {
      toast.error(t("tournaments.shareError"));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbf8]">
      <div className="mx-auto w-full max-w-[1040px] px-5 pb-10 pt-7 sm:px-6 sm:pt-8 lg:px-6">
        <div className="mb-6 flex items-center justify-between sm:mb-7">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group h-auto gap-1.5 px-1 text-[14px] font-medium text-[#010a04]/70 hover:bg-transparent hover:text-[#010a04]"
          >
            <Link to="/tournaments">
              <ChevronLeft size={16} className="text-[#010a04]/70 group-hover:text-[#010a04]" />
              {t("tournaments.goBack")}
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {tournament.status === "draft" && tournament.permissions.canEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={onPublish}
                disabled={publishTournament.isPending}
                className="h-9 bg-[#067429] px-3 text-[13px] hover:bg-[#055b20]"
              >
                <Upload01Icon size={15} className="mr-1" />
                {t("tournaments.publish")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="group inline-flex h-auto gap-1.5 rounded-md px-2 py-1 text-[14px] font-medium text-[#010a04] transition-[background-color,transform] duration-200 ease-out hover:bg-[#010a04]/[0.07] hover:text-[#010a04] active:bg-[#010a04]/[0.1]"
            >
              <Share2
                size={16}
                className="text-[#010a04] transition-transform duration-200 ease-out group-hover:scale-[1.05]"
              />
              {t("tournaments.share")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-6 sm:gap-6 sm:pb-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[#e4dbcc]">
              <img src="/tennis-ball.png" alt="" className="h-full w-full object-cover" />
            </div>
            <h1 className="truncate text-[20px] font-semibold leading-[1.2] text-[#010a04] sm:text-[26px] lg:text-[34px]">
              {tournament.name}
            </h1>
          </div>

          {tournament.sponsor ? (
            <div className="flex flex-wrap items-center gap-3 self-start pt-0.5 sm:pt-1">
              <p className="text-[14px] font-normal text-[#010a04]/60">{t("tournaments.sponsoredBy")}:</p>
              <div className="flex min-w-0 items-center gap-[10px]">
                <div className="flex h-[45px] w-[45px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-[2.5px] border-white bg-[#d9d9d9] shadow-[0_2px_3px_rgba(143,143,143,0.1),0_6px_6px_rgba(143,143,143,0.09)]">
                  {tournament.sponsor.logoUrl ? (
                    <img
                      src={tournament.sponsor.logoUrl}
                      alt={tournament.sponsor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-1 text-center text-[11px] font-semibold leading-tight text-[#6b7280]">
                      {tournament.sponsor.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word.charAt(0).toUpperCase())
                        .join("") || "?"}
                    </span>
                  )}
                </div>
                <span className="truncate text-[14px] font-medium text-[#010a04]">{tournament.sponsor.name}</span>
              </div>
            </div>
          ) : null}
        </div>

        <TournamentDetailsTabs
          tournament={tournament}
          currentUserId={user?.id ?? null}
          onJoin={onJoin}
          isJoinPending={joinTournament.isPending}
        />
      </div>
    </div>
  );
}
