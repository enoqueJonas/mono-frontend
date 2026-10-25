"use client";

import { BlockchainHistory } from "./BlockchainHistory";
import { GroupSettingsIntegrity } from "./GroupSettingsIntegrity";

type Props = {
  groupId: string;
  settingsVersion: number;
};

export function GroupBlockchainAudit({ groupId, settingsVersion }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Integridade dos parâmetros</h2>
        <p>Compare os parâmetros actuais desta versão com o registo na blockchain.</p>
        <GroupSettingsIntegrity groupId={groupId} version={settingsVersion} />
      </section>
      <section className="rounded-xl border p-4 space-y-3">
        <BlockchainHistory groupId={groupId} />
      </section>
    </div>
  );
}
