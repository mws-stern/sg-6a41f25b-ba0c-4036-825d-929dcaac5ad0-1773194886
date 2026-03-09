import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { useEffect } from "react";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <main className={inter.className}>
            <Component {...pageProps} />
          </main>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}