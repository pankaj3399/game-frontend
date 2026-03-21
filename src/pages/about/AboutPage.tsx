import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Trans } from "react-i18next";
import { toast } from "sonner";

const GLICKMAN_URL = "https://datascience.harvard.edu/directory/mark-glickman/";
const GLICKO_WIKI_URL = "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1";
const TB10_URL = "https://www.tiebreak10.eu";

export default function AboutPage() {
  const { t } = useTranslation();

  const handleInviteFriends = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "TB10",
          text: TB10_URL,
          url: TB10_URL,
        });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(TB10_URL);
        toast.success("Link copied");
        return;
      } catch {
        toast.error("Unable to copy the link");
      }
    }

    window.open(TB10_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-full bg-[#f8fbf8] px-5 pb-8 pt-[30px] sm:px-6 sm:pb-10 sm:pt-[45px]"
      style={{
        backgroundColor: "#f8fbf8",
      }}
    >
      <div className="mx-auto w-full max-w-[880px] min-w-0">
        <div className="rounded-[12px] border border-[#010a0414] bg-white p-5 shadow-[0_3px_15px_0_rgba(0,0,0,0.06)]">
          <h1 className="mb-5 text-[20px] font-semibold leading-[1] text-[#010a04]">
            {t("about.title")}
          </h1>

          <div className="flex flex-col gap-3 sm:gap-[15px]">
            <section className="rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] p-[15px] sm:p-[18px]">
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
              {t("about.allowsYouTo")}
              </h2>
              <ul className="list-disc pl-[21px] text-[14px] leading-[1.5] text-[#010a0499]">
              {(["1", "2", "3", "4"] as const).map((key) => (
                <li key={key}>{t(`about.allowsYouToItem${key}`)}</li>
              ))}
              </ul>
            </section>

            <section className="rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] p-[15px] sm:p-[18px]">
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
              {t("about.howToUse")}
              </h2>
              <ul className="list-disc pl-[21px] text-[14px] leading-[1.5] text-[#010a0499]">
              {(["1", "2", "3", "4", "5", "6"] as const).map((key) => (
                <li key={key}>
                  {key === "6" ? (
                    <Trans
                      i18nKey="about.howToUseItem6"
                      components={{
                        link: <a href="mailto:service.tb10@gmail.com" className="underline" aria-label={t("about.contactUs")} />
                      }}
                    />
                  ) : (
                    t(`about.howToUseItem${key}`)
                  )}
                </li>
              ))}
              </ul>
            </section>

            <section className="rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] p-[15px] sm:p-[18px]">
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
              {t("about.glicko2Title")}
              </h2>
              <div className="text-[14px] leading-[1.5] text-[#010a0499]">
                <ul className="mb-0 list-disc pl-[21px]">
                  <li>
              {t("about.glicko2Paragraph")}
                  </li>
                </ul>
                <p className="mt-1">1: {t("about.glicko2Credit1")}</p>
                <p className="mb-3">2: {t("about.glicko2Credit2")}</p>
                <div className="flex flex-col">
              <a
                href={GLICKMAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {GLICKMAN_URL}
              </a>
              <a
                href={GLICKO_WIKI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {GLICKO_WIKI_URL}
              </a>
                </div>
              </div>
            </section>

            <section id="contact" className="rounded-[10px] border border-[#e1e3e8] bg-[#f9fafc] p-[18px]">
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
              {t("about.otherInformation")}
              </h2>
              <div className="flex items-center gap-3">
              <Button
                asChild
                className="h-[30px] rounded-[8px] border border-[#010a041f] bg-brand-accent px-[15px] py-2 text-[12px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
              >
                <a href="mailto:service.tb10@gmail.com">{t("about.contactUs")}</a>
              </Button>
              <Button
                type="button"
                onClick={handleInviteFriends}
                className="h-[30px] rounded-[8px] border border-[#010a041f] bg-brand-accent px-[15px] py-2 text-[12px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
              >
                {t("about.inviteFriends")}
              </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
