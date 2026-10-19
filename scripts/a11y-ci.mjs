#!/usr/bin/env node
/**
 * Accessibility CI — axe-core on key static pages (Puppeteer + bundled Chromium).
 *
 * Usage: npm run test:a11y
 * Env:   A11Y_PORT, A11Y_BASE_URL, A11Y_AXE_TAGS (default wcag2a,wcag2aa)
 *         A11Y_STRICT — "0" / "false" = report violations but exit 0 (CI informative mode)
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.A11Y_PORT || 8765);
const HOST = "127.0.0.1";
const BASE_URL = (process.env.A11Y_BASE_URL || `http://${HOST}:${PORT}`).replace(/\/$/, "");
const REPORT_DIR = path.join(ROOT, "scripts", "a11y-reports");
const AXE_TAGS = (process.env.A11Y_AXE_TAGS || "wcag2a,wcag2aa").split(",").map((t) => t.trim());
const STRICT =
  process.env.A11Y_STRICT !== "0" && String(process.env.A11Y_STRICT || "").toLowerCase() !== "false";
const SUMMARY_PATH = path.join(REPORT_DIR, "summary.json");

const PAGES = [
  "/index.html",
  "/en/index.html",
  "/metodologia.html",
  "/servicios.html",
  "/casos.html",
  "/informes.html",
  "/perspectivas.html",
  "/contacto.html",
  "/evaluacion.html",
  "/mi-espacio.html",
  "/newsletter.html",
];

function waitForServer(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server not ready: ${url}`));
          return;
        }
        setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

function startServer() {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["serve", ".", "-l", `tcp://${HOST}:${PORT}`],
    { cwd: ROOT, stdio: "pipe", shell: process.platform === "win32" }
  );
  return child;
}

function slugFromPath(pagePath) {
  return pagePath.replace(/^\//, "").replace(/[/.]/g, "-") || "root";
}

async function scanPage(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    const results = await new AxePuppeteer(page).withTags(AXE_TAGS).analyze();
    return results;
  } finally {
    await page.close();
  }
}

async function main() {
  const ownServer = !process.env.A11Y_BASE_URL;
  let server = null;

  if (ownServer) {
    server = startServer();
    await waitForServer(`${BASE_URL}/index.html`);
    console.log(`\n[a11y] Server ready at ${BASE_URL}\n`);
  } else {
    console.log(`\n[a11y] Using existing server: ${BASE_URL}\n`);
  }

  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const failures = [];

  try {
    for (const pagePath of PAGES) {
      const url = `${BASE_URL}${pagePath}`;
      const reportPath = path.join(REPORT_DIR, `${slugFromPath(pagePath)}.json`);
      console.log(`[a11y] Scanning ${url}`);

      const results = await scanPage(browser, url);
      writeFileSync(reportPath, JSON.stringify(results, null, 2));

      const violations = results.violations || [];
      if (violations.length) {
        failures.push({ pagePath, url, reportPath, violations });
        console.error(
          `[a11y] FAIL — ${violations.length} violation(s): ${url}\n` +
            violations
              .slice(0, 5)
              .map((v) => `       • ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
              .join("\n") +
            (violations.length > 5 ? `\n       … +${violations.length - 5} more` : "") +
            `\n       report: ${path.relative(ROOT, reportPath)}\n`
        );
      } else {
        console.log(`[a11y] OK — ${url}\n`);
      }
    }
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }

  const summary = {
    mode: STRICT ? "strict" : "informative",
    tags: AXE_TAGS,
    totalPages: PAGES.length,
    failedPages: failures.length,
    passedPages: PAGES.length - failures.length,
    pages: PAGES.map((pagePath) => {
      const hit = failures.find((f) => f.pagePath === pagePath);
      return {
        pagePath,
        url: `${BASE_URL}${pagePath}`,
        ok: !hit,
        violationCount: hit ? hit.violations.length : 0,
        violationIds: hit ? hit.violations.map((v) => v.id) : [],
        report: path.join("scripts", "a11y-reports", `${slugFromPath(pagePath)}.json`),
      };
    }),
  };

  writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));

  if (failures.length) {
    console.error(`\n[a11y] ${failures.length}/${PAGES.length} page(s) with axe violations.`);
    console.error(`[a11y] Summary: ${path.relative(ROOT, SUMMARY_PATH)}\n`);
    if (STRICT) {
      process.exit(1);
    }
    console.warn("[a11y] Informative mode (A11Y_STRICT=0) — exiting 0; see reports for details.\n");
    return;
  }

  console.log(`[a11y] All ${PAGES.length} pages passed (tags: ${AXE_TAGS.join(", ")}).\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
