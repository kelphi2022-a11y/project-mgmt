"use client";
// app/components/ui/select.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onValueChange?: (value: string) => void
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>((props, ref) => {
  const { className = "", children, onValueChange, onChange, ...rest } = props

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value)
    }
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <select
      ref={ref}
      className={cn(
        "flex w-full rounded border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={handleChange}
      {...rest}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

export const SelectTrigger = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span>{placeholder}</span>
}
SelectValue.displayName = "SelectValue"

export const SelectContent = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded border border-border bg-surface p-2", className)} {...props}>
    {children}
  </div>
)
SelectContent.displayName = "SelectContent"

export const SelectItem = ({ value, children, className = "", ...props }: React.OptionHTMLAttributes<HTMLOptionElement> & { value: string }) => (
  <option value={value} className={cn("p-2", className)} {...props}>
    {children}
  </option>
)
SelectItem.displayName = "SelectItem"
