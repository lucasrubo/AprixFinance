import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/shared/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { titulo, valor, descricao, tipo, data, user_id, created_by } =
      await request.json();

    // Validate required fields
    if (!titulo || !valor || !tipo || !data || !user_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      );
    }

    // Insert into receipts table
    const { data: receipt, error } = await supabase
      .from("receipts")
      .insert([
        {
          titulo,
          valor: parseFloat(valor),
          descricao,
          tipo,
          data,
          user_id,
          created_by,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar recibo" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recibo cadastrado com sucesso!",
      receipt,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
