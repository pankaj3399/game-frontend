import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search01Icon } from "@/icons/figma-icons";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import InlineLoader from "@/components/shared/InlineLoader";
import {
  useSearchUsers,
  isUserSearchQueryValid,
  type SearchUserResult,
} from "@/pages/clubs/hooks";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

interface UserSearchSelectProps {
  inputId?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelectUser: (user: SearchUserResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  openOnFocus?: boolean;
  noResultsText?: string;
  keepTypingText?: string;
  userFilter?: (user: SearchUserResult) => boolean;
  primaryText?: (user: SearchUserResult) => string;
}

type UIState = "idle" | "typing" | "loading" | "empty" | "results";

export function UserSearchSelect({
  inputId,
  value,
  onValueChange,
  onSelectUser,
  placeholder,
  className,
  disabled = false,
  openOnFocus = true,
  noResultsText,
  keepTypingText,
  userFilter,
  primaryText,
}: UserSearchSelectProps) {
  const { t } = useTranslation();

  const resolvedPlaceholder = placeholder ?? t("userSearch.placeholder");
  const resolvedNoResults = noResultsText ?? t("userSearch.noResults");
  const resolvedKeepTyping = keepTypingText ?? t("userSearch.keepTyping");

  const [open, setOpen] = useState(false);

  const trimmedValue = value.trim();
  const debouncedValue = useDebouncedValue(trimmedValue, 300);

  const isValid = isUserSearchQueryValid(trimmedValue);
  const isValidDebounced = isUserSearchQueryValid(debouncedValue);

  const { data, isLoading, isFetching } = useSearchUsers(
    trimmedValue,
    isValid && open
  );

  const allUsers = data?.users ?? [];
  const users = userFilter ? allUsers.filter(userFilter) : allUsers;

  const isDebouncing = trimmedValue !== debouncedValue;

  const uiState: UIState = !open
    ? "idle"
    : !isValidDebounced
    ? "typing"
    : isDebouncing || isLoading || isFetching
    ? "loading"
    : users.length === 0
    ? "empty"
    : "results";

  const handleSelectUser = (user: SearchUserResult) => {
    onSelectUser(user);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div className={cn("relative", className)}>
          <Search01Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              const nextOpen = event.target.value.trim().length > 0;
              setOpen(nextOpen);
            }}
            onFocus={() => {
              if (!openOnFocus) return;
              setOpen(true);
            }}
            placeholder={resolvedPlaceholder}
            className="h-[38px] rounded-[8px] border-[#e1e3e8] bg-[#f9fafc] pl-9 text-[14px]"
            autoComplete="off"
            disabled={disabled}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[9px] border border-black/10 bg-white p-[15px] shadow-[0px_10px_23.5px_0px_rgba(0,0,0,0.2)]"
        align="center"
        side="bottom"
        sideOffset={5}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto">
          {uiState === "loading" && (
            <div className="flex w-full items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <InlineLoader className="h-5 w-5" size="sm" />
              <span>{t("userSearch.searching")}</span>
            </div>
          )}

          {uiState === "empty" && (
            <div className="w-full px-3 py-4 text-center text-sm text-muted-foreground">
              {resolvedNoResults}
            </div>
          )}

          {uiState === "typing" && (
            <div className="w-full px-3 py-4 text-center text-sm text-muted-foreground">
              {resolvedKeepTyping}
            </div>
          )}

          {uiState === "results" && (
            <ul className="py-0">
              {users.map((user) => {
                const alias = user.alias?.trim();
                const display =
                  primaryText?.(user) ??
                  alias ??
                  user.name?.trim() ??
                  user.email;

                return (
                  <li
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="cursor-pointer border-b border-black/10 py-2.5 last:border-b-0"
                  >
                    <div className="flex items-center gap-[13px]">
                      <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-black/70 bg-[#dddddd99] text-[11px] font-medium text-black/70">
                        {(display?.[0] || user.email?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] leading-4 text-foreground">
                          {display}
                        </p>
                        <p className="truncate text-[12px] leading-4 text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}