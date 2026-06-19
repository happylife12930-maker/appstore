
import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import {LanguageProvider} from '@/components/language-provider';
import {DashboardShell} from '@/components/dashboard-shell';

export const metadata: Metadata = {
  title: 'APP STORE | مدير الوكالة',
  description: 'نظام إدارة المشاريع والعملاء لوكالات البرمجيات.',
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
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <DashboardShell>
            {children}
          </DashboardShell>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
