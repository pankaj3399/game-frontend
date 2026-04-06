import type { TFunction } from "i18next";

interface FoodSectionProps {
  hasFoodInfo: boolean;
  foodInfoTrimmed: string;
  t: TFunction;
}

export function FoodSection({ hasFoodInfo, foodInfoTrimmed, t }: FoodSectionProps) {
  return (
    <section className="border-b border-[#dddddd] py-[18px]">
      <h3 className="text-[20px] font-semibold leading-[1.15] text-[#010a04]">{t("tournaments.foodDrinks")}</h3>
      <p
        className={`mt-[18px] whitespace-pre-line text-[16px] leading-5 ${hasFoodInfo ? "text-[#010a04]" : "text-[#010a04]/60"}`}
      >
        {hasFoodInfo ? foodInfoTrimmed : t("tournaments.noFoodInfo")}
      </p>
    </section>
  );
}
