import "@/styles/globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/700.css";
import "@fontsource/frank-ruhl-libre/400.css";
import "@fontsource/frank-ruhl-libre/700.css";

// Import Toaster dynamically with ssr disabled to prevent hydration issues
const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  { ssr: false }
);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isLoginPage = router.pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/login");
    }
  }, [user, loading, router, isLoginPage]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated (unless on login page)
  if (!user && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === "/login";
  const isPrintPage = router.pathname.includes("/invoices/");

  if (isLoginPage) {
    return (
      <>
        <Component {...pageProps} />
        <Toaster />
      </>
    );
  }

  if (isPrintPage) {
    return (
      <div className="min-h-screen bg-white">
        <Component {...pageProps} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto h-screen">
        <Component {...pageProps} />
      </main>
      <Toaster />
    </div>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent {...props} />
      </AuthGuard>
    </AuthProvider>
  );
}