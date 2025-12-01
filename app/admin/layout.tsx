import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 側邊導航欄 */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRight: "1px solid #ddd",
        }}
      >
        <nav>
          <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>
            管理後台
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link
                href="/admin"
                style={{
                  display: "block",
                  padding: "10px",
                  textDecoration: "none",
                  color: "#333",
                  borderRadius: "4px",
                }}
              >
                儀表板
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                href="/admin/local"
                style={{
                  display: "block",
                  padding: "10px",
                  textDecoration: "none",
                  color: "#333",
                  borderRadius: "4px",
                }}
              >
                商家查詢管理
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 主內容區域 */}
      <main style={{ flex: 1, padding: "20px" }}>{children}</main>
    </div>
  );
}










