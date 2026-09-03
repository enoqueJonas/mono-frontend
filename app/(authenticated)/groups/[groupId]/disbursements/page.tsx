"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, CheckCircle2, PlusCircle } from "lucide-react";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { disbursementsApi } from "@/lib/api/disbursements";
import { groupsApi } from "@/lib/api/groups";
import { formatDate, formatMoney } from "@/lib/utils";
import { createDisbursementSchema, type CreateDisbursementFormData } from "@/schemas/disbursement";
import type { Disbursement } from "@/types/disbursements";
import type { GroupDetail } from "@/types/groups";

interface PageProps { params: Promise<{ groupId: string }>; }

type PendingAction = { type: "approve" | "complete"; item: Disbursement } | null;

export default function DisbursementsPage({ params }: PageProps) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [items, setItems] = useState<Disbursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDisbursementFormData>({
    resolver: zodResolver(createDisbursementSchema),
    defaultValues: { cycle_number: 1 },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [groupData, disbursementData] = await Promise.all([
        groupsApi.getGroup(groupId),
        disbursementsApi.listGroupDisbursements(groupId),
      ]);
      setGroup(groupData);
      setItems(disbursementData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os desembolsos.");
    } finally { setIsLoading(false); }
  }, [groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  const isManager = group?.user_role === "MANAGER" || group?.role === "MANAGER" || group?.my_role === "MANAGER";

  const createDisbursement = async (data: CreateDisbursementFormData) => {
    setIsSubmitting(true); setFormError(null); setSuccess(null);
    try {
      await disbursementsApi.createDisbursement(groupId, { cycle_number: data.cycle_number });
      setItems(await disbursementsApi.listGroupDisbursements(groupId));
      reset({ cycle_number: data.cycle_number + 1 });
      setSuccess("Desembolso criado com sucesso.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Não foi possível criar o desembolso.");
    } finally { setIsSubmitting(false); }
  };

  const runAction = async () => {
    if (!pendingAction) return;
    setIsActionRunning(true); setError(null); setSuccess(null);
    try {
      if (pendingAction.type === "approve") {
        await disbursementsApi.approveDisbursement(groupId, pendingAction.item.id);
        setSuccess("Desembolso aprovado com sucesso.");
      } else {
        await disbursementsApi.completeDisbursement(groupId, pendingAction.item.id);
        setSuccess("Desembolso concluído com sucesso. A rotação foi avançada pelo backend.");
      }
      setItems(await disbursementsApi.listGroupDisbursements(groupId));
      setPendingAction(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
      setPendingAction(null);
    } finally { setIsActionRunning(false); }
  };

  const renderCard = (item: Disbursement) => (
    <article key={item.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Ciclo {item.cycle_number}</p>
          <h3 className="mt-1 font-semibold text-slate-900">{item.beneficiary_name || "Beneficiário"}</h3>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatMoney(item.amount, item.currency)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">
        <div><p className="text-slate-400">Período</p><p className="mt-1 font-medium text-slate-700">{formatDate(item.contribution_period)}</p></div>
        <div><p className="text-slate-400">Versão</p><p className="mt-1 font-medium text-slate-700">{item.settings_version}</p></div>
        <div><p className="text-slate-400">Solicitado em</p><p className="mt-1 font-medium text-slate-700">{formatDate(item.requested_at)}</p></div>
        <div><p className="text-slate-400">Concluído em</p><p className="mt-1 font-medium text-slate-700">{formatDate(item.completed_at)}</p></div>
      </div>
      {item.failure_reason && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{item.failure_reason}</div>}
      {isManager && item.status !== "COMPLETED" && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {item.status === "AWAITING_CONSENSUS" && <Button size="sm" onClick={() => setPendingAction({ type: "approve", item })}>Aprovar</Button>}
          {item.status === "APPROVED" && <Button size="sm" onClick={() => setPendingAction({ type: "complete", item })}>Marcar como concluído</Button>}
        </div>
      )}
    </article>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {error && <ErrorAlert message={error} onRetry={loadData} />}
      {isLoading && <div className="space-y-4"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-36 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>}

      {!isLoading && group && <>
        <GroupHeaderNav group={group} activeTab="disbursements" />
        {success && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" />{success}</div>}

        {isManager && <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-slate-700" /><h2 className="font-semibold text-slate-900">Criar desembolso</h2></div>
          <p className="text-sm text-slate-500">Indique apenas o ciclo. O backend determina o beneficiário, valor, moeda e período a partir da rotação e das contribuições confirmadas.</p>
          {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
          <form onSubmit={handleSubmit(createDisbursement)} className="flex max-w-sm flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Número do ciclo</label>
              <input type="number" min={1} {...register("cycle_number", { valueAsNumber: true })} disabled={isSubmitting} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm" />
              {errors.cycle_number && <p className="mt-1 text-xs text-rose-600">{errors.cycle_number.message}</p>}
            </div>
            <Button type="submit" isLoading={isSubmitting}>Criar desembolso</Button>
          </form>
        </section>}

        <section className="space-y-3">
          <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-slate-600" /><h2 className="font-semibold text-slate-900">Desembolsos</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{items.length}</span></div>
          {items.length === 0 ? <EmptyState icon={Banknote} title="Este grupo ainda não possui desembolsos." description="Os desembolsos criados para os ciclos da rotação aparecerão aqui." /> : <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{items.map(renderCard)}</div>}
        </section>
      </>}

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={() => { if (!isActionRunning) setPendingAction(null); }}
        onConfirm={runAction}
        title={pendingAction?.type === "approve" ? "Aprovar desembolso" : "Concluir desembolso"}
        description={pendingAction?.type === "approve" ? "Confirma a aprovação deste desembolso?" : "Ao concluir, o backend marca o desembolso como concluído e avança a rotação para o próximo beneficiário."}
        confirmText={pendingAction?.type === "approve" ? "Aprovar" : "Concluir"}
        cancelText="Cancelar"
        isLoading={isActionRunning}
      />
    </div>
  );
}
