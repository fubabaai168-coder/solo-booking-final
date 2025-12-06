import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    sessionId: string;
  };
}

/**
 * 針對指定 ChatSession 建立一筆 ChatMessage
 * POST /api/support/chat-sessions/[sessionId]/messages
 *
 * Body JSON:
 * {
 *   "role": "USER" | "BOT",
 *   "content": "文字內容"
 * }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { sessionId } = params;

  try {
    // 先確認 session 是否存在
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "SESSION_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.role !== "string" || typeof body.content !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
        },
        { status: 400 }
      );
    }

    const role = body.role.toUpperCase();
    const content = body.content.trim();

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "EMPTY_CONTENT",
        },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role,      // "USER" or "BOT"
        content,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[POST /api/support/chat-sessions/[sessionId]/messages] error:",
      error
    );

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
 * （可選）列出某個 session 底下的 messages
 * GET /api/support/chat-sessions/[sessionId]/messages
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { sessionId } = params;

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[GET /api/support/chat-sessions/[sessionId]/messages] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
