import { randomBytes } from "node:crypto";
import { writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function create(file, content) {
  try {
    await access(resolve(root, file));
  } catch {
    await writeFile(resolve(root, file), content);
  }
}
const secret = () => randomBytes(32).toString("hex");
await create(
  "backend/.env",
  `DATABASE_URL=postgresql://stryde:${secret()}@127.0.0.1:5433/stryde_development\nDATABASE_SSL=false\nSTORE_CORS=http://localhost:3000,http://127.0.0.1:3000\nADMIN_CORS=http://localhost:9000,http://127.0.0.1:9000\nAUTH_CORS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:9000,http://127.0.0.1:9000\nJWT_SECRET=${secret()}\nCOOKIE_SECRET=${secret()}\nSTRYDE_TEST_MODE=true\nDISABLE_ADMIN=false\n`,
);
await create(
  "storefront/.env.local",
  `SITE_URL=http://localhost:3000\nMEDUSA_BACKEND_URL=http://127.0.0.1:9000\nMEDUSA_PUBLISHABLE_KEY=\nMEDUSA_REGION_ID=\nCART_COOKIE_SECRET=${secret()}\nSTRYDE_TEST_MODE=true\n`,
);
console.log(
  "Local configuration created with random secrets. Existing configuration preserved.",
);
