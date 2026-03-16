import Link from "next/link";
import { useRouter } from "next/router";
import { Clock, Users, DollarSign, FileText, LayoutDashboard, Menu, X, Plus, Timer, Fingerprint, Croissant } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Time Clock", href: "/timeclock", icon: Clock },
  { name: "Current Hours", href: "/current-hours", icon: Timer },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Adjustments", href: "/adjustments", icon: Plus },
  { name: "Payroll", href: "/payroll", icon: DollarSign },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Fingerprint Setup", href: "/fingerprint-setup", icon: Fingerprint },
  { name: "Enroll Fingerprints", href: "/fingerprint-enrollment", icon: Fingerprint },
];

export function Sidebar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-lg"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-6 border-b border-border/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Croissant className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Bakery</h1>
              <p className="text-xs text-muted-foreground">Employee Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-amber-600 text-white shadow-lg"
                      : "text-amber-900 hover:bg-amber-100 hover:shadow-md"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-amber-200">
            <div className="text-xs text-amber-700 text-center">
              <p>Bakery Management v1.0</p>
              <p className="mt-1"> 2026 All rights reserved</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}