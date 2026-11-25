import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "../i18n";

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const demoQuery = location.search.includes("demo=1") ? "?demo=1" : "";

  const navItems = [
    { label: t("navHowItWorks"), to: "/learn" },
    { label: t("navForLearners"), to: `/profile${demoQuery}` },
    { label: t("navForEmployers"), to: "/opportunities" },
    { label: t("navVerify"), to: "/skill/demo?demo=1" }
  ];

  return (
    <div className="app-frame">
      <header className="site-topbar">
        <div className="site-topbar-inner">
          <Link to={`/${demoQuery}`} className="topbar-wordmark" onClick={() => setMenuOpen(false)}>
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
            <Link to={`/profile${demoQuery}`} className="topbar-start-btn">
              {t("navStart")}
            </Link>
            <button
              type="button"
              className="topbar-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={t("navMenuToggle")}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? "✕" : "☰"}
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
    </div>
  );
}
