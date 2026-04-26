import type { CurrentUser } from "../../../auth/current-user";
import { requireRole } from "../../workflows/authorization";
import type { ListSignalsQuery } from "../schemas";
import { signalRepository, type SignalRepository } from "../repository";

export type ListSignalsCommand = {
  input: ListSignalsQuery;
  user: CurrentUser;
};

export async function listSignals(
  command: ListSignalsCommand,
  repository: SignalRepository = signalRepository
) {
  requireRole(command.user, "viewer");

  const signals = await repository.list({
    agencyId: command.user.agencyId,
    status: command.input.status,
    limit: command.input.limit
  });

  return {
    signals,
    count: signals.length
  };
}
