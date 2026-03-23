# Subscription PRD (Polar Integration)

## Document Control

- Status: Draft for implementation
- Owner: Product + Engineering
- Scope: Subscription checkout, webhook sync, and feature-gate readiness for Standard launch

## Problem Statement

Firma needs a reliable subscription system that:

- lets a firm owner start paid checkout for the active firm,
- maps Polar billing entities to a firm in our DB deterministically,
- keeps subscription status in sync via webhooks,
- supports environment separation (local sandbox org, preview sandbox org, production live org),
- allows controlled operations overrides for exceptional accounts.

## Goals

- Launch Standard paid subscription with sandbox and production parity.
- Make subscription state authoritative in `platform.firms`.
- Keep implementation environment-agnostic (same code path; env-specific secrets/tokens).
- Avoid ambiguous billing ownership by mapping customer records to a firm UUID.

## Non-Goals (for this phase)

- Full self-serve plan switching UI.
- Metered billing.
- Fully automated refunds/disputes workflows.
- Entitlement/benefit-level gating beyond firm subscription status.

## Target Users

- Firm admins/owners purchasing a Standard subscription.
- Internal ops team validating and supporting billing states.

## Functional Requirements

### Checkout

- Checkout endpoint must require authenticated user context.
- User must be a member of the target firm before checkout session creation.
- Checkout must attach `customerExternalId = firmId` for deterministic mapping.
- Checkout should include metadata fallback (`firmId`) for defensive mapping.

### Subscription Sync

- Webhook endpoint must verify signatures with `POLAR_WEBHOOK_SECRET`.
- On subscription lifecycle events, update `platform.firms` anchor billing record:
  - `subscriptionStatus`
  - `subscriptionProvider = polar`
  - `polarCustomerId`
  - `polarSubscriptionId`
  - `subscriptionPlan`
  - `subscriptionCurrentPeriodEnd`
- Sync logic must be idempotent and replay-safe.

### Billing Group Compatibility

- If a firm shares billing via `billingSharesSubscriptionFromFirmId`, updates must persist on the anchor firm.

## Data Mapping Contract

- Primary key from Polar to app: `customerExternalId` -> `platform.firms.id`
- Fallbacks:
  1. `metadata.firmId`
  2. lookup by `polarCustomerId`
  3. lookup by `polarSubscriptionId`

## Environment Strategy

- Local: sandbox org A + local token + local webhook URL (Tailnet/tunnel).
- Preview: sandbox org B + preview token + preview webhook URL.
- Production: live org + production token + production webhook URL.

Each environment is isolated by Polar org/token/secret; code is unchanged.

## Webhook Setup (Local Sandbox Org)

- Endpoint URL: `https://macbook-air.tail48717e.ts.net/api/webhooks/polar`
- Required secret env: `POLAR_WEBHOOK_SECRET`
- Recommended events:
  - `subscription.created`
  - `subscription.updated`
  - `subscription.active`
  - `subscription.canceled`
  - `subscription.revoked`
  - `subscription.uncanceled`

## Acceptance Criteria

- Authenticated firm member can create checkout for their firm.
- Completed sandbox checkout reaches success page.
- Polar webhook delivery logs success in local app.
- Firm row reflects expected subscription status and Polar IDs.
- Replay of same webhook event does not cause data corruption.
- Billing-group satellite firms continue inheriting anchor status.

## Risks and Mitigations

- Risk: webhook not reachable in local.
  - Mitigation: Tailnet/tunnel URL + Polar delivery log checks.
- Risk: wrong firm mapping.
  - Mitigation: enforce `customerExternalId=firmId` and fallback hierarchy.
- Risk: env cross-talk.
  - Mitigation: separate Polar org/token/secret per environment.
