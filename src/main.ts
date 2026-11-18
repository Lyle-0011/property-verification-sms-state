import { resendVerification } from "./property_verification.js";

const propertyId = process.env.PROPERTY_ID;
const tenantId = process.env.TENANT_ID;
const messageId = process.env.MESSAGE_ID;
const expiresAt = process.env.CODE_EXPIRES_AT;

if (!propertyId || !tenantId || !messageId || !expiresAt) {
  throw new Error("PROPERTY_ID, TENANT_ID, MESSAGE_ID, and CODE_EXPIRES_AT are required");
}

const result = await resendVerification({ propertyId, tenantId, messageId, expiresAt });
console.log(JSON.stringify(result, null, 2));
