"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

export function AdminLayoutClientShell({ children }: Props) {
  const pathname = usePathname();

  // 導航項目配置
  const navItems = [
    { href: "/admin/reservations", label: "預約列表" },
    { href: "/admin/booking-dashboard", label: "座位儀表板" },
    { href: "/admin/support-bot", label: "客服機器人" },
    { href: "/admin/support-sessions", label: "客服對話紀錄" },
  ];

  // 判斷是否為 Active 狀態（支援精確匹配或 startsWith 匹配）
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <style jsx global>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          font-size: 16px;
        }
        .admin-sidebar {
          width: 250px;
          background-color: #f5f5f5;
          padding: 20px;
          border-right: 1px solid #ddd;
          flex-shrink: 0;
        }
        .admin-main {
          flex: 1;
          padding: 20px;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column;
          }
          .admin-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #ddd;
            padding: 16px;
          }
          .admin-main {
            padding: 16px;
          }
        }
      `}</style>
      <div className="admin-container">
        {/* 側邊導航欄 */}
        <aside className="admin-sidebar">
          <nav>
            <h2 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>
              管理後台
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} style={{ marginBottom: "10px" }}>
                    <Link
                      href={item.href}
                      style={{
                        display: "block",
                        padding: "10px",
                        textDecoration: "none",
                        color: active ? "#9a3412" : "#333",
                        backgroundColor: active ? "#ffedd5" : "transparent",
                        borderRadius: "4px",
                        fontSize: "14px",
                        transition: "all 0.2s",
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* 主內容區域 */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </>
  );
}

