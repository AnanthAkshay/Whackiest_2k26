export type ThemePreference = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "prooffolio_theme";

export function getStoredThemePreference(storage?: Pick<Storage, "getItem">): ThemePreference {
  try {
    const s = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    const val = s?.getItem(THEME_STORAGE_KEY);
    if (val === "light" || val === "dark") return val;
    return "system";
  } catch {
    return "system";
  }
}

export function persistThemePreference(
  pref: ThemePreference,
  storage?: Pick<Storage, "setItem" | "removeItem">,
  root?: HTMLElement
): void {
  const s = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  const el = root ?? (typeof document !== "undefined" ? document.documentElement : undefined);
  try {
    if (pref === "system") {
      s?.removeItem(THEME_STORAGE_KEY);
      el?.removeAttribute("data-theme");
    } else {
      s?.setItem(THEME_STORAGE_KEY, pref);
      el?.setAttribute("data-theme", pref);
    }
  } catch {
    // Ignore storage errors
  }
}
