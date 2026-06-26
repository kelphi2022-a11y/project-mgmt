'use client';
// app/components/ui/tabs.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

// Simple Tab system without external dependencies
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, children, className, ...props }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue || "");
  // Provide context to child components
  const context = React.useMemo(() => ({ value, setValue }), [value]);
  return (
    <TabsContext.Provider value={context}>
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn("flex border-b border-muted", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}
export function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
  const { value: current, setValue } = React.useContext(TabsContext);
  const selected = current === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={() => setValue(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium",
        selected
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}
export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { value: current } = React.useContext(TabsContext);
  if (current !== value) return null;
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}

// Context shared between tab components
interface TabsContextType {
  value: string;
  setValue: (val: string) => void;
}
const TabsContext = React.createContext<TabsContextType>({
  value: "",
  setValue: () => {}
});

// Export statements are handled by the component declarations above
