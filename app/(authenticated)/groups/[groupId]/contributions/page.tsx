"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Coins, PlusCircle } from "lucide-react";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { contributionsApi } from "@/lib/api/contributions";
import { groupsApi } from "@/lib/api/groups";
import { formatDate, formatMoney } from "@/lib/utils";
import {
  createContributionSchema,
  type CreateContributionFormData,
} from "@/schemas/contribution";
import type { Contribution } from "@/types/contributions";
import { CONTRIBUTION_SOURCE_LABELS } from "@/types/contributions";
import type { GroupDetail, GroupMember } from "@/types/groups";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

const selectClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900";

export default function ContributionsPage({ params }: PageProps) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateContributionFormData>({
    resolver: zodResolver(createContributionSchema),
    defaultValues: {
      group_member_id: "",
      amount: "",
      contribution_period: "",
    },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, memberData, contributionData] = await Promise.all([
        groupsApi.getGroup(groupId),
        groupsApi.listGroupMembers(groupId),
        contributionsApi.listGroupContributions(groupId),
      ]);
      setGroup(groupData);
      setMembers(memberData);
      setContributions(contributionData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as contribuições.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isManager =
    group?.user_role === "MANAGER" ||
    group?.role === "MANAGER" ||
    group?.my_role === "MANAGER";
  const canRegisterManually = Boolean(
    isManager && group?.settings?.allow_manual_contributions
  );

  const periods = useMemo(
    () =>
      Array.from(new Set(contributions.map((item) => item.contribution_period))).sort().reverse(),
    [contributions]
  );

  const filteredContributions = useMemo(
    () =>
      contributions.filter((item) => {
        if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
        if (sourceFilter !== "ALL" && item.source !== sourceFilter) return false;
        if (periodFilter !== "ALL" && item.contribution_period !== periodFilter) return false;
        return true;
      }),
    [contributions, periodFilter, sourceFilter, statusFilter]
  );

  const submitContribution = async (data: CreateContributionFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await contributionsApi.createManualContribution(groupId, {
        group_member_id: data.group_member_id,
        amount: data.amount.replace(",", "."),
        contribution_period: data.contribution_period,
      });
      setContributions(await contributionsApi.listGroupContributions(groupId));
      reset();
      setSuccess("Contribuição registada com sucesso.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Não foi possível registar a contribuição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {isLoading && (
        <div className="space-y-5">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      )}

      {!isLoading && group && (
        <>
          <GroupHeaderNav group={group} activeTab="contributions" />

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {canRegisterManually && (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-slate-700" />
                <h2 className="font-semibold text-slate-900">Registar contribuição</h2>
              </div>
              {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
              <form onSubmit={handleSubmit(submitContribution)} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Membro</label>
                  <select {...register("group_member_id")} className={selectClass} disabled={isSubmitting}>
                    <option value="">Seleccione um membro</option>
                    {members
                      .filter((member) => member.status === "ACTIVE")
                      .map((member) => {
                        const user = typeof member.user === "object" && member.user ? member.user : null;
                        const name =
                          member.name ||
                          `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                          member.phone_number ||
                          user?.phone_number ||
                          String(member.id);
                        return <option key={member.id} value={String(member.id)}>{name}</option>;
                      })}
                  </select>
                  {errors.group_member_id && <p className="mt-1 text-xs text-rose-600">{errors.group_member_id.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
                  <input
                    inputMode="decimal"
                    placeholder="1000.00"
                    {...register("amount")}
                    disabled={isSubmitting}
                    className={selectClass}
                  />
                  {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Período da contribuição</label>
                  <input type="date" {...register("contribution_period")} disabled={isSubmitting} className={selectClass} />
                  {errors.contribution_period && <p className="mt-1 text-xs text-rose-600">{errors.contribution_period.message}</p>}
                </div>
                <div className="lg:col-span-3">
                  <Button type="submit" isLoading={isSubmitting}>Registar contribuição</Button>
                </div>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-slate-600" />
                <h2 className="font-semibold text-slate-900">Histórico de contribuições</h2>
              </div>
              {contributions.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                    <option value="ALL">Todos os estados</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="FAILED">Falhada</option>
                    <option value="REVERSED">Revertida</option>
                  </select>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass}>
                    <option value="ALL">Todas as origens</option>
                    <option value="MANUAL">Manual</option>
                    <option value="MOBILE_WALLET">Carteira móvel</option>
                  </select>
                  <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className={selectClass}>
                    <option value="ALL">Todos os períodos</option>
                    {periods.map((period) => <option key={period} value={period}>{formatDate(period)}</option>)}
                  </select>
                </div>
              )}
            </div>

            {contributions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="Este grupo ainda não possui contribuições registadas."
                description="As contribuições manuais e as confirmações recebidas da carteira móvel aparecerão aqui."
              />
            ) : filteredContributions.length === 0 ? (
              <EmptyState icon={Coins} title="Nenhuma contribuição corresponde aos filtros seleccionados." />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filteredContributions.map((item) => (
                    <article key={item.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{item.member_name || "Membro"}</p>
                          <p className="mt-1 text-xs text-slate-500">Período: {formatDate(item.contribution_period)}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(item.amount, group.settings?.currency || "MZN")}
                      </p>
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                        <div>
                          <p className="text-slate-400">Origem</p>
                          <p className="mt-1 font-medium text-slate-700">{CONTRIBUTION_SOURCE_LABELS[item.source] || item.source}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Registada em</p>
                          <p className="mt-1 font-medium text-slate-700">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                      {item.reference && <p className="break-all text-xs text-slate-500">Referência: {item.reference}</p>}
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Membro</th>
                        <th className="px-4 py-3 font-semibold">Período</th>
                        <th className="px-4 py-3 font-semibold">Valor</th>
                        <th className="px-4 py-3 font-semibold">Origem</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredContributions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium text-slate-900">{item.member_name || "Membro"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(item.contribution_period)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(item.amount, group.settings?.currency || "MZN")}</td>
                          <td className="px-4 py-3 text-slate-600">{CONTRIBUTION_SOURCE_LABELS[item.source] || item.source}</td>
                          <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
