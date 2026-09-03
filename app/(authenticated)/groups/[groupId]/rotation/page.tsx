"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ListOrdered, PlusCircle } from "lucide-react";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { groupsApi } from "@/lib/api/groups";
import { rotationApi } from "@/lib/api/rotation";
import { formatDate } from "@/lib/utils";
import {
  generateRotationSchema,
  type GenerateRotationFormData,
} from "@/schemas/rotation";
import type { GroupDetail } from "@/types/groups";
import type { RotationOrder } from "@/types/rotation";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

const fieldClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900";

export default function RotationPage({ params }: PageProps) {
  const { groupId } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [rotation, setRotation] = useState<RotationOrder[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GenerateRotationFormData>({
    resolver: zodResolver(generateRotationSchema),
    defaultValues: {
      cycle_number: 1,
      contribution_period: "",
    },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, rotationData] = await Promise.all([
        groupsApi.getGroup(groupId),
        rotationApi.listGroupRotation(groupId),
      ]);
      setGroup(groupData);
      setRotation(rotationData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a rotação.");
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

  const cycles = useMemo(
    () => Array.from(new Set(rotation.map((item) => item.cycle_number))).sort((a, b) => a - b),
    [rotation]
  );

  const displayedRotation = useMemo(
    () =>
      selectedCycle
        ? rotation.filter((item) => item.cycle_number === selectedCycle)
        : rotation,
    [rotation, selectedCycle]
  );

  const handleCycleChange = async (value: string) => {
    if (value === "ALL") {
      setSelectedCycle(undefined);
      const data = await rotationApi.listGroupRotation(groupId);
      setRotation(data);
      return;
    }

    const cycleNumber = Number(value);
    setSelectedCycle(cycleNumber);
    try {
      setError(null);
      const data = await rotationApi.listGroupRotation(groupId, cycleNumber);
      setRotation((current) => {
        const otherCycles = current.filter((item) => item.cycle_number !== cycleNumber);
        return [...otherCycles, ...data].sort(
          (a, b) => a.cycle_number - b.cycle_number || a.position - b.position
        );
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o ciclo seleccionado.");
    }
  };

  const submitRotation = async (data: GenerateRotationFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccess(null);
    try {
      await rotationApi.generateRotation(groupId, {
        cycle_number: data.cycle_number,
        contribution_period: data.contribution_period,
      });
      const refreshed = await rotationApi.listGroupRotation(groupId);
      setRotation(refreshed);
      setSelectedCycle(data.cycle_number);
      reset({ cycle_number: data.cycle_number + 1, contribution_period: "" });
      setSuccess("Rotação gerada com sucesso.");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Não foi possível gerar a rotação.");
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
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && group && (
        <>
          <GroupHeaderNav group={group} activeTab="rotation" />

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {isManager && (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-slate-700" />
                <div>
                  <h2 className="font-semibold text-slate-900">Gerar rotação</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    A ordem é determinada pelo backend segundo a estratégia configurada no grupo.
                  </p>
                </div>
              </div>
              {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
              <form onSubmit={handleSubmit(submitRotation)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Número do ciclo</label>
                  <input
                    type="number"
                    min={1}
                    {...register("cycle_number", { valueAsNumber: true })}
                    disabled={isSubmitting}
                    className={fieldClass}
                  />
                  {errors.cycle_number && <p className="mt-1 text-xs text-rose-600">{errors.cycle_number.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Período da contribuição</label>
                  <input type="date" {...register("contribution_period")} disabled={isSubmitting} className={fieldClass} />
                  {errors.contribution_period && <p className="mt-1 text-xs text-rose-600">{errors.contribution_period.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" isLoading={isSubmitting}>Gerar rotação</Button>
                </div>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-slate-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">Ordem de rotação</h2>
                  {group.settings?.rotation_strategy && (
                    <p className="text-xs text-slate-500">
                      Estratégia: {group.settings.rotation_strategy === "FIXED_ORDER" ? "Ordem fixa" : "Aleatória"}
                    </p>
                  )}
                </div>
              </div>

              {cycles.length > 1 && (
                <select
                  value={selectedCycle ?? "ALL"}
                  onChange={(event) => handleCycleChange(event.target.value)}
                  className={`${fieldClass} sm:w-48`}
                >
                  <option value="ALL">Todos os ciclos</option>
                  {cycles.map((cycle) => (
                    <option key={cycle} value={cycle}>Ciclo {cycle}</option>
                  ))}
                </select>
              )}
            </div>

            {displayedRotation.length === 0 ? (
              <EmptyState
                icon={ListOrdered}
                title="A rotação ainda não foi gerada."
                description={
                  isManager
                    ? "Utilize a opção acima para gerar o primeiro ciclo de rotação."
                    : "Aguarde até que o gestor gere a rotação do grupo."
                }
              />
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {displayedRotation.map((item) => (
                    <article
                      key={item.id}
                      className={`relative rounded-xl border bg-white p-4 shadow-xs ${
                        item.status === "CURRENT" ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {item.position}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{item.member_name || "Membro"}</p>
                            <StatusBadge
                              status={item.status}
                              customLabel={item.status === "CURRENT" ? "Beneficiário actual" : undefined}
                            />
                          </div>
                          {item.member_phone_number && (
                            <p className="mt-1 text-xs text-slate-500">{item.member_phone_number}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Ciclo {item.cycle_number}</span>
                            <span>Período {formatDate(item.contribution_period)}</span>
                            <span>Versão {item.settings_version}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Posição</th>
                        <th className="px-4 py-3 font-semibold">Membro</th>
                        <th className="px-4 py-3 font-semibold">Ciclo</th>
                        <th className="px-4 py-3 font-semibold">Período</th>
                        <th className="px-4 py-3 font-semibold">Estado</th>
                        <th className="px-4 py-3 font-semibold">Versão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedRotation.map((item) => (
                        <tr key={item.id} className={item.status === "CURRENT" ? "bg-blue-50/40" : undefined}>
                          <td className="px-4 py-3 font-bold text-slate-700">{item.position}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{item.member_name || "Membro"}</p>
                            {item.member_phone_number && <p className="text-xs text-slate-500">{item.member_phone_number}</p>}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.cycle_number}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(item.contribution_period)}</td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={item.status}
                              customLabel={item.status === "CURRENT" ? "Beneficiário actual" : undefined}
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-600">{item.settings_version}</td>
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
