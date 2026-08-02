import crypto from "crypto";

function getEncryptionKey() {
  const secret = process.env.PROVIDER_TOKEN_ENCRYPTION_KEY;

  if (!secret || secret.length < 32) {
    throw new Error("PROVIDER_TOKEN_ENCRYPTION_KEY must be at least 32 characters.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptProviderToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptProviderToken(encryptedToken: string) {
  const [ivValue, authTagValue, encryptedValue] = encryptedToken.split(".");

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error("Provider token is not in the expected encrypted format.");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
