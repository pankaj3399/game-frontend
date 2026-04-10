import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { EditTournamentInfoModal } from "./EditTournamentInfoModal";
import { ClubInfo } from "./info-tab/ClubInfo";
import { DescriptionSection } from "./info-tab/DescriptionSection";
import { FoodSection } from "./info-tab/FoodSection";
import { PlayersList } from "./info-tab/PlayersList";
import { Sidebar } from "./info-tab/Sidebar";
import { TournamentMeta } from "./info-tab/TournamentMeta";
import { useExpandable } from "./info-tab/useExpandable";
import { useTournamentInfo } from "./info-tab/useTournamentInfo";

interface InfoTabProps {
  tournament: TournamentDetail;
  onParticipationAction: () => Promise<void>;
  isParticipationPending: boolean;
}

export function InfoTab({
  tournament,
  onParticipationAction,
  isParticipationPending,
}: InfoTabProps) {
  const { t, i18n } = useTranslation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const descriptionExpansion = useExpandable(true);
  const playersExpansion = useExpandable(true);
  const {
    expanded: isDescriptionExpanded,
    toggle: toggleDescriptionExpanded,
  } = descriptionExpansion;
  const {
    expanded: isPlayersExpanded,
    toggle: togglePlayersExpanded,
  } = playersExpansion;

  const {
    feeText,
    foodInfoTrimmed,
    hasFoodInfo,
    hasDescription,
    descriptionDisplay,
    isDescriptionCollapsible,
    hasParticipants,
    participantSummary,
    isPlayersCollapsible,
    spotPercentage,
    formattedDate,
    formattedTime,
  } = useTournamentInfo({
    tournament,
    t,
    language: i18n.language,
    isDescriptionExpanded,
  });

  const club = tournament.club;

  return (
    <TabsContent value="info" className="mt-6 sm:mt-[30px]">
      <div className="grid gap-7 xl:grid-cols-[577px_368px] xl:items-start xl:justify-center xl:gap-12">
        <div className="order-2 min-w-0 xl:order-1">
          <section className="border-b border-[#dddddd] pb-[25px] sm:pb-[30px]">
            <DescriptionSection
              title={t("tournaments.info")}
              descriptionDisplay={descriptionDisplay}
              hasDescription={hasDescription}
              isCollapsible={isDescriptionCollapsible}
              isExpanded={isDescriptionExpanded}
              onToggle={toggleDescriptionExpanded}
              t={t}
            />

            <ClubInfo
              clubName={club?.name ?? t("tournaments.unknownClub")}
              canEdit={tournament.permissions.canEdit}
              onEdit={() => setIsEditModalOpen(true)}
              onGetDirection={
                club
                  ? () => {
                      const userAgent = navigator.userAgent;
                      const isIOS =
                        /iPad|iPhone|iPod/i.test(userAgent) ||
                        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
                      const locationParts = [club.name, club.address]
                        .map((part) => part?.trim())
                        .filter((part): part is string => Boolean(part));
                      const q = encodeURIComponent(locationParts.join(", "));
                      const mapsUrl = isIOS
                        ? `https://maps.apple.com/?q=${q}`
                        : `https://www.google.com/maps/search/?api=1&query=${q}`;
                      window.open(
                        mapsUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }
                  : undefined
              }
              t={t}
            />

            <TournamentMeta
              tournament={tournament}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              feeText={feeText}
              t={t}
            />
          </section>

          <FoodSection hasFoodInfo={hasFoodInfo} foodInfoTrimmed={foodInfoTrimmed} t={t} />

          <PlayersList
            participants={tournament.participants}
            participantSummary={participantSummary}
            hasParticipants={hasParticipants}
            isPlayersCollapsible={isPlayersCollapsible}
            isPlayersListExpanded={isPlayersExpanded}
            onToggle={togglePlayersExpanded}
            t={t}
          />
        </div>

        <Sidebar
          className="order-1 xl:order-2"
          tournament={tournament}
          spotPercentage={spotPercentage}
          onParticipationAction={onParticipationAction}
          isParticipationPending={isParticipationPending}
          onEdit={() => setIsEditModalOpen(true)}
          t={t}
        />
      </div>

      {tournament.status === "draft" ? (
        <CreateTournamentModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          mode="edit"
          tournamentId={tournament.id}
        />
      ) : (
        <EditTournamentInfoModal
          key={tournament.id}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          tournament={tournament}
        />
      )}
    </TabsContent>
  );
}
