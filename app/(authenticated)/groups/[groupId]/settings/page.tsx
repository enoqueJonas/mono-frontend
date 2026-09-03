"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  ShieldAlert,
  Coins,
  Calendar,
  Users,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Archive,
  Save,
} from "lucide-react";
import { groupsApi } from "@/lib/api/groups";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMoney } from "@/lib/utils";
import {
  updateSettingsSchema,
  type UpdateSettingsFormData,
} from "@/schemas/group";
import {
  FREQUENCY_LABELS,
  ROTATION_LABELS,
  type GroupDetail,
  type ContributionFrequency,
  type RotationStrategy,
} from "@/types/groups";

interface GroupSettingsPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const router = useRouter();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de actualização
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Estados de arquivamento (Zona de Risco)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // Form de edição com React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateSettingsFormData>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      contribution_amount: "1000.00",
      currency: "MZN",
      contribution_frequency: "MONTHLY",
      maximum_members: 10,
      rotation_strategy: "FIXED_ORDER",
      requires_consensus: false,
      allow_manual_contributions: true,
    },
  });

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupsApi.getGroup(groupId);
      setGroup(data);
      if (data.settings) {
        reset({
          contribution_amount: data.settings.contribution_amount
            ? String(data.settings.contribution_amount)
            : "1000.00",
          currency: data.settings.currency || "MZN",
          contribution_frequency:
            data.settings.contribution_frequency || "MONTHLY",
          maximum_members: Number(data.settings.maximum_members) || 10,
          rotation_strategy:
            data.settings.rotation_strategy || "FIXED_ORDER",
          requires_consensus: Boolean(data.settings.requires_consensus),
          allow_manual_contributions: Boolean(
            data.settings.allow_manual_contributions
          ),
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as configurações do grupo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, reset]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Verificar papel do utilizador (Gestor vs Membro comum)
  const isManager =
    group?.user_role === "MANAGER" ||
    group?.role === "MANAGER" ||
    group?.my_role === "MANAGER";

  // Identificar versão das configurações se devolvida pela API (sem inventar)
  const rawVersion =
    group?.settings?.version ??
    (group as unknown as Record<string, unknown>)?.settings_version ??
    (group as unknown as Record<string, unknown>)?.version;
  const settingsVersionDisplay =
    rawVersion !== undefined && rawVersion !== null
      ? `Versão ${rawVersion}`
      : null;

  // Submeter actualização das configurações
  const handleSaveSettings = async (data: UpdateSettingsFormData) => {
    setSaveError(null);
    setSuccessFeedback(null);
    setIsSaving(true);

    try {
      // Garantir formato decimal limpo e valores padrão estritos
      const payload = {
        contribution_amount: data.contribution_amount.replace(",", "."),
        currency: data.currency.trim(),
        contribution_frequency: data.contribution_frequency,
        maximum_members: Number(data.maximum_members),
        rotation_strategy: data.rotation_strategy,
        requires_consensus: Boolean(data.requires_consensus),
        allow_manual_contributions: Boolean(data.allow_manual_contributions),
      };

      await groupsApi.updateGroupSettings(groupId, payload);
      setSuccessFeedback("Configurações do grupo actualizadas com sucesso.");

      // Recarregar os dados do grupo actualizados
      await loadGroup();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível guardar as alterações às configurações.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Executar arquivamento do grupo
  const handleConfirmArchive = async () => {
    setIsArchiving(true);
    setArchiveError(null);

    try {
      await groupsApi.archiveGroup(groupId);
      setIsArchiveDialogOpen(false);
      // Redireccionar para a lista de grupos
      router.push("/groups");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao tentar arquivar o grupo.";
      setArchiveError(message);
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alerta de erro global */}
      {error && <ErrorAlert message={error} onRetry={loadGroup} />}

      {/* Skeletons durante carregamento */}
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && group && (
        <>
          {/* Navegação e Cabeçalho Unificados */}
          <GroupHeaderNav group={group} activeTab="settings" />

          {/* Feedback de sucesso */}
          {successFeedback && (
            <div
              role="status"
              className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successFeedback}</span>
            </div>
          )}

          {/* Cabeçalho da secção de Configurações */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                Regras e Parâmetros do Xitique
              </h2>
            </div>
            {settingsVersionDisplay && (
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                {settingsVersionDisplay}
              </span>
            )}
          </div>

          {/* MODO GESTOR: FORMULÁRIO DE EDIÇÃO */}
          {isManager ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              {saveError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(handleSaveSettings)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Valor da Contribuição */}
                  <div>
                    <label
                      htmlFor="settings-amount-input"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Valor da Contribuição
                    </label>
                    <div className="relative">
                      <input
                        id="settings-amount-input"
                        type="text"
                        inputMode="decimal"
                        placeholder="1000.00"
                        disabled={isSaving}
                        {...register("contribution_amount")}
                        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px] ${
                          errors.contribution_amount
                            ? "border-rose-500 focus:ring-rose-500"
                            : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.contribution_amount && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.contribution_amount.message}
                      </p>
                    )}
                  </div>

                  {/* Moeda */}
                  <div>
                    <label
                      htmlFor="settings-currency-input"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Moeda
                    </label>
                    <input
                      id="settings-currency-input"
                      type="text"
                      disabled={isSaving}
                      {...register("currency")}
                      className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px] ${
                        errors.currency
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.currency && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.currency.message}
                      </p>
                    )}
                  </div>

                  {/* Frequência da Contribuição */}
                  <div>
                    <label
                      htmlFor="settings-frequency-select"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Frequência da Contribuição
                    </label>
                    <select
                      id="settings-frequency-select"
                      disabled={isSaving}
                      {...register("contribution_frequency")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px]"
                    >
                      <option value="DAILY">
                        {FREQUENCY_LABELS.DAILY} (Diária)
                      </option>
                      <option value="WEEKLY">
                        {FREQUENCY_LABELS.WEEKLY} (Semanal)
                      </option>
                      <option value="BIWEEKLY">
                        {FREQUENCY_LABELS.BIWEEKLY} (Quinzenal)
                      </option>
                      <option value="MONTHLY">
                        {FREQUENCY_LABELS.MONTHLY} (Mensal)
                      </option>
                    </select>
                    {errors.contribution_frequency && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.contribution_frequency.message}
                      </p>
                    )}
                  </div>

                  {/* Número Máximo de Membros */}
                  <div>
                    <label
                      htmlFor="settings-max-members-input"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Número Máximo de Membros
                    </label>
                    <input
                      id="settings-max-members-input"
                      type="number"
                      min={2}
                      max={100}
                      disabled={isSaving}
                      {...register("maximum_members", { valueAsNumber: true })}
                      className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px] ${
                        errors.maximum_members
                          ? "border-rose-500 focus:ring-rose-500"
                          : "border-slate-200"
                      }`}
                    />
                    {errors.maximum_members && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.maximum_members.message}
                      </p>
                    )}
                  </div>

                  {/* Estratégia de Rotação */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="settings-rotation-select"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Estratégia de Rotação
                    </label>
                    <select
                      id="settings-rotation-select"
                      disabled={isSaving}
                      {...register("rotation_strategy")}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px]"
                    >
                      <option value="FIXED_ORDER">
                        {ROTATION_LABELS.FIXED_ORDER} (Ordem fixa de adesão)
                      </option>
                      <option value="RANDOM">
                        {ROTATION_LABELS.RANDOM} (Sorteio aleatório)
                      </option>
                    </select>
                    {errors.rotation_strategy && (
                      <p className="mt-1 text-xs text-rose-600">
                        {errors.rotation_strategy.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Opções Booleanas de Governança */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      id="settings-consensus-checkbox"
                      type="checkbox"
                      disabled={isSaving}
                      {...register("requires_consensus")}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 block group-hover:text-slate-800">
                        Requer consenso para desembolsos
                      </span>
                      <span className="text-xs text-slate-500 block leading-relaxed">
                        Exige a aprovação da maioria dos membros antes de libertar
                        o fundo de rotação.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      id="settings-manual-contributions-checkbox"
                      type="checkbox"
                      disabled={isSaving}
                      {...register("allow_manual_contributions")}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-900 block group-hover:text-slate-800">
                        Permite contribuições manuais
                      </span>
                      <span className="text-xs text-slate-500 block leading-relaxed">
                        Permite que os membros registem depósitos manuais directos
                        fora de canais automáticos.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Botão de Gravar */}
                <div className="pt-4 flex justify-end">
                  <Button
                    id="save-settings-submit-btn"
                    type="submit"
                    disabled={isSaving}
                    isLoading={isSaving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span>Guardar alterações</span>
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* MODO LEITURA (MEMBROS NÃO-GESTORES) */
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  Apenas o gestor do grupo pode alterar estas configurações.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Valor da Contribuição
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {group.settings?.contribution_amount
                      ? formatMoney(
                          group.settings.contribution_amount,
                          group.settings.currency || "MZN"
                        )
                      : "Não definido"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Moeda
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {group.settings?.currency || "MZN"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Frequência
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {group.settings?.contribution_frequency
                      ? FREQUENCY_LABELS[
                          group.settings
                            .contribution_frequency as ContributionFrequency
                        ] || group.settings.contribution_frequency
                      : "Não definida"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Limite de Membros
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {group.settings?.maximum_members
                      ? `${group.settings.maximum_members} participantes`
                      : "Sem limite"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Estratégia de Rotação
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {group.settings?.rotation_strategy
                      ? ROTATION_LABELS[
                          group.settings.rotation_strategy as RotationStrategy
                        ] || group.settings.rotation_strategy
                      : "Não definida"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Regras de Governança
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          group.settings?.requires_consensus
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <span>
                        Requer consenso para desembolsos:{" "}
                        <strong className="text-slate-900">
                          {group.settings?.requires_consensus ? "Sim" : "Não"}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          group.settings?.allow_manual_contributions
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <span>
                        Permite contribuições manuais:{" "}
                        <strong className="text-slate-900">
                          {group.settings?.allow_manual_contributions
                            ? "Sim"
                            : "Não"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ZONA DE RISCO (APENAS PARA GESTOR) */}
          {isManager && (
            <div
              id="danger-zone-section"
              className="bg-white rounded-xl border border-rose-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold">Zona de risco</h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Arquivar este grupo encerra as actividades do Xitique. Esta acção
                não pode ser desfeita facilmente.
              </p>

              {archiveError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{archiveError}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  id="archive-group-btn"
                  onClick={() => setIsArchiveDialogOpen(true)}
                  disabled={isArchiving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-semibold text-sm transition-colors min-h-[44px]"
                >
                  <Archive className="w-4 h-4 text-rose-600" />
                  <span>Arquivar grupo</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Diálogo de Confirmação para Arquivar Grupo */}
      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => {
          if (!isArchiving) {
            setIsArchiveDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmArchive}
        title="Arquivar grupo"
        description={`Tem a certeza que deseja arquivar o grupo ${
          group?.name || ""
        }? Os membros não poderão realizar novas contribuições ou rotações.`}
        confirmText="Arquivar grupo"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isArchiving}
      />
    </div>
  );
}
