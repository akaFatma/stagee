import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div className="h-full bg-primary transition-all" style={{ width: `${clamped}%` }} />
    </div>
  )
} 