import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = resolve(process.cwd(), "docs", "assets", "screenshots");
mkdirSync(outDir, { recursive: true });

async function run(): Promise<void> {
  console.log("Starting mock API and Web Vite server...");
  const api = spawn("cmd.exe", ["/c", "npx", "tsx", "api/src/local.ts"], {
    env: { ...process.env, MOCK_MODE: "1", PORT: "8787" }
  });

  const web = spawn("cmd.exe", ["/c", "npx", "vite", "--port", "5173"], {
    cwd: resolve(process.cwd(), "web"),
    env: { ...process.env, VITE_API_URL: "http://localhost:8787" }
  });

  await new Promise((res) => setTimeout(res, 5000));

  const takeScreenshot = (url: string, filename: string, delayMs = 3000): Promise<void> => {
    return new Promise((resolvePromise) => {
      const outPath = resolve(outDir, filename);
      const args = [
        "--headless=new",
        "--disable-gpu",
        "--window-size=380,800",
        "--hide-scrollbars",
        `--screenshot=${outPath}`,
        `--virtual-time-budget=${delayMs}`,
        url
      ];
      const proc = spawn(chromePath, args);
      proc.on("exit", () => {
        console.log(`Saved screenshot: ${filename}`);
        resolvePromise();
      });
    });
  };

  try {
    console.log("Capturing high-resolution screenshots...");
    await takeScreenshot("http://localhost:5173/", "01-setup-step-skill.png", 2500);
    await takeScreenshot("http://localhost:5173/?demo=1", "02-demo-replay-banner.png", 2500);
    await takeScreenshot("http://localhost:5173/session?demo=1", "03-live-session-meter.png", 4500);
    await takeScreenshot("http://localhost:5173/results/demo?demo=1", "04-results-screen.png", 3000);
    await takeScreenshot("http://localhost:5173/skill/EwRis6MBnpNeQO2D", "05-share-screen.png", 3000);
    await takeScreenshot("http://localhost:8787/p/EwRis6MBnpNeQO2D", "06-skill-page-static-html.png", 2500);
    await takeScreenshot("http://localhost:5173/health", "07-health-dashboard.png", 2500);
  } finally {
    spawn("taskkill", ["/pid", api.pid?.toString() ?? "", "/f", "/t"]);
    spawn("taskkill", ["/pid", web.pid?.toString() ?? "", "/f", "/t"]);
    console.log("Servers stopped. Screenshot capture complete.");
  }
}

void run();
