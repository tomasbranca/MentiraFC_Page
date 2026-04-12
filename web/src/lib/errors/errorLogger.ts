type ErrorContext = Record<string, unknown>;

export const reportError = (error: unknown, context: ErrorContext = {}): void => {
  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  const payload = {
    message: normalizedError.message,
    stack: normalizedError.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // Punto único de logging. Aquí se puede reemplazar por Sentry, Datadog, etc.
  console.error("[AppError]", payload);
};
