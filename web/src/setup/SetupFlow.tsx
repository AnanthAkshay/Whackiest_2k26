import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatText, Microphone } from "@phosphor-icons/react";
import { getSkills } from "../api";
import { useTranslation } from "../i18n";
import { JourneyNav } from "../shared/JourneyNav";
import { Accordion, Button, GlassBadge, GlassCard, GlassPanel, OptionButton, RuledRow, StatusMark } from "../shared/ui";
import { useSetup } from "./SetupContext";
import type { AgentLevel, Language } from "../types";

type MicStatus = "waiting" | "checking" | "granted" | "denied";

const LANGUAGE_ROWS: { code: Language; title: string; subtitle: string }[] = [
  { code: "en", title: "English", subtitle: "Workplace English" },
  { code: "hi", title: "हिन्दी", subtitle: "सरल हिन्दी" },
  { code: "kn", title: "ಕನ್ನಡ", subtitle: "ಸರಳ ಕನ್ನಡ" }
];

const LEVEL_OPTIONS: { value: AgentLevel; titleKey: "levelNewTitle" | "levelSomeTitle" | "levelToughTitle" }[] = [
  { value: "new", titleKey: "levelNewTitle" },
  { value: "some", titleKey: "levelSomeTitle" },
  { value: "tough", titleKey: "levelToughTitle" }
];

function formatShaPreview(sha: string): string {
  if (sha.length <= 16) return sha;
  return `${sha.slice(0, 8)}...${sha.slice(-6)}`;
}

export function SetupFlow(): JSX.Element {
  const { skill, language, level, inputMode, validationReport, chooseSkill, chooseLanguage, chooseLevel, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [micStatus, setMicStatus] = useState<MicStatus>("waiting");
  const [loadingSkills, setLoadingSkills] = useState(!skill);
  const [loadError, setLoadError] = useState(false);
  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";

  async function ensureDefaults(): Promise<void> {
    setLoadingSkills(true);
    setLoadError(false);
    try {
      const list = await getSkills();
      if (!skill && list.length > 0) chooseSkill(list[0]);
      if (!level) chooseLevel("new");
    } catch {
      setLoadError(true);
    } finally {
      setLoadingSkills(false);
    }
  }

  useEffect(() => {
    if (!skill || !level) {
      void ensureDefaults();
    } else {
      setLoadingSkills(false);
    }
  }, []);

  async function checkMicrophone(): Promise<boolean> {
    setMicStatus("checking");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMicStatus("denied");
        chooseInputMode("text");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      return true;
    } catch {
      setMicStatus("denied");
      chooseInputMode("text");
      return false;
    }
  }

  async function handleStartViva(): Promise<void> {
    if (inputMode === "text") {
      navigate("/session" + (isDemo ? "?demo=1" : ""));
      return;
    }
    if (micStatus === "granted") {
      chooseInputMode("voice");
      navigate("/session" + (isDemo ? "?demo=1" : ""));
      return;
    }
    const ok = await checkMicrophone();
    if (ok) {
      chooseInputMode("voice");
      navigate("/session" + (isDemo ? "?demo=1" : ""));
    }
  }

  const langLabel = LANGUAGE_ROWS.find((r) => r.code === language)?.title ?? "English";
  const summaryRows = (
    <>
      <RuledRow label="Language" value={langLabel} />
      <RuledRow label="Mode" value={inputMode === "voice" ? "Voice" : "Text"} />
      <RuledRow
        label="Artifact SHA-256"
        value={validationReport?.sha256 ? <code className="mono">{formatShaPreview(validationReport.sha256)}</code> : "Demo / Pending"}
      />
      <RuledRow
        label="Questions grounded in"
        value={validationReport?.fileName ?? "Retail Sales Cleanup (.xlsx)"}
      />
    </>
  );

  return (
    <main className="shell setup-shell">
      <div className="pf-frame">
        <JourneyNav activeStage="explain" />

        {isDemo && (
          <div className="demo-top-banner">
            <span className="pf-label">{t("replayBadge")}</span>
            <Button variant="dark" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
              {t("startDemoReplay")}
            </Button>
          </div>
        )}

        <p className="pf-label">{t("languageEyebrow")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("sessionTitle")}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{t("languageBody")}</p>

        <div className="form-with-summary-grid">
          <div className="form-main-col">
            <GlassPanel as="section" className="setup-card">
              <div className="setup-section">
                <div className="card-header-row">
                  <h2 className="setup-section-title">{t("languageTitle")}</h2>
                  <GlassBadge>{isDemo ? "Mock Provider" : "ElevenLabs + Bedrock"}</GlassBadge>
                </div>
                <div className="setup-lang-grid" role="radiogroup" aria-label={t("languageTitle")}>
                  {LANGUAGE_ROWS.map((row) => {
                    const selected = language === row.code;
                    return (
                      <OptionButton
                        key={row.code}
                        role="radio"
                        aria-checked={selected}
                        lang={row.code}
                        selected={selected}
                        onClick={() => chooseLanguage(row.code)}
                      >
                        <strong className="setup-lang-script">{row.title}</strong>
                        <span className="setup-lang-sub">{row.subtitle}</span>
                      </OptionButton>
                    );
                  })}
                </div>
              </div>

              <div className="setup-section">
                <h2 className="setup-section-title">Mode</h2>
                <div className="setup-mode-grid" role="group" aria-label="Voice or Text mode">
                  <OptionButton
                    selected={inputMode === "voice"}
                    onClick={() => chooseInputMode("voice")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Microphone size={16} weight="regular" aria-hidden="true" />
                      <span>Voice</span>
                    </span>
                  </OptionButton>
                  <OptionButton
                    selected={inputMode === "text"}
                    onClick={() => chooseInputMode("text")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <ChatText size={16} weight="regular" aria-hidden="true" />
                      <span>Text</span>
                    </span>
                  </OptionButton>
                </div>
              </div>

              <div className="setup-section">
                <span className="pf-label" style={{ display: "block", marginBottom: "8px" }}>{t("levelTitle")}</span>
                <div className="setup-level-pills">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={"pf-stepper-pill" + ((level ?? "new") === opt.value ? " is-active" : "")}
                      onClick={() => chooseLevel(opt.value)}
                    >
                      {t(opt.titleKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-section">
                <div className="mic-status-line" role="status" aria-live="polite">
                  {micStatus === "waiting" && (
                    <>
                      <StatusMark tone="neutral" label="Microphone permission not checked yet." />
                      <Button variant="secondary" onClick={() => void checkMicrophone()}>
                        Test mic
                      </Button>
                    </>
                  )}
                  {micStatus === "checking" && (
                    <StatusMark tone="review" label={t("micRequesting")} />
                  )}
                  {micStatus === "granted" && (
                    <StatusMark tone="ok" label="Microphone ready." />
                  )}
                  {micStatus === "denied" && (
                    <StatusMark tone="warn" label="Microphone unavailable — switched to Text mode automatically." />
                  )}
                </div>
              </div>

              {loadError && (
                <div className="rule-feedback rule-feedback--bad" role="alert">
                  <StatusMark tone="bad" />
                  <span>{t("loadSkillsError")}</span>
                  <Button variant="secondary" onClick={() => void ensureDefaults()}>
                    {t("retry")}
                  </Button>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={loadingSkills || micStatus === "checking"}
                onClick={() => void handleStartViva()}
              >
                {inputMode === "text" ? t("startTextMode") : t("start")}
              </Button>
            </GlassPanel>
          </div>

          <aside className="summary-col" aria-label="Summary">
            <GlassCard className="summary-panel summary-desktop-only">
              <span className="pf-label">SUMMARY</span>
              <div style={{ marginTop: "12px" }}>{summaryRows}</div>
            </GlassCard>
            <div className="summary-mobile-only">
              <Accordion title="SUMMARY">{summaryRows}</Accordion>
            </div>
          </aside>
        </div>

        <Button variant="ghost" fullWidth onClick={() => navigate("/validation")} style={{ marginTop: "24px" }}>
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
