/**
 * lib/db.ts — Prisma client singleton (Prisma 7 + @prisma/adapter-better-sqlite3)
 *
 * The Prisma 7 generated client uses ESM (import.meta.url) internally,
 * so it cannot be bundled by webpack. We use a dynamic require() that
 * is resolved at runtime by Node.js, bypassing the webpack bundler.
 *
 * DATABASE_URL=file:./dev.db   (set in .env)
 */

import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

// Cache client across HMR reloads in dev to avoid multiple file-handle opens
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: DbClient;
};

function createClient(): DbClient {
  // Dynamic require prevents webpack from bundling these modules.
  // Using a variable for the path breaks static analysis.
  const prismaClientPath = require.resolve("../lib/generated/prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require(prismaClientPath);

  const adapterPath = require.resolve("@prisma/adapter-better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSQLite3 } = require(adapterPath);

  // Strip "file:" prefix from DATABASE_URL
  const rawUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
    /^file:/,
    ""
  );
  const dbPath = path.isAbsolute(rawUrl)
    ? rawUrl
    : path.join(process.cwd(), rawUrl);

  const adapter = new PrismaBetterSQLite3({ url: dbPath });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getDb(): DbClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

// Also export as `db` for backward compatibility with existing route imports
export const db: DbClient = new Proxy(
  {},
  {
    get(_target, prop) {
      return getDb()[prop];
    },
  }
);
