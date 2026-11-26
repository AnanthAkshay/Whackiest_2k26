import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Modal } from "./ui/Modal";
import { getStoredThemePreference, persistThemePreference } from "./theme";
import { appendOutboundUtm, extractUtmParams } from "./utm";

(globalThis as unknown as { React: typeof React }).React = React;

test("UTM handling captures utm_* params, strips them from own URL, and appends only to outbound links", () => {
  const { utm, cleanedSearch } = extractUtmParams("?demo=1&utm_source=tryb&utm_campaign=pilot26");
  assert.deepEqual(utm, { utm_source: "tryb", utm_campaign: "pilot26" });
  assert.equal(cleanedSearch, "?demo=1");

  const outbound = appendOutboundUtm("https://tryb.example/activity", utm);
  assert.match(outbound, /utm_source=tryb/);
  assert.match(outbound, /utm_campaign=pilot26/);
});

test("Theme persistence stores light/dark and clears on system", () => {
  const mem = new Map<string, string>();
  const attrs = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); }
  };
  const mockRoot = {
    setAttribute: (k: string, v: string) => { attrs.set(k, v); },
    removeAttribute: (k: string) => { attrs.delete(k); }
  } as unknown as HTMLElement;

  assert.equal(getStoredThemePreference(mockStorage), "system");
  persistThemePreference("dark", mockStorage, mockRoot);
  assert.equal(getStoredThemePreference(mockStorage), "dark");
  assert.equal(attrs.get("data-theme"), "dark");

  persistThemePreference("system", mockStorage, mockRoot);
  assert.equal(getStoredThemePreference(mockStorage), "system");
  assert.equal(attrs.has("data-theme"), false);
});

test("Confirmation modal renders accessible dialog with Cancel and explicit destructive action", () => {
  const html = renderToStaticMarkup(
    <Modal open onClose={() => undefined} title="Withdraw Skill Passport?">
      <button type="button">Cancel</button>
      <button type="button">WITHDRAW PASSPORT</button>
    </Modal>
  );
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /Withdraw Skill Passport\?/);
  assert.match(html, /Cancel/);
  assert.match(html, /WITHDRAW PASSPORT/);
});
