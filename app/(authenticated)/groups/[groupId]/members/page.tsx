"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Users, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { groupsApi } from "@/lib/api/groups";
import { GroupHeaderNav } from "@/components/groups/GroupHeaderNav";
import { MemberCard } from "@/components/groups/MemberCard";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { addMemberSchema, type AddMemberFormData } from "@/schemas/group";
import type { GroupDetail, GroupMember } from "@/types/groups";

interface GroupMembersPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default function GroupMembersPage({ params }: GroupMembersPageProps) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de gestão de membros
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Estado do diálogo de confirmação para remoção
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  // Form de adição de membro (React Hook Form + Zod)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      phone_number: "",
    },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, membersData] = await Promise.all([
        groupsApi.getGroup(groupId),
        groupsApi.listGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os membros do grupo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verificar se utilizador tem permissão de gestor (apenas para UX, backend autoritativo)
  const isManager =
    group?.user_role === "MANAGER" ||
    group?.role === "MANAGER" ||
    group?.my_role === "MANAGER";

  // Submissão do formulário de adição
  const handleAddMember = async (data: AddMemberFormData) => {
    setAddMemberError(null);
    setSuccessFeedback(null);
    setIsAdding(true);
    try {
      await groupsApi.addGroupMember(groupId, {
        phone_number: data.phone_number.trim(),
      });
      reset();
      setSuccessFeedback("Membro adicionado com sucesso ao grupo.");
      // Actualizar lista de membros e dados do grupo
      const updatedMembers = await groupsApi.listGroupMembers(groupId);
      setMembers(updatedMembers);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível adicionar o membro. Verifique o número e tente novamente.";
      setAddMemberError(message);
    } finally {
      setIsAdding(false);
    }
  };

  // Confirmar remoção de membro
  const handleConfirmRemove = async () => {
    if (!selectedMemberToRemove) return;
    setIsRemoving(true);
    setAddMemberError(null);
    setSuccessFeedback(null);
    try {
      await groupsApi.removeGroupMember(groupId, selectedMemberToRemove.id);
      setSelectedMemberToRemove(null);
      setSuccessFeedback("Membro removido do grupo com sucesso.");
      // Actualizar lista
      const updatedMembers = await groupsApi.listGroupMembers(groupId);
      setMembers(updatedMembers);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao tentar remover o membro.";
      setError(message);
      setSelectedMemberToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  // Nome formatado para o diálogo de remoção
  const getMemberDisplayName = (m: GroupMember | null) => {
    if (!m) return "";
    const userObj =
      typeof m.user === "object" && m.user !== null ? m.user : null;
    const name =
      m.name ||
      (userObj
        ? `${userObj.first_name || ""} ${userObj.last_name || ""}`.trim()
        : "") ||
      m.phone_number ||
      (userObj ? userObj.phone_number : null) ||
      `Membro #${m.id}`;
    return name;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Alerta de erro global */}
      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Skeletons durante carregamento inicial */}
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      )}

      {!isLoading && group && (
        <>
          {/* Navegação e Cabeçalho Unificados */}
          <GroupHeaderNav group={group} activeTab="members" />

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

          {/* Form de Adicionar Membro (Apenas para Gestor) */}
          {isManager && (
            <div
              id="add-member-section"
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-semibold text-slate-900">
                  Adicionar membro
                </h2>
              </div>

              {addMemberError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{addMemberError}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(handleAddMember)}
                className="space-y-4 max-w-xl"
              >
                <div>
                  <label
                    htmlFor="member-phone-input"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Número de telefone
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1">
                      <input
                        id="member-phone-input"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+258 84 123 4567"
                        disabled={isAdding}
                        {...register("phone_number")}
                        className={`w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors min-h-[44px] ${
                          errors.phone_number
                            ? "border-rose-500 focus:ring-rose-500"
                            : "border-slate-200"
                        }`}
                      />
                      {errors.phone_number && (
                        <p className="mt-1 text-xs text-rose-600">
                          {errors.phone_number.message}
                        </p>
                      )}
                    </div>
                    <Button
                      id="add-member-submit-btn"
                      type="submit"
                      disabled={isAdding}
                      isLoading={isAdding}
                      leftIcon={<UserPlus className="w-4 h-4" />}
                      className="shrink-0 whitespace-nowrap"
                    >
                      Adicionar membro
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    O participante deve estar previamente registado no MONO.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Cabeçalho da Lista de Membros */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Membros do Grupo
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {members.length}
                {group.settings?.maximum_members
                  ? ` / ${group.settings.maximum_members}`
                  : ""}
              </span>
            </div>
          </div>

          {/* Lista de Membros ou Estado Vazio */}
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Este grupo ainda não tem membros."
              description={
                isManager
                  ? "Utilize o campo acima para adicionar o primeiro participante através do número de telefone."
                  : "Aguarde até que o gestor do grupo adicione participantes ao Xitique."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isManager={isManager}
                  onRemove={(m) => setSelectedMemberToRemove(m)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Diálogo de Confirmação para Remoção de Membro */}
      <ConfirmDialog
        isOpen={Boolean(selectedMemberToRemove)}
        onClose={() => {
          if (!isRemoving) {
            setSelectedMemberToRemove(null);
          }
        }}
        onConfirm={handleConfirmRemove}
        title="Remover membro do grupo"
        description={`Tem a certeza que deseja remover ${getMemberDisplayName(
          selectedMemberToRemove
        )} do grupo? Esta acção cancela a participação deste membro no Xitique.`}
        confirmText="Remover membro"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isRemoving}
      />
    </div>
  );
}
