import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { email, nome, password } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email é obrigatório" },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Senha é obrigatória" },
        { status: 400 },
      );
    }

    // Create user in auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.trim(),
        password: password,
        user_metadata: {
          nome: nome?.trim() || email.split("@")[0],
        },
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { success: false, error: "Erro ao criar usuário" },
        { status: 500 },
      );
    }

    // The users table will be auto-populated by the trigger
    return NextResponse.json({
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
