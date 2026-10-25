"use client";

import { useState } from "react";
import type { BlockchainIntegrityResult } from "@/lib/api/groups";

type Props = {
  onVerify: () => Promise<BlockchainIntegrityResult>;
};

export function IntegrityStatus({ onVerify }: Props) {
  const [result, setResult] = useState<BlockchainIntegrityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function verify() {
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      setResult(await onVerify());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return <section aria-label="Verificação de integridade">
    <button type="button" disabled={loading} onClick={verify}>
      {loading ? "A verificar…" : "Verificar integridade"}
    </button>
    {error && <p role="alert">Não foi possível verificar a integridade.</p>}
    {result && <div role="status">
      <strong>{result.status === "INTEGRITY_CONFIRMED"
        ? "Integridade confirmada"
        : result.status === "INTEGRITY_MISMATCH"
          ? "Divergência detectada"
          : "Sem registo na blockchain"}</strong>
      <p>Hash calculado: <code className="break-all">{result.calculated_hash}</code></p>
      <p>Hash blockchain: <code className="break-all">{result.blockchain_hash ?? "Não disponível"}</code></p>
    </div>}
  </section>;
}
