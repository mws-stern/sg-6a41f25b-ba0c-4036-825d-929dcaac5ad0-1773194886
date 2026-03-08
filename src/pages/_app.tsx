import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import useStore from "@/lib/store";

const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
  loading: () => <div className="w-64 bg-background border-r" />
});

const AlertsPanel = dynamic(() => import("@/components/AlertsPanel").then(mod => ({ default: mod.AlertsPanel })), {
  ssr: false,
  loading: () => <div className="w-80 bg-background border-l" />
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === "/login";
  const initialize = useStore(state => state.initialize);

  useEffect(() => {
    // Initialize store after mount (when authentication is ready)
    if (!isLoginPage) {
      initialize();
    }
  }, [initialize, isLoginPage]);

  return (
    <ThemeProvider>
      <AuthProvider>
        {isLoginPage ? (
          <Component {...pageProps} />
        ) : (
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Component {...pageProps} />
            </main>
            <AlertsPanel />
          </div>
        )}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}