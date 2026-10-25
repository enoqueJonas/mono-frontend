"use client";

import { useEffect, useState } from "react";
import { blockchainAuditApi, type BlockchainHistoryEntry } from "@/lib/api/groups";

export function BlockchainHistory({ groupId }: { groupId: string }) {
  const [items, setItems] = useState<BlockchainHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    blockchainAuditApi.listHistory(groupId)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [groupId]);

  return <section aria-label="Histórico blockchain">
    <h2>Histórico blockchain</h2>
    {loading && <p>A carregar…</p>}
    {error && <p role="alert">Não foi possível consultar o histórico.</p>}
    {!loading && !error && items.length === 0 && <p>Sem registos.</p>}
    {!loading && !error && <ul>{items.map(item =>
      <li key={item.transaction_hash}>
        <strong>{item.anchor_type}</strong> — {item.status}
        <div>Bloco: {item.block_number}</div>
        <div>Transacção: <code className="break-all">{item.transaction_hash}</code></div>
        <div>{new Date(item.anchored_at).toLocaleString("pt-MZ")}</div>
      </li>
    )}</ul>}
  </section>;
}
