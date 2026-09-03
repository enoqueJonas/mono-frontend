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
    { key: "overview", label: "Visão Geral", href: `/groups/${group.id}`, isImplemented: true },
    { key: "members", label: "Membros", href: `/groups/${group.id}/members`, isImplemented: true },
    { key: "contributions", label: "Contribuições", href: `/groups/${group.id}/contributions`, isImplemented: true },
    { key: "rotation", label: "Rotação", href: `/groups/${group.id}/rotation`, isImplemented: true },
    { key: "disbursements", label: "Desembolsos", href: `/groups/${group.id}/disbursements`, isImplemented: true },
    { key: "penalties", label: "Penalizações", href: `/groups/${group.id}/penalties`, isImplemented: true },
    { key: "settings", label: "Configurações", href: `/groups/${group.id}/settings`, isImplemented: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/groups" className="inline-flex min-h-[44px] items-center gap-1.5 py-1.5 -ml-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos grupos</span>
        </Link>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{group.name}</h1>
            {group.description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">{group.description}</p>}
            {group.created_at && <p className="mt-2 text-xs text-slate-400">Criado em {formatDate(group.created_at)}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {group.status && <StatusBadge status={group.status} size="default" />}
            {userRole && <StatusBadge status={userRole} size="default" />}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto pb-1 -mb-px no-scrollbar" aria-label="Abas do Grupo">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            if (tab.isImplemented && tab.href) {
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${isActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
                >
                  <span>{tab.label}</span>
                </Link>
              );
            }

            return (
              <button key={tab.key} type="button" disabled className="flex min-h-[44px] cursor-not-allowed items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-xs font-semibold text-slate-300 sm:text-sm">
                <span>{tab.label}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wider text-slate-400">Em breve</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
