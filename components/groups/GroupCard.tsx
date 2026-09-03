import React from "react";
import Link from "next/link";
import { Users, ChevronRight, Calendar, Coins } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney } from "@/lib/utils";
import { FREQUENCY_LABELS, type Group } from "@/types/groups";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const settings = group.settings;
  const userRole = group.user_role || group.role || group.my_role;
  const membersCount =
    group.members_count !== undefined
      ? group.members_count
      : group.total_members !== undefined
      ? group.total_members
      : null;

  return (
    <div
      id={`group-card-${group.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
    >
      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight truncate">
              {group.name}
            </h3>
            {group.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {group.status && (
              <StatusBadge status={group.status} size="sm" />
            )}
            {userRole && (
              <StatusBadge status={userRole} size="sm" />
            )}
          </div>
        </div>

        {/* Metadados reais presentes na resposta */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          {settings?.contribution_amount && (
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3 text-slate-400" />
                Contribuição
              </span>
              <p className="font-semibold text-slate-800">
                {formatMoney(
                  settings.contribution_amount,
                  settings.currency || "MZN"
                )}
              </p>
            </div>
          )}

          {settings?.contribution_frequency && (
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Frequência
              </span>
              <p className="font-medium text-slate-800">
                {FREQUENCY_LABELS[settings.contribution_frequency] ||
                  settings.contribution_frequency}
              </p>
            </div>
          )}

          {membersCount !== null && (
            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                Membros
              </span>
              <p className="font-medium text-slate-800">
                {membersCount}
                {settings?.maximum_members
                  ? ` / ${settings.maximum_members} máx.`
                  : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ação Principal: Ver grupo */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-blue-600 transition-colors py-2 px-3 -mr-2 rounded-md hover:bg-slate-50 min-h-[44px]"
        >
          <span>Ver grupo</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
