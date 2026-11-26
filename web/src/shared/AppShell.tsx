import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Award, BookOpen, Briefcase, FileSpreadsheet, Mic, User } from "lucide-react";
import { useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import type { Language } from "../types";

const LANG_OPTIONS: { code: Language; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "hi", short: "हि", label: "हिन्दी" },
  { code: "kn", short: "ಕ", label: "ಕನ್ನಡ" }
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
      icon: BookOpen,
      matches: (p: string) => p.startsWith("/learn") || p.startsWith("/role")
    },
    {
      key: "challenge",
      label: "Challenge",
      to: "/challenge",
      icon: FileSpreadsheet,
      matches: (p: string) => p.startsWith("/challenge") || p.startsWith("/validation")
    },
    {
      key: "explain",
      label: "Explain",
      to: `/session${demoQuery}`,
      icon: Mic,
      matches: (p: string) => p.startsWith("/session") || p.startsWith("/results")
    },
    {
      key: "passport",
      label: "Passport",
      to: "/skill/demo?demo=1",
      icon: Award,
      matches: (p: string) => p.startsWith("/skill")
    },
    {
      key: "connect",
      label: "Connect",
      to: "/opportunities",
      icon: Briefcase,
      matches: (p: string) => p.startsWith("/opportunities")
    }
  ];

  return (
    <div className="app-frame">
      <header className="site-topbar">
        <div className="site-topbar-inner">
          <Link to={`/${demoQuery}`} className="topbar-wordmark">
            {t("appName")}
          </Link>

          <nav className="topbar-pill-nav" aria-label={t("mainNavLabel")}>
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

            <Link
              to={`/profile${demoQuery}`}
              className="topbar-profile-btn"
              aria-label={t("navForLearners")}
              title={t("navForLearners")}
            >
              <User size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <div className="app-content">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong className="footer-wordmark">{t("appName")}</strong>
            <p className="footer-tagline">{t("tagline")}</p>
            <p className="footer-basis">{t("rubricBasis")}</p>
          </div>
          <div className="footer-links">
            <Link to="/opportunities">{t("navForEmployers")}</Link>
            <Link to="/integrations">{t("footerIntegrations")}</Link>
            <Link to="/health">{t("footerHealth")}</Link>
          </div>
        </div>
      </footer>

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
              <Icon size={20} strokeWidth={1.85} aria-hidden="true" />
              <span className="mobile-dock-label">{item.label}</span>
              {isActive && <span className="mobile-dock-dot" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
