import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppProvider } from "@/contexts/AppContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "E-Commerce Store",
  description: "Your trusted online shopping destination for quality products and services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <AppProvider>
              <ToastProvider>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
              </ToastProvider>
            </AppProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
