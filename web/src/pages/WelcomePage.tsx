import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Certificate,
  CheckCircle,
  FileXls,
  GitDiff,
  Microphone
} from "@phosphor-icons/react";
import { useTranslation } from "../i18n";
import { createMockValidationReport } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { Accordion, Button, Card, Frame, StatusMark } from "../shared/ui";

const JOURNEY_STAGES = [
  { num: "01", key: "1. Learn", outcome: "Study short spreadsheet rules cached for offline access.", to: "/learn", icon: BookOpen },
  { num: "02", key: "2. Practise", outcome: "Complete low-stakes drills with immediate explanations.", to: "/learn", icon: CheckCircle },
  { num: "03", key: "3. Demonstrate", outcome: "Clean a seeded .xlsx sales workbook and upload it.", to: "/challenge", icon: FileXls },
  { num: "04", key: "4. Explain", outcome: "Answer the AI Examiner in English, Hindi, or Kannada (voice or text).", to: "/setup-viva", icon: Microphone },
  { num: "05", key: "5. Cross-Verify", outcome: "Check consistency between your spoken claims and file facts.", to: "/results/att_demo_retail_01?demo=1", icon: GitDiff },
  { num: "06", key: "6. Verify", outcome: "Receive an Ed25519-signed Skill Passport bound to the SHA-256 hash.", to: "/skill/demo?demo=1", icon: Certificate },
  { num: "07", key: "7. Connect", outcome: "Review local entry-level matches with transparent skill gaps.", to: "/opportunities", icon: Briefcase }
];

const TRUST_CAPABILITIES = [
  "PRACTICAL ASSESSMENT",
  "MULTILINGUAL AI VIVA",
  "EVIDENCE-BASED SCORING",
  "SIGNED SKILL PASSPORTS",
  "EXPLAINABLE JOB MATCHING"
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
      <section className="editorial-hero" aria-labelledby="hero-heading">
        <Frame>
          {isDemo && (
            <div className="demo-top-banner">
              <span className="pf-label">{t("replayBadge")}</span>
              <Button variant="dark" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
                {t("startDemoReplay")}
              </Button>
            </div>
          )}

          <div className="hero-grid">
            <div className="hero-copy">
              <span className="pf-chip">{t("tagline")}</span>
              <h1 id="hero-heading" className="pf-hero-title" style={{ marginTop: "20px" }}>
                Your skills deserve to be seen.
              </h1>
              <p className="pf-lead editorial-hero-sub">
                Don&apos;t let your skills get lost behind a traditional resume. Show what you can actually do, explain your work and carry trusted proof of your abilities.
              </p>

              <div className="hero-cta-row">
                <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
                  START YOUR JOURNEY
                </Button>
                <button
                  type="button"
                  className="hero-circle-cta"
                  onClick={() => navigate("/skill/demo?demo=1")}
                >
                  <span>VIEW SAMPLE SKILL PASSPORT</span>
                  <span className="circle-arrow-badge" aria-hidden="true">
                    <ArrowUpRight size={16} weight="regular" />
                  </span>
                </button>
              </div>

              <div className="hero-meta-pills">
                <span>English</span>
                <span>·</span>
                <span>हिन्दी</span>
                <span>·</span>
                <span>ಕನ್ನಡ</span>
                <span>·</span>
                <button
                  type="button"
                  className="hero-plain-link"
                  onClick={() => startJourney("text")}
                >
                  {t("textModeOption")}
                </button>
                <span>·</span>
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
              <Card as="article" className="hero-passport-preview">
                <div className="hero-sample-head">
                  <div>
                    <span className="pf-label">SAMPLE SKILL PASSPORT</span>
                    <strong className="hero-sample-name">Ananya Kumar</strong>
                    <span className="fineprint">Entry-Level Data Entry Operator</span>
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
              </Card>

              <Card as="article" variant="subtle" padding="sm">
                <span className="pf-label">Validator checks · {sampleReport.fileName}</span>
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
              </Card>
            </aside>
          </div>
        </Frame>
      </section>

      <section className="trust-strip" aria-label="Platform capabilities">
        <Frame>
          <div className="trust-strip-inner">
            {TRUST_CAPABILITIES.map((cap, idx) => (
              <span key={cap} className="trust-strip-item">
                {idx > 0 && <span className="trust-dot" aria-hidden="true">·</span>}
                <span>{cap}</span>
              </span>
            ))}
          </div>
        </Frame>
      </section>

      <Frame>
        <section id="how-it-works" className="editorial-section" aria-label={t("journeyNavLabel")}>
          <span className="pf-label">SEVEN-STAGE JOURNEY</span>
          <h2 className="pf-section-title" style={{ marginTop: "8px", marginBottom: "28px" }}>
            From practical work to professional recognition.
          </h2>
          <div className="stages-card-grid">
            {JOURNEY_STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <Card key={stage.key} as="article" interactive className="stage-editorial-card">
                  <div className="stage-card-top">
                    <span className="pf-label tabular-nums">{stage.num}</span>
                    <span className="stage-icon-badge" aria-hidden="true">
                      <Icon size={18} weight="regular" />
                    </span>
                  </div>
                  <h3 className="stage-card-title">{stage.key}</h3>
                  <p className="fineprint" style={{ margin: 0, flex: 1 }}>{stage.outcome}</p>
                  <Link to={stage.to + (isDemo ? "?demo=1" : "")} className="stage-card-link">
                    <span>Open</span>
                    <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="editorial-section" aria-label="How it is checked">
          <span className="pf-label">ECVE ASSESSMENT</span>
          <h2 className="pf-section-title" style={{ marginTop: "8px", marginBottom: "28px" }}>
            Your work matters more than words on a resume.
          </h2>
          <div className="ecve-cards-grid">
            <Card as="article">
              <span className="pf-label">P · PRACTICAL EXECUTION</span>
              <div className="ecve-big-num tabular-nums">60%</div>
              <div className="pillar-track"><div className="pillar-fill" style={{ width: "60%" }} /></div>
              <p className="fineprint" style={{ marginTop: "12px", marginBottom: 0 }}>
                Deterministic code checks on your submitted .xlsx workbook.
              </p>
            </Card>
            <Card as="article">
              <span className="pf-label">U · CONCEPTUAL UNDERSTANDING</span>
              <div className="ecve-big-num tabular-nums">25%</div>
              <div className="pillar-track"><div className="pillar-fill" style={{ width: "25%" }} /></div>
              <p className="fineprint" style={{ marginTop: "12px", marginBottom: 0 }}>
                Artifact-aware AI Viva responses scored against the public MO-200 rubric.
              </p>
            </Card>
            <Card as="article">
              <span className="pf-label">C · EVIDENCE CONSISTENCY</span>
              <div className="ecve-big-num tabular-nums">15%</div>
              <div className="pillar-track"><div className="pillar-fill" style={{ width: "15%" }} /></div>
              <p className="fineprint" style={{ marginTop: "12px", marginBottom: 0 }}>
                Cross-check between spoken reasoning and verified file facts.
              </p>
            </Card>
          </div>
          <p className="fineprint" style={{ marginTop: "16px" }}>
            <code className="mono">Composite = 0.60P + 0.25U + 0.15C</code> — Proposed assessment design weights, not a guarantee of employment or official certification.
          </p>
        </section>

        <section className="editorial-section" aria-label="Skill Passport Showcase">
          <div className="passport-showcase-panel">
            <div>
              <span className="pf-label" style={{ color: "#B1B5AB" }}>SAMPLE SKILL PASSPORT · ED25519 JWS</span>
              <h2 className="pf-section-title" style={{ color: "#F5F3EC", marginTop: "8px" }}>
                Ananya Kumar
              </h2>
              <p style={{ color: "#B1B5AB", margin: "6px 0 16px" }}>
                Entry-Level Data Entry Operator · Score 88 / 100 · Demonstrated
              </p>
              <div className="passport-showcase-meta">
                <StatusMark tone="ok" label={t("recordMatchesDatabase")} />
                <code className="mono" style={{ color: "#B1B5AB" }}>
                  ID: att_demo_retail_01 · SHA-256: {sampleReport.sha256.slice(0, 12)}…
                </code>
              </div>
            </div>
            <Link to="/skill/demo?demo=1" className="pf-btn pf-btn--primary pf-btn--lg">
              EXPLORE A SAMPLE PASSPORT
            </Link>
          </div>
        </section>

        <section className="editorial-section final-cta-band" aria-label="Get started">
          <h2 className="pf-page-title">Let your work speak for you.</h2>
          <div style={{ marginTop: "24px" }}>
            <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
              START YOUR SKILL JOURNEY
            </Button>
          </div>
        </section>

        <section className="editorial-section" aria-label="Frequently asked questions">
          <h2 className="pf-section-title" style={{ marginBottom: "20px" }}>Questions</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <Accordion key={item.q} title={item.q}>
                <p className="faq-answer">{item.a}</p>
              </Accordion>
            ))}
          </div>
        </section>

        <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
      </Frame>
    </main>
  );
}
