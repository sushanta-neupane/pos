import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

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

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function usageAndExit(message) {
  if (message) console.error(message);
  console.error(
    [
      "",
      "Usage:",
      "  bun scripts/create-user.mjs --email admin@local.test --password admin123 --role ADMIN",
      "  bun scripts/create-user.mjs --email sales@local.test --password sales123 --role SALES",
      "",
      "Notes:",
      "  - MongoDB must be a replica set (single-node is fine).",
      "  - Ensure DATABASE_URL includes ?replicaSet=rs0",
      "",
    ].join("\n")
  );
  process.exit(1);
}

async function main() {
  loadDotEnv();

  const emailRaw = arg("email");
  const password = arg("password");
  const roleRaw = (arg("role") ?? "SALES").toUpperCase();

  if (!emailRaw) usageAndExit("Missing --email");
  if (!password) usageAndExit("Missing --password");

  const email = emailRaw.toLowerCase().trim();
  const role = roleRaw === "ADMIN" ? Role.ADMIN : roleRaw === "SALES" ? Role.SALES : null;
  if (!role) usageAndExit("Invalid --role. Use ADMIN or SALES.");

  if (!process.env.DATABASE_URL) {
    usageAndExit("DATABASE_URL is not set. Run `bun run setup` or set it in .env.");
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role },
      create: { email, passwordHash, role },
    });
    console.log(`OK: ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});

