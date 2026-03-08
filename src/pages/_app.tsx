import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Lazy load Sidebar to reduce initial bundle
const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => mod.Sidebar), {
  ssr: false,
  loading: () => <div className="w-64 bg-background border-r" />
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isLoginPage = router.pathname === "/login";
  const is404Page = router.pathname === "/404";

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <ThemeProvider>
      <AuthProvider>
        {!isLoginPage && !is404Page ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-background">
              {loading && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50">
                  <div className="h-full bg-primary animate-pulse" style={{ width: "30%" }} />
                </div>
              )}
              <Component {...pageProps} />
            </main>
          </div>
        ) : (
          <Component {...pageProps} />
        )}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}