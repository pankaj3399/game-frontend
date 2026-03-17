import type { ComponentProps } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { HugeiconsIcon } from "@hugeicons/react";

export function ProfileRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <Field className="flex-1 gap-1 min-w-0">
        <FieldLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </FieldLabel>
        <p
          className={`text-sm text-foreground sm:text-base ${mono ? "font-mono break-all text-[13px]" : ""}`}
        >
          {value}
        </p>
      </Field>
    </div>
  );
}
