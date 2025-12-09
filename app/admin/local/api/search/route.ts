// app/admin/local/api/search/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Buffer } from "buffer";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword") || "";
  const region = req.nextUrl.searchParams.get("region") || "高雄市";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!keyword) {
    return NextResponse.json({ error: "請輸入關鍵字" }, { status: 400 });
  }

  try {
    // === Google Places API ===
    const url = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
    const body = {
      textQuery: `${region} ${keyword}`,
      languageCode: "zh-TW",
      regionCode: "TW",
      locationBias: {
        circle: {
          center: { latitude: 22.6273, longitude: 120.3014 },
          radius: 5000,
        },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey!,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.rating,places.id",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const results =
      data.places?.map((p: any) => ({
        place_id: p.id,
        name: p.displayName?.text || "無名稱",
        address: p.formattedAddress || "無地址",
        rating: p.rating || "無評分",
      })) || [];

    // === Google Sheets 寫入 ===
    if (results.length > 0) {
      // 從環境變數讀取 Base64 編碼的服務帳號金鑰
      const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
      
      if (!base64Key) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 環境變數未設定！");
      }

      // 將 Base64 字串解碼回原始的 JSON 字串
      const jsonString = Buffer.from(base64Key, "base64").toString("utf8");
      const keyObj = JSON.parse(jsonString);

      // 使用 JWT 進行服務初始化
      const auth = new google.auth.JWT({
        email: keyObj.client_email,
        key: keyObj.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth });

      const sheetName = `${region}_${keyword}`;
      const sheetId = process.env.GOOGLE_SHEETS_ID;

      // 檢查是否已有工作表，若無則建立
      const existingSheets = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });

      const sheetExists = existingSheets.data.sheets?.some(
        (s) => s.properties?.title === sheetName
      );

      if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetName } } }],
          },
        });
      }

      // 寫入資料
      const values = results.map((r: any) => [
        r.name,
        r.address,
        r.rating,
        new Date().toLocaleString("zh-TW"),
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:D`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
    }

    return NextResponse.json({ keyword, region, results });
  } catch (error: any) {
    console.error("❌ 錯誤:", error);
    return NextResponse.json(
      { error: "查詢或寫入失敗", details: error.message },
      { status: 500 }
    );
  }
}

