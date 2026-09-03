"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { createGroupSchema, type CreateGroupFormData } from "@/schemas/group";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/types/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  FileText,
  Settings2,
  Users,
} from "lucide-react";

export default function NewGroupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      settings: {
        contribution_amount: "1000.00",
        contribution_frequency: "MONTHLY",
        maximum_members: 10,
        rotation_strategy: "FIXED_ORDER",
        requires_consensus: true,
        allow_manual_contributions: true,
        currency: "MZN",
      },
    },
    mode: "onBlur",
  });

  const requiresConsensus = watch("settings.requires_consensus");
  const allowManualContributions = watch("settings.allow_manual_contributions");

  const handleNextStep = async () => {
    setGeneralError(null);
    const isStep1Valid = await trigger(["name", "description"]);
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setGeneralError(null);
    setCurrentStep(1);
  };

  const onSubmit = async (data: CreateGroupFormData) => {
    setGeneralError(null);
    try {
      // Normaliza o montante para o formato string Decimal com 2 casas (ex: "1000.00")
      const parsedAmount = parseFloat(
        data.settings.contribution_amount.replace(",", ".")
      );
      const normalizedAmount = isNaN(parsedAmount)
        ? data.settings.contribution_amount
        : parsedAmount.toFixed(2);

      // Payload exacto conforme a especificação:
      // {
      //   name, description, settings: {
      //     contribution_amount, contribution_frequency, maximum_members,
      //     rotation_strategy, requires_consensus, allow_manual_contributions, currency
      //   }
      // }
      const payload = {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : "",
        settings: {
          contribution_amount: normalizedAmount,
          contribution_frequency: data.settings.contribution_frequency,
          maximum_members: Number(data.settings.maximum_members),
          rotation_strategy: data.settings.rotation_strategy,
          requires_consensus: Boolean(data.settings.requires_consensus),
          allow_manual_contributions: Boolean(
            data.settings.allow_manual_contributions
          ),
          currency: data.settings.currency.trim() || "MZN",
        },
      };

      const result = await groupsApi.createGroup(payload);

      // Se o ID estiver presente na resposta, redireciona para o detalhe do grupo
      if (result && (result as { id?: string | number }).id) {
        router.push(`/groups/${(result as { id: string | number }).id}`);
      } else {
        router.push("/groups");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          Object.entries(err.fieldErrors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : messages;
            if (field.startsWith("settings.")) {
              const subField = field.replace("settings.", "");
              setError(`settings.${subField}` as unknown as `settings.${keyof CreateGroupFormData["settings"]}`, {
                type: "server",
                message,
              });
            } else if (field in data) {
              setError(field as keyof CreateGroupFormData, {
                type: "server",
                message,
              });
            }
          });
        }
        setGeneralError(err.message);
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao criar o grupo. Tente novamente.";
        setGeneralError(msg);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho de Navegação */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3 py-1 -ml-1 min-h-[44px] items-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos grupos</span>
        </Link>
        <PageHeader
          title="Criar novo grupo"
          description="Configure o círculo de poupança comunitária Xitique com regras transparentes."
        />
      </div>

      {/* Indicador de Etapas */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
              currentStep === 1
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                currentStep === 1
                  ? "bg-white text-slate-900"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              1
            </span>
            <span className="truncate">Informação do grupo</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
              currentStep === 2
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                currentStep === 2
                  ? "bg-white text-slate-900"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              2
            </span>
            <span className="truncate">Configurações</span>
          </button>
        </div>
      </div>

      {/* Alerta de erro geral */}
      {generalError && (
        <ErrorAlert
          message={generalError}
          onDismiss={() => setGeneralError(null)}
        />
      )}

      {/* Formulário Principal */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6"
      >
        {/* ETAPA 1: Informação do Grupo */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Informação Geral do Grupo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina o nome e propósito do grupo para identificação dos membros.
              </p>
            </div>

            <FormField
              id="name"
              label="Nome do grupo"
              required
              error={errors.name?.message}
              hint="Ex: Xitique Família, Poupança Colegas"
            >
              <Input
                id="name"
                placeholder="Introduza o nome do grupo"
                hasError={!!errors.name}
                {...register("name")}
              />
            </FormField>

            <FormField
              id="description"
              label="Descrição"
              error={errors.description?.message}
              hint="Opcional. Explique os objetivos deste ciclo de poupança."
            >
              <textarea
                id="description"
                rows={3}
                placeholder="Ex: Círculo mensal familiar para despesas escolares e emergências."
                className="flex w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-slate-900 shadow-xs transition-colors"
                {...register("description")}
              />
            </FormField>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="primary"
                size="default"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Continuar para Configurações
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 2: Configurações do Grupo */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-500" />
                Regras e Configurações Financeiras
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores, periodicidade e governação do círculo de poupança.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="contribution_amount"
                label="Valor da contribuição"
                required
                error={errors.settings?.contribution_amount?.message}
                hint="Valor que cada membro entrega por ciclo."
              >
                <div className="relative">
                  <Input
                    id="contribution_amount"
                    placeholder="1000.00"
                    hasError={!!errors.settings?.contribution_amount}
                    {...register("settings.contribution_amount")}
                  />
                </div>
              </FormField>

              <FormField
                id="currency"
                label="Moeda"
                required
                error={errors.settings?.currency?.message}
                hint="Padrão em Meticais (MZN)."
              >
                <Input
                  id="currency"
                  placeholder="MZN"
                  hasError={!!errors.settings?.currency}
                  {...register("settings.currency")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="contribution_frequency"
                label="Frequência"
                required
                error={errors.settings?.contribution_frequency?.message}
                hint="Intervalo temporal entre contribuições."
              >
                <select
                  id="contribution_frequency"
                  className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  {...register("settings.contribution_frequency")}
                >
                  <option value="DAILY">Diária</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </FormField>

              <FormField
                id="maximum_members"
                label="Número máximo de membros"
                required
                error={errors.settings?.maximum_members?.message}
                hint="Limite de participantes no ciclo (mín. 2)."
              >
                <Input
                  id="maximum_members"
                  type="number"
                  min={2}
                  max={100}
                  placeholder="10"
                  hasError={!!errors.settings?.maximum_members}
                  {...register("settings.maximum_members", {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
            </div>

            <FormField
              id="rotation_strategy"
              label="Estratégia de rotação"
              required
              error={errors.settings?.rotation_strategy?.message}
              hint="Determina como os desembolsos serão atribuídos aos membros."
            >
              <select
                id="rotation_strategy"
                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                {...register("settings.rotation_strategy")}
              >
                <option value="FIXED_ORDER">Ordem fixa</option>
                <option value="RANDOM">Aleatória</option>
              </select>
            </FormField>

            {/* Governação e Contribuições Manuais */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  {...register("settings.requires_consensus")}
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    Requer consenso
                  </span>
                  <span className="text-slate-500 leading-relaxed">
                    Exige aprovação dos membros da cooperativa antes da liquidação dos desembolsos.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  {...register("settings.allow_manual_contributions")}
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    Permitir contribuições manuais
                  </span>
                  <span className="text-slate-500 leading-relaxed">
                    Permite aos tesoureiros registar pagamentos em numerário ou transferências manuais.
                  </span>
                </div>
              </label>
            </div>

            {/* Botões de Ação */}
            <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handlePrevStep}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Voltar à informação
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="default"
                isLoading={isSubmitting}
                leftIcon={<Check className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Criar grupo
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
