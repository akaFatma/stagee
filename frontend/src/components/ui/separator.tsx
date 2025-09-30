import * as React from "react"
import { cn } from "@/lib/utils"

export function Separator({ className, orientation = "horizontal", ...props }: React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "w-px h-4" : "h-px w-full",
        className,
      )}
      {...props}
    />
  )
} 