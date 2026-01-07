import { NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";

export async function POST() {
  try {
    const supabase = getSupabaseServer();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sign out error:", err);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
