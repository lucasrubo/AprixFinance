import { createClient } from "@/shared/utils/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const subscription = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "Subscription inválida" },
        { status: 400 },
      );
    }

    // Salvar subscription em user_settings (upsert)
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        push_subscription: subscription,
        push_notifications: true,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("subscribe route:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await supabase
      .from("user_settings")
      .update({ push_subscription: null, push_notifications: false })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("unsubscribe route:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
