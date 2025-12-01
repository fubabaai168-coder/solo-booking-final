"use client";
import { useState } from "react";

export default function LocalBizFinder() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("高雄市"); // 預設搜尋地區
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `/admin/local/api/search?keyword=${encodeURIComponent(keyword)}&region=${encodeURIComponent(region)}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("搜尋失敗:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px", fontSize: "16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>📍 在地商家查詢系統</h1>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: "16px" }}>
        現在可輸入關鍵字與地區進行 Google 商家查詢。
      </p>

      {/* 搜尋輸入區 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="輸入關鍵字，例如：咖啡"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: "16px",
          }}
        />
        <input
          type="text"
          placeholder="輸入地區，例如：鼓山區"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{
            width: 150,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            fontSize: "16px",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#004AAD",
            color: "#fff",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          {loading ? "搜尋中..." : "搜尋"}
        </button>
      </div>

      {/* 搜尋結果區 */}
      {results.length > 0 ? (
        <ul>
          {results.map((item) => (
            <li
              key={item.place_id}
              style={{
                marginBottom: 12,
                padding: "12px 16px",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <strong>{item.name}</strong>
              <p>{item.address}</p>
              <p>⭐ {item.rating}</p>
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${item.place_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                在 Google 地圖開啟
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ opacity: 0.6 }}>尚未搜尋或沒有結果</p>
      )}
    </section>
  );
}










