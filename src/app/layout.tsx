
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/use-language';

export const metadata: Metadata = {
  title: 'KisanMitra',
  description: 'AI-powered personal assistant for farmers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-muted/40">
        <LanguageProvider>
          <SidebarProvider>
              <div className="flex min-h-screen">
                <AppSidebar />
                <SidebarInset>{children}</SidebarInset>
              </div>
          </SidebarProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
