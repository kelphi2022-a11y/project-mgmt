// app/components/ui/dialog.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/** Simple Dialog components to satisfy imports.
 *  These are lightweight wrappers with minimal styling. They mimic the API
 *  expected by the codebase (Dialog, DialogTrigger, DialogContent, DialogHeader,
 *  DialogTitle, DialogFooter). For production you would replace them with a
 *  fully‑featured implementation (e.g., Radix UI), but they are sufficient for
 *  building the project on Vercel.
 */

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/30",
        "overflow-auto"
      )}
      onClick={() => onOpenChange(false)}
    >
      {/* Stop propagation so clicking inside the dialog does not close it */}
      <div className={cn("bg-background rounded-lg p-6 shadow-lg")} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
Dialog.displayName = "Dialog"

/** DialogTrigger simply renders its children. The parent component controls the
 *  open state, so here we just return the child element. The `asChild` prop used
 *  in the codebase is ignored – the child is rendered unchanged.
 */
export const DialogTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return <>{children}</>
}
DialogTrigger.displayName = "DialogTrigger"

export const DialogContent = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn(className)}>{children}</div>
}
DialogContent.displayName = "DialogContent"

export const DialogHeader = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn("mb-4", className)}>{children}</div>
}
DialogHeader.displayName = "DialogHeader"

export const DialogTitle = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}
DialogTitle.displayName = "DialogTitle"

export const DialogFooter = ({ className = "", children }: { className?: string; children: React.ReactNode }) => {
  return <div className={cn("mt-4 flex justify-end space-x-2", className)}>{children}</div>
}
DialogFooter.displayName = "DialogFooter"
