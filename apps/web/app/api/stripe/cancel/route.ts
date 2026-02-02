import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";

export async function POST() {
  try {
    // Check authentication
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === "sk_test_placeholder") {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    // Get subscription info
    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const adminClient = getSupabaseAdmin();

    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, plan, status")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    if (subscription.plan === "free") {
      return NextResponse.json(
        { error: "You are on the free plan" },
        { status: 400 }
      );
    }

    // Cancel the subscription in Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    // Cancel at period end (user keeps access until billing period ends)
    // Set to true for immediate cancellation, but at_period_end is more user-friendly
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update local database to reflect cancellation pending
    await adminClient
      .from("subscriptions")
      .update({
        status: "canceling",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of your billing period",
      cancelAt: canceledSubscription.cancel_at
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null
    });
  } catch (err: any) {
    console.error("Error canceling subscription:", err.message);
    return NextResponse.json(
      { error: "Failed to cancel subscription. Please try again or contact support." },
      { status: 500 }
    );
  }
}
