/**
 * @file layout.tsx
 * @description This file defines the root layout for the application.
 * It sets up the HTML structure, includes global stylesheets, defines metadata,
 * provides authentication context, and conditionally shows the sidebar layout.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth/auth-provider"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Manager - Personal Finance Management",
  description: "Manage your personal finances with ease. Track expenses, manage accounts, and generate reports.",
};

/**
 * RootLayout component
 * @description Provides the main layout structure with authentication context and toast notifications
 * @param children - The page content to be rendered
 * @returns JSX element containing the complete application layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
