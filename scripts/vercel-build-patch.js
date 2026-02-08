#!/usr/bin/env node
"use strict";
const fs = require("fs");
// 1) auth: token.email type
const authPath = "lib/auth.ts";
let c = fs.readFileSync(authPath, "utf8");
if (c.includes("token.email = user.email;")) {
  c = c.replace("token.email = user.email;", "token.email=user.email??undefined");
  fs.writeFileSync(authPath, c);
}
// 2) pages: force-dynamic for useSearchParams prerender
const inject = '"use client";\nexport const dynamic = "force-dynamic";\n';
["app/(app)/thought-records/new/page.tsx", "app/(auth)/login/page.tsx"].forEach((p) => {
  c = fs.readFileSync(p, "utf8");
  if (!c.includes("force-dynamic")) {
    c = c.replace('"use client";', inject);
    fs.writeFileSync(p, c);
  }
});
