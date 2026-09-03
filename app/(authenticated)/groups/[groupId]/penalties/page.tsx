"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, PlusCircle } from "lucide-react";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { groupsApi } from "@/lib/api/groups";
import { penaltiesApi } from "@/lib/api/penalties";
import { formatDate } from "@/lib/utils";
import { createPenaltySchema, type CreatePenaltyFormData } from "@/schemas/penalty";
import type { GroupDetail, GroupMember } from "@/types/groups";
import type { Penalty } from "@/types/penalties";

interface PageProps { params: Promise<{ groupId: string }>; }

export default function PenaltiesPage({ params }: PageProps) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePenaltyFormData>({
    resolver: zodResolver(createPenaltySchema),
    defaultValues: { member_id: "", reason: "" },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, memberData, penaltyData] = await Promise.all([
        groupsApi.getGroup(groupId),
        groupsApi.listGroupMembers(groupId),
        penaltiesApi.listGroupPenalties(groupId),
      ]);
      setGroup(groupData);
      setMembers(memberData);
      setPenalties(penaltyData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as penalizações.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  const isManager = group?.user_role === "MANAGER" || group?.role === "MANAGER" || group?.my_role === "MANAGER";
  const activePenalties = useMemo(() => penalties.filter((item) => item.status === "ACTIVE"), [penalties]);
  const history = useMemo(() => penalties.filter((item) => item.status !== "ACTIVE"), [penalties]);

  const createPenalty = async (data: CreatePenaltyFormData) => {
    setIsSubmitting(true); setFormError(null); setSuccess(null);
    try {
      await penaltiesApi.createPenalty(groupId, { member_id: data.member_id, reason: data.reason.trim() });
      setPenalties(await penaltiesApi.listGroupPenalties(groupId));
      reset();
      setSuccess("Penalização registada com sucesso.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Não foi possível registar a penalização.");
    } finally { setIsSubmitting(false); }
  };

  const resolvePenalty = async (penaltyId: string) => {
    setResolvingId(penaltyId); setError(null); setSuccess(null);
    try {
      await penaltiesApi.resolvePenalty(groupId, penaltyId);
      setPenalties(await penaltiesApi.listGroupPenalties(groupId));
      setSuccess("Penalização resolvida com sucesso.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível resolver a penalização.");
    } finally { setResolvingId(null); }
  };

  const renderPenalty = (item: Penalty) => (
    <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-slate-900">{item.member_name || "Membro"}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.reason}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Registada em {formatDate(item.created_at)}</span>
            {item.resolved_at && <span>Resolvida em {formatDate(item.resolved_at)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <StatusBadge status={item.status} />
          {isManager && item.status === "ACTIVE" && (
            <Button size="sm" variant="outline" isLoading={resolvingId === item.id} onClick={() => resolvePenalty(item.id)}>
              Resolver
            </Button>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && <ErrorAlert message={error} onRetry={loadData} />}
      {isLoading && <div className="space-y-4"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-28 w-full rounded-xl" /></div>}

      {!isLoading && group && <>
        <GroupHeaderNav group={group} activeTab="penalties" />
        {success && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{success}</div>}

        {isManager && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-slate-700" /><h2 className="font-semibold text-slate-900">Registar penalização</h2></div>
          {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
          <form onSubmit={handleSubmit(createPenalty)} className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_2fr_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Membro</label>
              <select {...register("member_id")} disabled={isSubmitting} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm">
                <option value="">Seleccione um membro</option>
                {members.filter((m) => m.status === "ACTIVE").map((m) => {
                  const user = typeof m.user === "object" && m.user ? m.user : null;
                  const name = m.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || m.phone_number || user?.phone_number || String(m.id);
                  return <option key={m.id} value={String(m.id)}>{name}</option>;
                })}
              </select>
              {errors.member_id && <p className="mt-1 text-xs text-rose-600">{errors.member_id.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Motivo</label>
              <input {...register("reason")} disabled={isSubmitting} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm" placeholder="Indique o motivo da penalização" />
              {errors.reason && <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>}
            </div>
            <Button type="submit" isLoading={isSubmitting}>Registar</Button>
          </form>
        </section>}

        <section className="space-y-3">
          <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-slate-600" /><h2 className="font-semibold text-slate-900">Penalizações activas</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{activePenalties.length}</span></div>
          {activePenalties.length === 0 ? <EmptyState icon={AlertTriangle} title="Não existem penalizações activas." /> : activePenalties.map(renderPenalty)}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900">Histórico</h2>
          {history.length === 0 ? <EmptyState icon={CheckCircle2} title="Ainda não existem penalizações resolvidas." /> : history.map(renderPenalty)}
        </section>
      </>}
    </div>
  );
}
