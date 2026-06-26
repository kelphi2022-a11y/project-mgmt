// app/components/AuthProvider.tsx
"use client";
import { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/utils/supabase/client';

const SupabaseContext = createContext<typeof supabase | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) throw new Error('useSupabase must be used within AuthProvider');
  return context;
};
