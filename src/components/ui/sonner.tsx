import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "@/icons/figma-icons"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import InlineLoader from "@/components/shared/InlineLoader"

function DismissErrorToastIcon() {
  return (
    <button
      type="button"
      aria-label="Dismiss error toast"
      className="inline-flex size-4 items-center justify-center"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toast.dismiss()
      }}
    >
      <OctagonXIcon className="size-4" />
    </button>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <DismissErrorToastIcon />,
        loading: <InlineLoader size="sm" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
