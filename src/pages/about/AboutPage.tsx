import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trans } from "react-i18next";

const GLICKMAN_URL = "https://datascience.harvard.edu/directory/mark-glickman/";
const GLICKO_WIKI_URL = "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div
      className="py-6 sm:py-8 px-4 sm:px-6 min-h-full"
      style={{
        backgroundColor: "#f9fafb",
        backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)",
      }}
    >
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
            {t("about.title")}
          </h1>

          <section className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">
              {t("about.allowsYouTo")}
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground text-sm sm:text-base">
              {(["1", "2", "3", "4"] as const).map((key) => (
                <li key={key}>{t(`about.allowsYouToItem${key}`)}</li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">
              {t("about.howToUse")}
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground text-sm sm:text-base">
              {(["1", "2", "3", "4", "5", "6"] as const).map((key) => (
                <li key={key}>
                  {key === "6" ? (
                    <Trans
                      i18nKey="about.howToUseItem6"
                      components={{
                        link: <a href="#contact" className="text-blue-600 hover:underline" aria-label={t("about.contactUs")} />
                      }}
                    />
                  ) : (
                    t(`about.howToUseItem${key}`)
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-base font-bold text-foreground mb-3">
              {t("about.glicko2Title")}
            </h2>
            <p className="text-foreground text-sm sm:text-base mb-3">
              {t("about.glicko2Paragraph")}
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-foreground text-sm sm:text-base mb-3">
              <li>{t("about.glicko2Credit1")}</li>
              <li>{t("about.glicko2Credit2")}</li>
            </ol>
            <div className="flex flex-col gap-1">
              <a
                href={GLICKMAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {GLICKMAN_URL}
              </a>
              <a
                href={GLICKO_WIKI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {GLICKO_WIKI_URL}
              </a>
            </div>
          </section>

          <section id="contact">
            <h2 className="text-base font-bold text-foreground mb-4">
              {t("about.otherInformation")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {/* TODO: replace /profile with actual route when Contact/Invite pages are added */}
              <Button
                asChild
                className="bg-brand-accent text-[#1a1a1a] hover:bg-brand-accent-hover rounded-md"
              >
                <Link to="/profile">{t("about.contactUs")}</Link>
              </Button>
              <Button
                asChild
                className="bg-brand-accent text-[#1a1a1a] hover:bg-brand-accent-hover rounded-md"
              >
                <Link to="/profile">{t("about.inviteFriends")}</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
