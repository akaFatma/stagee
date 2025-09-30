import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center cursor-pointer", className)}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => {
          onChange?.(e)
          onCheckedChange?.(e.target.checked)
        }}
        {...props}
      />
      <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary transition-colors relative">
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-4" />
      </div>
    </label>
  )
} 