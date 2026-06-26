'use client';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Projects", href: "/projects" },
  { name: "Teams", href: "/teams" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 min-h-screen bg-card text-primary flex flex-col p-4">
      <div className="flex-1 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block px-3 py-2 rounded-md hover:bg-muted ${pathname === item.href ? "bg-muted font-medium" : ""}`}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <button
        onClick={handleSignOut}
        className="mt-4 w-full px-3 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Sign Out
      </button>
    </aside>
  );
}
