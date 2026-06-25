import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "danger" | "success" | "warning"
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let baseStyle = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
  
  let variantStyle = ""
  if (variant === "default") {
    variantStyle = "border-transparent bg-primary text-background hover:bg-primary/80"
  } else if (variant === "secondary") {
    variantStyle = "border-transparent bg-surface text-primary hover:bg-surface/80"
  } else if (variant === "success") {
    variantStyle = "border-transparent bg-success text-white"
  } else if (variant === "warning") {
    variantStyle = "border-transparent bg-warning text-white"
  } else if (variant === "danger") {
    variantStyle = "border-transparent bg-danger text-white"
  }

  return (
    <div className={`${baseStyle} ${variantStyle} ${className}`} {...props} />
  )
}
