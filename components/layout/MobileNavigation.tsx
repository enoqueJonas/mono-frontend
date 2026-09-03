"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Fecha o drawer sempre que a rota mudar
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Bloqueia scroll de fundo quando o drawer estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
    <>
      {/* Topbar compacta do Mobile */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Abrir menu de navegação"
            aria-expanded={isOpen}
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              MONO
            </span>
          </Link>
        </div>

        <Link
          href="/profile"
          className="flex items-center gap-2 py-1 px-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Ir para Perfil"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 font-semibold text-xs">
            {getInitials()}
          </div>
        </Link>
      </header>

      {/* Backdrop do Drawer Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer / Sheet Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal móvel"
      >
        {/* Topo do drawer */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              M
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              MONO
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 -mr-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de navegação */}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-slate-100 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-blue-600" : "text-slate-500"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do utilizador autenticado */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
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
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium min-h-[44px] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
