"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, FileJson, ShieldX } from "lucide-react";
import { credentialsApi } from "@/lib/api/credentials";
import { groupsApi } from "@/lib/api/groups";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { VerifiableCredential } from "@/types/credentials";
import type { Group } from "@/types/groups";

interface PageProps {
  params: Promise<{ credentialId: string }>;
}

export default function CredentialDetailPage({ params }: PageProps) {
  const { credentialId } = use(params);
  const [credential, setCredential] = useState<VerifiableCredential | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showDocument, setShowDocument] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [credentialData, groupData] = await Promise.all([
        credentialsApi.getCredential(credentialId),
        groupsApi.listGroups(),
      ]);
      setCredential(credentialData);
      setGroups(groupData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a credencial.");
    } finally {
      setIsLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canRevoke = useMemo(() => {
    if (!credential || credential.effective_status !== "ACTIVE") return false;
    const group = groups.find((item) => String(item.id) === String(credential.group_id));
    return Boolean(
      group &&
        (group.user_role === "MANAGER" ||
          group.role === "MANAGER" ||
          group.my_role === "MANAGER")
    );
  }, [credential, groups]);

  const handleCopy = async () => {
    if (!credential) return;
    await navigator.clipboard.writeText(JSON.stringify(credential.credential_document, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!credential || !canRevoke) return;
    setIsRevoking(true);
    setRevokeError(null);
    try {
      await credentialsApi.revokeCredential(credential.id, { reason: reason.trim() });
      setCredential(await credentialsApi.getCredential(credential.id));
      setReason("");
    } catch (err: unknown) {
      setRevokeError(err instanceof Error ? err.message : "Não foi possível revogar a credencial.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/credentials" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Voltar às credenciais
      </Link>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : credential ? (
        <>
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Credencial Verificável</p>
                <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{credential.group_name}</h1>
                <p className="mt-1 text-sm text-slate-500">Titular: {credential.holder_name || "—"}</p>
              </div>
              <StatusBadge status={credential.effective_status} />
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Tipo" value={credential.credential_type} />
              <Info label="Período" value={`${formatDate(credential.period_start)} – ${formatDate(credential.period_end)}`} />
              <Info label="Emitida por" value={credential.issued_by_name || "—"} />
              <Info label="Válida desde" value={formatDate(credential.valid_from)} />
              <Info label="Válida até" value={formatDate(credential.valid_until)} />
              <Info label="Revogada em" value={credential.revoked_at ? formatDate(credential.revoked_at) : "—"} />
            </dl>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Emissor</p>
              <p className="break-all rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">{credential.issuer}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Titular DID</p>
              <p className="break-all rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">{credential.holder}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Hash da credencial</p>
              <p className="break-all rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">{credential.credential_hash}</p>
            </div>

            {credential.revocation_reason && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <span className="font-semibold">Motivo da revogação:</span> {credential.revocation_reason}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowDocument((value) => !value)}
              className="flex min-h-[52px] w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:px-6"
            >
              <span className="flex items-center gap-2"><FileJson className="h-4 w-4" /> Documento da credencial</span>
              <span className="text-xs text-slate-400">{showDocument ? "Ocultar" : "Mostrar"}</span>
            </button>
            {showDocument && (
              <div className="space-y-3 border-t border-slate-200 p-5 sm:p-6">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleCopy} leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}>
                    {copied ? "Copiado" : "Copiar JSON"}
                  </Button>
                </div>
                <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-100">
                  {JSON.stringify(credential.credential_document, null, 2)}
                </pre>
              </div>
            )}
          </section>

          {canRevoke && (
            <section className="space-y-4 rounded-xl border border-rose-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldX className="mt-0.5 h-5 w-5 text-rose-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">Revogar Credencial Verificável</h2>
                  <p className="mt-1 text-xs text-slate-500">A revogação é permanente. O motivo é opcional segundo a API.</p>
                </div>
              </div>
              {revokeError && <ErrorAlert message={revokeError} onDismiss={() => setRevokeError(null)} />}
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Motivo da revogação (opcional)"
                disabled={isRevoking}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100"
              />
              <Button variant="destructive" isLoading={isRevoking} onClick={handleRevoke}>Revogar credencial</Button>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value || "—"}</dd>
    </div>
  );
}
