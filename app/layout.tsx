import '@/app/globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
// import { createClient } from '@supabase/supabase-js'; // removed
import { Toaster as Sonner } from 'sonner';
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
