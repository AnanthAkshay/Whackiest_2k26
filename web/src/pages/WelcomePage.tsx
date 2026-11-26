import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { Button, Card, StatusMark } from "../shared/ui";

const JOURNEY_STAGES = [
  { num: "01", key: "1. Learn", outcome: "Study short spreadsheet rules cached for offline access." },
  { num: "02", key: "2. Practise", outcome: "Complete low-stakes drills with immediate explanations." },
  { num: "03", key: "3. Demonstrate", outcome: "Clean a seeded .xlsx sales workbook and upload it." },
  { num: "04", key: "4. Explain", outcome: "Answer the AI Examiner in English, Hindi, or Kannada (voice or text)." },
  { num: "05", key: "5. Cross-Verify", outcome: "Check consistency between your spoken claims and file facts." },
  { num: "06", key: "6. Verify", outcome: "Receive an Ed25519-signed Skill Passport bound to the SHA-256 hash." },
  { num: "07", key: "7. Connect", outcome: "Review local entry-level matches with transparent skill gaps." }
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
    <main className="shell landing-shell">
      {isDemo && (
        <div className="demo-top-banner">
          <span className="eyebrow">{t("replayBadge")}</span>
          <Button variant="dark" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
            {t("startDemoReplay")}
          </Button>
        </div>
      )}

      <section className="hero-grid" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <h1 id="hero-heading" className="hero-headline">
            Show the work. Explain it. Carry the proof.
          </h1>
          <p className="lede hero-subline">
            A vocational graduate cleans a real workbook, explains it to an AI examiner in English, Hindi or Kannada, and gets a signed Skill Passport that employers can verify.
          </p>

          <div className="hero-cta-row">
            <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
              START THE CHALLENGE
            </Button>
            <button
              type="button"
              className="hero-plain-link"
              onClick={() => navigate("/skill/demo?demo=1")}
            >
              See a sample passport
            </button>
          </div>

          <div className="hero-secondary-actions">
            <button
              type="button"
              className="hero-plain-link"
              onClick={() => startJourney("text")}
            >
              {t("textModeOption")}
            </button>
            <button
              type="button"
              className="hero-plain-link"
              onClick={() => navigate("/opportunities")}
            >
              {t("welcomeExploreOpportunities")}
            </button>
          </div>
        </div>

        <aside className="hero-demo-col" aria-label="Live product sample">
          <span className="ghost-numeral" aria-hidden="true">7</span>

          <Card as="article" className="hero-sample-passport" padding="sm">
            <div className="hero-sample-head">
              <div>
                <span className="eyebrow">SKILL PASSPORT · SAMPLE</span>
                <strong className="hero-sample-name">Ananya K.</strong>
                <span className="fineprint">Entry-Level Data Entry Operator</span>
              </div>
              <div className="hero-sample-score">
                <strong>88</strong>
                <span>/ 100</span>
              </div>
            </div>
            <div className="hero-sample-meta">
              <span className="pf-chip pf-chip--ok">{t("recordMatchesDatabase")}</span>
              <code className="mono">{sampleReport.sha256.slice(0, 8)}…{sampleReport.sha256.slice(-6)}</code>
            </div>
          </Card>

          <Card as="article" className="hero-sample-checks" padding="sm">
            <span className="eyebrow">Validator checks · {sampleReport.fileName}</span>
            <ul className="sample-check-list">
              {sampleChecks.map((chk) => {
                const tone = chk.status === "pass" ? "ok" : chk.status === "issue" ? "bad" : "warn";
                return (
                  <li key={chk.id} className="sample-check-row">
                    <StatusMark tone={tone} size={15} />
                    <span className="sample-check-title">{chk.title}</span>
                    <code className="mono">{chk.status}</code>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </section>

      <section id="how-it-works" className="stages-vertical-section" aria-label={t("journeyNavLabel")}>
        <h2 className="section-heading">Seven-stage evidence pipeline</h2>
        <ol className="stages-vertical-list">
          {JOURNEY_STAGES.map((stage) => (
            <li key={stage.key} className="stage-vertical-row">
              <span className="stage-numeral">{stage.num}</span>
              <div className="stage-body">
                <strong>{stage.key}</strong>
                <p>{stage.outcome}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="how-checked-band" aria-label="How it is checked">
        <h2 className="section-heading">How it&apos;s checked</h2>
        <div className="ecve-summary-row">
          <div className="ecve-weight-item">
            <span className="ecve-weight-num">60%</span>
            <div>
              <strong>Practical execution</strong>
              <p className="fineprint">Deterministic Python checks on your .xlsx workbook.</p>
            </div>
          </div>
          <div className="ecve-weight-item">
            <span className="ecve-weight-num">25%</span>
            <div>
              <strong>Conceptual understanding</strong>
              <p className="fineprint">AI Viva responses scored against the public MO-200 rubric.</p>
            </div>
          </div>
          <div className="ecve-weight-item">
            <span className="ecve-weight-num">15%</span>
            <div>
              <strong>Evidence consistency</strong>
              <p className="fineprint">Cross-check between spoken reasoning and file facts.</p>
            </div>
          </div>
        </div>
        <p className="fineprint" style={{ marginTop: "12px" }}>
          Authoritative Demonstrated outcomes receive an Ed25519-signed JWS bound to the artifact SHA-256 hash.
        </p>
      </section>

      <section className="faq-section" aria-label="Frequently asked questions">
        <h2 className="section-heading">Questions</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="faq-item">
              <summary className="faq-summary">{item.q}</summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
    </main>
  );
}
