import { clientConfig } from "../config/integrations";

export interface WebVitalMetric {
  name: "LCP" | "CLS" | "INP";
  value: number;
}

function emitVital(metric: WebVitalMetric): void {
  if (import.meta.env.DEV || import.meta.env.VITE_MOCK_MODE === "1") {
    console.info(`[web-vitals] ${metric.name}:`, Number(metric.value.toFixed(3)));
    return;
  }
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function" && clientConfig.apiBase) {
    try {
      navigator.sendBeacon(`${clientConfig.apiBase}/api/vitals`, JSON.stringify(metric));
    } catch {
      // Non-blocking
    }
  }
}

export function observeWebVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) emitVital({ name: "LCP", value: last.startTime });
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // Unsupported entry type
  }

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (!entry.hadRecentInput && typeof entry.value === "number") {
          clsValue += entry.value;
        }
      }
      emitVital({ name: "CLS", value: clsValue });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  } catch {
    // Unsupported entry type
  }

  try {
    let maxInp = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > maxInp) maxInp = entry.duration;
      }
      if (maxInp > 0) emitVital({ name: "INP", value: maxInp });
    });
    inpObserver.observe({ type: "event", buffered: true });
  } catch {
    // Unsupported entry type
  }
}
