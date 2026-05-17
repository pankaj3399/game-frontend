import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2 } from "@/icons/figma-icons";
import { GLOBAL_PARAMETERS } from "@/constants/constants";

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
          url: GLOBAL_PARAMETERS.TB10_SHARE_URL,
        });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(GLOBAL_PARAMETERS.TB10_SHARE_URL);
        toast.success(t("about.linkCopied"));
        return;
      } catch {
        toast.error(t("about.unableToCopyLink"));
      }
    }

    window.open(GLOBAL_PARAMETERS.TB10_SHARE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#dfe2e0] px-4 pb-10 pt-7 sm:px-6">
      <div className="mx-auto w-full max-w-[1120px] min-w-0">
        <div className="overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <header className="border-b border-[#010a04]/8 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#010a04] sm:text-[28px]">
                {t("about.title")}
              </h1>
              <Button
                type="button"
                onClick={handleInviteFriends}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] bg-brand-accent px-3 text-[11px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
              >
                <Share2 className="size-3.5" aria-hidden />
                {t("about.share")}
              </Button>
            </div>
          </header>

          <div className="flex flex-col gap-2.5 p-4 sm:gap-3 sm:p-5">
            <section className="rounded-[10px] border border-[#010a04]/10 bg-[#f9faf9] p-4 sm:p-[18px]">
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
                {t("about.allowsYouTo")}
              </h2>
              <ul className="list-disc pl-[21px] text-[14px] leading-[1.5] text-[#010a0499]">
                {(["1", "2", "3", "4"] as const).map((key) => (
                  <li key={key}>{t(`about.allowsYouToItem${key}`)}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[10px] border border-[#010a04]/10 bg-[#f9faf9] p-4 sm:p-[18px]">
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
                              href={GLOBAL_PARAMETERS.CONTACT_US_MAILTO}
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

            <section className="rounded-[10px] border border-[#010a04]/10 bg-[#f9faf9] p-4 sm:p-[18px]">
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
                          href={GLOBAL_PARAMETERS.ELO_WIKI_URL}
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
                  href={GLOBAL_PARAMETERS.GLICKMAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#067429] underline underline-offset-2"
                >
                  {t("about.glickmanProfile")}
                </a>
                <a
                  href={GLOBAL_PARAMETERS.GLICKO_WIKI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#067429] underline underline-offset-2"
                >
                  {t("about.glickoSystemLink")}
                </a>
              </div>
            </section>

            <section
              id="contact"
              className="rounded-[10px] border border-[#010a04]/10 bg-[#f9faf9] p-4 sm:p-[18px]"
            >
              <h2 className="mb-3 text-[18px] font-medium leading-normal text-[#010a04]">
                {t("about.otherInformation")}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  asChild
                  className="h-8 rounded-[7px] border border-[#010a04]/15 bg-brand-accent px-3 text-[11px] font-medium text-[#010a04] hover:bg-brand-accent-hover"
                >
                  <a href={GLOBAL_PARAMETERS.CONTACT_US_MAILTO}>{t("about.contactUs")}</a>
                </Button>
                <Button
                  type="button"
                  onClick={handleInviteFriends}
                  className="h-8 rounded-[7px] bg-[#010a04] px-3 text-[11px] font-medium text-white hover:bg-[#1d241d]"
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
