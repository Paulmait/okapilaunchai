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
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    if (subscription.status !== "canceling") {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Reactivate the subscription in Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: false }
    );

    // Update local database
    await adminClient
      .from("subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Subscription reactivated successfully"
    });
  } catch (err: any) {
    console.error("Error reactivating subscription:", err.message);
    return NextResponse.json(
      { error: "Failed to reactivate subscription. Please try again." },
      { status: 500 }
    );
  }
}
