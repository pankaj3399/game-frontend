import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import MoveRightIcon from "@/assets/icons/figma/lucide/move-right.svg?react";
import {
  IconChevronLeft,
  IconScanBarcode,
  PencilEdit01Icon,
} from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

type ActionCardConfig = {
  id: "validate" | "enter";
  title: string;
  description: string;
  accentBgClass: string;
  accentBorderClass: string;
  iconBgClass: string;
};

export default function RecordScorePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actionCards: ActionCardConfig[] = [
    {
      id: "validate",
      title: t("recordScorePage.cards.validate.title"),
      description: t("recordScorePage.cards.validate.description"),
      accentBgClass: "bg-[rgba(6,116,41,0.08)]",
      accentBorderClass: "border-[rgba(6,116,41,0.25)]",
      iconBgClass: "bg-[#067429]",
    },
    {
      id: "enter",
      title: t("recordScorePage.cards.enter.title"),
      description: t("recordScorePage.cards.enter.description"),
      accentBgClass: "bg-[rgba(244,201,93,0.08)]",
      accentBorderClass: "border-[rgba(244,201,93,0.55)]",
      iconBgClass: "bg-[#d6ab3f]",
    },
  ];

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/my-score", { replace: true });
  };

  const onActionCardClick = (id: ActionCardConfig["id"]) => {
    if (id === "validate") {
      navigate("/record-score/validate");
      return;
    }

    navigate("/record-score/manual");
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#dfe2e0] px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:min-h-[calc(100vh-60px)] lg:pt-7">
      <div className="mx-auto w-full max-w-[824px]">
        <button
          type="button"
          onClick={onGoBack}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#010a04] transition-opacity hover:opacity-65"
        >
          <IconChevronLeft size={14} className="text-[#010a04]" />
          {t("recordScorePage.goBack")}
        </button>

        <section className="mt-2 w-full rounded-[10px] border border-[rgba(1,10,4,0.08)] bg-white px-4 pb-4 pt-3 shadow-[0_3px_7px_rgba(0,0,0,0.06)] sm:px-5 sm:pb-5 sm:pt-4">
          <header className="text-[#010a04]">
            <h1 className="text-2xl font-semibold leading-tight tracking-[-0.01em] ">
              {t("recordScorePage.title")}
            </h1>
            <p className="mt-1 max-w-[560px] text-xs  text-[#010a04]/62 ">
              {t("recordScorePage.subtitle")}
            </p>
          </header>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {actionCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onActionCardClick(card.id)}
                className={cn(
                  "group flex min-h-[172px] flex-col rounded-[10px] border px-4 pb-4 pt-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#067429]/35",
                  card.accentBgClass,
                  card.accentBorderClass,
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-[36px] w-[36px] items-center justify-center rounded-[8px]",
                    card.iconBgClass,
                  )}
                >
                  {card.id === "validate" ? (
                    <IconScanBarcode size={19} className="text-white" />
                  ) : (
                    <PencilEdit01Icon size={19} className="text-white" />
                  )}
                </span>

                <div className="mt-3 flex flex-1 flex-col">
                  <p className="text-lg font-medium text-[#010a04] ">
                    {card.title}
                  </p>
                  <p className="mt-1.5 max-w-[280px] text-xs text-[#010a04]/58">
                    {card.description}
                  </p>
                </div>

                <span className="inline-flex h-5 w-5 items-center justify-center text-[#010a04]/80 transition-transform group-hover:translate-x-1">
                  <MoveRightIcon className="h-5 w-5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
