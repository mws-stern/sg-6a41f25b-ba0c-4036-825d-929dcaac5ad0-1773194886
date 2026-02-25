import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import { Sidebar } from "@/components/Sidebar";
import type { AppProps } from "next/app";
import { useState, useEffect } from "react";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/700.css";
import "@fontsource/frank-ruhl-libre/400.css";
import "@fontsource/frank-ruhl-libre/700.css";

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we're on a print page (invoice)
  const isPrintPage = typeof window !== 'undefined' && window.location.pathname.includes('/invoices/');

  if (isPrintPage) {
    return (
      <div className="min-h-screen bg-white">
        <Component {...pageProps} />
        {mounted && <Toaster />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto h-screen">
        <Component {...pageProps} />
      </main>
      {mounted && <Toaster />}
    </div>
  );
}