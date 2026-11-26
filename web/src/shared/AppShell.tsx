import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import type { Language } from "../types";
import {
  Button,
  IconArrowUp,
  IconBook,
  IconBriefcase,
  IconClose,
  IconHelp,
  IconMenu,
  IconMic,
  IconMoon,
  IconSearch,
  IconSheet,
  IconShield,
  IconSun,
  IconUser,
  Sheet
} from "./ui";

const LANG_OPTIONS: { code: Language; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "hi", short: "हि", label: "हिन्दी" },
  { code: "kn", short: "ಕ", label: "ಕನ್ನಡ" }
];

const SEARCH_INDEX = [
  { title: "Learn & Practise", desc: "Spreadsheet micro-lessons and drills", to: "/learn" },
  { title: "Retail Sales Challenge (.xlsx)", desc: "Download starter workbook and upload", to: "/challenge" },
  { title: "Validation Report", desc: "Deterministic spreadsheet check results", to: "/validation" },
  { title: "AI Viva Setup", desc: "Choose language, voice/text mode, and test mic", to: "/setup-viva" },
  { title: "Explain (AI Viva)", desc: "Live voice or text examiner interview", to: "/session" },
  { title: "Sample Skill Passport", desc: "Ed25519-signed credential preview", to: "/skill/demo?demo=1" },
  { title: "Local Opportunities", desc: "Matched entry-level roles and skill gaps", to: "/opportunities" },
  { title: "System Health & Integrations", desc: "Live / Mock / Not configured status", to: "/health" }
];

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const { language, chooseLanguage } = useSetup();
  const location = useLocation();
  const demoQuery = location.search.includes("demo=1") ? "?demo=1" : "";
  const activeLangIndex = Math.max(
    0,
    LANG_OPTIONS.findIndex((opt) => opt.code === language)
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [consentAck, setConsentAck] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Preserve UTM parameters locally for session attribution (zero third-party scripts)
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const utm: Record<string, string> = {};
    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    if (Object.keys(utm).length > 0) {
      try {
        window.sessionStorage.setItem("prooffolio_utm", JSON.stringify(utm));
      } catch {
        // Ignore storage quota errors
      }
    }

    try {
      const savedTheme = window.localStorage.getItem("prooffolio_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
      setConsentAck(window.localStorage.getItem("prooffolio_storage_ack") === "1");
    } catch {
      // Ignore storage errors
    }

    const onScroll = (): void => {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      setScrollPct(Math.min(100, Math.max(0, (window.scrollY / max) * 100)));
      setShowTopBtn(window.scrollY > 320);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleTheme(): void {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = next;
    }
    try {
      window.localStorage.setItem("prooffolio_theme", next);
    } catch {
      // Ignore storage errors
    }
  }

  function acceptStorageNotice(): void {
    setConsentAck(true);
    try {
      window.localStorage.setItem("prooffolio_storage_ack", "1");
    } catch {
      // Ignore storage errors
    }
  }

  const navItems = [
    { label: t("navHowItWorks"), to: "/learn" },
    { label: t("navForLearners"), to: `/profile${demoQuery}` },
    { label: t("navForEmployers"), to: "/opportunities" },
    { label: t("navVerify"), to: "/skill/demo?demo=1" }
  ];

  const mobileDockItems = [
    {
      key: "learn",
      label: "Learn",
      to: "/learn",
      icon: IconBook,
      matches: (p: string) => p.startsWith("/learn") || p.startsWith("/role")
    },
    {
      key: "challenge",
      label: "Challenge",
      to: "/challenge",
      icon: IconSheet,
      matches: (p: string) => p.startsWith("/challenge") || p.startsWith("/validation")
    },
    {
      key: "explain",
      label: "Explain",
      to: `/session${demoQuery}`,
      icon: IconMic,
      matches: (p: string) => p.startsWith("/session") || p.startsWith("/results") || p.startsWith("/setup-viva")
    },
    {
      key: "passport",
      label: "Passport",
      to: "/skill/demo?demo=1",
      icon: IconShield,
      matches: (p: string) => p.startsWith("/skill") || p.startsWith("/passport")
    },
    {
      key: "connect",
      label: "Connect",
      to: "/opportunities",
      icon: IconBriefcase,
      matches: (p: string) => p.startsWith("/opportunities") || p.startsWith("/connect")
    }
  ];

  const q = searchQuery.trim().toLowerCase();
  const filteredSearch = q
    ? SEARCH_INDEX.filter(
        (item) =>
          item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
      )
    : SEARCH_INDEX;

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <div className="scroll-progress-bar" aria-hidden="true">
        <div
          className="scroll-progress-fill"
          style={{ transform: `scaleX(${scrollPct / 100})` }}
        />
      </div>

      <header className="site-topbar">
        <div className="site-topbar-inner">
          <Link to={`/${demoQuery}`} className="topbar-wordmark" onClick={() => setMenuOpen(false)}>
            {t("appName")}
          </Link>

          <nav className="topbar-nav" aria-label={t("mainNavLabel")}>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="topbar-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="topbar-actions">
            <div
              className="lang-switcher"
              role="group"
              aria-label="Language switcher"
              style={{ "--lang-idx": activeLangIndex } as CSSProperties}
            >
              <span className="lang-switcher-thumb" aria-hidden="true" />
              {LANG_OPTIONS.map((opt) => {
                const isActive = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    className={"lang-switcher-btn" + (isActive ? " is-active" : "")}
                    aria-pressed={isActive}
                    aria-label={opt.label}
                    onClick={() => chooseLanguage(opt.code)}
                  >
                    {opt.short}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Search site"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch size={17} />
            </button>

            <button
              type="button"
              className="topbar-icon-btn"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <IconSun size={17} /> : <IconMoon size={17} />}
            </button>

            <Link
              to={`/profile${demoQuery}`}
              className="topbar-icon-btn"
              aria-label={t("navForLearners")}
              title={t("navForLearners")}
            >
              <IconUser size={17} />
            </Link>

            <button
              type="button"
              className="topbar-icon-btn topbar-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={t("navMenuToggle")}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <IconClose size={17} /> : <IconMenu size={17} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav-drawer" className="mobile-nav-drawer" aria-label={t("mainNavLabel")}>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="mobile-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div id="main-content" className="app-content" tabIndex={-1}>
        {children}
      </div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong className="footer-wordmark">{t("appName")}</strong>
            <p className="footer-tagline">{t("tagline")}</p>
            <p className="footer-basis">{t("rubricBasis")}</p>
            <p className="footer-updated">Last updated: Nov 2026</p>
          </div>
          <div className="footer-links">
            <Link to="/opportunities">{t("navForEmployers")}</Link>
            <Link to="/integrations">{t("footerIntegrations")}</Link>
            <Link to="/health">{t("footerHealth")}</Link>
          </div>
        </div>
      </footer>

      {showTopBtn && (
        <button
          type="button"
          className="back-to-top-btn"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <IconArrowUp size={16} />
          <span>Top</span>
        </button>
      )}

      <button
        type="button"
        className="floating-help-btn"
        aria-label="Help and support"
        onClick={() => setHelpOpen(true)}
      >
        <IconHelp size={16} />
        <span>Help</span>
      </button>

      {!consentAck && (
        <div className="consent-banner" role="region" aria-label="Local storage notice">
          <span className="fineprint">
            Prooffolio saves your progress and language locally on this device. No ad trackers.
          </span>
          <Button variant="primary" onClick={acceptStorageNotice}>
            Got it
          </Button>
        </div>
      )}

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
              {isActive && <span className="mobile-dock-bar" aria-hidden="true" />}
              <Icon size={19} />
              <span className="mobile-dock-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title="Search Prooffolio">
        <label htmlFor="site-search-input" className="sr-only">
          Search lessons, challenges, and pages
        </label>
        <input
          id="site-search-input"
          type="search"
          className="text-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons, challenge, passport, opportunities..."
        />
        <ul className="site-search-results">
          {filteredSearch.map((item) => (
            <li key={item.to}>
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
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Support">
        <p className="fineprint">
          Need help completing the spreadsheet challenge or running the AI Viva in Mock Mode?
        </p>
        <div className="cta-stack">
          <Link to="/learn" className="pf-btn pf-btn--secondary" onClick={() => setHelpOpen(false)}>
            Open Learn &amp; Practise
          </Link>
          <Link to="/health" className="pf-btn pf-btn--secondary" onClick={() => setHelpOpen(false)}>
            Check System Health
          </Link>
          <Link to="/integrations" className="pf-btn pf-btn--secondary" onClick={() => setHelpOpen(false)}>
            View Sponsor &amp; Provider Status
          </Link>
        </div>
      </Sheet>
    </div>
  );
}
