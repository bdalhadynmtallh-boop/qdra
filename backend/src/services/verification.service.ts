import crypto from "node:crypto";

export function generateVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashVerificationCode(
  code: string
) {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
}