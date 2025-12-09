export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Buffer } from "buffer";

export async function GET(req: NextRequest) {
  try {
    const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!base64Key) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 未設定");
    }

    if (!calendarId) {
      return NextResponse.json(
        {
          success: false,
          message: "環境變數缺失",
          base64KeyExists: !!base64Key,
          calendarId,
        },
        { status: 500 }
      );
    }

    // 將 Base64 字串解碼回原始的 JSON 字串
    const jsonString = Buffer.from(base64Key, "base64").toString("utf8");
    const keyObj = JSON.parse(jsonString);

    // 使用 JWT 進行服務初始化
    const auth = new google.auth.JWT({
      email: keyObj.client_email,
      key: keyObj.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // 測試讀取事件（只讀取 1 筆）
    const r = await calendar.events.list({
      calendarId,
      maxResults: 1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Google Calendar 連線成功",
        items: r.data.items || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Calendar Test Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Google API 呼叫失敗",
        error: String(err),
      },
      { status: 500 }
    );
  }
}

