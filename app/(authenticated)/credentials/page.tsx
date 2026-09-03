"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShieldCheck } from "lucide-react";

export default function CredentialsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Credenciais Verificáveis"
        description="Atestados criptográficos descentralizados baseados no histórico de contribuições válidas."
      />

      <EmptyState
        icon={ShieldCheck}
        title="Módulo de Credenciais Verificáveis preparado"
        description="A fundação da aplicação está concluída. As operações de consulta, detalhe técnico de provas criptográficas, verificação e revogação serão ativadas no módulo correspondente."
      />
    </div>
  );
}
