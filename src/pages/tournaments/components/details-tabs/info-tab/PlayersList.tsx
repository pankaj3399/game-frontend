import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { PlayerNameText } from "@/components/shared/PlayerNameText";
import { ChevronDown, ChevronUp, UserCircle2 } from "@/icons/figma-icons";
import { useAuth } from "@/pages/auth/hooks";
import type { TournamentParticipant, TournamentSchedulePairPlayer } from "@/models/tournament/types";
import { useDoublesPairs, useSaveDoublesPairs } from "@/pages/tournaments/hooks";
import { UI_LIMITS } from "./constants";

interface PlayersListProps {
  tournamentId: string;
  participants: TournamentParticipant[];
  participantSummary: string;
  hasParticipants: boolean;
  isPlayersCollapsible: boolean;
  isPlayersListExpanded: boolean;
  canEditPairs: boolean;
  isCurrentUserParticipant: boolean;
  onToggle: () => void;
  t: TFunction;
}

type DoublesPartnerById = Record<string, string>;

function sanitizeDoublesPartnerById(
  partnerById: DoublesPartnerById,
  participants: TournamentParticipant[]
): DoublesPartnerById {
  const validIds = new Set(participants.map((participant) => participant.id));
  const next: DoublesPartnerById = {};

  for (const participant of participants) {
    const partnerId = partnerById[participant.id];
    if (!partnerId || !validIds.has(partnerId) || partnerId === participant.id) {
      continue;
    }
    if (partnerById[partnerId] !== participant.id) {
      continue;
    }
    next[participant.id] = partnerId;
  }

  return next;
}

function asPairPlayer(participant: TournamentParticipant): TournamentSchedulePairPlayer {
  return {
    id: participant.id,
    name: participant.name,
    alias: participant.alias,
    skillLabel: "",
    rating: 0,
  };
}

function buildDoublesPairsResponse(
  participants: TournamentParticipant[],
  partnerById: DoublesPartnerById
) {
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const used = new Set<string>();
  const teams: Array<{ team: number; players: [TournamentSchedulePairPlayer, TournamentSchedulePairPlayer] }> = [];
  const unpaired: TournamentSchedulePairPlayer[] = [];

  let teamNo = 1;
  for (const participant of participants) {
    if (used.has(participant.id)) {
      continue;
    }

    const partnerId = partnerById[participant.id];
    const partner = partnerId ? byId.get(partnerId) : undefined;
    if (partner && !used.has(partner.id) && partnerById[partner.id] === participant.id) {
      teams.push({
        team: teamNo,
        players: [asPairPlayer(participant), asPairPlayer(partner)],
      });
      teamNo += 1;
      used.add(participant.id);
      used.add(partner.id);
      continue;
    }

    used.add(participant.id);
    unpaired.push(asPairPlayer(participant));
  }

  return { teams, unpaired };
}

function getPlayersContent({
  participants,
  participantSummary,
  hasParticipants,
  isPlayersCollapsible,
  isPlayersListExpanded,
  safePartnerById,
  currentUserId,
  onTogglePartner,
  t,
}: Omit<
  PlayersListProps,
  "onToggle" | "tournamentId" | "canEditPairs" | "isCurrentUserParticipant"
> & {
  safePartnerById: DoublesPartnerById | undefined;
  currentUserId: string | null;
  onTogglePartner: (participantId: string) => Promise<void>;
}): ReactNode {
  const partnerById = safePartnerById ?? {};

  if (!hasParticipants) {
    return <p className="text-[14px] text-[#010a04]/60">{t("tournaments.noPlayersYet")}</p>;
  }

  if (isPlayersListExpanded || !isPlayersCollapsible) {
    return (
      <div className="grid grid-cols-2 gap-[10px] sm:gap-[14px]">
        {participants.map((participant) => {
          const nameTrimmed = participant.name?.trim() ?? "";
          const aliasTrimmed = participant.alias?.trim() ?? "";
          const isPaired = Boolean(partnerById[participant.id]);
          const isCurrentUser = currentUserId === participant.id;
          const partnerId = partnerById[participant.id];
          const partner = partnerId
            ? participants.find((item) => item.id === partnerId) ?? null
            : null;
          const partnerName = partner
            ? partner.alias?.trim() || partner.name?.trim() || t("tournaments.unknownPlayer")
            : null;
          const displayName = nameTrimmed || aliasTrimmed || t("tournaments.unknownPlayer");
          const subtitleText = partnerName
            ? `${displayName} / ${partnerName}`
            : aliasTrimmed || t("tournaments.participantNoAlias");

          return (
            <button
              key={participant.id}
              type="button"
              onClick={() => {
                void onTogglePartner(participant.id);
              }}
              className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-2.5 text-left transition-colors sm:gap-5 sm:px-[15px] sm:py-3 ${
                isPaired
                  ? "border-[#067429]/45 bg-[#0a6925]/15"
                  : isCurrentUser
                    ? "border-[#067429]/20 bg-[#f2fbf4] hover:bg-[#e4f7e9]"
                    : "border-[#010a04]/[0.08] bg-white hover:bg-[#f3f4f6]"
              }`}
              aria-label={t("tournaments.scheduleDoublesSelectParticipant", { name: displayName })}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border-[1.5px] border-[#010a04] bg-[#dddddd]/60 sm:h-10 sm:w-10">
                <UserCircle2 size={30} className="text-[#010a04]" />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <PlayerNameText
                    name={displayName}
                    className="text-[14px] leading-5 sm:text-[16px]"
                    focusable={false}
                  />
                  {isCurrentUser ? (
                    <span className="rounded-[6px] border border-[#010a04]/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#010a04]/70">
                      {t("tournaments.scheduleDoublesYou")}
                    </span>
                  ) : null}
                </div>
                <PlayerNameText
                  name={subtitleText}
                  className="text-[14px] leading-[18px] text-[#6a6a6a]"
                  focusable
                />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const preview = participantSummary.slice(0, UI_LIMITS.DESCRIPTION_PREVIEW);
  return (
    <p className="text-[14px] leading-5 text-[#010a04]">
      {participantSummary.length > UI_LIMITS.DESCRIPTION_PREVIEW ? `${preview}…` : preview}
    </p>
  );
}

export function PlayersList({
  tournamentId,
  participants,
  participantSummary,
  hasParticipants,
  isPlayersCollapsible,
  isPlayersListExpanded,
  canEditPairs,
  isCurrentUserParticipant,
  onToggle,
  t,
}: PlayersListProps) {
  const { user } = useAuth();
  const doublesPairsQuery = useDoublesPairs(tournamentId, true);
  const saveDoublesPairsMutation = useSaveDoublesPairs();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const id = useId();
  const headingId = `${id}-heading`;
  const contentId = `${id}-content`;

  const safePartnerById = useMemo(
    () => {
      const doublesPairs = doublesPairsQuery.data?.doublesPairs;

      if (doublesPairs == null) {
        return undefined;
      }

      return sanitizeDoublesPartnerById(doublesPairs, participants);
    },
    [doublesPairsQuery.data?.doublesPairs, participants]
  );

  useEffect(() => {
    if (selectedParticipantId && !participants.some((participant) => participant.id === selectedParticipantId)) {
      setSelectedParticipantId(null);
    }
  }, [participants, selectedParticipantId]);

  const pairsPreview = useMemo(
    () => buildDoublesPairsResponse(participants, safePartnerById ?? {}),
    [participants, safePartnerById]
  );

  const persistPartnerById = async (next: DoublesPartnerById) => {
    if (safePartnerById == null) {
      throw new Error("Doubles pairs are still loading");
    }

    await saveDoublesPairsMutation.mutateAsync({
      id: tournamentId,
      payload: { doublesPairs: next },
    });
  };

  const onTogglePartner = async (participantId: string) => {
    if (saveDoublesPairsMutation.isPending) {
      return;
    }

    const partnerById = safePartnerById ?? {};
    const clickedParticipant = participants.find((participant) => participant.id === participantId);
    if (!clickedParticipant) {
      return;
    }
    const clickedParticipantName =
      clickedParticipant.alias?.trim() || clickedParticipant.name?.trim() || t("tournaments.unknownPlayer");

    if (canEditPairs && !isCurrentUserParticipant) {
      const next = { ...partnerById };
      const currentPartnerId = next[participantId];

      if (selectedParticipantId == null) {
        if (currentPartnerId) {
          delete next[participantId];
          delete next[currentPartnerId];
          try {
            await persistPartnerById(next);
            setSelectedParticipantId(null);
            toast.success(t("tournaments.scheduleDoublesPairDismissed"));
          } catch {
            setSelectedParticipantId(null);
            toast.error(t("tournaments.scheduleDoublesSaveFailed"));
          }
          return;
        }
        setSelectedParticipantId(participantId);
        toast.info(t("tournaments.scheduleDoublesSelectParticipant", { name: clickedParticipantName }));
        return;
      }

      if (selectedParticipantId === participantId) {
        setSelectedParticipantId(null);
        return;
      }

      const selectedExistingPartner = next[selectedParticipantId];
      if (selectedExistingPartner) {
        delete next[selectedParticipantId];
        delete next[selectedExistingPartner];
      }
      const clickedExistingPartner = next[participantId];
      if (clickedExistingPartner) {
        delete next[participantId];
        delete next[clickedExistingPartner];
      }

      next[selectedParticipantId] = participantId;
      next[participantId] = selectedParticipantId;
      try {
        await persistPartnerById(next);
        setSelectedParticipantId(null);
        toast.success(t("tournaments.scheduleDoublesPairCreated"));
      } catch {
        setSelectedParticipantId(null);
        toast.error(t("tournaments.scheduleDoublesSaveFailed"));
      }
      return;
    }

    const currentUserId = user?.id ?? null;
    if (!currentUserId) {
      toast.error(t("tournaments.scheduleDoublesNoCurrentUser"));
      return;
    }

    const meExists = participants.some((participant) => participant.id === currentUserId);
    if (!meExists) {
      toast.error(t("tournaments.scheduleDoublesCurrentUserNotParticipant"));
      return;
    }

    if (participantId === currentUserId) {
      const currentPartner = partnerById[currentUserId];
      if (!currentPartner) {
        return;
      }
      const next = { ...partnerById };
      delete next[currentUserId];
      delete next[currentPartner];
      try {
        await persistPartnerById(next);
        toast.success(t("tournaments.scheduleDoublesPairDismissed"));
      } catch {
        toast.error(t("tournaments.scheduleDoublesSaveFailed"));
      }
      return;
    }

    const currentPartnerId = partnerById[currentUserId];
    if (currentPartnerId && currentPartnerId !== participantId) {
      toast.error(t("tournaments.scheduleDoublesDismissCurrentPairFirst"));
      return;
    }
    const targetPartnerId = partnerById[participantId];
    if (targetPartnerId && targetPartnerId !== currentUserId) {
      toast.error(t("tournaments.scheduleDoublesTargetAlreadyPaired"));
      return;
    }

    const next = { ...partnerById };
    if (currentPartnerId === participantId && targetPartnerId === currentUserId) {
      delete next[currentUserId];
      delete next[participantId];
      try {
        await persistPartnerById(next);
        toast.success(t("tournaments.scheduleDoublesPairDismissed"));
      } catch {
        toast.error(t("tournaments.scheduleDoublesSaveFailed"));
      }
      return;
    }

    next[currentUserId] = participantId;
    next[participantId] = currentUserId;
    try {
      await persistPartnerById(next);
      toast.success(t("tournaments.scheduleDoublesPairCreated"));
    } catch {
      toast.error(t("tournaments.scheduleDoublesSaveFailed"));
    }
  };

  const playersContent = getPlayersContent({
    participants,
    participantSummary,
    hasParticipants,
    isPlayersCollapsible,
    isPlayersListExpanded,
    safePartnerById,
    currentUserId: user?.id ?? null,
    onTogglePartner,
    t,
  });

  return (
    <section className="py-4 sm:py-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold text-[#010a04]" id={headingId}>
          {t("tournaments.currentPlayers")}
        </h3>
        {isPlayersCollapsible ? (
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border border-[#010a04]/25 text-[#010a04] transition-colors hover:bg-[#010a04]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010a04]/25"
            aria-expanded={isPlayersListExpanded}
            aria-controls={contentId}
            aria-label={
              isPlayersListExpanded ? t("tournaments.collapsePlayerList") : t("tournaments.expandPlayerList")
            }
            onClick={onToggle}
          >
            {isPlayersListExpanded ? (
              <ChevronUp size={16} className="text-[#010a04]" aria-hidden />
            ) : (
              <ChevronDown size={16} className="text-[#010a04]" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <div id={contentId} aria-labelledby={headingId}>
        {playersContent}
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-[16px] font-semibold text-[#010a04]">
          {t("tournaments.schedulePairsTitle", { defaultValue: "Pairs" })}
        </h4>
        {pairsPreview.teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 sm:gap-[14px]">
            {pairsPreview.teams.map((team) => (
              <div
                key={`pair-${team.team}`}
                className="flex items-center gap-3 rounded-[12px] border border-[#067429]/45 bg-[#0a6925]/15 px-3 py-2.5 sm:gap-5 sm:px-[15px] sm:py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[20px] border-[1.5px] border-[#010a04] bg-[#dddddd]/60 sm:h-10 sm:w-10">
                  <UserCircle2 size={30} className="text-[#010a04]" />
                </div>
                <PlayerNameText
                  name={`${team.players[0]?.alias ?? team.players[0]?.name ?? t("tournaments.unknownPlayer")} / ${team.players[1]?.alias ?? team.players[1]?.name ?? t("tournaments.unknownPlayer")}`}
                  className="text-[14px] leading-5 text-[#010a04] sm:text-[16px]"
                  focusable
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-[#010a04]/60">
            {t("tournaments.scheduleNoPairsYet", { defaultValue: "No pairs selected yet." })}
          </p>
        )}
      </div>
    </section>
  );
}
