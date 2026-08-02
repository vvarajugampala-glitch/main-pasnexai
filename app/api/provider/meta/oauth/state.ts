import crypto from "crypto";

export type MetaOAuthState = {
  businessId: string;
  channelType: string;
  userId: string;
  createdAt: number;
  requestedScopes?: string[];
  usedConfigId?: boolean;
};

function getStateSecret() {
  return process.env.META_APP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "pasnex-dev-state-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createMetaOAuthState(payload: MetaOAuthState) {
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getStateSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function parseMetaOAuthState(state: string) {
  const [body, signature] = state.split(".");
  if (!body || !signature) {
    throw new Error("Invalid OAuth state.");
  }

  const expected = crypto.createHmac("sha256", getStateSecret()).update(body).digest("base64url");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw new Error("OAuth state signature could not be verified.");
  }

  const payload = JSON.parse(decodeBase64Url(body)) as MetaOAuthState;
  const ageMs = Date.now() - payload.createdAt;
  if (ageMs > 15 * 60 * 1000) {
    throw new Error("OAuth state expired. Please start connection again.");
  }

  return payload;
}
