import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// 暫時用的簡化版 Reservation API，只用來測試 Vercel 部署

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({}));

    console.log("🔧 TEMP Reservation API called");
    console.log("Request body:", data);

    return NextResponse.json(
      {
        success: true,
        message: "暫時的預約 API 已正常回應（用來測試部署是否成功）",
        echo: data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("TEMP Reservation API error:", err);

    return NextResponse.json(
      {
        success: false,
        message: "暫時 API 發生錯誤",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
