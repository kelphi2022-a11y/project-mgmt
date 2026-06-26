// app/components/ui/checkbox.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { className = "", onCheckedChange, onChange, ...rest } = props

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked)
    }
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn("h-4 w-4 rounded border border-border text-primary focus:ring-2 focus:ring-accent", className)}
      onChange={handleChange}
      {...rest}
    />
  )
})
Checkbox.displayName = "Checkbox"
