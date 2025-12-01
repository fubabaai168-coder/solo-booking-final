// app/api/ai-chat/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    // 從請求中獲取用戶問題
    const body = await req.json();
    const { prompt } = body;

    // 驗證必填欄位
    if (!prompt) {
      return NextResponse.json(
        { error: "請提供問題內容" },
        { status: 400 }
      );
    }

    // 初始化 Gemini 客戶端
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY 未設定" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenAI({ apiKey });

    // 設定系統提示詞
    const systemInstruction =
      "You are a friendly and helpful AI customer service agent for 'Modern Brunch Place'. Your goal is to answer FAQs about our menu, hours, and reservation process. Always maintain a warm tone.";

    // 生成回應
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // 取得回應文字
    const text = response.text || "抱歉，無法產生回應。";

    // 返回 AI 回應
    return NextResponse.json(
      {
        message: text,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ AI 聊天錯誤:", error);
    return NextResponse.json(
      { error: "AI 回應失敗", details: error.message },
      { status: 500 }
    );
  }
}
