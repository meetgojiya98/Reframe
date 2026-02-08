import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type ApiHandler<T = unknown> = (
  request: Request,
  context?: { params?: T }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with try/catch and consistent error responses.
 * - 5xx errors are logged via logger and return generic message to client.
 *
 * @example
 *   export const GET = withApiHandler(async (request) => {
 *     const userId = await getCurrentUserId();
 *     if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *     const data = await fetchData(userId);
 *     return NextResponse.json(data);
 *   });
 */
export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (request: Request, context?: { params?: unknown }) => {
    try {
      return await handler(request, context);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      const isClientError =
        typeof (err as { statusCode?: number }).statusCode === "number" &&
        (err as { statusCode: number }).statusCode >= 400 &&
        (err as { statusCode: number }).statusCode < 500;
      const status = isClientError
        ? (err as { statusCode: number }).statusCode
        : 500;
      if (status >= 500) {
        logger.error("API error", {
          url: request.url,
          method: request.method,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
      return NextResponse.json(
        { error: status >= 500 ? "Something went wrong. Please try again." : message },
        { status }
      );
    }
  };
}

/** Return 400 with Zod validation errors. Use after schema.safeParse(). */
export function validationErrorResponse(
  issues: { path: (string | number)[]; message: string }[]
): NextResponse {
  const message = issues.length > 0 ? issues.map((i) => i.path.join(".") + ": " + i.message).join("; ") : "Validation failed";
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Parse JSON body and validate with Zod. Returns [data, null] or [null, error Response]. */
export async function parseAndValidate<T>(
  request: Request,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } } }
): Promise<[T, null] | [null, NextResponse]> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return [null, NextResponse.json({ error: "Invalid JSON" }, { status: 400 })];
  }
  const result = schema.safeParse(raw);
  if (result.success) return [result.data, null];
  return [null, validationErrorResponse(result.error.issues)];
}
