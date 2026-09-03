import { apiClient } from "./client";
import type {
  Group,
  GroupDetail,
  CreateGroupPayload,
  GroupMember,
  AddGroupMemberPayload,
  UpdateGroupSettingsPayload,
  GroupSettings,
} from "@/types/groups";

/**
 * Serviço centralizado de gestão de grupos ligado à API DRF
 */
export const groupsApi = {
  /**
   * GET /api/v1/groups/
   * Lista os grupos do utilizador autenticado
   */
  async listGroups(): Promise<Group[]> {
    const response = await apiClient<unknown>("/api/v1/groups/", {
      method: "GET",
    });

    if (Array.isArray(response)) {
      return response as Group[];
    }
    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        return obj.data as Group[];
      }
      if (
        obj.data &&
        typeof obj.data === "object" &&
        Array.isArray((obj.data as Record<string, unknown>).results)
      ) {
        return (obj.data as Record<string, unknown>).results as Group[];
      }
      if (Array.isArray(obj.results)) {
        return obj.results as Group[];
      }
    }
    return [];
  },

  /**
   * GET /api/v1/groups/{group_id}/
   * Obtém os detalhes de um grupo específico
   */
  async getGroup(groupId: string | number): Promise<GroupDetail> {
    const response = await apiClient<unknown>(`/api/v1/groups/${groupId}/`, {
      method: "GET",
    });

    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object") {
        return obj.data as GroupDetail;
      }
      return obj as unknown as GroupDetail;
    }
    throw new Error("Formato de resposta inválido ao carregar grupo.");
  },

  /**
   * POST /api/v1/groups/
   * Cria um novo grupo com configurações especificadas
   */
  async createGroup(payload: CreateGroupPayload): Promise<GroupDetail | Group> {
    const response = await apiClient<unknown>("/api/v1/groups/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object") {
        return obj.data as GroupDetail;
      }
      return obj as unknown as GroupDetail;
    }
    return response as GroupDetail;
  },

  /**
   * GET /api/v1/groups/{group_id}/members/
   * Lista os membros do grupo especificado
   */
  async listGroupMembers(groupId: string | number): Promise<GroupMember[]> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/members/`,
      {
        method: "GET",
      }
    );

    if (Array.isArray(response)) {
      return response as GroupMember[];
    }
    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        return obj.data as GroupMember[];
      }
      if (
        obj.data &&
        typeof obj.data === "object" &&
        Array.isArray((obj.data as Record<string, unknown>).results)
      ) {
        return (obj.data as Record<string, unknown>).results as GroupMember[];
      }
      if (Array.isArray(obj.results)) {
        return obj.results as GroupMember[];
      }
    }
    return [];
  },

  /**
   * POST /api/v1/groups/{group_id}/members/
   * Adiciona um membro existente no MONO através do número de telefone
   */
  async addGroupMember(
    groupId: string | number,
    payload: AddGroupMemberPayload
  ): Promise<GroupMember> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/members/`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object") {
        return obj.data as GroupMember;
      }
      return obj as unknown as GroupMember;
    }
    return response as GroupMember;
  },

  /**
   * DELETE /api/v1/groups/{group_id}/members/{group_member_id}/
   * Remove a adesão do membro no grupo
   */
  async removeGroupMember(
    groupId: string | number,
    groupMemberId: string | number
  ): Promise<void> {
    await apiClient<unknown>(
      `/api/v1/groups/${groupId}/members/${groupMemberId}/`,
      {
        method: "DELETE",
      }
    );
  },

  /**
   * PATCH /api/v1/groups/{group_id}/settings/
   * Atualiza as configurações do grupo gerando uma nova versão no backend
   */
  async updateGroupSettings(
    groupId: string | number,
    payload: UpdateGroupSettingsPayload
  ): Promise<GroupSettings | GroupDetail> {
    const response = await apiClient<unknown>(
      `/api/v1/groups/${groupId}/settings/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );

    if (response && typeof response === "object") {
      const obj = response as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object") {
        return obj.data as GroupSettings;
      }
      return obj as unknown as GroupSettings;
    }
    return response as GroupSettings;
  },

  /**
   * DELETE /api/v1/groups/{group_id}/
   * Arquiva o grupo no backend (não elimina permanentemente)
   */
  async archiveGroup(groupId: string | number): Promise<void> {
    await apiClient<unknown>(`/api/v1/groups/${groupId}/`, {
      method: "DELETE",
    });
  },
};
