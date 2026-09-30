// Prisma 7 configuration file.
// The connection URL is provided directly here for local SQLite development.
// For production (Vercel / PostgreSQL), override via environment variables.
// See: https://pris.ly/d/config-datasource
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "file:./dev.db",
  },
});
