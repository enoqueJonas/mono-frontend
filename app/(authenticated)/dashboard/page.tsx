"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { GroupCard } from "@/components/groups/GroupCard";
import { groupsApi } from "@/lib/api/groups";
import type { Group } from "@/types/groups";
import { Users, Plus, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupsApi.listGroups();
      setGroups(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os grupos. Verifique a ligação ao servidor.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Saudação personalizada com o nome do utilizador
  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
    : user?.phone_number || "Membro";

  // Métricas derivadas estritamente de dados reais
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === "ACTIVE").length;
  const managedGroups = groups.filter((g) => {
    const role = g.user_role || g.role || g.my_role;
    return role === "MANAGER";
  }).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <PageHeader
        title={`Olá, ${displayName}`}
        description="Visão geral da sua participação nos grupos e cooperativas Xitique."
        actions={
          <Link href="/groups/new" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="default"
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Criar grupo
            </Button>
          </Link>
        }
      />

      {/* Erro de ligação */}
      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGroups}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Tentar novamente
            </Button>
          }
        />
      )}

      {/* Resumo derivado de dados reais */}
      {!isLoading && !error && totalGroups > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total de Grupos
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {String(totalGroups).padStart(2, "0")}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                inscrito(a)
              </span>
            </div>
          </div>

          {activeGroups > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Grupos Ativos
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {String(activeGroups).padStart(2, "0")}
                </span>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>
            </div>
          )}

          {managedGroups > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sob Minha Gestão
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {String(managedGroups).padStart(2, "0")}
                </span>
                <StatusBadge status="MANAGER" size="sm" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secção de Grupos do Utilizador */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Meus Grupos
            </h2>
            <p className="text-xs text-slate-500">
              Grupos de poupança rotativa em que participa atualmente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/groups"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors py-2 px-2.5 rounded-md hover:bg-slate-100 min-h-[44px]"
            >
              <span>Ver todos os grupos</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Estado: Carregamento */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Estado: Vazio */}
        {!isLoading && !error && totalGroups === 0 && (
          <EmptyState
            icon={Users}
            title="Ainda não participa em nenhum grupo."
            description="Crie o seu primeiro grupo de poupança comunitária Xitique ou solicite a integração num grupo existente."
            action={
              <Link href="/groups/new">
                <Button
                  variant="primary"
                  size="default"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Criar grupo
                </Button>
              </Link>
            }
          />
        )}

        {/* Estado: Lista de Grupos */}
        {!isLoading && !error && totalGroups > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
