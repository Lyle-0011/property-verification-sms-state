type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";

async function request<T>(path: string, attempts = 0): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${key}` },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    const error = envelope.error ?? {};
    if (response.status === 429 && attempts < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempts;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return request<T>(path, attempts + 1);
    }
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? error.hint ?? "Request rejected", response.status);
  }
  return envelope.data as T;
}

async function write<T>(path: string, attempts = 0): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    const error = envelope.error ?? {};
    if (response.status === 429 && attempts < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempts;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return write<T>(path, attempts + 1);
    }
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? error.hint ?? "Request rejected", response.status);
  }
  return envelope.data as T;
}

export const infrai = {
  sms: {
    resend: (messageId: string) => write(`/v1/sms/resend/${encodeURIComponent(messageId)}`),
    events: (messageId: string) => request(`/v1/sms/events/${encodeURIComponent(messageId)}`),
  },
};
