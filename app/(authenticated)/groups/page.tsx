"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/LoadingState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { GroupCard } from "@/components/groups/GroupCard";
import { groupsApi } from "@/lib/api/groups";
import type { Group } from "@/types/groups";
import { Users, Plus, RefreshCw } from "lucide-react";

export default function GroupsPage() {
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
          : "Não foi possível carregar a lista de grupos. Verifique a ligação ao servidor.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Grupos"
        description="Gestão e consulta dos seus grupos de poupança comunitária Xitique."
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

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <EmptyState
          icon={Users}
          title="Ainda não participa em nenhum grupo."
          description="Os grupos de Xitique permitem gerir contribuições regulares e rotações ordenadas entre membros."
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

      {!isLoading && !error && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
