import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = resolve(process.cwd(), "docs", "assets", "screenshots");
mkdirSync(outDir, { recursive: true });

async function isServerReady(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function captureWithCdp(
  pages: { url: string; filename: string; width: number; height: number; mobile: boolean; delayMs?: number }[]
): Promise<void> {
  const userDataDir = mkdtempSync(join(tmpdir(), "prooffolio-cdp-"));
  const port = 9229;
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = (await listRes.json()) as { webSocketDebuggerUrl: string }[];
    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);

    let msgId = 1;
    const call = (method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> =>
      new Promise((resolvePromise, rejectPromise) => {
        const id = msgId++;
        const onMsg = (ev: MessageEvent) => {
          const data = JSON.parse(String(ev.data)) as { id?: number; error?: unknown; result?: Record<string, unknown> };
          if (data.id === id) {
            ws.removeEventListener("message", onMsg);
            if (data.error) rejectPromise(data.error);
            else resolvePromise(data.result ?? {});
          }
        };
        ws.addEventListener("message", onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise((r) => ws.addEventListener("open", r));
    await call("Page.enable");
    await call("Runtime.enable");

    for (const page of pages) {
      await call("Emulation.setDeviceMetricsOverride", {
        width: page.width,
        height: page.height,
        deviceScaleFactor: page.mobile ? 2 : 1,
        mobile: page.mobile
      });
      await call("Page.navigate", { url: page.url });
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const res = await call("Runtime.evaluate", {
          expression: "Boolean(document.querySelector('#root') && document.querySelector('#root').children.length > 0)",
          returnByValue: true
        });
        const resultObj = res.result as { value?: boolean } | undefined;
        if (resultObj?.value) break;
      }
      await new Promise((r) => setTimeout(r, 800));
      const shot = await call("Page.captureScreenshot", { format: "png" });
      writeFileSync(resolve(outDir, page.filename), Buffer.from(String(shot.data), "base64"));
      console.log(`Saved screenshot: ${page.filename} (${page.width}x${page.height})`);
    }

    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore temp cleanup errors
    }
  }
}

async function run(): Promise<void> {
  let api: ChildProcess | undefined;
  let web: ChildProcess | undefined;

  const alreadyRunning = await isServerReady("http://localhost:5173/");
  if (!alreadyRunning) {
    console.log("Starting mock API and Web Vite server...");
    api = spawn("cmd.exe", ["/c", "npx", "tsx", "api/src/local.ts"], {
      env: { ...process.env, MOCK_MODE: "1", PORT: "8787" }
    });
    web = spawn("cmd.exe", ["/c", "npx", "vite", "--port", "5173"], {
      cwd: resolve(process.cwd(), "web"),
      env: { ...process.env, VITE_API_URL: "http://localhost:8787" }
    });
    await new Promise((res) => setTimeout(res, 5000));
  } else {
    console.log("Using existing dev servers on http://localhost:5173/");
  }

  try {
    await captureWithCdp([
      { url: "http://localhost:5173/", filename: "01-landing-mobile-360.png", width: 360, height: 800, mobile: true },
      { url: "http://localhost:5173/", filename: "02-landing-desktop-1280.png", width: 1280, height: 800, mobile: false },
      { url: "http://localhost:5173/?demo=1", filename: "03-demo-replay-desktop.png", width: 1280, height: 800, mobile: false },
      { url: "http://localhost:5173/challenge", filename: "04-challenge-desktop.png", width: 1280, height: 800, mobile: false },
      { url: "http://localhost:5173/opportunities", filename: "05-opportunities-desktop.png", width: 1280, height: 800, mobile: false },
      { url: "http://localhost:5173/health", filename: "06-health-desktop.png", width: 1280, height: 800, mobile: false },
      { url: "http://localhost:5173/integrations", filename: "07-integrations-desktop.png", width: 1280, height: 800, mobile: false }
    ]);
  } finally {
    if (api?.pid) spawn("taskkill", ["/pid", api.pid.toString(), "/f", "/t"]);
    if (web?.pid) spawn("taskkill", ["/pid", web.pid.toString(), "/f", "/t"]);
    console.log("Screenshot capture complete.");
  }
}

void run();
