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

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === "sk_test_placeholder") {
      return NextResponse.json({ invoices: [] });
    }

    // Get customer ID from subscription
    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const adminClient = getSupabaseAdmin();

    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    // Fetch invoices from Stripe
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 24 // Last 2 years of monthly invoices
    });

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.created,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (err: any) {
    console.error("Error fetching invoices:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
