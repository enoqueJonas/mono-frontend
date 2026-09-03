"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { GroupDetail } from "@/types/groups";

export type GroupTabKey =
  | "overview"
  | "members"
  | "contributions"
  | "rotation"
  | "disbursements"
  | "penalties"
  | "settings";

interface GroupHeaderNavProps {
  group: GroupDetail;
  activeTab: GroupTabKey;
}

interface NavTabItem {
  key: GroupTabKey;
  label: string;
  href?: string;
  isImplemented: boolean;
}

export function GroupHeaderNav({ group, activeTab }: GroupHeaderNavProps) {
  const userRole = group.user_role || group.role || group.my_role;

  const tabs: NavTabItem[] = [
    {
      key: "overview",
      label: "Visão Geral",
      href: `/groups/${group.id}`,
      isImplemented: true,
    },
    {
      key: "members",
      label: "Membros",
      href: `/groups/${group.id}/members`,
      isImplemented: true,
    },
    {
      key: "contributions",
      label: "Contribuições",
      href: `/groups/${group.id}/contributions`,
      isImplemented: true,
    },
    {
      key: "rotation",
      label: "Rotação",
      href: `/groups/${group.id}/rotation`,
      isImplemented: true,
    },
    {
      key: "disbursements",
      label: "Desembolsos",
      isImplemented: false,
    },
    {
      key: "penalties",
      label: "Penalizações",
      isImplemented: false,
    },
    {
      key: "settings",
      label: "Configurações",
      href: `/groups/${group.id}/settings`,
      isImplemented: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1.5 -ml-1 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos grupos</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {group.name}
            </h1>
            {group.description && (
              <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-3xl">
                {group.description}
              </p>
            )}
            {group.created_at && (
              <p className="mt-2 text-xs text-slate-400">
                Criado em {formatDate(group.created_at)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {group.status && <StatusBadge status={group.status} size="default" />}
            {userRole && <StatusBadge status={userRole} size="default" />}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav
          className="flex gap-1 overflow-x-auto pb-1 -mb-px no-scrollbar"
          aria-label="Abas do Grupo"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            if (tab.isImplemented && tab.href) {
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors min-h-[44px] flex items-center gap-1.5 ${
                    isActive
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={tab.key}
                type="button"
                disabled
                className="whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-slate-300 cursor-not-allowed min-h-[44px] flex items-center gap-1.5"
                title="Módulo a implementar nas próximas etapas"
              >
                <span>{tab.label}</span>
                <span className="text-[10px] uppercase tracking-wider font-normal bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                  Em breve
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
