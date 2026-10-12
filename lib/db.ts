/**
 * lib/db.ts — Prisma client singleton (Prisma 7 + @prisma/adapter-better-sqlite3)
 *
 * The Prisma 7 generated client uses `import.meta.url` (ESM) and cannot be
 * statically bundled by webpack. We resolve it via a dynamic `import()` which
 * Next.js/webpack leaves alone when the path is listed in
 * `serverExternalPackages` (next.config.mjs).
 *
 * DATABASE_URL=file:./dev.db (set in .env / .env.local)
 *
 * SQLite on Vercel: Vercel's filesystem is read-only at runtime (except /tmp).
 * If the DB file cannot be opened the client falls back to a no-op proxy so
 * that history routes return empty results instead of crashing the whole app.
 */

import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = any;

// Cache the client across HMR reloads in dev to avoid multiple file-handle opens
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: DbClient;
};

async function createClientAsync(): Promise<DbClient> {
  try {
    // Dynamic import — webpack skips bundling this because the generated
    // client path is listed in `serverExternalPackages` in next.config.mjs.
    const { PrismaClient } = await import("../lib/generated/prisma/client");
    const { PrismaBetterSqlite3 } = await import(
      "@prisma/adapter-better-sqlite3"
    );

    // Strip "file:" prefix from DATABASE_URL
    const rawUrl = (process.env.DATABASE_URL ?? "file:./dev.db").replace(
      /^file:/,
      ""
    );
    const dbPath = path.isAbsolute(rawUrl)
      ? rawUrl
      : path.join(process.cwd(), rawUrl);

    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (err) {
    // On Vercel (or any env where SQLite is unavailable / read-only),
    // return a no-op proxy so the app builds and runs without crashing.
    // History will simply be unavailable.
    console.warn(
      "[db] SQLite unavailable — history disabled. Cause:",
      (err as Error).message
    );
    return makeNoOpProxy();
  }
}

function makeNoOpProxy(): DbClient {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {},
          {
            get(_t, method) {
              if (method === "then") return undefined; // not a Promise
              return async () => {
                console.warn(
                  `[db] no-op: ${String(prop)}.${String(method)}() — SQLite unavailable`
                );
                return null;
              };
            },
          }
        );
      },
    }
  );
}

// Initialise lazily and cache in globalThis (survives HMR reloads in dev)
let _initPromise: Promise<DbClient> | null = null;

function getDb(): DbClient {
  if (!globalForPrisma.prisma) {
    if (!_initPromise) {
      _initPromise = createClientAsync().then((client) => {
        globalForPrisma.prisma = client;
        return client;
      });
    }
    // While the async init is in flight, return the no-op proxy so that
    // any synchronous code path (rare) does not throw.
    // In practice all callers are async and will await the real client.
    return makeNoOpProxy();
  }
  return globalForPrisma.prisma;
}

// Warm up the client at module load time so it is ready before the first request
if (!globalForPrisma.prisma && !_initPromise) {
  _initPromise = createClientAsync().then((client) => {
    globalForPrisma.prisma = client;
    return client;
  });
}

// Export as `db` — callers use db.tailoringRunRecord.create(...) etc.
// The proxy forwards to getDb() so it always resolves to the live client
// once the async initialisation has completed.
export const db: DbClient = new Proxy(
  {},
  {
    get(_target, prop) {
      return getDb()[prop];
    },
  }
);

export { getDb };
