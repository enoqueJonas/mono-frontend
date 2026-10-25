"use client";

import { useEffect, useState } from "react";
import { blockchainAuditApi, type BlockchainHistoryEntry } from "@/lib/api/groups";

export function BlockchainHistory({ groupId }: { groupId: string }) {
  const [items, setItems] = useState<BlockchainHistoryEntry[]>([]);
  useEffect(() => {
    blockchainAuditApi.listHistory(groupId).then(setItems);
  }, [groupId]);
  return <ul>{items.map(item => <li key={item.transaction_hash}>{item.anchor_type}: {item.status}</li>)}</ul>;
}
