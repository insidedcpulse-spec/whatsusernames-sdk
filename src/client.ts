import { bsuidParse, bsuidValidate, contactResolve, usernameValidate, webhookNormalize } from "./business";
import { openApiSpec, phoneLink, qr, usernameLink, validateKey, validatePhone, validateUsername } from "./consumer";
import type { ClientContext } from "./http";
import type {
  BsuidParse,
  BsuidValidation,
  BusinessUsernameValidation,
  NormalizedWebhook,
  PhoneLinkResult,
  QrOptions,
  QrResult,
  ResolvedContact,
  UsernameLinkResult,
  ValidationResult,
} from "./types";

export const DEFAULT_BASE_URL = "https://whatsusernames.link";

export interface CreateClientOptions {
  baseUrl?: string;
}

export interface WhatsUsernamesClient {
  usernameLink(params: { username: string; key?: string; text?: string }): Promise<UsernameLinkResult>;
  phoneLink(params: { phone: string; text?: string }): Promise<PhoneLinkResult>;
  validateUsername(params: { username: string }): Promise<ValidationResult>;
  validateKey(params: { key: string }): Promise<ValidationResult>;
  validatePhone(params: { phone: string }): Promise<ValidationResult>;
  qr(options: QrOptions): Promise<QrResult>;
  openApiSpec(): Promise<unknown>;
  business: {
    bsuid: {
      validate(params: { bsuid: string }): Promise<BsuidValidation>;
      parse(params: { bsuid: string }): Promise<BsuidParse>;
    };
    username: {
      validate(params: { username: string }): Promise<BusinessUsernameValidation>;
    };
    contact: {
      resolve(params: { bsuid?: string; phone?: string; username?: string }): Promise<ResolvedContact>;
    };
    webhook: {
      normalize(payload: unknown): Promise<NormalizedWebhook>;
    };
  };
}

export function createClient(options: CreateClientOptions = {}): WhatsUsernamesClient {
  const ctx: ClientContext = { baseUrl: options.baseUrl ?? DEFAULT_BASE_URL };

  return {
    usernameLink: (params) => usernameLink(ctx, params),
    phoneLink: (params) => phoneLink(ctx, params),
    validateUsername: (params) => validateUsername(ctx, params),
    validateKey: (params) => validateKey(ctx, params),
    validatePhone: (params) => validatePhone(ctx, params),
    qr: (opts) => qr(ctx, opts),
    openApiSpec: () => openApiSpec(ctx),
    business: {
      bsuid: {
        validate: (params) => bsuidValidate(ctx, params),
        parse: (params) => bsuidParse(ctx, params),
      },
      username: {
        validate: (params) => usernameValidate(ctx, params),
      },
      contact: {
        resolve: (params) => contactResolve(ctx, params),
      },
      webhook: {
        normalize: (payload) => webhookNormalize(ctx, payload),
      },
    },
  };
}
