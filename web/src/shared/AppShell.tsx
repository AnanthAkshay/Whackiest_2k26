import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUp,
  BookOpen,
  Briefcase,
  Certificate,
  FileXls,
  List,
  MagnifyingGlass,
  Microphone,
  Moon,
  Question,
  Sun,
  User,
  X
} from "@phosphor-icons/react";
import { DEFAULT_CONTENT_BUNDLE } from "../content/lessons";
import { useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import type { Language } from "../types";
import { getStoredThemePreference, persistThemePreference, type ThemePreference } from "./theme";
import { Frame, SegmentedControl, Sheet, TextLink, buttonClasses } from "./ui";
import { extractUtmParams, saveStoredUtm } from "./utm";

const LANG_OPTIONS: { value: Language; label: string; ariaLabel: string }[] = [
  { value: "en", label: "EN", ariaLabel: "English" },
  { value: "hi", label: "हिं", ariaLabel: "हिन्दी" },
  { value: "kn", label: "ಕನ್ನಡ", ariaLabel: "ಕನ್ನಡ" }
];

const SEARCH_INDEX = [
  { group: "Journey", title: "Learn & Practise", desc: "Spreadsheet micro-lessons and drills", to: "/learn" },
  { group: "Journey", title: "Retail Sales Challenge (.xlsx)", desc: "Download starter workbook and upload", to: "/challenge" },
  { group: "Journey", title: "Validation Report", desc: "Deterministic spreadsheet check results", to: "/validation" },
  { group: "Journey", title: "AI Viva Setup", desc: "Choose language, voice/text mode, and test mic", to: "/setup-viva" },
  { group: "Journey", title: "Explain (AI Viva)", desc: "Live voice or text examiner interview", to: "/session" },
  { group: "Passport", title: "Sample Skill Passport", desc: "Ed25519-signed credential preview", to: "/skill/demo?demo=1" },
  { group: "Connect", title: "Local Opportunities", desc: "Matched entry-level roles and skill gaps", to: "/opportunities" },
  { group: "Rubric", title: "ECVE Scoring (0.60P + 0.25U + 0.15C)", desc: "Practical, Understanding, Consistency weights", to: "/results/att_demo_retail_01?demo=1" },
  { group: "Diagnostics", title: "System Health & Integrations", desc: "Live / Mock / Not configured status", to: "/health" },
  ...DEFAULT_CONTENT_BUNDLE.lessons.map((l) => ({
    group: "Lesson",
    title: l.title.en,
    desc: l.summary.en,
    to: "/learn"
  }))
];

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const { language, chooseLanguage } = useSetup();
  const location = useLocation();
  const demoQuery = location.search.includes("demo=1") ? "?demo=1" : "";

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { utm, cleanedSearch } = extractUtmParams(window.location.search);
    if (Object.keys(utm).length > 0) {
      saveStoredUtm(utm);
      window.history.replaceState({}, "", window.location.pathname + cleanedSearch + window.location.hash);
    }

    const stored = getStoredThemePreference();
    setThemePref(stored);
    if (stored !== "system") {
      document.documentElement.dataset.theme = stored;
    }

    let rafId = 0;
    const onScroll = (): void => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - window.innerHeight);
        const y = window.scrollY;
        setScrollPct(Math.min(100, Math.max(0, (y / max) * 100)));
        setIsScrolled(y > 16);
        setShowTopBtn(y > 600);
      });
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    const firstLink = drawer?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();

    const onDrawerKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key === "Tab" && drawer) {
        const items = Array.from(drawer.querySelectorAll<HTMLElement>("a, button"));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onDrawerKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onDrawerKey);
    };
  }, [menuOpen]);

  function setThemePreference(next: ThemePreference): void {
    setThemePref(next);
    persistThemePreference(next);
  }

  const navItems = [
    { label: t("navHowItWorks"), to: "/learn", matches: (p: string) => p.startsWith("/learn") },
    { label: t("navForLearners"), to: `/profile${demoQuery}`, matches: (p: string) => p.startsWith("/profile") || p.startsWith("/role") || p.startsWith("/challenge") },
    { label: t("navForEmployers"), to: "/opportunities", matches: (p: string) => p.startsWith("/opportunities") || p.startsWith("/connect") },
    { label: t("navVerify"), to: "/skill/demo?demo=1", matches: (p: string) => p.startsWith("/skill") || p.startsWith("/passport") }
  ];

  const mobileDockItems = [
    { key: "learn", label: "Learn", to: "/learn", icon: BookOpen, matches: (p: string) => p.startsWith("/learn") || p.startsWith("/role") },
    { key: "challenge", label: "Challenge", to: "/challenge", icon: FileXls, matches: (p: string) => p.startsWith("/challenge") || p.startsWith("/validation") },
    { key: "explain", label: "Explain", to: `/session${demoQuery}`, icon: Microphone, matches: (p: string) => p.startsWith("/session") || p.startsWith("/results") || p.startsWith("/setup-viva") },
    { key: "passport", label: "Passport", to: "/skill/demo?demo=1", icon: Certificate, matches: (p: string) => p.startsWith("/skill") || p.startsWith("/passport") },
    { key: "connect", label: "Connect", to: "/opportunities", icon: Briefcase, matches: (p: string) => p.startsWith("/opportunities") || p.startsWith("/connect") }
  ];

  const q = searchQuery.trim().toLowerCase();
  const filteredSearch = q
    ? SEARCH_INDEX.filter((item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))
    : SEARCH_INDEX;

  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  const isMockOrDemo = location.search.includes("demo=1") || env?.VITE_MOCK_MODE !== "0";
  const announcementText = isMockOrDemo
    ? "Mock mode: integrations are simulated. Voice needs a microphone; Text mode is always available."
    : "";

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {announcementText && !announcementDismissed && (
        <div className="announcement-bar" role="region" aria-label="System notice">
          <div className="announcement-bar-inner">
            <span>{announcementText}</span>
            <button
              type="button"
              className="announcement-close-btn"
              aria-label="Dismiss announcement"
              onClick={() => setAnnouncementDismissed(true)}
            >
              <X size={14} weight="regular" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="site-topbar-wrap">
        <header className={"site-topbar" + (isScrolled ? " is-scrolled" : "")}>
          <div className="site-topbar-inner">
            <Link to={`/${demoQuery}`} className="topbar-wordmark" onClick={() => setMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2" />
                <path d="M9 17V7H13C14.933 7 16.5 8.567 16.5 10.5C16.5 12.433 14.933 14 13 14H9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="wordmark-bold">PROOFFOLIO</span>
            </Link>

            <nav className="topbar-nav" aria-label={t("mainNavLabel")}>
              {navItems.map((item) => (
                <TextLink
                  key={item.to}
                  to={item.to}
                  current={item.matches(location.pathname)}
                  className="topbar-nav-link"
                >
                  {item.label}
                </TextLink>
              ))}
            </nav>

            <div className="topbar-actions">
              <SegmentedControl
                options={LANG_OPTIONS}
                value={language}
                onChange={chooseLanguage}
                ariaLabel="Language switcher"
                className="topbar-lang-seg"
              />

              <button
                type="button"
                className="topbar-icon-btn topbar-search-btn"
                aria-label="Search site (/)"
                title="Search (/)"
                onClick={() => setSearchOpen(true)}
              >
                <MagnifyingGlass size={18} weight="regular" aria-hidden="true" />
              </button>

              <button
                type="button"
                className="topbar-icon-btn"
                aria-label={themePref === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setThemePreference(themePref === "dark" ? "light" : "dark")}
              >
                {themePref === "dark" ? <Sun size={18} weight="regular" aria-hidden="true" /> : <Moon size={18} weight="regular" aria-hidden="true" />}
              </button>

              <Link
                to={`/profile${demoQuery}`}
                className="topbar-icon-btn topbar-search-btn"
                aria-label={t("navForLearners")}
                title={t("navForLearners")}
              >
                <User size={18} weight="regular" aria-hidden="true" />
              </Link>

              <Link
                to={`/profile${demoQuery}`}
                className={buttonClasses({ variant: "primary", className: "topbar-start-cta" })}
              >
                START NOW
              </Link>

              <button
                type="button"
                className="topbar-icon-btn topbar-menu-btn"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={t("navMenuToggle")}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? <X size={18} weight="regular" aria-hidden="true" /> : <List size={18} weight="regular" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="scroll-progress-bar" aria-hidden="true">
            <div className="scroll-progress-fill" style={{ transform: `scaleX(${scrollPct / 100})` }} />
          </div>
        </header>
      </div>

      {menuOpen && (
        <nav ref={drawerRef} id="mobile-nav-drawer" className="mobile-nav-drawer" aria-label={t("mainNavLabel")}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={"mobile-nav-link" + (item.matches(location.pathname) ? " is-current" : "")}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ marginTop: "8px" }}>
            <span className="pf-label" style={{ display: "block", marginBottom: "8px" }}>Language</span>
            <SegmentedControl
              options={LANG_OPTIONS}
              value={language}
              onChange={chooseLanguage}
              ariaLabel="Mobile language switcher"
            />
          </div>
          <div style={{ marginTop: "8px" }}>
            <span className="pf-label" style={{ display: "block", marginBottom: "8px" }}>Theme</span>
            <SegmentedControl
              ariaLabel="Theme"
              value={themePref}
              onChange={setThemePreference}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" }
              ]}
            />
          </div>
        </nav>
      )}

      <div id="main-content" className="app-content" tabIndex={-1}>
        <div key={location.pathname} className="am-route-enter">
          {children}
        </div>
      </div>

      <Frame>
        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <strong className="footer-col-title">Project</strong>
              <ul className="footer-col-list">
                <li><Link to="/learn">{t("navHowItWorks")}</Link></li>
                <li><Link to="/challenge">Demonstrate (.xlsx)</Link></li>
                <li><Link to="/opportunities">{t("navForEmployers")}</Link></li>
              </ul>
            </div>
            <div>
              <strong className="footer-col-title">Verify a passport</strong>
              <ul className="footer-col-list">
                <li><Link to="/skill/demo?demo=1">Sample Skill Passport</Link></li>
                <li><a href="/.well-known/jwks.json">JWKS Public Keys</a></li>
                <li><Link to="/health">{t("footerHealth")}</Link></li>
              </ul>
            </div>
            <div>
              <strong className="footer-col-title">Honesty and disclosure</strong>
              <ul className="footer-col-list">
                <li><Link to="/integrations">{t("footerIntegrations")}</Link></li>
                <li><span className="footer-note">No ad trackers. Local device storage only.</span></li>
              </ul>
            </div>
            <div>
              <strong className="footer-col-title">Team The North Remembers</strong>
              <p className="footer-note">MSRIT · wHACKiest 2026 · Track 04 UnlockED</p>
              <p className="footer-note">
                Last updated: <time dateTime="2026-11-26">2026-11-26</time>
              </p>
            </div>
          </div>
          <p className="footer-basis">{t("rubricBasis")}</p>
        </footer>
      </Frame>

      <div className="quiet-subfooter">
        <span>{t("appName")} — {t("tagline")}</span>
      </div>

      <nav className="mobile-bottom-dock" aria-label={t("mainNavLabel")}>
        {mobileDockItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.matches(location.pathname);
          return (
            <Link
              key={item.key}
              to={item.to}
              className={"mobile-dock-item" + (isActive ? " is-active" : "")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} weight="regular" aria-hidden="true" />
              <span className="mobile-dock-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showTopBtn && (
        <button
          type="button"
          className="back-to-top-btn"
          aria-label="Back to top"
          onClick={() => {
            const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
          }}
        >
          <ArrowUp size={18} weight="regular" aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        className="floating-help-btn"
        aria-label="Help"
        onClick={() => setHelpOpen(true)}
      >
        <Question size={16} weight="regular" aria-hidden="true" />
        <span>HELP</span>
      </button>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Search Prooffolio">
        <label htmlFor="site-search-input" className="sr-only">
          Search lessons, rubric terms, and routes
        </label>
        <input
          id="site-search-input"
          type="search"
          className="pf-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons, challenge, passport, opportunities..."
        />
        <ul className="site-search-results">
          {filteredSearch.map((item, idx) => (
            <li key={`${item.to}-${idx}`}>
              <Link
                to={item.to}
                className="site-search-link"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              >
                <div>
                  <strong>{item.title}</strong>
                  <div className="fineprint">{item.desc}</div>
                </div>
                <span className="pf-label">{item.group}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Support">
        <p className="fineprint">
          Questions about the spreadsheet rubric, Mock Mode, or verification?
        </p>
        <div style={{ marginBottom: "12px" }}>
          <span className="field-label" style={{ marginTop: 0 }}>Theme</span>
          <SegmentedControl
            ariaLabel="Theme preference"
            value={themePref}
            onChange={setThemePreference}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "System" }
            ]}
          />
        </div>
        <div className="cta-stack">
          <a href="mailto:team@prooffolio.example" className="pf-btn pf-btn--secondary">
            Email Team The North Remembers
          </a>
          <Link to="/integrations" className="pf-btn pf-btn--secondary" onClick={() => setHelpOpen(false)}>
            Honesty &amp; Provider Status
          </Link>
          <Link to="/health" className="pf-btn pf-btn--secondary" onClick={() => setHelpOpen(false)}>
            System Health
          </Link>
        </div>
      </Sheet>
    </div>
  );
}
