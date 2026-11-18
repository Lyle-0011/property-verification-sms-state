import assert from "node:assert/strict";
import { shouldResend, resendRequest } from "./property_verification.js";

const now = new Date("2026-01-01T12:00:00.000Z");
const expired = resendRequest.parse({
  propertyId: "building-7",
  tenantId: "tenant-42",
  messageId: "message-99",
  expiresAt: "2026-01-01T11:59:00.000Z",
});
const active = { ...expired, expiresAt: new Date("2026-01-01T12:01:00.000Z") };

assert.equal(shouldResend(expired, now), true);
assert.equal(shouldResend(active, now), false);
console.log("expired codes are resendable; active codes remain untouched");
