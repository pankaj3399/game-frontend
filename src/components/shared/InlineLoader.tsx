import { cn } from "@/lib/utils";

type InlineLoaderSize = "sm" | "md" | "lg";

const sizeClasses: Record<InlineLoaderSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
};

interface InlineLoaderProps {
  className?: string;
  size?: InlineLoaderSize;
}

export default function InlineLoader({
  className,
  size = "lg",
}: InlineLoaderProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-muted-foreground/30 border-t-foreground",
        sizeClasses[size],
        className
      )}
      aria-hidden
    />
  );
}
