
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GLICKMAN_URL = "https://datascience.harvard.edu/directory/mark-glickman/";
const GLICKO_WIKI_URL = "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1";
const ELO_WIKI_URL = "https://en.wikipedia.org/wiki/Arpad_Elo";
const TB10_URL = "https://www.tiebreak10.eu";

const footnoteClassName =
  "align-super text-[10px] font-semibold leading-none text-[#067429]";

export default function AboutPage() {
  const { t } = useTranslation();

  const handleInviteFriends = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t("about.inviteShareTitle"),
          text: t("about.inviteShareText"),
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
        toast.success(t("about.linkCopied"));
        return;
      } catch {
        toast.error(t("about.unableToCopyLink"));
      }
    }

    window.open(TB10_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-full bg-[#f8fbf8] px-5 pb-8 pt-[30px] sm:px-6 sm:pb-10 sm:pt-[45px]"
    >
      <div className="mx-auto w-full max-w-[880px] min-w-0">
        <div className="rounded-[12px] border border-[#010a0414] bg-white p-5 shadow-[0_3px_15px_0_rgba(0,0,0,0.06)]">
          <h1 className="sr-only text-[20px] font-semibold leading-[1] text-[#010a04] lg:not-sr-only lg:mb-5 lg:block">
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
                          link: (
                            <a
                              href="mailto:service.tb10@gmail.com"
                              className="underline"
                              aria-label={t("about.contactUs")}
                            />
                          ),
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
              <p className="text-[14px] leading-[1.5] text-[#010a0499]">
                <Trans
                  i18nKey="about.glicko2Paragraph"
                  components={{
                    sup: <sup className={footnoteClassName} />,
                  }}
                />
              </p>

              <h3 className="mt-4 text-[14px] font-medium leading-normal text-[#010a04]">
                {t("about.references")}
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-[21px] text-[14px] leading-[1.5] text-[#010a0499]">
                <li>{t("about.glicko2Credit1")}</li>
                <li>
                  <Trans
                    i18nKey="about.glicko2Credit2"
                    components={{
                      eloLink: (
                        <a
                          href={ELO_WIKI_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#067429] underline underline-offset-2"
                        />
                      ),
                    }}
                  />
                </li>
              </ol>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[14px] leading-[1.5] text-[#010a0499]">
                <a
                  href={GLICKMAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#067429] underline underline-offset-2"
                >
                  {t("about.glickmanProfile")}
                </a>
                <a
                  href={GLICKO_WIKI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#067429] underline underline-offset-2"
                >
                  {t("about.glickoSystemLink")}
                </a>
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
