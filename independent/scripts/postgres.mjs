// Optional local PostgreSQL binaries. No global install, OS user, or service.
import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = await readFile(resolve(root, "backend/.env"), "utf8");
const url = new URL(env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim() || "");
const databaseDir = resolve(root, ".data/postgres");
await mkdir(databaseDir, { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir,
  user: url.username,
  password: url.password,
  port: Number(url.port),
  persistent: true,
  createPostgresUser: false,
  postgresFlags: ["-h", "127.0.0.1"],
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});
let initialized = false;
try {
  await access(resolve(databaseDir, "PG_VERSION"));
  initialized = true;
} catch {}
if (!initialized) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const database = url.pathname.slice(1);
if (!/^[a-z0-9_]+$/.test(database))
  throw new Error("Invalid local database name");
const exists = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  [database],
);
await client.end();
if (!exists.rows.length) await pg.createDatabase(database);
console.log(
  `Local PostgreSQL ready at 127.0.0.1:${url.port}. Ctrl+C stops it; data persists.`,
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 60000);
