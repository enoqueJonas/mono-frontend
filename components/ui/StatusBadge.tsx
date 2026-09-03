import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Ban,
  ShieldCheck,
  UserCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeStatus =
  // Membros / Geral
  | "ACTIVE"
  | "SUSPENDED"
  | "LEFT"
  // Rotação
  | "PENDING"
  | "CURRENT"
  | "COMPLETED"
  | "SKIPPED"
  // Contribuições
  | "CONFIRMED"
  | "FAILED"
  | "REVERSED"
  // Desembolsos
  | "AWAITING_CONSENSUS"
  | "APPROVED"
  // Penalizações
  | "RESOLVED"
  // Credenciais
  | "VALID"
  | "REVOKED"
  // Roles
  | "MANAGER"
  | "TREASURER"
  | "MEMBER"
  | string;

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  classes: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  ACTIVE: {
    label: "Activo",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  SUSPENDED: {
    label: "Suspenso",
    icon: <AlertCircle className="w-3 h-3 text-amber-600" />,
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  LEFT: {
    label: "Saiu",
    icon: <Ban className="w-3 h-3 text-slate-500" />,
    classes: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  PENDING: {
    label: "Pendente",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  CURRENT: {
    label: "Beneficiário atual",
    icon: <Sparkles className="w-3 h-3 text-blue-600" />,
    classes: "bg-blue-50 text-blue-700 border border-blue-200 font-semibold",
  },
  COMPLETED: {
    label: "Concluído",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  SKIPPED: {
    label: "Ignorado",
    icon: <Ban className="w-3 h-3 text-slate-500" />,
    classes: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  CONFIRMED: {
    label: "Confirmada",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  FAILED: {
    label: "Falhada",
    icon: <XCircle className="w-3 h-3 text-rose-600" />,
    classes: "bg-rose-50 text-rose-700 border border-rose-100",
  },
  REVERSED: {
    label: "Revertida",
    icon: <RotateCcw className="w-3 h-3 text-amber-600" />,
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  AWAITING_CONSENSUS: {
    label: "Aguarda aprovação",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  APPROVED: {
    label: "Aprovado",
    icon: <CheckCircle2 className="w-3 h-3 text-blue-600" />,
    classes: "bg-blue-50 text-blue-700 border border-blue-100",
  },
  RESOLVED: {
    label: "Resolvida",
    icon: <CheckCircle2 className="w-3 h-3 text-slate-600" />,
    classes: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  VALID: {
    label: "Válida",
    icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  },
  REVOKED: {
    label: "Revogada",
    icon: <XCircle className="w-3 h-3 text-rose-600" />,
    classes: "bg-rose-50 text-rose-700 border border-rose-100",
  },
  // Funções
  MANAGER: {
    label: "Gestor",
    icon: <ShieldCheck className="w-3 h-3 text-slate-700" />,
    classes: "bg-slate-100 text-slate-800 border border-slate-200 font-medium",
  },
  TREASURER: {
    label: "Tesoureiro",
    icon: <UserCheck className="w-3 h-3 text-slate-700" />,
    classes: "bg-slate-100 text-slate-800 border border-slate-200 font-medium",
  },
  MEMBER: {
    label: "Membro",
    icon: <User className="w-3 h-3 text-slate-500" />,
    classes: "bg-slate-50 text-slate-600 border border-slate-200",
  },
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  customLabel?: string;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({ status, customLabel, className, size = "default" }: StatusBadgeProps) {
  const normalizedKey = String(status || "").toUpperCase();
  const config = STATUS_MAP[normalizedKey] || {
    label: customLabel || String(status),
    icon: <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />,
    classes: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const label = customLabel || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap tracking-tight transition-colors",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        config.classes,
        className
      )}
    >
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
