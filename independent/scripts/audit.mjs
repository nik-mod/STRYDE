import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(resolve(root, "evidence"), { recursive: true });
let failed = false;
for (const project of ["storefront", "backend"]) {
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["audit", "--omit=dev", "--json"],
    {
      cwd: resolve(root, project),
      shell: process.platform === "win32",
      encoding: "utf8",
    },
  );
  await writeFile(
    resolve(root, `evidence/${project}-audit.json`),
    result.stdout,
  );
  const audit = JSON.parse(result.stdout);
  console.log(project, JSON.stringify(audit.metadata.vulnerabilities));
  if (audit.metadata.vulnerabilities.total) failed = true;
}
process.exitCode = failed ? 1 : 0;
