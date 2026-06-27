
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { DashboardShell } from '@/components/dashboard-shell';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'APP STORE | Agency OS',
  description: 'Integrated agency and client management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#f8fafc] text-foreground min-h-screen">
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
              <DashboardShell>
                {children}
              </DashboardShell>
            </Suspense>
          </LanguageProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
