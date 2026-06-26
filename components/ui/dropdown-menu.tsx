// app/components/ui/dropdown-menu.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/** Minimal dropdown menu implementation to satisfy imports. */
export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
DropdownMenu.displayName = "DropdownMenu"

export const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  // The original code uses asChild, we simply render children.
  return <>{children}</>
}
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export const DropdownMenuContent = ({ align = "start", className = "", children }: { align?: "start" | "end"; className?: string; children: React.ReactNode }) => {
  const alignment = align === "end" ? "right-0" : "left-0"
  return (
    <div className={cn("absolute mt-2 w-48 rounded-md border border-border bg-surface shadow-lg", alignment, className)}>
      {children}
    </div>
  )
}
DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = ({ onSelect, children }: { onSelect?: () => void; children: React.ReactNode }) => {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center px-2 py-1 text-sm hover:bg-muted/50 focus:outline-none")}
      onClick={onSelect}
    >
      {children}
    </button>
  )
}
DropdownMenuItem.displayName = "DropdownMenuItem"
