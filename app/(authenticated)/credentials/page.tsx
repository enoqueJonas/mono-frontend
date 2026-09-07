"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, FileCheck2, SearchCheck, ShieldCheck, Users } from "lucide-react";
import { credentialsApi } from "@/lib/api/credentials";
import { groupsApi } from "@/lib/api/groups";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  issueCredentialSchema,
  verifyCredentialSchema,
  type IssueCredentialFormData,
  type VerifyCredentialFormData,
} from "@/schemas/credential";
import type { VerifiableCredential } from "@/types/credentials";
import type { Group, GroupMember } from "@/types/groups";

const controlClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100";

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [managedCredentials, setManagedCredentials] = useState<VerifiableCredential[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [managedGroupFilter, setManagedGroupFilter] = useState("ALL");

  const issueForm = useForm<IssueCredentialFormData>({
    resolver: zodResolver(issueCredentialSchema),
    defaultValues: { group_id: "", group_member_id: "", period_start: "", period_end: "" },
  });

  const verifyForm = useForm<VerifyCredentialFormData>({
    resolver: zodResolver(verifyCredentialSchema),
    defaultValues: { credential_json: "" },
  });

  const managerGroups = useMemo(
    () => groups.filter((group) => group.user_role === "MANAGER" || group.role === "MANAGER" || group.my_role === "MANAGER"),
    [groups]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [credentialData, groupData] = await Promise.all([
        credentialsApi.listMyCredentials(),
        groupsApi.listGroups(),
      ]);
      setCredentials(credentialData);
      setGroups(groupData);

      const managedGroups = groupData.filter(
        (group) => group.user_role === "MANAGER" || group.role === "MANAGER" || group.my_role === "MANAGER"
      );
      const groupCredentialLists = await Promise.all(
        managedGroups.map((group) => credentialsApi.listGroupCredentials(String(group.id)))
      );
      setManagedCredentials(groupCredentialLists.flat());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as credenciais.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedGroupId = issueForm.watch("group_id");

  useEffect(() => {
    let active = true;
    issueForm.setValue("group_member_id", "");
    setMembers([]);
    if (!selectedGroupId) return;

    setIsLoadingMembers(true);
    groupsApi.listGroupMembers(selectedGroupId)
      .then((data) => { if (active) setMembers(data.filter((member) => member.status === "ACTIVE")); })
      .catch((err: unknown) => {
        if (active) setIssueError(err instanceof Error ? err.message : "Não foi possível carregar os membros do grupo.");
      })
      .finally(() => { if (active) setIsLoadingMembers(false); });

    return () => { active = false; };
  }, [issueForm, selectedGroupId]);

  const filteredManagedCredentials = useMemo(
    () => managedGroupFilter === "ALL"
      ? managedCredentials
      : managedCredentials.filter((credential) => String(credential.group_id) === managedGroupFilter),
    [managedCredentials, managedGroupFilter]
  );

  const memberName = (member: GroupMember) => {
    const user = typeof member.user === "object" && member.user ? member.user : null;
    return member.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || member.phone_number || user?.phone_number || String(member.id);
  };

  const submitIssue = async (data: IssueCredentialFormData) => {
    setIsIssuing(true);
    setIssueError(null);
    setSuccess(null);
    try {
      await credentialsApi.issueCredential(data.group_id, {
        group_member_id: data.group_member_id,
        period_start: data.period_start,
        period_end: data.period_end,
      });
      issueForm.reset();
      setMembers([]);
      setSuccess("Credencial Verificável emitida com sucesso.");
      await loadData();
    } catch (err: unknown) {
      setIssueError(err instanceof Error ? err.message : "Não foi possível emitir a credencial.");
    } finally {
      setIsIssuing(false);
    }
  };

  const submitVerification = async (data: VerifyCredentialFormData) => {
    setIsVerifying(true);
    setVerifyError(null);
    setVerificationResult(null);
    try {
      const parsed = JSON.parse(data.credential_json) as Record<string, unknown>;
      const result = await credentialsApi.verifyCredential({ credential: parsed });
      setVerificationResult(result.valid);
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Não foi possível verificar a credencial.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Credenciais Verificáveis" description="Consulte, emita e verifique credenciais baseadas no histórico confirmado de contribuições." />

      {error && <ErrorAlert message={error} onRetry={loadData} />}
      {success && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-xl" /></div>
      ) : (
        <>
          {managerGroups.length > 0 && (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 text-slate-700" />
                <div><h2 className="font-semibold text-slate-900">Emitir Credencial Verificável</h2><p className="mt-1 text-xs text-slate-500">Seleccione o grupo, o membro e o período do histórico que pretende certificar.</p></div>
              </div>
              {issueError && <ErrorAlert message={issueError} onDismiss={() => setIssueError(null)} />}
              <form onSubmit={issueForm.handleSubmit(submitIssue)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Grupo</label><select {...issueForm.register("group_id")} className={controlClass} disabled={isIssuing}><option value="">Seleccione o grupo</option>{managerGroups.map((group) => <option key={group.id} value={String(group.id)}>{group.name}</option>)}</select>{issueForm.formState.errors.group_id && <p className="mt-1 text-xs text-rose-600">{issueForm.formState.errors.group_id.message}</p>}</div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Membro</label><select {...issueForm.register("group_member_id")} className={controlClass} disabled={!selectedGroupId || isLoadingMembers || isIssuing}><option value="">{isLoadingMembers ? "A carregar membros..." : "Seleccione o membro"}</option>{members.map((member) => <option key={member.id} value={String(member.id)}>{memberName(member)}</option>)}</select>{issueForm.formState.errors.group_member_id && <p className="mt-1 text-xs text-rose-600">{issueForm.formState.errors.group_member_id.message}</p>}</div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Início do período</label><input type="date" {...issueForm.register("period_start")} className={controlClass} disabled={isIssuing} />{issueForm.formState.errors.period_start && <p className="mt-1 text-xs text-rose-600">{issueForm.formState.errors.period_start.message}</p>}</div>
                <div><label className="mb-1 block text-sm font-medium text-slate-700">Fim do período</label><input type="date" {...issueForm.register("period_end")} className={controlClass} disabled={isIssuing} />{issueForm.formState.errors.period_end && <p className="mt-1 text-xs text-rose-600">{issueForm.formState.errors.period_end.message}</p>}</div>
                <div className="md:col-span-2"><Button type="submit" isLoading={isIssuing}>Emitir Credencial Verificável</Button></div>
              </form>
            </section>
          )}

          {managerGroups.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-2"><Users className="mt-0.5 h-5 w-5 text-slate-600" /><div><h2 className="font-semibold text-slate-900">Credenciais dos meus grupos</h2><p className="mt-1 text-xs text-slate-500">Acompanhe as credenciais emitidas aos membros dos grupos que gere.</p></div></div>
                {managerGroups.length > 1 && <select value={managedGroupFilter} onChange={(event) => setManagedGroupFilter(event.target.value)} className={`${controlClass} sm:w-64`}><option value="ALL">Todos os grupos</option>{managerGroups.map((group) => <option key={group.id} value={String(group.id)}>{group.name}</option>)}</select>}
              </div>
              {filteredManagedCredentials.length === 0 ? (
                <EmptyState icon={Users} title="Ainda não existem credenciais emitidas." description="As credenciais dos membros dos grupos que gere aparecerão nesta área." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                    <span>Titular</span><span>Grupo</span><span>Período</span><span>Estado</span><span className="text-right">Acção</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filteredManagedCredentials.map((credential) => (
                      <article key={credential.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_auto] md:items-center md:gap-4">
                        <div><p className="text-xs text-slate-400 md:hidden">Titular</p><p className="font-semibold text-slate-900">{credential.holder_name || "—"}</p></div>
                        <div><p className="text-xs text-slate-400 md:hidden">Grupo</p><p className="text-sm text-slate-700">{credential.group_name}</p></div>
                        <div><p className="text-xs text-slate-400 md:hidden">Período</p><p className="text-sm text-slate-700">{formatDate(credential.period_start)} – {formatDate(credential.period_end)}</p></div>
                        <div><p className="mb-1 text-xs text-slate-400 md:hidden">Estado</p><StatusBadge status={credential.effective_status} /></div>
                        <Link href={`/credentials/${credential.id}`} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-blue-700 hover:text-blue-800 md:justify-end">Gerir</Link>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-slate-600" /><h2 className="font-semibold text-slate-900">As minhas Credenciais Verificáveis</h2></div>
            {credentials.length === 0 ? <EmptyState icon={ShieldCheck} title="Ainda não possui Credenciais Verificáveis." description="As credenciais emitidas para si aparecerão nesta área." /> : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{credentials.map((credential) => (
                <article key={credential.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-900">{credential.group_name}</p><p className="mt-1 text-xs text-slate-500">{credential.holder_name || "Titular"}</p></div><StatusBadge status={credential.effective_status} /></div>
                  <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-400">Período</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(credential.period_start)} – {formatDate(credential.period_end)}</dd></div><div><dt className="text-slate-400">Válida até</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(credential.valid_until)}</dd></div></dl>
                  <Link href={`/credentials/${credential.id}`} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-blue-700 hover:text-blue-800">Ver detalhes</Link>
                </article>
              ))}</div>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-start gap-3"><SearchCheck className="mt-0.5 h-5 w-5 text-slate-700" /><div><h2 className="font-semibold text-slate-900">Verificar Credencial</h2><p className="mt-1 text-xs text-slate-500">Cole o objecto JSON completo da Credencial Verificável.</p></div></div>
            {verifyError && <ErrorAlert message={verifyError} onDismiss={() => setVerifyError(null)} />}
            {verificationResult !== null && <div className={`rounded-lg border p-4 text-sm font-medium ${verificationResult ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{verificationResult ? "A Credencial Verificável é válida." : "A Credencial Verificável não é válida."}</div>}
            <form onSubmit={verifyForm.handleSubmit(submitVerification)} className="space-y-3">
              <textarea {...verifyForm.register("credential_json")} rows={9} placeholder='{"@context": [...], "id": "..."}' disabled={isVerifying} className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 font-mono text-xs text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100" />
              {verifyForm.formState.errors.credential_json && <p className="text-xs text-rose-600">{verifyForm.formState.errors.credential_json.message}</p>}
              <Button type="submit" variant="outline" isLoading={isVerifying}>Verificar credencial</Button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
