import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import { readFileSync } from "node:fs";
import { bankProviderModules } from "./src/lib/bank-payments/config";
loadEnv(process.env.NODE_ENV || "development", process.cwd());
const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required server configuration: ${name}`);
  return value;
};
const production = process.env.NODE_ENV === "production";
if (production) {
  required("REDIS_URL");
  if (
    required("JWT_SECRET").length < 32 ||
    required("COOKIE_SECRET").length < 32
  )
    throw new Error("Production secrets must contain at least 32 characters");
  for (const name of ["STORE_CORS", "ADMIN_CORS", "AUTH_CORS"])
    if (
      !required(name)
        .split(",")
        .every((url) => url.startsWith("https://"))
    )
      throw new Error(`${name} must use HTTPS in production`);
}
// Bank adapters are opt-in with bank-issued sandbox credentials only.
// Production checkout remains denied until merchant certification is complete.
module.exports = defineConfig({
  projectConfig: {
    databaseUrl: required("DATABASE_URL"),
    databaseDriverOptions: {
      connection: {
        ssl:
          process.env.DATABASE_SSL === "true"
            ? {
                ...(process.env.DATABASE_SSL_CA_FILE ? { ca: readFileSync(process.env.DATABASE_SSL_CA_FILE, "utf8") } : {}),
                // Hosted providers (e.g. Supabase) present a standard public
                // CA chain; local VPN/proxy setups can break Node's chain
                // verification. Set DATABASE_SSL_STRICT=false explicitly to
                // still encrypt but skip chain verification.
                rejectUnauthorized:
                  process.env.DATABASE_SSL_STRICT !== "false",
              }
            : false,
      },
    },
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: required("STORE_CORS"),
      adminCors: required("ADMIN_CORS"),
      authCors: required("AUTH_CORS"),
      jwtSecret: required("JWT_SECRET"),
      cookieSecret: required("COOKIE_SECRET"),
    },
  },
  admin: { disable: process.env.DISABLE_ADMIN === "true" },
  modules: [
    { resolve: "./src/modules/catalog-media" },
    { resolve: "./src/modules/payment-operations" },
    { resolve: "@medusajs/medusa/payment", options: { providers: bankProviderModules() } },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "./static",
              backend_url:
                process.env.MEDIA_PUBLIC_URL || "http://localhost:3000/media",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-postgres",
            id: "locking-postgres",
            is_default: true,
          },
        ],
      },
    },
    ...(process.env.REDIS_URL
      ? [
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: { redisUrl: process.env.REDIS_URL },
          },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: { redis: { redisUrl: process.env.REDIS_URL } },
          },
        ]
      : []),
  ],
});
