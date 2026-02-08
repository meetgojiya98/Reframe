/**
 * Prebuild patch: fix lib/auth.ts token.email type so the build passes
 * when the repo is at a commit that still has token.email = user.email
 * (user.email can be null; token.email expects string | undefined).
 * Idempotent: safe to run even if the file is already fixed.
 */
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "lib", "auth.ts");
let content = fs.readFileSync(file, "utf8");
const oldLine = "token.email = user.email;";
const newLine = "token.email = (user.email ?? undefined) as string | undefined;";
if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(file, content);
  console.log("[patch-auth-for-build] Patched lib/auth.ts for token.email type");
}
