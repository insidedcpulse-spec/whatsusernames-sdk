import { WhatsUsernamesApiError } from "./errors";

export interface ClientContext {
  baseUrl: string;
}

async function throwApiError(response: Response): Promise<never> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new WhatsUsernamesApiError(response.status, "unknown_error", response.statusText || "Request failed.");
  }

  const error = (body as { error?: { code?: string; message?: string } }).error;
  throw new WhatsUsernamesApiError(
    response.status,
    error?.code ?? "unknown_error",
    error?.message ?? "Request failed.",
  );
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function getJson<T>(ctx: ClientContext, path: string): Promise<T> {
  const response = await fetch(`${ctx.baseUrl}${path}`);
  if (!response.ok) await throwApiError(response);
  return (await response.json()) as T;
}

export async function postJson<T>(ctx: ClientContext, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ctx.baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) await throwApiError(response);
  return (await response.json()) as T;
}

export async function getBinary(ctx: ClientContext, path: string): Promise<{ body: Uint8Array; contentType: string }> {
  const response = await fetch(`${ctx.baseUrl}${path}`);
  if (!response.ok) await throwApiError(response);
  const buffer = await response.arrayBuffer();
  return {
    body: new Uint8Array(buffer),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}
