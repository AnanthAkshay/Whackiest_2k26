import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";

const JOURNEY_PLAIN = [
  { key: "1. Learn", desc: "Short, practical tips for real office spreadsheet tasks." },
  { key: "2. Practise", desc: "Try quick drills at your own pace with zero pressure." },
  { key: "3. Demonstrate", desc: "Clean a realistic sales spreadsheet (.xlsx) and upload it." },
  { key: "4. Explain", desc: "Talk with the AI Examiner in English, Hindi, or Kannada (or type)." },
  { key: "5. Verify", desc: "Get a signed Skill Passport backed by your actual work." },
  { key: "6. Connect", desc: "See local jobs that match your verified skills and gaps." }
];

export function WelcomePage(): JSX.Element {
  const { t } = useTranslation();
  const { chooseInputMode } = useSetup();
  const navigate = useNavigate();
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";

  function startJourney(mode: "voice" | "text"): void {
    chooseInputMode(mode);
    navigate("/profile" + (isDemo ? "?demo=1" : ""));
  }

  return (
    <main className="shell landing-shell">
      {isDemo && (
        <div className="demo-top-banner">
          <span className="replay-badge">{t("replayBadge")}</span>
          <button
            type="button"
            className="primary demo-start-btn"
            onClick={() => navigate("/session?demo=1")}
          >
            {t("startDemoReplay")}
          </button>
        </div>
      )}

      <section className="hero-grid fade-up" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">{t("tagline")}</p>
          <h1 id="hero-heading" className="hero-headline">{t("heroHeadline")}</h1>
          <p className="lede hero-subline">{t("platformBannerBody")}</p>

          <div className="hero-cta-row">
            <button
              type="button"
              className="primary hero-pill-btn"
              onClick={() => startJourney("voice")}
            >
              {t("heroStartChallenge")}
            </button>

            <button
              type="button"
              className="secondary hero-pill-btn"
              onClick={() => navigate("/skill/demo?demo=1")}
            >
              {t("heroVerifyPassport")}
            </button>
          </div>

          <div className="hero-secondary-actions">
            <button
              type="button"
              className="text-button hero-text-mode-btn"
              onClick={() => startJourney("text")}
            >
              {t("textModeOption")}
            </button>
            <button
              type="button"
              className="text-button hero-text-mode-btn"
              onClick={() => navigate("/opportunities")}
            >
              {t("welcomeExploreOpportunities")}
            </button>
          </div>
        </div>

        <aside className="hero-lavender-panel" aria-label={t("sampleClusterLabel")}>
          <span className="sample-cluster-badge">{t("sampleClusterLabel")}</span>

          <div className="hero-float-stage">
            <article className="hero-float-card hero-card-passport">
              <div className="passport-card-head">
                <span className="initials-avatar" aria-hidden="true">AK</span>
                <div>
                  <strong>Ananya K.</strong>
                  <span>Entry-Level Data Entry Operator</span>
                </div>
              </div>
              <div className="passport-card-meta">
                <span>ECVE · 88 / 100</span>
                <span className="passport-outcome-pill">Demonstrated</span>
              </div>
            </article>

            <article className="hero-float-card hero-card-meter">
              <div className="meter-card-top">
                <span>{t("meter")}</span>
                <strong>88%</strong>
              </div>
              <div className="meter" aria-hidden="true">
                <span className="meter-fill" style={{ width: "88%" }} />
              </div>
            </article>

            <div className="hero-float-card hero-card-verified">
              <span className="verified-chip">{t("recordMatchesDatabase")}</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="built-with-bar" aria-label={t("builtWithLabel")}>
        <div className="built-with-group">
          <span className="built-with-title">{t("builtWithLabel")}</span>
          <span className="wordmark-item">ElevenLabs</span>
          <span className="wordmark-item">AWS</span>
          <span className="wordmark-item">.xyz</span>
        </div>
        <div className="built-with-group">
          <span className="built-with-title">{t("linkOutsLabel")}</span>
          <span className="wordmark-item">tryb</span>
          <span className="wordmark-item">Devnovate</span>
        </div>
      </section>

      <section id="how-it-works" aria-label={t("journeyNavLabel")} className="journey-stepper-section">
        <div className="journey-stepper-grid">
          {JOURNEY_PLAIN.map((item) => (
            <article key={item.key} className="journey-stepper-card">
              <strong>{item.key}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
    </main>
  );
}
