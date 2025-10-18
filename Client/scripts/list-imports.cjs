const fs = require("fs");
const path = require("path");

const mods = new Set();
const isBare = (id) =>
  id &&
  !id.startsWith(".") &&
  !id.startsWith("/") &&
  !id.startsWith("@/") &&
  !id.startsWith("virtual:") &&
  !id.startsWith("http");

function scan(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      scan(fp);
    } else if (/\.(mjs|cjs|js|jsx|ts|tsx)$/.test(name)) {
      const t = fs.readFileSync(fp, "utf8");
      // import ... from "x"
      for (const m of t.matchAll(/from\s+["']([^"']+)["']/g)) {
        const id = m[1];
        if (isBare(id)) mods.add(id);
      }
      // import("x")
      for (const m of t.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
        const id = m[1];
        if (isBare(id)) mods.add(id);
      }
      // require("x")
      for (const m of t.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
        const id = m[1];
        if (isBare(id)) mods.add(id);
      }
    }
  }
}

scan(path.join(process.cwd(), "src"));
for (const m of mods) console.log(m);
