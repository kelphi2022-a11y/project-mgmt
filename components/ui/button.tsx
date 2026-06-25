import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "ghost" | "accent"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    let baseStyle = "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    
    let variantStyle = ""
    if (variant === "default") {
      variantStyle = "bg-primary text-background hover:bg-primary/90"
    } else if (variant === "secondary") {
      variantStyle = "bg-surface text-primary border border-border hover:bg-border/50"
    } else if (variant === "accent") {
      variantStyle = "bg-accent text-white hover:bg-accent-hover"
    } else if (variant === "danger") {
      variantStyle = "bg-danger text-white hover:bg-danger/90"
    } else if (variant === "ghost") {
      variantStyle = "text-primary hover:bg-surface/50"
    }

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variantStyle} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
