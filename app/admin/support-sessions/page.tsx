import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale/zh-TW";
import Link from "next/link";

type SearchParams = {
  searchParams?: {
    q?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function SupportSessionsPage({ searchParams }: SearchParams) {
  const q = searchParams?.q?.trim() || "";
  const dateFrom = searchParams?.dateFrom ? new Date(searchParams.dateFrom) : null;
  const dateTo = searchParams?.dateTo ? new Date(searchParams.dateTo) : null;

  // 建立 where 條件
  const where: any = {};

  if (dateFrom || dateTo) {
    where.startedAt = {};
    if (dateFrom) {
      where.startedAt.gte = dateFrom;
    }
    if (dateTo) {
      // dateTo 當天 23:59:59
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.startedAt.lte = end;
    }
  }

  if (q) {
    // 依 ChatMessage content 做簡單關鍵字搜尋
    // SQLite 不支援 mode: "insensitive"，改用 contains
    where.messages = {
      some: {
        content: {
          contains: q,
        },
      },
    };
  }

  const sessions = await prisma.chatSession.findMany({
    where,
    orderBy: {
      startedAt: "desc",
    },
    take: 50,
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // 取最後一則訊息當作摘要
      },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">客服對話紀錄</h1>

      {/* 查詢條件列 */}
      <form className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">關鍵字搜尋（訊息內容）</label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="輸入客戶訊息或回覆中的關鍵字"
            className="border rounded px-3 py-1 text-sm min-w-[220px]"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">起始日期</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={searchParams?.dateFrom}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">結束日期</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={searchParams?.dateTo}
            className="border rounded px-3 py-1 text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600"
        >
          查詢
        </button>
      </form>

      {/* 結果列表 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">開始時間</th>
              <th className="px-3 py-2 text-left">Channel</th>
              <th className="px-3 py-2 text-left">訊息數</th>
              <th className="px-3 py-2 text-left">User Agent</th>
              <th className="px-3 py-2 text-left">最後訊息摘要</th>
              <th className="px-3 py-2 text-left">需要人工</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                  目前沒有符合條件的對話紀錄
                </td>
              </tr>
            )}

            {sessions.map((session) => {
              const lastMessage = session.messages[0];
              const startedAtLabel = format(session.startedAt, "yyyy-MM-dd HH:mm", {
                locale: zhTW,
              });

              return (
                <tr key={session.id} className="border-t">
                  <td className="px-3 py-2">{startedAtLabel}</td>
                  <td className="px-3 py-2">{session.channel}</td>
                  <td className="px-3 py-2">{session._count.messages}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[220px] truncate">
                    {session.userAgent || "-"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700 max-w-[260px] truncate">
                    {lastMessage ? `[${lastMessage.role}] ${lastMessage.content}` : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {session.needHuman ? (
                      <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        需人工
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        機器人處理
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/support-sessions/${session.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      查看明細
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

