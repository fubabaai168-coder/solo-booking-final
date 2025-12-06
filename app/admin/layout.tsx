import { ReactNode } from "react";
import { AdminLayoutClientShell } from "./AdminLayoutClientShell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto p-6">
        <AdminLayoutClientShell>{children}</AdminLayoutClientShell>
      </div>
    </div>
  );
}
