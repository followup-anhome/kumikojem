/**
 * prisma.ts
 * Prisma Client シングルトン（遅延初期化）
 *
 * Proxy を使い、実際にアクセスされるまで new PrismaClient() を呼ばない。
 * これにより Vercel ビルド時（DATABASE_URL 未設定）に初期化エラーが起きない。
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    return getClient()[prop as keyof PrismaClient];
  },
});
