import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const FONT_BLOCK = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://api.fontshare.com">
    <link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;600;700&display=swap">
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap">
`;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

let updated = 0;

for (const file of walk(root)) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes("css/styles.css") && !html.includes("../css/styles.css")) continue;
  if (html.includes("preconnect") && html.includes("api.fontshare.com")) continue;

  const pattern = /(\n\s*<link rel="stylesheet" href="(?:\.\.\/)?css\/styles\.css)/;
  if (!pattern.test(html)) continue;

  html = html.replace(pattern, `\n${FONT_BLOCK}$1`);
  fs.writeFileSync(file, html);
  updated += 1;
}

console.log(`Updated ${updated} HTML file(s).`);
