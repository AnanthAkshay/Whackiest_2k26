import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { Accordion, Button, CurrentRow, Frame, RuledRow, StatusMark, TextLink } from "../shared/ui";

const JOURNEY_STAGES = [
  { num: "01", key: "1. Learn", outcome: "Study short spreadsheet rules cached for offline access.", to: "/learn" },
  { num: "02", key: "2. Practise", outcome: "Complete low-stakes drills with immediate explanations.", to: "/learn" },
  { num: "03", key: "3. Demonstrate", outcome: "Clean a seeded .xlsx sales workbook and upload it.", to: "/challenge" },
  { num: "04", key: "4. Explain", outcome: "Answer the AI Examiner in English, Hindi, or Kannada (voice or text).", to: "/setup-viva" },
  { num: "05", key: "5. Cross-Verify", outcome: "Check consistency between your spoken claims and file facts.", to: "/results/att_demo_retail_01?demo=1" },
  { num: "06", key: "6. Verify", outcome: "Receive an Ed25519-signed Skill Passport bound to the SHA-256 hash.", to: "/skill/demo?demo=1" },
  { num: "07", key: "7. Connect", outcome: "Review local entry-level matches with transparent skill gaps.", to: "/opportunities" }
];

const FAQ_ITEMS = [
  {
    q: "Do I need an account or password?",
    a: "No. Enter a display handle or use the Demo Learner profile to start immediately."
  },
  {
    q: "What if I do not have a microphone or quiet room?",
    a: "Switch to Text mode at any time before or during the AI Viva. Both modes evaluate the same rubric."
  },
  {
    q: "What happens when the AI flags a mismatch?",
    a: "Your attempt enters Pending Human Review. A mismatch is a review signal only, never an accusation."
  },
  {
    q: "Are my uploaded spreadsheets public?",
    a: "No. Uploaded files, audio, and full transcripts stay private. Public Skill Passports show only consented summary fields."
  }
];

export function WelcomePage(): JSX.Element {
  const { t } = useTranslation();
  const { chooseInputMode } = useSetup();
  const navigate = useNavigate();
  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";

  const sampleReport = createMockValidationReport("retail_sales_cleaned_demo.xlsx", 42500);
  const sampleChecks = sampleReport.checks.slice(0, 4);

  function startJourney(mode: "voice" | "text"): void {
    chooseInputMode(mode);
    navigate("/profile" + (isDemo ? "?demo=1" : ""));
  }

  return (
    <main className="landing-shell">
      <section className="kohaku-hero" aria-labelledby="hero-heading">
        <div className="kohaku-hero-scrim" aria-hidden="true" />
        <Frame>
          {isDemo && (
            <div className="demo-top-banner">
              <span className="pf-label" style={{ color: "#F4F0E4" }}>{t("replayBadge")}</span>
              <Button variant="primary" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
                {t("startDemoReplay")}
              </Button>
            </div>
          )}

          <div className="kohaku-hero-wordmark" aria-hidden="true">
            PROOFFOLIO
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="pf-lead kohaku-hero-desc">
                A vocational graduate cleans a real workbook, explains it to an AI examiner in English, Hindi or Kannada, and carries a signed Skill Passport that employers can verify.
              </p>

              <div className="hero-cta-row">
                <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
                  Start the challenge →
                </Button>
                <button
                  type="button"
                  className="hero-plain-link hero-plain-link--dark"
                  onClick={() => navigate("/skill/demo?demo=1")}
                >
                  See a sample passport
                </button>
              </div>

              <div className="hero-secondary-actions">
                <button
                  type="button"
                  className="hero-plain-link hero-plain-link--dark"
                  onClick={() => startJourney("text")}
                >
                  {t("textModeOption")}
                </button>
                <button
                  type="button"
                  className="hero-plain-link hero-plain-link--dark"
                  onClick={() => navigate("/opportunities")}
                >
                  {t("welcomeExploreOpportunities")}
                </button>
              </div>
            </div>

            <aside className="hero-demo-col" aria-label="Live product sample">
              <article className="hero-sample-box">
                <div className="hero-sample-head">
                  <div>
                    <span className="pf-label" style={{ color: "#B8B3A6" }}>SKILL PASSPORT · SAMPLE</span>
                    <strong className="hero-sample-name">Ananya K.</strong>
                    <span className="hero-sample-role">Entry-Level Data Entry Operator</span>
                  </div>
                  <div className="hero-sample-score tabular-nums">
                    <strong>88</strong>
                    <span>/ 100</span>
                  </div>
                </div>
                <div className="hero-sample-meta">
                  <StatusMark tone="ok" label={t("recordMatchesDatabase")} />
                  <code className="mono">{sampleReport.sha256.slice(0, 8)}…{sampleReport.sha256.slice(-6)}</code>
                </div>
              </article>

              <article className="hero-sample-box">
                <span className="pf-label" style={{ color: "#B8B3A6" }}>
                  Validator checks · {sampleReport.fileName}
                </span>
                <ul className="sample-check-list">
                  {sampleChecks.map((chk) => {
                    const tone = chk.status === "pass" ? "ok" : chk.status === "issue" ? "bad" : "warn";
                    return (
                      <li key={chk.id} className="sample-check-row">
                        <StatusMark tone={tone} />
                        <span className="sample-check-title">{chk.title}</span>
                        <code className="mono">{chk.status}</code>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </aside>
          </div>
        </Frame>
      </section>

      <Frame>
        <div className="landing-cream-body">
          <div className="landing-status-line">
            <StatusMark tone="ok" label="Demo ready, ?demo=1 replays a full run" />
          </div>

          <h1 id="hero-heading" className="pf-page-title landing-main-title">
            {t("tagline")}
          </h1>

          <section id="how-it-works" className="stages-vertical-section" aria-label={t("journeyNavLabel")}>
            <h2 className="pf-section-title" style={{ marginBottom: "24px" }}>Seven-stage evidence pipeline</h2>
            <div className="stages-ruled-list">
              {JOURNEY_STAGES.map((stage, idx) => {
                const label = (
                  <span className="stage-ruled-label">
                    <span className="tabular-nums stage-numeral">{stage.num}</span>
                    <strong>{stage.key}</strong>
                  </span>
                );
                const value = (
                  <span className="stage-ruled-val">
                    <span>{stage.outcome}</span>
                    <TextLink to={stage.to + (isDemo ? "?demo=1" : "")}>Open →</TextLink>
                  </span>
                );
                if (idx === 0) {
                  return <CurrentRow key={stage.key} label={label} value={value} />;
                }
                return <RuledRow key={stage.key} label={label} value={value} />;
              })}
            </div>
          </section>

          <section className="how-checked-band" aria-label="How it is checked">
            <h2 className="pf-section-title" style={{ marginBottom: "24px" }}>How it&apos;s checked</h2>
            <div className="ruled-table">
              <RuledRow
                label="Practical execution (60%)"
                value="Deterministic Python checks on your .xlsx workbook."
              />
              <RuledRow
                label="Conceptual understanding (25%)"
                value="AI Viva responses scored against the public MO-200 rubric."
              />
              <RuledRow
                label="Evidence consistency (15%)"
                value="Cross-check between spoken reasoning and file facts."
              />
              <RuledRow
                label="Passport signature"
                value="Ed25519 JWS bound to the artifact SHA-256 hash."
              />
            </div>
          </section>

          <section className="faq-section" aria-label="Frequently asked questions">
            <h2 className="pf-section-title" style={{ marginBottom: "24px" }}>Questions</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <Accordion key={item.q} title={item.q}>
                  <p className="faq-answer">{item.a}</p>
                </Accordion>
              ))}
            </div>
          </section>

          <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
        </div>
      </Frame>
    </main>
  );
}
