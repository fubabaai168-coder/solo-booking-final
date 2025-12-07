import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // 解析 DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || "";

  const dbInfo: {
    hasDatabaseUrl: boolean;
    host?: string;
    database?: string;
    urlLast8?: string;
  } = {
    hasDatabaseUrl: !!databaseUrl,
  };

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      dbInfo.host = url.host;
      dbInfo.database = url.pathname.replace("/", "");
      dbInfo.urlLast8 = databaseUrl.slice(-8);
    } catch (e) {
      // parse 失敗就忽略，不要 throw
      console.error("[Debug][DB-Status][UrlParseError]", e);
    }
  }

  try {
    // 檢查資料庫連線
    await prisma.$connect();

    // 查詢基本統計資訊
    const [reservationCount, resourceCount, chatSessionCount, supportTemplateCount] =
      await Promise.all([
        prisma.reservation.count(),
        prisma.resource.count(),
        prisma.chatSession.count(),
        prisma.supportTemplate.count(),
      ]);

    // 查詢各狀態的預約數量
    const reservationStatusCounts = await prisma.reservation.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    // 查詢最近的預約（最多 5 筆）
    const recentReservations = await prisma.reservation.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        customerName: true,
        phone: true,
        peopleCount: true,
        status: true,
        reservedStart: true,
        reservedEnd: true,
        createdAt: true,
      },
    });

    // 檢查資料庫連線是否正常（執行簡單查詢）
    const healthCheck = await prisma.$queryRaw`SELECT 1 as health`;

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          healthCheck: healthCheck,
        },
        counts: {
          reservations: reservationCount,
          resources: resourceCount,
          chatSessions: chatSessionCount,
          supportTemplates: supportTemplateCount,
        },
        reservationStatusCounts: reservationStatusCounts.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        recentReservations: recentReservations.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          phone: r.phone,
          peopleCount: r.peopleCount,
          status: r.status,
          reservedStart: r.reservedStart.toISOString(),
          reservedEnd: r.reservedEnd.toISOString(),
          createdAt: r.createdAt.toISOString(),
        })),
        dbInfo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Debug][DB-Status] Error:", error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error?.message || String(error),
        },
        error: {
          message: error?.message || "Unknown error",
          code: error?.code,
          name: error?.name,
        },
        dbInfo,
      },
      { status: 500 }
    );
  } finally {
    // 注意：在 Next.js API routes 中，通常不需要手動 disconnect
    // Prisma 會自動管理連線池
  }
}

