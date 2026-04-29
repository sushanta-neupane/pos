import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const envPath = path.join(root, ".env");

function base64url(bytes) {
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function generateSecret() {
  return base64url(crypto.randomBytes(32));
}

function hasKey(content, key) {
  const re = new RegExp(`^\\s*${key}=`, "m");
  return re.test(content);
}

const defaults = [
  ['DATABASE_URL', '"mongodb://127.0.0.1:27018/pos?replicaSet=rs0"'],
  ["NEXTAUTH_URL", '"http://localhost:3000"'],
  ["NEXTAUTH_SECRET", JSON.stringify(generateSecret())],
];

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf8");
}

const missing = defaults.filter(([k]) => !hasKey(content, k));

if (missing.length === 0) {
  console.log(".env already has required keys.");
  process.exit(0);
}

const block = [
  "",
  "# Added by scripts/ensure-env.mjs",
  ...missing.map(([k, v]) => `${k}=${v}`),
  "",
].join("\n");

fs.writeFileSync(envPath, content.trimEnd() + block, "utf8");

console.log(`.env updated: added ${missing.map(([k]) => k).join(", ")}`);
