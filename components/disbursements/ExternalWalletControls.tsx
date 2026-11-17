"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { disbursementsApi } from "@/lib/api/disbursements";
import { groupsApi } from "@/lib/api/groups";
import type { Disbursement, ExternalWalletCustody } from "@/types/disbursements";
import type { GroupMember } from "@/types/groups";

function memberLabel(member: GroupMember): string {
  if (member.name) return member.name;
  if (typeof member.user === "object" && member.user) {
    const name = [member.user.first_name, member.user.last_name].filter(Boolean).join(" ").trim();
    return name || member.user.phone_number || String(member.id);
  }
  return member.phone_number || String(member.id);
}

export function ExternalWalletCustodyPanel({
  groupId,
  isManager,
}: {
  groupId: string;
  isManager: boolean;
}) {
  const [custody, setCustody] = useState<ExternalWalletCustody | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberId, setMemberId] = useState("");
  const [provider, setProvider] = useState<"M_PESA" | "E_MOLA">("M_PESA");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [current, groupMembers] = await Promise.all([
        disbursementsApi.getExternalWalletCustody(groupId),
        isManager ? groupsApi.listGroupMembers(groupId) : Promise.resolve([]),
      ]);
      setCustody(current);
      setMembers(groupMembers);
      if (current) {
        setMemberId(current.custodian);
        setProvider(current.provider);
        setPhone(current.wallet_number);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar a carteira designada.");
    } finally {
      setLoading(false);
    }
  }, [groupId, isManager]);

  useEffect(() => { void load(); }, [load]);

  const eligibleMembers = members.filter((m) =>
    m.status === "ACTIVE" && (m.role === "MANAGER" || m.role === "TREASURER")
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      if (!memberId) throw new Error("Seleccione o responsável pela carteira.");
      const result = await disbursementsApi.designateExternalWallet(groupId, {
        member_id: memberId, provider, wallet_number: phone.trim(),
      });
      setCustody(result);
      setSuccess("Responsável pela carteira externa registado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível designar o responsável.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Carteira móvel do grupo</h3>
      <p className="text-sm text-slate-600">
        O dinheiro permanece na carteira externa do responsável designado.
        Mono não movimenta fundos e não verifica a titularidade desta conta.
      </p>
      {loading ? <p className="text-sm text-slate-500">A carregar...</p> : custody ? (
        <p className="text-sm text-slate-700">
          Responsável: {custody.custodian_user_id} · {custody.provider} · {custody.wallet_number}
        </p>
      ) : <p className="text-sm text-amber-700">Ainda não foi designado um responsável.</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
      {isManager && !loading && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            Responsável
            <select
              required value={memberId} onChange={(event) => setMemberId(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Seleccionar membro</option>
              {eligibleMembers.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>{memberLabel(m)} ({m.role})</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Prestador
            <select value={provider} onChange={(event) => setProvider(event.target.value as "M_PESA" | "E_MOLA")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="M_PESA">M-Pesa</option>
              <option value="E_MOLA">e-Mola</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Número da carteira
            <input required value={phone} onChange={(event) => setPhone(event.target.value)} pattern="\\+?[0-9]{9,15}" placeholder="+25884..." className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"/>
          </label>
          <div className="md:col-span-3">
            <Button type="submit" isLoading={saving}>Guardar responsável</Button>
          </div>
        </form>
      )}
    </section>
  );
}

export function ExternalPaymentActions({
  groupId,
  item,
  userId,
  onUpdated,
}: {
  groupId: string;
  item: Disbursement;
  userId: string | null;
  onUpdated: () => Promise<void>;
}) {
  const isCustodian = Boolean(userId && item.custodian_user_id === userId);
  const isBeneficiary = Boolean(userId && item.beneficiary_user_id === userId);
  const [reference, setReference] = useState("");
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(task: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }

  const report = item.external_payment;
  return (
    <div className="space-y-3 border-t border-slate-200 pt-3">
      {report && (
        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <p><strong>Transferência declarada:</strong> {report.provider} · {report.reference}</p>
          <p><strong>Destino declarado:</strong> {report.recipient_wallet_number}</p>
          <p><strong>Validação:</strong> {report.verification_level === "BENEFICIARY_ATTESTED" ? "Recepção confirmada pelo beneficiário" : "Declaração sem confirmação independente"}</p>
          {report.dispute_reason && <p className="text-rose-700">Contestação: {report.dispute_reason}</p>}
        </div>
      )}

      {item.status === "APPROVED" && isCustodian && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void action(() => disbursementsApi.reportExternalPayment(groupId, item.id, {
              reference: reference.trim(), recipient_wallet_number: recipient.trim(),
            }));
          }}
        >
          <p className="text-sm font-medium">Declarar transferência efectuada fora de Mono</p>
          <input required minLength={4} maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)}
            placeholder="Referência da transferência" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input required pattern="\\+?[0-9]{9,15}" value={recipient} onChange={(e) => setRecipient(e.target.value)}
            placeholder="Número da carteira do beneficiário" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="text-xs text-slate-500">Não execute outra transferência aqui. Registe apenas a operação que realizou na carteira móvel.</p>
          <Button type="submit" isLoading={busy}>Declarar transferência</Button>
        </form>
      )}

      {item.status === "PAYMENT_REPORTED" && isBeneficiary && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Confirme apenas se o montante foi efectivamente recebido na sua carteira. Esta é uma confirmação pessoal, não uma verificação do prestador.</p>
          <Button isLoading={busy} onClick={() => void action(() => disbursementsApi.confirmExternalPayment(groupId, item.id))}>
            Confirmo que recebi o valor
          </Button>
          <form className="space-y-2" onSubmit={(e) => {
            e.preventDefault();
            void action(() => disbursementsApi.disputeExternalPayment(groupId, item.id, reason.trim()));
          }}>
            <textarea required minLength={8} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva por que contesta o recebimento" className="w-full rounded-md border border-slate-300 p-2 text-sm" />
            <Button type="submit" isLoading={busy}>Contestar recebimento</Button>
          </form>
        </div>
      )}
      {item.status === "DISPUTED" && (
        <p className="text-sm text-rose-700">Recebimento contestado. A rotação permanece suspensa até resolução.</p>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
