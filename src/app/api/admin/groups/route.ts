import { createClient } from "@/shared/utils/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { nome } = body;

    if (!nome || typeof nome !== "string") {
      return NextResponse.json(
        { success: false, error: "Nome do grupo é obrigatório" },
        { status: 400 },
      );
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        nome: nome.trim(),
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { success: false, error: "Erro ao criar grupo" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
