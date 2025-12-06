import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TemplateInput = {
  title: string;
  prompt: string;
  reply: string;
  tags?: string | string[];
  isActive?: boolean;
};

type RequestBody = {
  templates: TemplateInput[];
};

type ErrorItem = {
  index: number;
  title?: string;
  message: string;
};

type ResponseBody = {
  success: boolean;
  createdCount: number;
  skippedCount: number;
  errors: ErrorItem[];
  skippedTitles: string[];
};

/**
 * 解析並正規化 tags
 * - 若是字串：用逗號分隔，trim，過濾空字串
 * - 若是字串陣列：trim，過濾空字串
 * - 若沒提供或結果為空陣列：回傳空陣列
 */
function parseTags(tags?: string | string[]): string[] {
  if (!tags) {
    return [];
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : String(tag).trim()))
      .filter((tag) => tag.length > 0);
  }

  return [];
}

export async function POST(req: Request) {
  try {
    // 1. 解析 JSON body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[import-batch] JSON 解析錯誤", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 2. 驗證 body 結構
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Request body must be an object" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.templates)) {
      return NextResponse.json(
        { success: false, message: "templates must be an array" },
        { status: 400 }
      );
    }

    const templates = body.templates;
    if (templates.length === 0) {
      return NextResponse.json(
        { success: false, message: "templates array cannot be empty" },
        { status: 400 }
      );
    }

    // 3. 初始化結果計數器
    let createdCount = 0;
    let skippedCount = 0;
    const errors: ErrorItem[] = [];
    const skippedTitles: string[] = [];

    // 4. 批次處理每一筆 template
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];

      // 4.1 驗證必填欄位
      if (!template.title || typeof template.title !== "string" || template.title.trim() === "") {
        errors.push({
          index: i,
          message: "Missing or invalid title (required)",
        });
        skippedCount++;
        continue;
      }

      if (!template.prompt || typeof template.prompt !== "string" || template.prompt.trim() === "") {
        const title = String(template.title).trim();
        errors.push({
          index: i,
          title,
          message: "Missing or invalid prompt (required)",
        });
        skippedTitles.push(title);
        skippedCount++;
        continue;
      }

      if (!template.reply || typeof template.reply !== "string" || template.reply.trim() === "") {
        const title = String(template.title).trim();
        errors.push({
          index: i,
          title,
          message: "Missing or invalid reply (required)",
        });
        skippedTitles.push(title);
        skippedCount++;
        continue;
      }

      // 4.2 正規化欄位
      const title = String(template.title).trim();
      const prompt = String(template.prompt).trim();
      const reply = String(template.reply).trim();
      const tags = parseTags(template.tags);
      const isActive = template.isActive !== undefined ? Boolean(template.isActive) : true;

      // 4.3 建立新記錄（不再檢查 title 重複）
      try {
        await prisma.supportTemplate.create({
          data: {
            title,
            prompt,
            reply,
            tags,
            isActive,
          },
        });

        createdCount++;
      } catch (dbCreateError) {
        console.error(`[import-batch] 建立 template "${title}" 時發生錯誤`, dbCreateError);
        errors.push({
          index: i,
          title,
          message: `Database create error: ${dbCreateError instanceof Error ? dbCreateError.message : "Unknown error"}`,
        });
        skippedTitles.push(title);
        skippedCount++;
      }
    }

    // 5. 回傳結果
    const response: ResponseBody = {
      success: true,
      createdCount,
      skippedCount,
      errors,
      skippedTitles: Array.from(new Set(skippedTitles)), // 去重（只包含欄位錯誤的 title）
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // 7. 處理未預期例外
    console.error("[import-batch] 未預期錯誤", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

