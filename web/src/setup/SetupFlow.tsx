import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSkills } from "../api";
import { useTranslation } from "../i18n";
import { JourneyNav } from "../shared/JourneyNav";
import { Badge, Button, Card, IconAlert, IconCheck, IconMessage, IconMic, IconMicOff } from "../shared/ui";
import { useSetup } from "./SetupContext";
import type { AgentLevel, Language } from "../types";

type MicStatus = "waiting" | "checking" | "granted" | "denied";

const LANGUAGE_CARDS: { code: Language; title: string; subtitle: string }[] = [
  { code: "en", title: "English", subtitle: "Standard workplace English" },
  { code: "hi", title: "हिन्दी", subtitle: "सरल हिन्दी और रोज़मर्रा के शब्द" },
  { code: "kn", title: "ಕನ್ನಡ", subtitle: "ಸರಳ ಕನ್ನಡ ಮತ್ತು ದೈನಂದಿನ ಪದಗಳು" }
];

const LEVEL_OPTIONS: { value: AgentLevel; titleKey: "levelNewTitle" | "levelSomeTitle" | "levelToughTitle" }[] = [
  { value: "new", titleKey: "levelNewTitle" },
  { value: "some", titleKey: "levelSomeTitle" },
  { value: "tough", titleKey: "levelToughTitle" }
];

export function SetupFlow(): JSX.Element {
  const { skill, language, level, inputMode, chooseSkill, chooseLanguage, chooseLevel, chooseInputMode } = useSetup();
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
      if (!skill && list.length > 0) {
        chooseSkill(list[0]);
      }
      if (!level) {
        chooseLevel("new");
      }
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
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      return true;
    } catch {
      setMicStatus("denied");
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

  function handleFallbackToText(): void {
    chooseInputMode("text");
    navigate("/session" + (isDemo ? "?demo=1" : ""));
  }

  return (
    <main className="shell setup-shell">
      <JourneyNav activeStage="explain" />

      {isDemo && (
        <div className="demo-top-banner">
          <Badge tone="lavender">{t("replayBadge")}</Badge>
          <Button variant="primary" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
            {t("startDemoReplay")}
          </Button>
        </div>
      )}

      <p className="eyebrow">{t("languageEyebrow")}</p>
      <h1>{t("sessionTitle")}</h1>
      <p className="lede">{t("languageBody")}</p>

      <Card as="section" className="setup-card">
        <div className="setup-section">
          <h2 className="setup-section-title">{t("languageTitle")}</h2>
          <div className="setup-lang-grid" role="radiogroup" aria-label={t("languageTitle")}>
            {LANGUAGE_CARDS.map((card) => {
              const selected = language === card.code;
              return (
                <button
                  key={card.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={"setup-lang-card" + (selected ? " is-selected" : "")}
                  onClick={() => chooseLanguage(card.code)}
                >
                  <span className="setup-lang-head">
                    <strong>{card.title}</strong>
                    {selected && (
                      <span className="setup-lang-check" aria-hidden="true">
                        <IconCheck size={14} />
                      </span>
                    )}
                  </span>
                  <span className="setup-lang-sub">{card.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="setup-section">
          <div className="setup-mode-row">
            <div>
              <h2 className="setup-section-title" style={{ marginBottom: "2px" }}>Interview mode</h2>
              <p className="fineprint" style={{ margin: 0 }}>Speak naturally or type your answers</p>
            </div>
            <div className="segmented-pill" role="group" aria-label="Voice or Text mode">
              <button
                type="button"
                className={"segmented-pill-btn" + (inputMode === "voice" ? " is-active" : "")}
                aria-pressed={inputMode === "voice"}
                onClick={() => chooseInputMode("voice")}
              >
                <IconMic size={15} />
                <span>Voice</span>
              </button>
              <button
                type="button"
                className={"segmented-pill-btn" + (inputMode === "text" ? " is-active" : "")}
                aria-pressed={inputMode === "text"}
                onClick={() => chooseInputMode("text")}
              >
                <IconMessage size={15} />
                <span>Text</span>
              </button>
            </div>
          </div>
        </div>

        <div className="setup-section">
          <span className="field-label" style={{ marginTop: 0 }}>{t("levelTitle")}</span>
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

        {inputMode === "voice" && (
          <div className="setup-section">
            <div className={"mic-status-box mic-status--" + micStatus} role="status" aria-live="polite">
              {micStatus === "waiting" && (
                <>
                  <IconMic size={18} />
                  <div className="mic-status-copy">
                    <strong>Microphone check</strong>
                    <span className="fineprint">We will ask for mic permission before starting.</span>
                  </div>
                  <Button variant="secondary" onClick={() => void checkMicrophone()}>
                    Test mic
                  </Button>
                </>
              )}
              {micStatus === "checking" && (
                <>
                  <IconMic size={18} />
                  <div className="mic-status-copy">
                    <strong>{t("micRequesting")}</strong>
                    <span className="fineprint">Please allow microphone access in your browser.</span>
                  </div>
                </>
              )}
              {micStatus === "granted" && (
                <>
                  <IconCheck size={18} className="check-icon--ok" />
                  <div className="mic-status-copy">
                    <strong>Microphone ready</strong>
                    <span className="fineprint">Audio input permission granted.</span>
                  </div>
                </>
              )}
              {micStatus === "denied" && (
                <div className="mic-denied-stack">
                  <div className="mic-denied-head">
                    <IconMicOff size={18} className="check-icon--bad" />
                    <strong>{t("micTitle")}</strong>
                  </div>
                  <p className="fineprint" style={{ margin: 0 }}>{t("micBody")}</p>
                  <div className="mic-denied-actions">
                    <Button variant="secondary" onClick={() => void checkMicrophone()}>
                      {t("tryAgain")}
                    </Button>
                    <Button variant="primary" onClick={handleFallbackToText}>
                      {t("useTextInstead")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loadError && (
          <div className="mic-help" role="alert">
            <div className="upload-error-head">
              <IconAlert size={18} />
              <p style={{ margin: 0 }}>{t("loadSkillsError")}</p>
            </div>
            <Button variant="secondary" onClick={() => void ensureDefaults()} className="cta-spacer">
              {t("retry")}
            </Button>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={loadingSkills || micStatus === "checking"}
          className="cta-spacer"
          onClick={() => void handleStartViva()}
        >
          {inputMode === "text" ? t("startTextMode") : t("start")}
        </Button>
      </Card>

      <Button variant="ghost" fullWidth onClick={() => navigate("/validation")}>
        {t("back")}
      </Button>
    </main>
  );
}
