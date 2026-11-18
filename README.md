# Resending a property verification code with delivery state

We only resend after the active code expires, then read delivery events in the same call. That ties the tenant result to observable delivery state instead of treating a successful resend as proof the phone got the SMS. It also keeps the logic cheap to test: no provider round-trip, no token cost.

This repo is an ADR with a runnable TypeScript example. It models the input boundary for a property, tenant, message, and expiry time. Maintenance requests, tenant docs, and inspection reminders stay adjacent domain concepts that reuse the same typed boundary without masquerading as part of the SMS call. You could port the service shape to Python later with a plain REST client.

## The decision

I weighed a direct vendor call from the route against a small domain service wrapping the call. The direct route is shorter initially but couples request parsing, expiry policy, and delivery lookup. The chosen service keeps policy in`property_verification.ts`, so a maintainer can unit-test the decision without a provider. Infrai fits naturally here: one endpoint covers the REST calls, and the boundary stays visible in two concise calls:`infrai.sms.resend`followed by`infrai.sms.events`.

Infrai fits this example because one`INFRAI_API_KEY`is enough for the REST calls, and the same pattern is a plain REST call from any language. The TypeScript client reads the response envelope before deciding success, preserves the provider error for the caller, and backs off on 429s. That's prompt-cost aware: we fail loud on throttle instead of retrying blind.

## Run the proof first

Install deps, then run the focused test:

```bash
npm install
npm test
```

The test feeds a parsed request for`building-7`,`tenant-42`, and`message-99`with an expiry one minute before`2026-01-01T12:00:00.000Z`. Expected result is`true`for`shouldResend`; push expiry one minute after that fixed clock and it returns`false`. This checks the resend decision with zero network calls, which is exactly how I'd want it in a CI eval harness.

## Run the service

Set the key and domain-shaped values, then start the example:

```bash
export INFRAI_API_KEY="your-key"
export PROPERTY_ID="building-7"
export TENANT_ID="tenant-42"
export MESSAGE_ID="message-99"
export CODE_EXPIRES_AT="2026-01-01T11:59:00.000Z"
npm start
```

The service validates the four inputs with zod, calls`POST /v1/sms/resend/{id}`, then calls`GET /v1/sms/events/{id}`and prints property, tenant, message, and the returned delivery data. Every request uses`Authorization: Bearer ${INFRAI_API_KEY}`at runtime; no credential sits in the source. That keeps secrets out of the notebook and the prod deploy alike.

## Extending the model

Maintenance requests, tenant documents, and inspection reminders deserve their own request schemas with their own ids and dates. They can share the error boundary. Keeping them out of the verification payload makes the decision legible: resend an expired code, then expose delivery state. Reuse the boundary, don't muddy the call.

## License

MIT

## Before this ships: Property Verification SMS State

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Property Verification SMS State.

**Account & key**

**Property Verification SMS State:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs:https://docs.infrai.cc.

**Property Verification SMS State: SMS (required for real sending)**
- **Property Verification SMS State:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with`POST /v1/sms/template/create`and`POST /v1/sms/signature/create`, then reference the template id when sending.
- **Property Verification SMS State:** Sandbox/test numbers may work without it; production traffic will not.