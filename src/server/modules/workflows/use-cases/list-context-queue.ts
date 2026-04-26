import type { CurrentUser } from "../../../auth/current-user";
import { signalRepository, type SignalRepository } from "../../signals/repository";
import { requireRole } from "../authorization";
import type { ContextQueueQuery } from "../context-queue-schema";

export type ListContextQueueCommand = {
  input: ContextQueueQuery;
  user: CurrentUser;
};

export async function listContextQueue(
  command: ListContextQueueCommand,
  repository: SignalRepository = signalRepository
) {
  requireRole(command.user, "admin");

  const signals = await repository.list({
    agencyId: command.user.agencyId,
    status: "context.queued",
    limit: command.input.limit
  });

  return {
    items: signals.map((signal) => ({
      id: signal.id,
      agencyId: signal.agencyId,
      signalId: signal.id,
      campaignId: signal.campaignId,
      signalRuleId: signal.signalRuleId,
      status: signal.status,
      sourceType: signal.sourceType,
      sourceUrl: signal.sourceUrl,
      sourceRunId: signal.sourceRunId,
      observedAt: signal.observedAt,
      companyName: signal.companyName,
      companyDomain: signal.companyDomain,
      signalSummary: signal.signalSummary,
      createdAt: signal.createdAt,
      updatedAt: signal.updatedAt
    })),
    count: signals.length
  };
}
