import type { ClientContext } from "./http";
import { postJson } from "./http";
import type {
  BsuidParse,
  BsuidValidation,
  BusinessUsernameValidation,
  NormalizedWebhook,
  ResolvedContact,
} from "./types";

export function bsuidValidate(ctx: ClientContext, params: { bsuid: string }): Promise<BsuidValidation> {
  return postJson(ctx, "/api/v1/business/bsuid/validate", params);
}

export function bsuidParse(ctx: ClientContext, params: { bsuid: string }): Promise<BsuidParse> {
  return postJson(ctx, "/api/v1/business/bsuid/parse", params);
}

export function usernameValidate(
  ctx: ClientContext,
  params: { username: string },
): Promise<BusinessUsernameValidation> {
  return postJson(ctx, "/api/v1/business/username/validate", params);
}

export function contactResolve(
  ctx: ClientContext,
  params: { bsuid?: string; phone?: string; username?: string },
): Promise<ResolvedContact> {
  return postJson(ctx, "/api/v1/business/contact/resolve", params);
}

export function webhookNormalize(ctx: ClientContext, payload: unknown): Promise<NormalizedWebhook> {
  return postJson(ctx, "/api/v1/business/webhook/normalize", payload);
}
