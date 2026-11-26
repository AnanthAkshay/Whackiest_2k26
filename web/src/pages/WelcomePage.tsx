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
import {
  AuroraBackground,
  BackgroundBeams,
  BentoGrid,
  BentoGridItem,
  CardBody,
  CardContainer,
  CardItem,
  CardStack,
  GlareCard,
  GlowingEffect,
  MacbookScroll,
  MovingBorder,
  Spotlight,
  TextGenerateEffect,
  TracingBeam
} from "../shared/aceternity";
import { Magnetic, ScrollParallax, ShaderHeroCanvas } from "../shared/animmaster";
import { ScrollImagesReveal } from "../shared/skiper";
import { Accordion, Button, Frame, GlassBadge, GlassCard, GlassPanel, StatusMark } from "../shared/ui";

const JOURNEY_STAGES = [
  { num: "01", key: "1. Learn", status: "Offline ready", outcome: "Study short spreadsheet rules cached for offline access.", to: "/learn", icon: BookOpen },
  { num: "02", key: "2. Practise", status: "Interactive", outcome: "Complete low-stakes drills with immediate explanations.", to: "/learn", icon: CheckCircle },
  { num: "03", key: "3. Demonstrate", status: ".xlsx check", outcome: "Clean a seeded .xlsx sales workbook and upload it.", to: "/challenge", icon: FileXls },
  { num: "04", key: "4. Explain", status: "AI Viva", outcome: "Answer the AI Examiner in English, Hindi, or Kannada (voice or text).", to: "/setup-viva", icon: Microphone },
  { num: "05", key: "5. Cross-Verify", status: "ECVE 60/25/15", outcome: "Check consistency between your spoken claims and file facts.", to: "/results/att_demo_retail_01?demo=1", icon: GitDiff },
  { num: "06", key: "6. Verify", status: "Signed JWS", outcome: "Receive an Ed25519-signed Skill Passport bound to the SHA-256 hash.", to: "/skill/demo?demo=1", icon: Certificate },
  { num: "07", key: "7. Connect", status: "Transparent", outcome: "Review local entry-level matches with transparent skill gaps.", to: "/opportunities", icon: Briefcase }
];

const TRUST_CAPABILITIES = [
  "Practical assessment",
  "Multilingual AI Viva",
  "Evidence verification",
  "Skill Passport",
  "Job matching"
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

function DemoQrTile({ url }: { url: string }): JSX.Element {
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 19;
  const isFinder = (r: number, c: number): boolean =>
    (r < 6 && c < 6) || (r < 6 && c >= size - 6) || (r >= size - 6 && c < 6);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        const lr = r >= size - 6 ? r - (size - 6) : r;
        const lc = c >= size - 6 ? c - (size - 6) : c;
        cells.push(lr === 0 || lr === 5 || lc === 0 || lc === 5 || (lr >= 2 && lr <= 3 && lc >= 2 && lc <= 3));
      } else {
        cells.push((((hash >>> ((r * size + c) % 24)) ^ (r * 7 + c * 13)) & 1) === 1);
      }
    }
  }
  return (
    <div className="passport-qr-tile" aria-label="Sample Skill Passport verification QR code">
      <svg width="84" height="84" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect width={size} height={size} fill="#FFFFFF" />
        {cells.map((filled, idx) =>
          filled ? <rect key={idx} x={idx % size} y={Math.floor(idx / size)} width="1" height="1" fill="#121411" /> : null
        )}
      </svg>
    </div>
  );
}

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
      <AuroraBackground>
        <section className="editorial-hero" aria-labelledby="hero-heading">
          <ShaderHeroCanvas />
          <BackgroundBeams />
          <Spotlight x="74%" y="24%" />
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
                <GlassBadge>{t("tagline")}</GlassBadge>
                <TextGenerateEffect
                  id="hero-heading"
                  className="pf-hero-title"
                  style={{ marginTop: "20px" }}
                  words="Your skills deserve to be seen."
                />
                <p className="pf-lead editorial-hero-sub">
                  Show what you can do. Explain your work. Earn trusted proof. Connect with opportunities.
                </p>

                <div className="hero-cta-row">
                  <Magnetic>
                    <MovingBorder>
                      <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
                        START YOUR JOURNEY
                      </Button>
                    </MovingBorder>
                  </Magnetic>
                  <button
                    type="button"
                    className="hero-circle-cta"
                    onClick={() => navigate("/skill/demo?demo=1")}
                  >
                    <span>EXPLORE SKILL PASSPORT</span>
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

              <aside aria-label="Live product sample">
                <ScrollParallax speed={0.05}>
                  <CardContainer>
                  <CardBody className="hero-glass-stack">
                    <CardItem translateZ={30} className="hero-floating-badge-row">
                      <GlassBadge className="hero-verify-pill">
                        <StatusMark tone="ok" label={t("recordMatchesDatabase")} />
                      </GlassBadge>
                    </CardItem>

                    <CardItem translateZ={20}>
                      <GlareCard>
                        <GlassPanel as="article" className="hero-passport-preview">
                          <div className="hero-sample-head">
                            <div>
                              <span className="pf-label">SAMPLE SKILL PASSPORT · DEMO</span>
                              <strong className="hero-sample-name">Ananya Kumar</strong>
                              <span className="fineprint">Entry-Level Data Entry Operator</span>
                            </div>
                            <div className="hero-sample-score tabular-nums">
                              <strong>88</strong>
                              <span>/ 100</span>
                            </div>
                          </div>
                          <div className="pillar-track" style={{ marginTop: "14px" }} aria-hidden="true">
                            <div className="pillar-fill" style={{ width: "88%" }} />
                          </div>
                          <div className="hero-sample-meta">
                            <span className="fineprint">Demonstrated · ECVE</span>
                            <code className="mono">{sampleReport.sha256.slice(0, 8)}…{sampleReport.sha256.slice(-6)}</code>
                          </div>
                        </GlassPanel>
                      </GlareCard>
                    </CardItem>

                    <CardItem translateZ={12}>
                      <GlassCard as="article" variant="glass-soft" padding="sm" className="hero-assessment-overlap">
                        <span className="pf-label">Assessment summary · {sampleReport.fileName}</span>
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
                      </GlassCard>
                    </CardItem>
                  </CardBody>
                </CardContainer>
                </ScrollParallax>
              </aside>
            </div>
          </Frame>
        </section>
      </AuroraBackground>

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
          <TracingBeam>
            <div className="stages-card-grid">
              {JOURNEY_STAGES.map((stage) => {
                const Icon = stage.icon;
                return (
                  <GlowingEffect key={stage.key}>
                    <GlassCard as="article" interactive className="stage-editorial-card">
                      <div className="stage-card-top">
                        <span className="pf-label tabular-nums">{stage.num}</span>
                        <GlassBadge>{stage.status}</GlassBadge>
                      </div>
                      <div className="stage-title-row">
                        <span className="stage-icon-badge" aria-hidden="true">
                          <Icon size={18} weight="regular" />
                        </span>
                        <h3 className="stage-card-title">{stage.key}</h3>
                      </div>
                      <p className="fineprint" style={{ margin: 0, flex: 1 }}>{stage.outcome}</p>
                      <Link to={stage.to + (isDemo ? "?demo=1" : "")} className="stage-card-link">
                        <span>Open</span>
                        <ArrowUpRight size={14} weight="regular" aria-hidden="true" />
                      </Link>
                    </GlassCard>
                  </GlowingEffect>
                );
              })}
            </div>
          </TracingBeam>
        </section>

        <section className="editorial-section" aria-label="How it is checked">
          <span className="pf-label">ECVE ASSESSMENT</span>
          <h2 className="pf-section-title" style={{ marginTop: "8px", marginBottom: "28px" }}>
            Your work matters more than words on a resume.
          </h2>
          <BentoGrid>
            <BentoGridItem>
              <GlowingEffect>
                <GlassCard as="article">
                  <span className="pf-label">P · PRACTICAL EXECUTION</span>
                  <div className="ecve-big-num tabular-nums">60%</div>
                  <div className="pillar-track"><div className="pillar-fill" style={{ width: "60%" }} /></div>
                  <p className="fineprint" style={{ marginTop: "12px", marginBottom: "8px" }}>
                    Deterministic code checks on your submitted .xlsx workbook.
                  </p>
                  <Accordion title="How P is measured">
                    <p className="fineprint" style={{ margin: 0 }}>
                      Python/TS workbook checks verify column hygiene, ISO dates, missing values, and dynamic formulas against the MO-200 rubric.
                    </p>
                  </Accordion>
                </GlassCard>
              </GlowingEffect>
            </BentoGridItem>
            <BentoGridItem>
              <GlowingEffect>
                <GlassCard as="article">
                  <span className="pf-label">U · CONCEPTUAL UNDERSTANDING</span>
                  <div className="ecve-big-num tabular-nums">25%</div>
                  <div className="pillar-track"><div className="pillar-fill" style={{ width: "25%" }} /></div>
                  <p className="fineprint" style={{ marginTop: "12px", marginBottom: "8px" }}>
                    Artifact-aware AI Viva responses scored against the public rubric.
                  </p>
                  <Accordion title="How U is measured">
                    <p className="fineprint" style={{ margin: 0 }}>
                      The AI Examiner asks about cells and formulas in your file in English, Hindi, or Kannada (voice or text mode).
                    </p>
                  </Accordion>
                </GlassCard>
              </GlowingEffect>
            </BentoGridItem>
            <BentoGridItem>
              <GlowingEffect>
                <GlassCard as="article">
                  <span className="pf-label">C · EVIDENCE CONSISTENCY</span>
                  <div className="ecve-big-num tabular-nums">15%</div>
                  <div className="pillar-track"><div className="pillar-fill" style={{ width: "15%" }} /></div>
                  <p className="fineprint" style={{ marginTop: "12px", marginBottom: "8px" }}>
                    Cross-check between spoken reasoning and verified file facts.
                  </p>
                  <Accordion title="How C is measured">
                    <p className="fineprint" style={{ margin: 0 }}>
                      Compares spoken claims against FactSheet evidence. Unresolved mismatches trigger calm Pending Human Review, never cheating claims.
                    </p>
                  </Accordion>
                </GlassCard>
              </GlowingEffect>
            </BentoGridItem>
          </BentoGrid>
          <p className="fineprint" style={{ marginTop: "16px" }}>
            <code className="mono">Composite = 0.60P + 0.25U + 0.15C</code> — Proposed assessment design weights, not a guarantee of employment or official certification.
          </p>
        </section>

        <section className="editorial-section" aria-label="Evidence Intelligence Highlights">
          <ScrollImagesReveal
            items={[
              {
                id: "story-1",
                content: (
                  <GlassCard as="article">
                    <span className="pf-label">01 · DETERMINISTIC</span>
                    <h3 className="stage-card-title" style={{ marginTop: "8px" }}>Spreadsheet FactSheet</h3>
                    <p className="fineprint" style={{ margin: "8px 0 0" }}>
                      Code-based checks inspect formulas, trimmed columns, and ISO dates without LLM guessing.
                    </p>
                  </GlassCard>
                )
              },
              {
                id: "story-2",
                content: (
                  <GlassCard as="article">
                    <span className="pf-label">02 · MULTILINGUAL</span>
                    <h3 className="stage-card-title" style={{ marginTop: "8px" }}>Artifact-Aware AI Viva</h3>
                    <p className="fineprint" style={{ margin: "8px 0 0" }}>
                      Voice or text examination in English, हिन्दी, or ಕನ್ನಡ grounded directly in your file.
                    </p>
                  </GlassCard>
                )
              },
              {
                id: "story-3",
                content: (
                  <GlassCard as="article">
                    <span className="pf-label">03 · VERIFIABLE</span>
                    <h3 className="stage-card-title" style={{ marginTop: "8px" }}>Ed25519 Skill Passport</h3>
                    <p className="fineprint" style={{ margin: "8px 0 0" }}>
                      Cryptographically signed JWS bound to your artifact SHA-256 fingerprint.
                    </p>
                  </GlassCard>
                )
              }
            ]}
          />
        </section>

        <section className="editorial-section" aria-label="Interactive Product Showcase">
          <MacbookScroll
            subtitle="PROOFFOLIO WORKSPACE · EVIDENCE INTELLIGENCE"
            title="Inspect real workbook evidence, AI Viva grounding, and cryptographic proof."
          >
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div>
                  <span className="pf-label">DEMONSTRATE → EXPLAIN → VERIFY</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "1.35rem", fontWeight: 800 }}>
                    Retail Sales Cleanup &amp; Reporting
                  </h3>
                </div>
                <GlassBadge>
                  <StatusMark tone="ok" label="Deterministic + AI Viva" />
                </GlassBadge>
              </div>
              <CardStack
                items={[
                  {
                    id: "ev-1",
                    eyebrow: "STAGE 03 · DETERMINISTIC CHECK",
                    title: "Workbook Hygiene & Formula Verification",
                    body: (
                      <p style={{ margin: 0 }}>
                        Inspects <code className="mono">retail_sales_cleaned_demo.xlsx</code> for trimmed names, ISO dates, and dynamic <code className="mono">=SUM</code> / <code className="mono">=COUNTIF</code> formulas.
                      </p>
                    )
                  },
                  {
                    id: "ev-2",
                    eyebrow: "STAGE 04 · AI VIVA",
                    title: "Artifact-Grounded Examiner Questions",
                    body: (
                      <p style={{ margin: 0 }}>
                        Asks targeted follow-ups in English, हिन्दी, or ಕನ್ನಡ about the exact cells and formulas in the submitted file.
                      </p>
                    )
                  },
                  {
                    id: "ev-3",
                    eyebrow: "STAGE 06 · SKILL PASSPORT",
                    title: "Ed25519 JWS + SHA-256 Binding",
                    body: (
                      <p style={{ margin: 0 }}>
                        Binds the Demonstrated outcome to <code className="mono">{sampleReport.sha256.slice(0, 14)}…</code> for instant public verification.
                      </p>
                    )
                  }
                ]}
              />
            </div>
          </MacbookScroll>
        </section>

        <section className="editorial-section" aria-label="Skill Passport Showcase">
          <GlareCard>
            <div className="passport-showcase-panel">
              <div style={{ flex: "1 1 320px" }}>
                <span className="pf-label" style={{ color: "#B1B5AB" }}>SAMPLE SKILL PASSPORT · DEMO FIXTURE</span>
                <h2 className="pf-section-title" style={{ color: "#F5F3EC", marginTop: "8px" }}>
                  Ananya Kumar
                </h2>
                <p style={{ color: "#B1B5AB", margin: "6px 0 16px" }}>
                  Entry-Level Data Entry Operator · Score 88 / 100 · Sample Demonstrated Outcome
                </p>
                <div className="passport-showcase-meta">
                  <StatusMark tone="ok" label={t("recordMatchesDatabase")} />
                  <code className="mono" style={{ color: "#B1B5AB" }}>
                    ID: att_demo_retail_01 · SHA-256: {sampleReport.sha256.slice(0, 12)}…
                  </code>
                </div>
                <div style={{ marginTop: "20px" }}>
                  <Link to="/skill/demo?demo=1" className="pf-btn pf-btn--primary pf-btn--lg">
                    EXPLORE A SAMPLE PASSPORT
                  </Link>
                </div>
              </div>
              <DemoQrTile url="/p/att_demo_retail_01" />
            </div>
          </GlareCard>
        </section>

        <section className="editorial-section final-cta-band" aria-label="Get started">
          <div className="final-cta-inner">
            <h2 className="pf-page-title">Let your work speak for you.</h2>
            <div style={{ marginTop: "24px" }}>
              <Button variant="primary" size="lg" onClick={() => startJourney("voice")}>
                START YOUR SKILL JOURNEY
              </Button>
            </div>
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
