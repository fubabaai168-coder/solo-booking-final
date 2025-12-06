import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export async function POST(req: Request) {
  try {
    // 取得上傳的檔案
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "未提供 CSV 檔案" },
        { status: 400 }
      );
    }

    // 檢查檔案類型
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      return NextResponse.json(
        { error: "檔案格式必須為 CSV" },
        { status: 400 }
      );
    }

    // 讀取檔案內容
    const fileContent = await file.text();

    // 解析 CSV
    let records: any[];
    try {
      records = parse(fileContent, {
        columns: true, // 使用第一行作為欄位名稱
        skip_empty_lines: true,
        trim: true,
        bom: true, // 處理 BOM（Byte Order Mark）
      });
    } catch (parseError) {
      console.error("[import-csv] CSV 解析錯誤", parseError);
      return NextResponse.json(
        { error: "CSV 檔案格式錯誤，無法解析" },
        { status: 400 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "CSV 檔案為空或沒有資料行" },
        { status: 400 }
      );
    }

    // 批次處理每一行
    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 因為第一行是標題，且陣列從 0 開始

      try {
        // 驗證必要欄位
        if (!row.title || !row.prompt || !row.reply) {
          skipped++;
          errors.push({
            row: rowNumber,
            error: `缺少必要欄位：title、prompt 或 reply`,
          });
          continue;
        }

        // 處理 tags：如果是字串（逗號分隔），轉換為陣列
        let tagsArray: string[] = [];
        if (row.tags) {
          if (typeof row.tags === "string") {
            // 移除空白並分割
            tagsArray = row.tags
              .split(",")
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag.length > 0);
          } else if (Array.isArray(row.tags)) {
            tagsArray = row.tags;
          }
        }

        // 建立 SupportTemplate
        await prisma.supportTemplate.create({
          data: {
            title: String(row.title).trim(),
            prompt: String(row.prompt).trim(),
            reply: String(row.reply).trim(),
            tags: tagsArray, // Prisma 會自動轉換為 Json
            isActive: true, // 自動設定為啟用
          },
        });

        created++;
      } catch (dbError: any) {
        skipped++;
        errors.push({
          row: rowNumber,
          error: `資料庫錯誤：${dbError.message || "未知錯誤"}`,
        });
        console.error(`[import-csv] 第 ${rowNumber} 行錯誤`, dbError);
      }
    }

    // 回傳結果
    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[import-csv] 匯入錯誤", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "匯入過程中發生錯誤",
      },
      { status: 500 }
    );
  }
}







