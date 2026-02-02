import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Stripe not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    const event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);

    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          // Update subscription
          await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              plan,
              status: "active",
              updated_at: new Date().toISOString()
            });

          // Update usage limits
          const limit = plan === "pro" ? 999999 : plan === "team" ? 999999 : 1;
          await supabase
            .from("usage")
            .upsert({
              user_id: userId,
              projects_limit: limit,
              updated_at: new Date().toISOString()
            });

          console.log(`Subscription activated for plan: ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Find user by customer ID
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          const status = subscription.status === "active" ? "active" :
                        subscription.status === "past_due" ? "past_due" :
                        subscription.status === "canceled" ? "canceled" : "active";

          await supabase
            .from("subscriptions")
            .update({
              status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("user_id", sub.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;

        // Find user and downgrade to free
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({
              plan: "free",
              status: "canceled",
              updated_at: new Date().toISOString()
            })
            .eq("user_id", sub.user_id);

          // Reset usage limits
          await supabase
            .from("usage")
            .update({
              projects_limit: 1,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", sub.user_id);

          console.log("Subscription canceled");
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
