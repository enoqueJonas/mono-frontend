"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { groupsApi } from "@/lib/api/groups";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  FREQUENCY_LABELS,
  ROTATION_LABELS,
  type GroupDetail,
} from "@/types/groups";
import {
  Calendar,
  CheckCircle2,
  Coins,
  FileText,
  Info,
  Layers,
  RefreshCw,
  Scale,
  Settings,
  ShieldAlert,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

interface GroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupsApi.getGroup(groupId);
      setGroup(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as informações do grupo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupDetail();
  }, [fetchGroupDetail]);

  const settings = group?.settings;
  const membersCount =
    group?.members_count !== undefined
      ? group.members_count
      : group?.total_members !== undefined
      ? group.total_members
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alerta de erro */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGroupDetail}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Tentar novamente
            </Button>
          }
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      )}

      {!isLoading && group && (
        <>
          {/* Navegação e Cabeçalho Unificados */}
          <GroupHeaderNav group={group} activeTab="overview" />

          {/* CONTEÚDO DA VISÃO GERAL */}
          <div className="space-y-6">
            {/* Estatísticas reais devolvidas pela API (apenas se existirem) */}
            {membersCount !== null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Total de Membros
                      </span>
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-bold tracking-tight text-slate-900">
                        {membersCount}
                      </span>
                      {settings?.maximum_members && (
                        <span className="text-xs text-slate-500 font-medium">
                          máx. {settings.maximum_members}
                        </span>
                      )}
                    </div>
                  </div>

                  {group.current_cycle !== undefined && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Ciclo Atual
                        </span>
                        <Layers className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                          #{group.current_cycle}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Configurações Ativas do Grupo */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      Configurações do Círculo de Xitique
                    </h2>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                  {/* Valor da contribuição */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-500" />
                      Valor da Contribuição
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {settings?.contribution_amount
                        ? formatMoney(
                            settings.contribution_amount,
                            settings.currency || "MZN"
                          )
                        : "Não configurado"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Moeda: {settings?.currency || "MZN"}
                    </p>
                  </div>

                  {/* Frequência */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Frequência
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {settings?.contribution_frequency
                        ? FREQUENCY_LABELS[settings.contribution_frequency] ||
                          settings.contribution_frequency
                        : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Periodicidade dos ciclos de entrega
                    </p>
                  </div>

                  {/* Número máximo de membros */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      Limite de Membros
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {settings?.maximum_members
                        ? `${settings.maximum_members} membros`
                        : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Capacidade total do círculo
                    </p>
                  </div>

                  {/* Estratégia de rotação */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      Estratégia de Rotação
                    </span>
                    <p className="text-base font-bold text-slate-900">
                      {settings?.rotation_strategy
                        ? ROTATION_LABELS[settings.rotation_strategy] ||
                          settings.rotation_strategy
                        : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ordem de atribuição dos desembolsos
                    </p>
                  </div>

                  {/* Requer consenso */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-500" />
                      Requer Consenso
                    </span>
                    <div className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                      {settings?.requires_consensus ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Sim (Ativo)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span>Não</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Aprovação coletiva para desembolsos
                    </p>
                  </div>

                  {/* Permitir contribuições manuais */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <WalletCards className="w-3.5 h-3.5 text-slate-500" />
                      Contribuições Manuais
                    </span>
                    <div className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                      {settings?.allow_manual_contributions ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Permitidas</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span>Não permitidas</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Registo direto por tesoureiros
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </>
      )}
    </div>
  );
}
