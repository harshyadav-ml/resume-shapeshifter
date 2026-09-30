/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude native modules and the Prisma generated client from webpack bundling.
  // The generated Prisma 7 client uses import.meta.url (ESM) which breaks
  // when bundled by webpack — it must be loaded as an external module at runtime.
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "@prisma/adapter-better-sqlite3",
      "@prisma/adapter-pg",
      "@prisma/client",
      "pg",
      "pg-native",
      ".prisma/client",
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
        ? [config.externals]
        : [];
      config.externals = [
        ...externals,
        ({ request }, callback) => {
          // Exclude any require/import of the Prisma generated client path
          if (
            request &&
            (request.includes("lib/generated/prisma") ||
              request.includes("@prisma/adapter-better-sqlite3") ||
              request.includes("better-sqlite3") ||
              request.includes("@prisma/adapter-pg") ||
              request === "pg" ||
              request === "pg-native")
          ) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
