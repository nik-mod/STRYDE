import readline from "node:readline";
import { Writable } from "node:stream";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
if (!process.stdin.isTTY)
  throw new Error(
    "Run this command in your interactive terminal. Passwords are not accepted as command-line arguments.",
  );
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output,
  terminal: true,
});
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
const email = await ask("Owner email: ");
process.stdout.write("Password (minimum 16 characters; input hidden): ");
muted = true;
const password = await ask("");
muted = false;
process.stdout.write("\n");
process.stdout.write("Confirm password: ");
muted = true;
const confirm = await ask("");
muted = false;
process.stdout.write("\n");
rl.close();
if (password !== confirm || password.length < 16)
  throw new Error("Passwords must match and contain at least 16 characters.");
const backend = resolve(dirname(fileURLToPath(import.meta.url)), "../backend");
const child = spawn(
  process.execPath,
  [
    resolve(backend, "node_modules/@medusajs/cli/cli.js"),
    "exec",
    "./src/scripts/setup-owner.ts",
  ],
  {
    cwd: backend,
    stdio: "inherit",
    env: {
      ...process.env,
      STRYDE_ADMIN_EMAIL: email,
      STRYDE_ADMIN_PASSWORD: password,
    },
  },
);
child.on("exit", (code) => (process.exitCode = code ?? 1));
