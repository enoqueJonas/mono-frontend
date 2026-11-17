"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { disbursementsApi } from "@/lib/api/disbursements";
import { groupsApi } from "@/lib/api/groups";
import type {
  Disbursement, ExternalPaymentReport, ExternalWalletProvider, TreasuryMandate,
} from "@/types/disbursements";
import type { GroupMember } from "@/types/groups";
import { formatMoney } from "@/lib/utils";

interface Props {
  groupId: string;
  items: Disbursement[];
  currentUserId: string | null;
  isManager: boolean;
  onRefresh: () => Promise<void>;
}

const memberUserId = (member: GroupMember): string | null => {
  const value = member.user;
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value.id !== undefined ? String(value.id) : null;
};

export function ExternalDisbursementWorkflow({
  groupId, items, currentUserId, isManager, onRefresh,
}: Props) {
  const [mandate, setMandate] = useState<TreasuryMandate | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [reports, setReports] = useState<Record<string, ExternalPaymentReport | null>>({});
  const [chosenMember, setChosenMember] = useState("");
  const [provider, setProvider] = useState<ExternalWalletProvider>("MPESA");
  const [alias, setAlias] = useState("");
  const [references, setReferences] = useState<Record<string, string>>({});
  const [disputeReasons, setDisputeReasons] = useState<Record<string, string>>({});
  const [confirmedReceipt, setConfirmedReceipt] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const currentMember = useMemo(() => members.find(
    (m) => currentUserId && memberUserId(m) === currentUserId && m.status === "ACTIVE",
  ), [members, currentUserId]);

  const reloadMetadata = useCallback(async () => {
    const [nextMandate, nextMembers] = await Promise.all([
      disbursementsApi.getTreasuryMandate(groupId),
      groupsApi.listGroupMembers(groupId),
    ]);
    setMandate(nextMandate);
    setMembers(nextMembers);

    const ownMember = nextMembers.find(
      (m) => currentUserId && memberUserId(m) === currentUserId && m.status === "ACTIVE"
    );
    const custodian = !!nextMandate && !!ownMember
      && String(nextMandate.custodian) === String(ownMember.id);
    const visibleReports = items.filter(item =>
      ["AWAITING_CONFIRMATION", "EVIDENCE_PENDING", "DISPUTED", "COMPLETED"].includes(item.status)
      && (isManager || custodian || (!!ownMember && String(item.beneficiary) === String(ownMember.id)))
    );
    const results = await Promise.all(visibleReports.map(async item => [
      item.id,
      await disbursementsApi.getExternalPaymentReport(groupId, item.id),
    ] as const));
    setReports(Object.fromEntries(results));
  }, [groupId, items, currentUserId, isManager]);

  useEffect(() => {
    reloadMetadata().catch(e => setError(e instanceof Error ? e.message : "Não foi possível carregar a tesouraria."));
  }, [reloadMetadata]);

  const run = async (action: () => Promise<unknown>, label: string) => {
    setBusy(true); setError(null); setNotice(null);
    try {
      await action();
      await onRefresh();
      await reloadMetadata();
      setNotice(label);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Não foi possível efectuar a operação.");
    } finally { setBusy(false); }
  };

  const appoint = () => {
    if (!chosenMember || !alias.trim()) {
      setError("Seleccione um responsável e introduza uma identificação abreviada da carteira.");
      return;
    }
    void run(
      () => disbursementsApi.appointTreasuryMandate(groupId, {
        group_member_id: chosenMember, provider, wallet_alias: alias.trim(),
      }),
      "Responsável pela carteira externa designado.",
    );
  };

  const isCustodian = !!mandate && !!currentMember
    && String(mandate.custodian) === String(currentMember.id);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Execução externa e confirmação do desembolso</h2>
      <p className="text-sm text-slate-600">
        O Mono regista autorizações e declarações. A transferência é efectuada fora da plataforma,
        a partir da carteira móvel designada do grupo. O Mono não movimenta fundos.
      </p>
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}

      {mandate ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          Carteira externa: <strong>{mandate.provider} · {mandate.wallet_alias}</strong>.
          A transferência é da responsabilidade do membro designado.
        </p>
      ) : isManager ? (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold">Designar responsável pela carteira externa</h3>
          <label className="block text-sm">
            Membro responsável
            <select
              value={chosenMember}
              onChange={e => setChosenMember(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2"
              disabled={busy}
            >
              <option value="">Seleccione um membro activo</option>
              {members.filter(m => m.status === "ACTIVE").map(m => (
                <option key={String(m.id)} value={String(m.id)}>
                  {m.name || m.phone_number || memberUserId(m) || String(m.id)} · {m.role}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Operador ou canal
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as ExternalWalletProvider)}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2"
              disabled={busy}
            >
              <option value="MPESA">M-Pesa</option>
              <option value="EMOLA">e-Mola</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
          <label className="block text-sm">
            Identificação abreviada da carteira (sem códigos PIN ou credenciais)
            <input value={alias} onChange={e => setAlias(e.target.value)}
              placeholder="M-Pesa ***1234" maxLength={64}
              className="mt-1 block w-full rounded-md border border-slate-300 p-2"
              disabled={busy}/>
          </label>
          <Button onClick={appoint} isLoading={busy}>Designar responsável</Button>
        </div>
      ) : (
        <p className="text-sm text-amber-700">O gestor ainda não designou o responsável pela carteira externa.</p>
      )}

      <div className="space-y-4">
        {items.map(item => {
          const isBeneficiary = !!currentMember
            && String(item.beneficiary) === String(currentMember.id);
          const canReport = isCustodian && item.status === "AWAITING_PAYMENT";
          const canConfirm = isBeneficiary && item.status === "AWAITING_CONFIRMATION";
          const canOpen = isManager && item.status === "APPROVED";
          const canFinalize = isManager && item.status === "EVIDENCE_PENDING";
          const report = reports[item.id];
          if (!canReport && !canConfirm && !canOpen && !canFinalize && !report) return null;
          return (
            <div key={item.id} className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium">
                Ciclo {item.cycle_number} — {item.beneficiary_name} — {formatMoney(item.amount, item.currency)}
              </div>
              {report && (
                <p className="text-sm text-slate-700">
                  Pagamento declarado: {report.provider}, referência <strong>{report.transfer_reference}</strong>.
                  Estado da declaração: {report.status}.
                  {report.dispute_reason ? ` Contestação: ${report.dispute_reason}` : ""}
                </p>
              )}

              {canOpen && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">RN06 aprovado. Registe a autorização na blockchain antes de solicitar ao responsável que efectue a transferência.</p>
                  <Button disabled={!mandate || busy} isLoading={busy} onClick={() => void run(
                    () => disbursementsApi.openExternalPayment(groupId, item.id),
                    "Autorização registada. O responsável pode efectuar a transferência fora do Mono.",
                  )}>Autorizar execução externa</Button>
                </div>
              )}

              {canReport && (
                <div className="space-y-2">
                  <label className="block text-sm">
                    Referência da transferência efectuada fora do Mono
                    <input
                      value={references[item.id] || ""}
                      onChange={e => setReferences(prev => ({ ...prev, [item.id]: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-slate-300 p-2"
                      placeholder="Introduza a referência do operador"
                      maxLength={100}
                      disabled={busy}
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Confirme na sua aplicação de carteira móvel que transferiu para o beneficiário correcto.
                    Esta acção apenas regista a sua declaração no Mono.
                  </p>
                  <Button
                    disabled={busy || (references[item.id] || "").trim().length < 5}
                    isLoading={busy}
                    onClick={() => void run(
                      () => disbursementsApi.reportExternalPayment(groupId, item.id, (references[item.id] || "").trim()),
                      "Transferência declarada. Aguarda confirmação do beneficiário.",
                    )}
                  >Registar transferência efectuada</Button>
                </div>
              )}

              {canConfirm && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-800">
                    Verifique o saldo recebido na sua própria carteira antes de confirmar.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox"
                      checked={!!confirmedReceipt[item.id]}
                      onChange={e => setConfirmedReceipt(prev => ({
                        ...prev, [item.id]: e.target.checked,
                      }))}
                      disabled={busy}/>
                    Confirmo que recebi este montante na carteira externa.
                  </label>
                  <Button
                    disabled={busy || !confirmedReceipt[item.id] || !report}
                    isLoading={busy}
                    onClick={() => void run(
                      () => disbursementsApi.acknowledgeExternalPayment(groupId, item.id, true),
                      "Recebimento confirmado. Falta a ancoragem da evidência.",
                    )}
                  >Confirmar recebimento</Button>
                  <label className="block text-sm">
                    Se não recebeu o montante, explique a contestação
                    <textarea
                      value={disputeReasons[item.id] || ""}
                      onChange={e => setDisputeReasons(prev => ({
                        ...prev, [item.id]: e.target.value,
                      }))}
                      rows={2} maxLength={1200}
                      className="mt-1 block w-full rounded-md border border-slate-300 p-2"
                      disabled={busy}
                    />
                  </label>
                  <Button
                    disabled={busy || !(disputeReasons[item.id] || "").trim()}
                    isLoading={busy}
                    onClick={() => void run(
                      () => disbursementsApi.acknowledgeExternalPayment(
                        groupId, item.id, false, (disputeReasons[item.id] || "").trim(),
                      ),
                      "Pagamento contestado. A rotação não foi concluída.",
                    )}
                  >Contestar recebimento</Button>
                </div>
              )}

              {canFinalize && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    O beneficiário confirmou a recepção. É necessário ancorar essa
                    declaração antes de concluir a rotação; não equivale a confirmação bancária.
                  </p>
                  <Button disabled={busy} isLoading={busy} onClick={() => void run(
                    () => disbursementsApi.finalizeExternalPayment(groupId, item.id),
                    "Declaração ancorada e rotação concluída.",
                  )}>Ancorar confirmação e concluir</Button>
                </div>
              )}

              {item.status === "DISPUTED" && (
                <p className="text-sm text-rose-700">
                  Pagamento contestado. O sistema não avança a rotação nem aceita nova confirmação unilateral.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
