const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const UTM_STORAGE_KEY = "prooffolio_utm";

export function extractUtmParams(search: string): {
  utm: Record<string, string>;
  cleanedSearch: string;
} {
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) {
      utm[key] = val;
      params.delete(key);
    }
  }
  const rest = params.toString();
  return { utm, cleanedSearch: rest ? `?${rest}` : "" };
}

export function appendOutboundUtm(url: string, utm: Record<string, string>): string {
  if (!url || Object.keys(utm).length === 0) return url;
  try {
    const parsed = new URL(url, "https://prooffolio.local");
    for (const [k, v] of Object.entries(utm)) {
      if (!parsed.searchParams.has(k)) parsed.searchParams.set(k, v);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getStoredUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function saveStoredUtm(utm: Record<string, string>): void {
  if (typeof window === "undefined" || Object.keys(utm).length === 0) return;
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Ignore storage quota errors
  }
}
