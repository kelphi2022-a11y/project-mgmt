import '@/app/globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import { Sonner } from 'sonner';
import AppShell from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Project Management App',
  description: 'Premium internal project management SaaS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background text-primary min-h-screen flex flex-col">
        <Sonner position="bottom-right" />
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
