import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale/zh-TW";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    sessionId: string;
  };
};

export const dynamic = "force-dynamic";

export default async function SupportSessionDetailPage({ params }: PageProps) {
  const { sessionId } = params;

  // 從 Prisma 讀取 ChatSession 和 Messages
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // 如果找不到 session，顯示 404
  if (!session) {
    notFound();
  }

  // 格式化時間
  const startedAtFormatted = format(session.startedAt, "yyyy/MM/dd HH:mm", {
    locale: zhTW,
  });

  return (
    <div className="p-6 space-y-6">
      {/* 返回列表按鈕 */}
      <div>
        <Link
          href="/admin/support-sessions"
          className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4"
        >
          ← 返回列表
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">客服對話明細</h1>

      {/* (A) Session 基本資訊卡片 */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">對話資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">開始時間：</span>
            <span className="ml-2 font-medium">{startedAtFormatted}</span>
          </div>
          <div>
            <span className="text-gray-600">Channel：</span>
            <span className="ml-2 font-medium">{session.channel}</span>
          </div>
          <div>
            <span className="text-gray-600">訊息數：</span>
            <span className="ml-2 font-medium">{session._count.messages}</span>
          </div>
          <div>
            <span className="text-gray-600">處理狀態：</span>
            {session.needHuman ? (
              <span className="ml-2 inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 font-medium">
                需人工
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">
                機器人處理
              </span>
            )}
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-600">User Agent：</span>
            <div className="mt-1">
              <span
                className="text-xs text-gray-500 font-mono break-all"
                title={session.userAgent || ""}
              >
                {session.userAgent || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* (B) 訊息 Timeline */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">對話內容</h2>
        {session.messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            目前尚無訊息紀錄
          </div>
        ) : (
          <div className="space-y-3">
            {session.messages.map((message) => {
              const timeFormatted = format(message.createdAt, "HH:mm:ss", {
                locale: zhTW,
              });
              const isUser = message.role === "USER";

              return (
                <div
                  key={message.id}
                  className="flex gap-3 border-b pb-3 last:border-b-0"
                >
                  {/* 左邊：時間 + role 標籤 */}
                  <div className="flex-shrink-0 w-32">
                    <div className="text-xs text-gray-500 mb-1">
                      {timeFormatted}
                    </div>
                    <div>
                      {isUser ? (
                        <span className="inline-flex items-center rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700 font-medium">
                          USER
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 font-medium">
                          BOT
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 右邊：訊息內容 */}
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}





