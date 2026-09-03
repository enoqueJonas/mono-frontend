"use client";

import React from "react";
import { User, UserMinus, Calendar } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { GroupMember } from "@/types/groups";

interface MemberCardProps {
  member: GroupMember;
  isManager: boolean;
  onRemove?: (member: GroupMember) => void;
  isRemoving?: boolean;
}

export function MemberCard({
  member,
  isManager,
  onRemove,
  isRemoving = false,
}: MemberCardProps) {
  // Resolução segura do nome e contacto
  const userObj =
    typeof member.user === "object" && member.user !== null
      ? member.user
      : null;

  const fullName =
    member.name ||
    (userObj
      ? `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim()
      : "") ||
    (member.first_name
      ? `${member.first_name} ${member.last_name || ""}`.trim()
      : "");

  const phoneNumber =
    member.phone_number || (userObj ? userObj.phone_number : null);

  const displayName = fullName || phoneNumber || `Membro #${member.id}`;

  const joinedDate = member.joined_at || member.created_at;

  // Obter iniciais
  const getInitials = (name: string) => {
    if (!name) return "M";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      id={`member-card-${member.id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar com Iniciais */}
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
            {fullName ? (
              getInitials(fullName)
            ) : (
              <User className="w-4 h-4 text-slate-500" />
            )}
          </div>

          {/* Nome e Telefone */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {displayName}
            </h3>
            {phoneNumber && fullName && (
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                {phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Badges de Função e Estado */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
          {member.role && <StatusBadge status={member.role} size="sm" />}
          {member.status && <StatusBadge status={member.status} size="sm" />}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        {/* Data de Entrada (se devolvida pela API) */}
        <div className="flex items-center gap-1.5 text-slate-400">
          {joinedDate ? (
            <>
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Aderiu em {formatDate(joinedDate)}</span>
            </>
          ) : (
            <span className="text-[11px] text-slate-400">Participante activo</span>
          )}
        </div>

        {/* Acção de Remoção (Gestor apenas) */}
        {isManager && onRemove && (
          <button
            type="button"
            id={`remove-member-btn-${member.id}`}
            onClick={() => onRemove(member)}
            disabled={isRemoving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors min-h-[36px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Remover</span>
          </button>
        )}
      </div>
    </div>
  );
}
