import type { CurrentUser } from "../../auth/current-user";
import { importSignals } from "../signals/use-cases/import-signals";
import { unprocessableEntity } from "../workflows/errors";
import type { AutomationCommand } from "./types";

export type AutomationCommandResult = {
  commandType: AutomationCommand["commandType"];
  flow: AutomationCommand["flow"];
  correlationId: string;
  idempotencyKey: string;
  result: unknown;
};

export async function executeAutomationCommand(input: {
  command: AutomationCommand;
  user: CurrentUser;
}): Promise<AutomationCommandResult> {
  if (input.command.commandType === "signals.import") {
    const result = await importSignals({
      input: {
        correlationId: input.command.correlationId,
        idempotencyKey: input.command.idempotencyKey,
        signals: input.command.payload.signals
      },
      idempotencyKey: input.command.idempotencyKey,
      user: input.user
    });

    return {
      commandType: input.command.commandType,
      flow: input.command.flow,
      correlationId: input.command.correlationId,
      idempotencyKey: input.command.idempotencyKey,
      result
    };
  }

  throw unprocessableEntity("Automation command is not implemented yet", {
    commandType: input.command.commandType,
    flow: input.command.flow
  });
}
