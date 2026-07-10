# Payment provider setup (Supabase Edge Functions → Secrets)

Convertly owns plan definitions and pricing metadata. Payment providers only receive mapped external plan/price IDs resolved by the pricing layer (`_shared/pricing`).

Set `PAYMENT_PROVIDER=razorpay` for V1 launch. Switch to `stripe` when Stripe onboarding is available.

## Shared

```
PAYMENT_PROVIDER=razorpay
APP_URL=https://your-app.vercel.app
```

## Razorpay (V1)

Environment selector (defaults to production when unset):

```
RAZORPAY_ENVIRONMENT=test
```

Set `RAZORPAY_ENVIRONMENT=production` (or remove the secret) before launch. All Razorpay credential reads go through `_shared/payment/razorpayConfig.ts`.

### Production secrets (leave configured; not used while `RAZORPAY_ENVIRONMENT=test`)

```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_STARTER=plan_...
RAZORPAY_PLAN_GROWTH=plan_...
RAZORPAY_PLAN_SCALE=plan_...
```

### Test secrets (used when `RAZORPAY_ENVIRONMENT=test`)

```
RAZORPAY_TEST_KEY_ID=rzp_test_...
RAZORPAY_TEST_KEY_SECRET=...
RAZORPAY_TEST_WEBHOOK_SECRET=...
RAZORPAY_TEST_PLAN_STARTER=plan_...
RAZORPAY_TEST_PLAN_GROWTH=plan_...
RAZORPAY_TEST_PLAN_SCALE=plan_...
```

### Shared

```
RAZORPAY_SUBSCRIPTION_TOTAL_COUNT=1200
```

Webhook endpoint:

```
POST https://<project-ref>.supabase.co/functions/v1/payment-webhook
```

Subscribe to: `subscription.authenticated`, `subscription.activated`, `subscription.charged`,
`subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`,
`subscription.expired`

## Stripe (future)

```
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
```

Webhook endpoint: same `payment-webhook` function when `PAYMENT_PROVIDER=stripe`.

## Razorpay checkout return URL

Subscription checkout uses Razorpay Standard Checkout with `callback_url` pointing to:

```
{APP_URL}/billing/return?checkout=success
```

Allowlist this URL in Razorpay Dashboard → **Settings → Payment Methods → Settings** (callback URL allowlist).

If Checkout.js cannot load, the client falls back to the subscription `short_url` from the API.

## Edge functions

| Function          | JWT   | Purpose                          |
|-------------------|-------|----------------------------------|
| payment-checkout  | true  | Start subscription checkout      |
| payment-portal    | true  | Customer portal / manage URL     |
| payment-cancel    | true  | Cancel subscription via provider |
| payment-webhook   | false | Provider webhook ingestion       |
