import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "@/icons/figma-icons";
import { partitionMatchOptions } from "../helpers";
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
  const selectedLabel =
    effectiveSelectedOption.label ||
    t("recordScorePage.enter.selectPlaceholder");

  const { independent: independentOptions, tournament: tournamentOptions } =
    useMemo(
      () => partitionMatchOptions(filteredMatchOptions),
      [filteredMatchOptions],
    );

  const renderOption = (option: MatchOption, isIndependent: boolean) => {
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
        className={cn(
          "block w-full border-b border-[#010a04]/8 px-3 py-2 text-left last:border-b-0",
          isIndependent ? "text-[14px]" : "text-[13px]",
          isIndependent
            ? isActive
              ? "bg-[#067429]/12 font-extrabold text-[#067429]"
              : "font-bold text-[#067429] hover:bg-[#067429]/[0.06]"
            : isActive
              ? "bg-[#067429]/10 font-medium text-[#067429]"
              : "text-[#010a04] hover:bg-[#010a04]/[0.035]",
        )}
        title={option.label}
      >
        <span className="block truncate">{option.label}</span>
      </button>
    );
  };

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
          className="min-h-[44px] h-auto min-w-0 w-full justify-between rounded-[10px] border-[#010a04]/10 bg-[#f2f4f3] px-3 py-2.5 text-left text-[14px] font-normal text-[#010a04] hover:bg-[#edf0ef] sm:h-[34px] sm:min-h-[34px] sm:rounded-[8px] sm:py-0"
          title={selectedLabel}
        >
          <span className="min-w-0 truncate">{selectedLabel}</span>
          <IconChevronDown size={14} className="ml-2 shrink-0 text-[#010a04]/55" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={16}
        sticky="partial"
        className="w-[min(var(--radix-popover-trigger-width),calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[10px] border-[#010a04]/10 p-2"
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
            <>
              {independentOptions.length > 0 ? (
                <div className="pt-0.5">
                  {independentOptions.map((option) => renderOption(option, true))}
                </div>
              ) : null}

              {independentOptions.length > 0 && tournamentOptions.length > 0 ? (
                <div
                  className="mx-3 border-t border-[#010a04]/10"
                  role="separator"
                  aria-hidden
                />
              ) : null}

              {tournamentOptions.length > 0 ? (
                <div className={independentOptions.length > 0 ? "pt-0.5" : undefined}>
                  {tournamentOptions.map((option) => renderOption(option, false))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
