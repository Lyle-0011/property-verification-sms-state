import { z } from "zod";
import { infrai } from "./infrai.js";

export const resendRequest = z.object({
  propertyId: z.string().min(1),
  tenantId: z.string().min(1),
  messageId: z.string().min(1),
  expiresAt: z.coerce.date(),
});

export type ResendRequest = z.infer<typeof resendRequest>;

export type VerificationResult = {
  propertyId: string;
  tenantId: string;
  messageId: string;
  delivery: unknown;
};

export function shouldResend(input: ResendRequest, now: Date): boolean {
  return input.expiresAt.getTime() <= now.getTime();
}

export async function resendVerification(input: unknown, now = new Date()): Promise<VerificationResult> {
  const request = resendRequest.parse(input);
  if (!shouldResend(request, now)) {
    throw new Error("verification code is still active");
  }
  await infrai.sms.resend(request.messageId);
  const delivery = await infrai.sms.events(request.messageId);
  return { propertyId: request.propertyId, tenantId: request.tenantId, messageId: request.messageId, delivery };
}
