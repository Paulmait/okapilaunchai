import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";

export async function GET() {
  try {
    // Check authentication
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subscription from database
    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const adminClient = getSupabaseAdmin();

    const { data: subscription, error: subError } = await adminClient
      .from("subscriptions")
      .select("plan, status, stripe_customer_id, stripe_subscription_id, created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      // Return default free plan for users without subscription record
      return NextResponse.json({
        subscription: {
          plan: "free",
          status: "active"
        }
      });
    }

    // If user has a Stripe subscription, get more details
    let currentPeriodEnd: string | null = null;

    if (subscription.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" });

        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        // Access the subscription data - Stripe SDK types can be complex
        const subData = stripeSubscription as unknown as { current_period_end: number };
        if (subData.current_period_end) {
          currentPeriodEnd = new Date(subData.current_period_end * 1000).toISOString();
        }
      } catch (err) {
        // Stripe lookup failed, continue with database data
        console.error("Failed to fetch Stripe subscription details:", err);
      }
    }

    return NextResponse.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        current_period_end: currentPeriodEnd,
        created_at: subscription.created_at
      }
    });
  } catch (err: any) {
    console.error("Error fetching subscription:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
