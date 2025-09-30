import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={cn(
        "w-full h-2 appearance-none rounded bg-muted outline-none [::-webkit-slider-thumb]:appearance-none [::-webkit-slider-thumb]:h-4 [::-webkit-slider-thumb]:w-4 [::-webkit-slider-thumb]:rounded-full [::-webkit-slider-thumb]:bg-primary",
        className,
      )}
      {...props}
    />
  )
} 