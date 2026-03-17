"use client";

import PlatformAdminPage from "../../PlatformAdmin/PlatformAdminPage";
import { useRouter } from "next/navigation";

/**
 * Route: /admin
 *
 * Trang Platform Admin — chỉ dành cho Super Admin (team ALUBOK).
 * HOÀN TOÀN TÁCH BIỆT với app khách hàng (localhost:3000).
 *
 * Bảo mật (khi có backend):
 * - Middleware kiểm tra isSuperAdmin trước khi cho truy cập
 * - MFA bắt buộc
 * - IP whitelist (chỉ internal network)
 * - Mọi thao tác ghi security_log
 */
export default function AdminPage() {
  const router = useRouter();

  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0 }}>
      <PlatformAdminPage onBackToHome={() => router.push("/")} />
    </div>
  );
}
