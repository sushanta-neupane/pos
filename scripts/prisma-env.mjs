import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

const prismaJs = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: bun scripts/prisma-env.mjs <prisma args...>");
  process.exit(1);
}

const res = spawnSync("bun", [prismaJs, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(res.status ?? 1);
