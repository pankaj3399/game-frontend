import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconChevronDown } from "@/icons/figma-icons";
import type { MatchOption } from "../types";

type MatchSelectorProps = {
  isConfirmLocked: boolean;
  isMatchPopoverOpen: boolean;
  setIsMatchPopoverOpen: (next: boolean) => void;
  matchSearch: string;
  setMatchSearch: (value: string) => void;
  filteredMatchOptions: MatchOption[];
  effectiveSelectedOption: MatchOption;
  onMatchChange: (id: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function MatchSelector({
  isConfirmLocked,
  isMatchPopoverOpen,
  setIsMatchPopoverOpen,
  matchSearch,
  setMatchSearch,
  filteredMatchOptions,
  effectiveSelectedOption,
  onMatchChange,
  t,
}: MatchSelectorProps) {
  return (
    <Popover
      open={isMatchPopoverOpen}
      onOpenChange={(nextOpen) => {
        if (nextOpen && isConfirmLocked) return;
        setIsMatchPopoverOpen(nextOpen);
        if (!nextOpen) {
          setMatchSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={isConfirmLocked}
          className="h-[34px] w-full justify-between rounded-[8px] border-[#010a04]/10 bg-[#f2f4f3] px-3 text-left text-[14px] font-normal text-[#010a04] hover:bg-[#edf0ef]"
        >
          <span className="truncate">
            {effectiveSelectedOption.label ||
              t("recordScorePage.enter.selectPlaceholder")}
          </span>
          <IconChevronDown size={14} className="ml-2 shrink-0 text-[#010a04]/55" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[--radix-popover-trigger-width] rounded-[10px] border-[#010a04]/10 p-2"
      >
        <Input
          value={matchSearch}
          onChange={(event) => setMatchSearch(event.target.value)}
          placeholder={t("recordScorePage.enter.selectPlaceholder")}
          className="mb-2 h-8 rounded-[8px] border-[#010a04]/12 bg-white text-[13px]"
          autoFocus
        />

        <div className="thin-scrollbar max-h-64 overflow-y-auto rounded-[8px] border border-[#010a04]/8">
          {filteredMatchOptions.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[#010a04]/55">
              {t("recordScorePage.enter.noMatchesFound")}
            </p>
          ) : (
            filteredMatchOptions.map((option) => {
              const isActive = option.id === effectiveSelectedOption.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onMatchChange(option.id);
                    setIsMatchPopoverOpen(false);
                    setMatchSearch("");
                  }}
                  className={`block w-full border-b border-[#010a04]/8 px-3 py-2 text-left text-[13px] last:border-b-0 ${
                    isActive
                      ? "bg-[#067429]/10 font-medium text-[#067429]"
                      : "text-[#010a04] hover:bg-[#010a04]/[0.035]"
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
