/**
 * lib/db.ts — Prisma client singleton for SQLite (Prisma 7 + better-sqlite3 adapter)
 *
 * In dev, we reuse the same PrismaClient across hot-reloads to avoid
 * exhausting connections. In production, a fresh client is created once.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@/lib/generated/prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

function createClient(): DbClient {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

// Extend globalThis to cache the client across HMR reloads in dev
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: DbClient;
};

export const db: DbClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
