import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline"
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles =
    variant === "secondary"
      ? "bg-secondary text-secondary-foreground"
      : variant === "outline"
      ? "border border-input"
      : "bg-primary text-primary-foreground"
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", styles, className)} {...props} />
} 