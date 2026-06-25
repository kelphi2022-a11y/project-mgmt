import '@/app/globals.css';
import { GeistSans, GeistMono } from 'next/font/local';
import { SessionProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import { Sonner } from 'sonner';
import AppShell from '@/components/layout/AppShell';

// Load local fonts (placeholder paths – you can replace with actual font files)
const geistSans = GeistSans({
  src: '../public/fonts/GeistSans-Regular.woff2',
  weight: '400',
  style: 'normal',
});
const geistMono = GeistMono({
  src: '../public/fonts/GeistMono-Regular.woff2',
  weight: '400',
  style: 'normal',
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
