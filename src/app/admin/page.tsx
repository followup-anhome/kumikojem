/**
 * /admin — 管理者ダッシュボード (Server Component)
 * Prisma 経由で Supabase からデータを取得し AdminClient に渡す。
 */

import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic"; // 常に最新データを取得

export default async function AdminPage() {
  const [userCount, companyCount, applicationCount, applications, visaCounts] =
    await Promise.all([
      // KPI
      prisma.user.count(),
      prisma.company.count(),
      prisma.application.count(),

      // 最新応募 20件（新しい順）
      prisma.application.findMany({
        orderBy: { created_at: "desc" },
        take: 20,
        include: {
          user: { select: { name: true } },
          job_posting: {
            select: {
              title: true,
              company: { select: { name: true } },
            },
          },
        },
      }),

      // ビザ種別ごとの求職者数
      prisma.user.groupBy({
        by: ["visa_type"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

  return (
    <AdminClient
      userCount={userCount}
      companyCount={companyCount}
      applicationCount={applicationCount}
      initialApplications={applications}
      visaCounts={visaCounts}
    />
  );
}
