import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Share2, Trophy } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon } from "@hugeicons/core-free-icons";
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
            <Link to="/tournaments">{t("tournaments.backToList")}</Link>
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
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="px-1 text-muted-foreground">
          <Link to="/tournaments">{t("tournaments.backToList")}</Link>
        </Button>
        <div className="flex items-center gap-2">
          {tournament.status === "draft" && tournament.permissions.canEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={onPublish}
              disabled={publishTournament.isPending}
              className="bg-brand-primary hover:bg-brand-primary-hover"
            >
              <HugeiconsIcon icon={Upload01Icon} size={16} className="mr-1" />
              {t("tournaments.publish")}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="size-4" />
            {t("tournaments.share")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[#e6e6e6] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ece7dd]">
              <Trophy className="size-6 text-[#8d867b]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#111827] sm:text-[2.125rem]">
                  {tournament.name}
                </h1>
                {tournament.status === "draft" && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-amber-800">
                    {t("tournaments.statusDraft")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <p className="text-sm text-[#6b7280]">{t("tournaments.sponsoredBy")}:</p>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#e5e7eb]">
                {tournament.sponsor?.logoUrl ? (
                  <img src={tournament.sponsor.logoUrl} alt={tournament.sponsor.name} className="h-full w-full" />
                ) : null}
              </div>
              <div className="h-10 w-10 rounded-md border border-[#e5e7eb] bg-[#e5e7eb]" />
            </div>
          </div>
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
