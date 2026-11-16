import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma.config.ts — Prisma 7 CLI configuration.
// Used by: prisma migrate dev, prisma migrate deploy, prisma db push, etc.
// NOT used by PrismaClient at runtime — runtime connection is in lib/db.ts
// via @prisma/adapter-better-sqlite3.

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
