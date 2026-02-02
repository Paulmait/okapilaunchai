import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";

// Stripe price IDs - you'll need to create these in your Stripe dashboard
const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  team: process.env.STRIPE_TEAM_PRICE_ID || "price_team_placeholder"
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan } = body;

    if (!plan || !["pro", "team"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Check authentication
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === "sk_test_placeholder") {
      // Stripe not configured - show setup message
      return NextResponse.json({
        error: "Stripe is not configured yet. Please set STRIPE_SECRET_KEY in environment variables.",
        setupRequired: true
      }, { status: 503 });
    }

    // Dynamic import of Stripe to avoid issues if not installed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    // Create or get Stripe customer
    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const adminClient = getSupabaseAdmin();

    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;

      // Save customer ID
      await adminClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: "free",
          status: "active"
        });
    }

    // Create checkout session
    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        user_id: user.id,
        plan
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err.message);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
