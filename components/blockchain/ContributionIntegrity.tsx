"use client";

import { contributionsApi } from "@/lib/api/contributions";
import { IntegrityStatus } from "./IntegrityStatus";

export function ContributionIntegrity({ groupId, contributionId }: { groupId: string; contributionId: string }) {
  return <IntegrityStatus onVerify={() => contributionsApi.verifyIntegrity(groupId, contributionId)} />;
}
