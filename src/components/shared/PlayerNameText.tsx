import { cn } from "@/lib/utils";

type PlayerNameTextProps = {
  name: string;
  className?: string;
  /** Set to true when the name should receive keyboard focus for title tooltips. */
  focusable?: boolean;
};

export function PlayerNameText({ name, className, focusable = false }: PlayerNameTextProps) {
  const normalizedName = name.trim();
  const value = normalizedName.length > 0 ? normalizedName : name;

  return (
    <span
      className={cn("block min-w-0 truncate", className)}
      title={value}
      aria-label={value}
      tabIndex={focusable ? 0 : undefined}
    >
      {name}
    </span>
  );
}
