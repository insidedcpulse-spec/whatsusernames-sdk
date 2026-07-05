import type { ClientContext } from "./http";
import { buildQuery, getBinary, getJson } from "./http";
import type { PhoneLinkResult, QrOptions, QrResult, UsernameLinkResult, ValidationResult } from "./types";

export function usernameLink(
  ctx: ClientContext,
  params: { username: string; key?: string; text?: string },
): Promise<UsernameLinkResult> {
  return getJson(ctx, `/api/v1/username-link${buildQuery(params)}`);
}

export function phoneLink(ctx: ClientContext, params: { phone: string; text?: string }): Promise<PhoneLinkResult> {
  return getJson(ctx, `/api/v1/phone-link${buildQuery(params)}`);
}

export function validateUsername(ctx: ClientContext, params: { username: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/username${buildQuery(params)}`);
}

export function validateKey(ctx: ClientContext, params: { key: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/key${buildQuery(params)}`);
}

export function validatePhone(ctx: ClientContext, params: { phone: string }): Promise<ValidationResult> {
  return getJson(ctx, `/api/v1/validate/phone${buildQuery(params)}`);
}

export function qr(ctx: ClientContext, options: QrOptions): Promise<QrResult> {
  return getBinary(ctx, `/api/v1/qr${buildQuery(options as Record<string, string | number | undefined>)}`);
}

export function openApiSpec(ctx: ClientContext): Promise<unknown> {
  return getJson(ctx, "/api/v1/openapi.json");
}
