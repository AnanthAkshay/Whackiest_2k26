import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  FileSpreadsheet,
  Fingerprint,
  GitCompareArrows,
  MessageSquare,
  Mic,
  ShieldCheck,
  Sparkles,
  WifiOff
} from "lucide-react";
import { useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import { Badge, Button, Chip, ProgressRing } from "../shared/ui";

const JOURNEY_STAGES = [
  {
    num: "01",
    key: "1. Learn",
    outcome: "Practical micro-lessons for real office work.",
    icon: BookOpen
  },
  {
    num: "02",
    key: "2. Practise",
    outcome: "Low-stakes drills at your own pace.",
    icon: Sparkles
  },
  {
    num: "03",
    key: "3. Demonstrate",
    outcome: "Clean and upload a realistic .xlsx workbook.",
    icon: FileSpreadsheet
  },
  {
    num: "04",
    key: "4. Explain",
    outcome: "Talk with the AI Examiner in EN, HI, or KN.",
    icon: Mic
  },
  {
    num: "05",
    key: "5. Cross-Verify",
    outcome: "Match spoken reasoning to spreadsheet facts.",
    icon: GitCompareArrows
  },
  {
    num: "06",
    key: "6. Verify",
    outcome: "Earn an Ed25519-signed Skill Passport.",
    icon: ShieldCheck
  },
  {
    num: "07",
    key: "7. Connect",
    outcome: "Discover transparent local job matches.",
    icon: Briefcase
  }
];

const TRUST_CHIPS = [
  { label: "Ed25519-signed", icon: ShieldCheck },
  { label: "SHA-256 bound", icon: Fingerprint },
  { label: "Works offline", icon: WifiOff },
  { label: "Voice or text", icon: MessageSquare }
];

export function WelcomePage(): JSX.Element {
  const { t } = useTranslation();
  const { chooseInputMode } = useSetup();
  const navigate = useNavigate();
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";

  const railRef = useRef<HTMLElement>(null);
  const [railVisible, setRailVisible] = useState(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRailVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRailVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function startJourney(mode: "voice" | "text"): void {
    chooseInputMode(mode);
    navigate("/profile" + (isDemo ? "?demo=1" : ""));
  }

  return (
    <main className="shell landing-shell">
      {isDemo && (
        <div className="demo-top-banner stagger-in" style={{ "--stagger": 0 } as CSSProperties}>
          <Badge tone="lavender">{t("replayBadge")}</Badge>
          <Button
            variant="primary"
            className="demo-start-btn"
            onClick={() => navigate("/session?demo=1")}
          >
            {t("startDemoReplay")}
          </Button>
        </div>
      )}

      <section className="hero-grid" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow stagger-in" style={{ "--stagger": 0 } as CSSProperties}>
            {t("tagline")}
          </p>

          <h1 id="hero-heading" className="hero-headline stagger-in" style={{ "--stagger": 1 } as CSSProperties}>
            Work. Explain.{" "}
            <span className="hero-verify-word">
              Verify
              <svg
                className="hero-verify-underline"
                viewBox="0 0 180 18"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 13.5C46 5.5 112 3.5 177 10.5"
                  stroke="var(--lav-500)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 15.5C64 9.5 128 8.5 168 12.5"
                  stroke="var(--violet)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </span>
            .
          </h1>

          <p className="lede hero-subline stagger-in" style={{ "--stagger": 2 } as CSSProperties}>
            {t("platformBannerBody")}
          </p>

          <div className="hero-cta-row stagger-in" style={{ "--stagger": 3 } as CSSProperties}>
            <Button
              variant="primary"
              size="lg"
              className="hero-pill-btn"
              onClick={() => startJourney("voice")}
            >
              Start your journey
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="hero-pill-btn"
              onClick={() => navigate("/skill/demo?demo=1")}
            >
              See a sample passport
            </Button>
          </div>

          <div className="hero-secondary-actions stagger-in" style={{ "--stagger": 4 } as CSSProperties}>
            <Button
              variant="ghost"
              className="hero-text-mode-btn"
              onClick={() => startJourney("text")}
            >
              {t("textModeOption")}
            </Button>
            <Button
              variant="ghost"
              className="hero-text-mode-btn"
              onClick={() => navigate("/opportunities")}
            >
              {t("welcomeExploreOpportunities")}
            </Button>
          </div>
        </div>

        <aside
          className="hero-passport-stage stagger-in"
          style={{ "--stagger": 3 } as CSSProperties}
          aria-label={t("sampleClusterLabel")}
        >
          <article className="passport-preview-card">
            <div className="passport-foil-edge" aria-hidden="true" />
            <div className="passport-preview-top">
              <Badge tone="lavender">{t("sampleClusterLabel")}</Badge>
              <Badge tone="ok">Demonstrated</Badge>
            </div>

            <div className="passport-card-head">
              <span className="initials-avatar" aria-hidden="true">AK</span>
              <div>
                <strong>Ananya K.</strong>
                <span>Entry-Level Data Entry Operator</span>
              </div>
              <ProgressRing value={88} size={60} strokeWidth={5} tone="ok" label="ECVE" />
            </div>

            <div className="passport-preview-pillars">
              <div>
                <span>Practical</span>
                <strong>90%</strong>
              </div>
              <div>
                <span>Explain</span>
                <strong>84%</strong>
              </div>
              <div>
                <span>Consistency</span>
                <strong>90%</strong>
              </div>
            </div>

            <div className="passport-card-meta">
              <code className="mono">sha256:9f4c…e81a</code>
              <span className="verified-chip">{t("recordMatchesDatabase")}</span>
            </div>
          </article>
        </aside>
      </section>

      <section
        className="trust-strip stagger-in"
        style={{ "--stagger": 4 } as CSSProperties}
        aria-label="Verification guarantees"
      >
        {TRUST_CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <Chip key={chip.label} tone="neutral" className="trust-chip">
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span>{chip.label}</span>
            </Chip>
          );
        })}
      </section>

      <section
        ref={railRef}
        id="how-it-works"
        aria-label={t("journeyNavLabel")}
        className={"journey-rail-section" + (railVisible ? " is-in-view" : "")}
      >
        <div className="journey-rail-track" aria-hidden="true">
          <div className="journey-rail-progress" />
        </div>

        <div className="journey-rail">
          {JOURNEY_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <article
                key={stage.key}
                className="journey-rail-card stagger-in"
                style={{ "--stagger": idx + 2 } as CSSProperties}
              >
                <div className="journey-rail-head">
                  <span className="journey-rail-num">{stage.num}</span>
                  <span className="journey-rail-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={1.9} />
                  </span>
                </div>
                <strong className="journey-rail-title">{stage.key}</strong>
                <p className="journey-rail-outcome">{stage.outcome}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="built-with-bar stagger-in" style={{ "--stagger": 5 } as CSSProperties} aria-label={t("builtWithLabel")}>
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

      <p className="fineprint mock-disclosure">{t("mockModeNotice")}</p>
    </main>
  );
}
