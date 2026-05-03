
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GLICKMAN_URL = "https://datascience.harvard.edu/directory/mark-glickman/";
const GLICKO_WIKI_URL = "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1";
const TB10_URL = "https://www.tiebreak10.eu";

const footnoteClassName =
  "relative -top-[0.45em] mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8f3ec] px-1 text-[10px] font-semibold leading-none text-[#067429]";

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
                          link: <a href="mailto:service.tb10@gmail.com" className="underline" aria-label={t("about.contactUs")} />,
                        }}
                      />
                    ) : (
                      t(`about.howToUseItem${key}`)
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="overflow-hidden rounded-[10px] border border-[#dfe7e2] bg-white">
              <div className="border-b border-[#e8eee9] bg-[#f7fbf8] px-4 py-4 sm:px-5">
                <span className="mb-2 inline-flex rounded-full bg-[#06742914] px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-[#067429]">
                  G3
                </span>
                <h2 className="text-[18px] font-semibold leading-[1.25] text-[#010a04]">
                  {t("about.glicko2Title")}
                </h2>
              </div>

              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <p className="max-w-[76ch] text-[14px] leading-[1.65] text-[#010a04b3]">
                  <Trans
                    i18nKey="about.glicko2Paragraph"
                    components={{
                      sup: <sup className={footnoteClassName} />,
                    }}
                  />
                </p>

                <div className="mt-5 grid gap-3 border-t border-[#e8eee9] pt-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-[12px] font-semibold uppercase leading-none tracking-[0.08em] text-[#010a0466]">
                      {t("about.references")}
                    </h3>
                    <ol className="space-y-2 text-[13px] leading-[1.45] text-[#010a0499]">
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8f3ec] text-[11px] font-semibold text-[#067429]">
                          1
                        </span>
                        <span>{t("about.glicko2Credit1")}</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e8f3ec] text-[11px] font-semibold text-[#067429]">
                          2
                        </span>
                        <span>{t("about.glicko2Credit2")}</span>
                      </li>
                    </ol>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-start sm:justify-end">
                    <a
                      href={GLICKMAN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit max-w-full items-center rounded-[8px] border border-[#010a0414] bg-[#f9fafc] px-3 py-2 text-[13px] font-medium leading-none text-[#067429] underline-offset-4 hover:underline"
                    >
                      {t("about.glickmanProfile")}
                    </a>
                    <a
                      href={GLICKO_WIKI_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit max-w-full items-center rounded-[8px] border border-[#010a0414] bg-[#f9fafc] px-3 py-2 text-[13px] font-medium leading-none text-[#067429] underline-offset-4 hover:underline"
                    >
                      {t("about.glickoSystemLink")}
                    </a>
                  </div>
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
