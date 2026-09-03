"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Fingerprint, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { identityApi } from "@/lib/api/identity";
import { formatDate } from "@/lib/utils";
import type { DIDDocument, DIDIdentity } from "@/types/identity";

export default function ProfilePage() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState<DIDIdentity | null>(null);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDidDocOpen, setIsDidDocOpen] = useState(false);

  const loadIdentity = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setIdentity(await identityApi.getMyDID());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a identidade descentralizada.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  const loadDocument = async () => {
    if (didDocument || isDocumentLoading) return;
    setIsDocumentLoading(true);
    setDocumentError(null);
    try {
      setDidDocument(await identityApi.getMyDIDDocument());
    } catch (err: unknown) {
      setDocumentError(err instanceof Error ? err.message : "Não foi possível carregar o DID Document.");
    } finally {
      setIsDocumentLoading(false);
    }
  };

  const toggleDocument = async () => {
    const next = !isDidDocOpen;
    setIsDidDocOpen(next);
    if (next) await loadDocument();
  };

  const handleCopyDid = async () => {
    if (!identity?.did) return;
    await navigator.clipboard.writeText(identity.did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Perfil / Identidade"
        description="Dados da sua conta e Identificador Descentralizado (DID) gerido pela plataforma MONO."
      />

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <h2 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
          <User className="h-4 w-4 text-slate-500" />
          Dados Pessoais
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <span className="mb-1 block text-xs font-medium text-slate-500">Nome Completo</span>
            <p className="text-sm font-semibold text-slate-900">
              {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—" : "—"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
              <Phone className="h-3 w-3 text-slate-400" />
              Número de Telefone
            </span>
            <p className="text-sm font-semibold text-slate-900">{user?.phone_number || "—"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Fingerprint className="h-4 w-4 text-blue-600" />
            Identificador Descentralizado (DID)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            O DID é criado e gerido pela plataforma. Não existe operação manual de geração ou alteração nesta interface.
          </p>
        </div>

        {error && <ErrorAlert message={error} onRetry={loadIdentity} />}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : identity ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">Seu DID</span>
                <p className="break-all rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 sm:text-sm">
                  {identity.did}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDid}
                leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                {copied ? "Copiado" : "Copiar DID"}
              </Button>
            </div>

            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <IdentityInfo label="Método" value={identity.method} />
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-400">Estado</dt>
                <dd className="mt-2"><StatusBadge status={identity.status} /></dd>
              </div>
              <IdentityInfo label="Criado em" value={formatDate(identity.created_at)} />
            </dl>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Método de verificação</p>
              <p className="break-all rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
                {identity.verification_method_id}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Chave pública multibase</p>
              <p className="break-all rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
                {identity.public_key_multibase}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={toggleDocument}
                className="flex min-h-[48px] w-full items-center justify-between bg-slate-50 px-4 py-3 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <span>DID Document</span>
                {isDidDocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isDidDocOpen && (
                <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                  {documentError && <ErrorAlert message={documentError} onRetry={loadDocument} />}
                  {isDocumentLoading ? (
                    <Skeleton className="h-48 w-full rounded-lg" />
                  ) : didDocument ? (
                    <pre className="max-h-[520px] overflow-auto rounded-md bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">
                      {JSON.stringify(didDocument, null, 2)}
                    </pre>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function IdentityInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</dd>
    </div>
  );
}
