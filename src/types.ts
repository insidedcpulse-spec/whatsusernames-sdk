export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface UsernameLinkResult {
  username: string;
  key?: string;
  link: string;
  shortLink: string;
  notice: string;
}

export interface PhoneLinkResult {
  phone: string;
  link: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ApiErrorDetail[];
}

export interface QrOptions {
  username?: string;
  phone?: string;
  text?: string;
  format?: "png" | "svg";
  size?: number;
  color?: string;
  bg?: string;
}

export interface QrResult {
  body: Uint8Array;
  contentType: string;
}

export interface BsuidValidation {
  valid: boolean;
  isParent: boolean;
}

export interface BsuidParse {
  countryCode: string;
  id: string;
  isParent: boolean;
}

export interface BusinessUsernameValidation {
  valid: boolean;
  reasons: string[];
}

export type ContactType = "bsuid" | "phone" | "username";

export interface ResolvedContact {
  id: string;
  type: ContactType;
  username: string | null;
  phone: string | null;
  bsuid: string | null;
  displayName: string | null;
  phoneKnown: boolean;
  bsuidKnown: boolean;
}

export type NormalizedEventKind = "message" | "status";

export interface NormalizedEvent {
  kind: NormalizedEventKind;
  bsuid: string | null;
  phone: string | null;
  username: string | null;
  displayName: string | null;
  raw: unknown;
}

export interface NormalizedWebhook {
  provider: "meta_cloud_api";
  events: NormalizedEvent[];
}
