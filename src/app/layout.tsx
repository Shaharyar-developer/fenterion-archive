import "../lib/orpc.server";
import type { Metadata } from "next";
import { Fira_Sans, Fira_Mono } from "next/font/google";
import "./globals.css";
import siteconfig from "@/constants/siteconfig";
import { ThemeProvider } from "@/providers/theme";
import QueryProviders from "@/providers/query";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/blocks/app-navbar";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const firaMono = Fira_Mono({
  variable: "--font-fira-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: siteconfig.title,
  description: siteconfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${firaSans.variable} ${firaMono.variable}`}>
        <QueryProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
