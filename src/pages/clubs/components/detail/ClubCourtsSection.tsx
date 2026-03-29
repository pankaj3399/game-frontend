import { useTranslation } from "react-i18next";
import type { ClubPublic } from "@/pages/clubs/hooks";

type CourtGroup = ClubPublic["courts"][number];
type KnownCourtType = "concrete" | "clay" | "hard" | "grass" | "carpet" | "other";

const COURT_TYPE_TRANSLATION_KEYS: Record<KnownCourtType, string> = {
  concrete: "clubs.courtTypeConcrete",
  clay: "clubs.courtTypeClay",
  hard: "clubs.courtTypeHard",
  grass: "clubs.courtTypeGrass",
  carpet: "clubs.courtTypeCarpet",
  other: "clubs.courtTypeOther",
};

function isKnownCourtType(surface: string): surface is KnownCourtType {
  return surface in COURT_TYPE_TRANSLATION_KEYS;
}

function getCourtSurfaceLabel(surface: string, t: (key: string) => string): string {
  const normalizedSurface = surface.trim().toLowerCase();
  if (isKnownCourtType(normalizedSurface)) {
    return t(COURT_TYPE_TRANSLATION_KEYS[normalizedSurface]);
  }
  return surface;
}

interface ClubCourtsSectionProps {
  courts: CourtGroup[];
}

export function ClubCourtsSection({ courts }: ClubCourtsSectionProps) {
  const { t } = useTranslation();

  if (courts.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("clubs.courts")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {courts.map((court, index) => (
          <div
            key={`${court.placement}-${court.surface}-${index}`}
            className="rounded-xl border border-border bg-white p-4"
          >
            <p className="font-semibold text-foreground">
              {court.placement === "outdoor"
                ? t("clubs.outdoorCourts")
                : t("clubs.indoorCourts")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("clubs.courtsCountSurface", {
                count: court.count,
                surface: getCourtSurfaceLabel(court.surface, t),
              })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
