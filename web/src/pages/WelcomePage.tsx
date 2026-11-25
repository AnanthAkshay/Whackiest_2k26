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
    <main className="shell setup-shell">
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

      <header className="home-header">
        <p className="brand">{t("appName")}</p>
        <p className="tagline">{t("tagline")}</p>
        <h1>{t("welcomeTitle")}</h1>
        <p className="lede">{t("platformBannerBody")}</p>
      </header>

      <section aria-label={t("journeyNavLabel")} className="journey-plain-list">
        {JOURNEY_PLAIN.map((item) => (
          <article key={item.key} className="journey-plain-card">
            <strong>{item.key}</strong>
            <p>{item.desc}</p>
          </article>
        ))}
      </section>

      <div className="cta-stack">
        <button
          type="button"
          className="primary large-button"
          onClick={() => startJourney("voice")}
        >
          {t("welcomeStartCta")}
        </button>

        <button
          type="button"
          className="secondary text-mode-button"
          onClick={() => startJourney("text")}
        >
          {t("textModeOption")}
        </button>

        <button
          type="button"
          className="text-button"
          onClick={() => navigate("/opportunities")}
        >
          {t("welcomeExploreOpportunities")}
        </button>
      </div>

      <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
    </main>
  );
}
