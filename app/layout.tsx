import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppProvider } from "@/contexts/AppContext";
import { ToastProvider } from "@/components/ui/Toast";
import {ThemeProvider} from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "eShopCure",
  description: "Your trusted online shopping destination for quality products and services",
  openGraph: {
    images: [
      {
        url: 'https://eshopcure.vercel.app/logo.png', // Must be an absolute URL
        width: 1200,
        height: 630,
        alt: 'eShopCure',
      },
    ],
  },
  // Also add Twitter-specific tags for better control on X (Twitter)
  twitter: {
    card: 'summary_large_image', // Use summary_large_image for a prominent image
    title: 'eShopCure',
    description: 'Your trusted online shopping destination for quality products and services',
    images: ['https://eshopcure.vercel.app/logo.png'], // Must be an absolute URL
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            <AppProvider>
              <ThemeProvider>
                <ToastProvider>
                  <AnalyticsProvider>
                    {children}
                  </AnalyticsProvider>
                </ToastProvider>
              </ThemeProvider>
            </AppProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
