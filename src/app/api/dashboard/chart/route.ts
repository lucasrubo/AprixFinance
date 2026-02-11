import { NextRequest, NextResponse } from "next/server";
import { getFinancialChartData } from "@/features/dashboard/actions/dashboard-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") as "30d" | "2m" | "1y";

    if (!period || !["30d", "2m", "1y"].includes(period)) {
      return NextResponse.json(
        { success: false, error: "Invalid period parameter" },
        { status: 400 },
      );
    }

    const result = await getFinancialChartData(period);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
