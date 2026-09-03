"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { NavItem } from "@/types/navigation";

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Grupos",
    href: "/groups",
    icon: Users,
  },
  {
    name: "Credenciais",
    href: "/credentials",
    icon: ShieldCheck,
  },
  {
    name: "Perfil",
    href: "/profile",
    icon: User,
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user) return "U";
    const f = user.first_name?.[0] || "";
    const l = user.last_name?.[0] || "";
    return (f + l).toUpperCase() || (user.phone_number?.slice(-2) || "U");
  };

  const fullName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.phone_number || "Utilizador"
    : "Utilizador";

  return (
    <aside
      className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 z-30"
      aria-label="Navegação desktop"
    >
      {/* Topo institucional MONO - Clean Minimalism */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center shadow-xs">
          <span className="text-white font-bold text-xs">M</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          MONO
        </span>
      </div>

      {/* Lista de navegação principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                isActive
                  ? "bg-slate-100 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-blue-600" : "text-slate-500"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secção inferior do utilizador autenticado */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 overflow-hidden min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.phone_number || "Conta MONO"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
