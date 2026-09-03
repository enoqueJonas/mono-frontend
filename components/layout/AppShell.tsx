"use client";

import React from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { usePathname } from "next/navigation";

export interface AppShellProps {
  children: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/groups": "Grupos",
  "/credentials": "Credenciais",
  "/profile": "Perfil",
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || "Dashboard";

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden flex-col lg:flex-row">
      <MobileNavigation />
      <DesktopSidebar />
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Estado da Identidade</p>
              <p className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Verificado</span>
              </p>
            </div>
          </div>
        </header>
        <section className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
