import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 建立新的 ChatSession
 * POST /api/support/chat-sessions
 */
export async function POST(request: Request) {
  try {
    // 取得 user-agent（可以為 null）
    const userAgent = request.headers.get("user-agent");

    const session = await prisma.chatSession.create({
      data: {
        channel: "web",
        // schema 裡 userAgent 是 String?，所以可以是 string 或 null
        userAgent: userAgent ?? null,
        // ❗ 其他欄位（id / startedAt / endedAt / needHuman / messages）
        // 都交給 Prisma 預設值與關聯處理，不要手動給
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error) {
    // 把真正錯誤印出來，方便在 dev server 觀察
    console.error("[POST /api/support/chat-sessions] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * 簡單的健康檢查
 * GET /api/support/chat-sessions
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "chat-sessions route alive",
  });
}

