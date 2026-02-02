# Stripe Setup Guide for OkapiLaunch AI

This guide walks you through setting up Stripe for the subscription system.

## Prerequisites

- A Stripe account (https://stripe.com)
- Access to the Stripe Dashboard
- Your production domain deployed

## Step 1: Create Products and Prices

### In the Stripe Dashboard:

1. Go to **Products** > **Add product**

2. **Create Pro Plan Product:**
   - Name: `OkapiLaunch Pro`
   - Description: `Unlimited projects with full legal docs and beta features`
   - Click **Add product**
   - Under Pricing, click **Add price**:
     - Price: `$29.00`
     - Billing period: `Monthly`
     - Click **Add price**
   - **Copy the Price ID** (starts with `price_`) - you'll need this

3. **Create Team Plan Product:**
   - Name: `OkapiLaunch Team`
   - Description: `Everything in Pro plus priority support and upcoming team features`
   - Click **Add product**
   - Under Pricing, click **Add price**:
     - Price: `$79.00`
     - Billing period: `Monthly`
     - Click **Add price**
   - **Copy the Price ID** (starts with `price_`) - you'll need this

## Step 2: Set Up Webhook

1. Go to **Developers** > **Webhooks**

2. Click **Add endpoint**

3. Configure the endpoint:
   - Endpoint URL: `https://YOUR_DOMAIN/api/stripe/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Click **Add endpoint**

4. **Copy the Webhook Signing Secret** (starts with `whsec_`)

## Step 3: Get Your API Keys

1. Go to **Developers** > **API keys**

2. Copy the **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)

## Step 4: Configure Environment Variables

Add these to your Railway environment variables (or `.env.local` for local development):

```
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_TEAM_PRICE_ID=price_your_team_price_id_here
```

### Railway Setup:
1. Go to your Railway project
2. Select the **web** service
3. Go to **Variables**
4. Add each variable above

## Step 5: Test the Integration

### Local Testing with Stripe CLI:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   This gives you a local webhook secret (`whsec_...`) - use this for local testing.

4. Test a checkout:
   - Go to `/subscribe?plan=pro`
   - Click Subscribe
   - Use test card: `4242 4242 4242 4242` (any future date, any CVC)

### Production Testing:

1. Ensure all environment variables are set in Railway
2. Deploy and wait for the deployment to complete
3. Go to `https://your-domain/subscribe?plan=pro`
4. Complete a real test purchase (you can refund it after)
5. Check Stripe Dashboard > Customers to verify the subscription was created

## Subscription Flow

Here's what happens when a user subscribes:

1. User clicks "Subscribe" on `/subscribe?plan=pro`
2. Frontend calls `POST /api/stripe/checkout` with the plan
3. Backend creates a Stripe Checkout Session
4. User is redirected to Stripe's hosted checkout page
5. After successful payment, Stripe redirects to `/dashboard?checkout=success`
6. Stripe sends `checkout.session.completed` webhook
7. Webhook handler updates `subscriptions` and `usage` tables in Supabase

## Database Tables Used

The subscription system uses these Supabase tables:

- **subscriptions**: Stores subscription status per user
  - `user_id`, `plan`, `status`, `stripe_customer_id`, `stripe_subscription_id`

- **usage**: Tracks project usage for enforcing limits
  - `user_id`, `projects_used`, `projects_limit`

## Troubleshooting

### Webhook not receiving events:
- Check the webhook endpoint URL is correct (no trailing slash)
- Verify the webhook signing secret matches
- Check Railway logs for any errors

### Checkout fails with "Failed to start checkout":
- Verify STRIPE_SECRET_KEY is set correctly
- Check that STRIPE_PRO_PRICE_ID and STRIPE_TEAM_PRICE_ID are valid price IDs
- Look at browser console and Railway logs for detailed errors

### Subscription not updating in database:
- Check that the webhook is receiving events (Stripe Dashboard > Webhooks > your endpoint)
- Verify Supabase connection is working
- Check Railway worker logs for database errors

## Test Cards

For testing in test mode:

| Card Number | Behavior |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Declined (generic) |

Use any future expiration date and any 3-digit CVC.

## Compliance Features (GDPR, Consumer Rights)

OkapiLaunch AI includes built-in compliance features:

### One-Click Cancellation
- Users can cancel their subscription with one click at `/billing`
- Cancellation takes effect at end of billing period (user keeps access)
- Users can reactivate before the period ends
- This satisfies EU consumer protection directives and FTC guidelines

### Invoice History
- All invoices are accessible at `/billing`
- Users can view and download PDF invoices
- Stripe-hosted invoice pages for detailed breakdown

### Billing Page Features
Located at `/billing`:
- View current plan and status
- One-click cancel button with confirmation
- Reactivate subscription option
- Full invoice history with download links

## Optional: Stripe Customer Portal

For even more self-service options, you can enable Stripe's Customer Portal:

1. Go to **Settings** > **Billing** > **Customer portal**

2. Configure what customers can do:
   - [x] View invoice history
   - [x] Update payment methods
   - [x] Cancel subscriptions
   - [x] Switch between plans

3. To add portal access, create an API route:

```typescript
// apps/web/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ... auth check ...

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/billing`
  });

  return NextResponse.json({ url: session.url });
}
```

Then add a "Manage in Stripe" button to the billing page.

## Going Live Checklist

- [ ] Switch from test API keys to live API keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Create live products and prices (or copy from test mode)
- [ ] Update price IDs in environment variables
- [ ] Test with a real card (refund after)
- [ ] Set up Stripe Tax if needed for your region
- [ ] Verify one-click cancellation works at `/billing`
- [ ] Verify invoice history displays correctly
- [ ] Test the full subscription lifecycle (subscribe, view invoices, cancel, reactivate)

## Legal Compliance Notes

### EU/GDPR Requirements
- One-click cancellation: **Implemented**
- Clear pricing display: **Implemented** (pricing page)
- Invoice access: **Implemented** (billing page)
- Refund policy: Add to Terms of Service

### US/FTC Guidelines
- Easy cancellation process: **Implemented**
- No dark patterns: **Implemented** (clear cancel button, no hidden steps)
- Transparent billing: **Implemented** (invoices accessible)

### Recommended Additions
1. Add cancellation confirmation email (configure in Stripe Dashboard > Emails)
2. Add Terms of Service with refund policy
3. Keep privacy policy updated with payment data handling
