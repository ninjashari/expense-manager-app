import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/providers/session-provider";
import QueryProvider from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Expense Manager",
  description: "Manage your personal expenses with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://js.puter.com/v2/" async></script>
      </head>
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
