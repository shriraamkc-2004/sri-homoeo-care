/** Framework-agnostic error reporting (no Lovable dependency). */

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error);
            }
          })();

  console.error("[AppError]", message, context);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

/** @deprecated Use reportAppError — kept so existing imports keep working during migration */
export const reportLovableError = reportAppError;
