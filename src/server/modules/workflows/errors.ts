export type WorkflowErrorCode =
  | "bad_request"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unprocessable_entity";

export class WorkflowApplicationError extends Error {
  readonly code: WorkflowErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, code: WorkflowErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "WorkflowApplicationError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new WorkflowApplicationError(400, "bad_request", message, details);
}

export function forbidden(message = "Forbidden") {
  return new WorkflowApplicationError(403, "forbidden", message);
}

export function notFound(message: string) {
  return new WorkflowApplicationError(404, "not_found", message);
}

export function conflict(message: string, details?: unknown) {
  return new WorkflowApplicationError(409, "conflict", message, details);
}

export function unprocessableEntity(message: string, details?: unknown) {
  return new WorkflowApplicationError(422, "unprocessable_entity", message, details);
}
