import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatText, Microphone } from "@phosphor-icons/react";
import { getSkills } from "../api";
import { useTranslation } from "../i18n";
import { JourneyNav } from "../shared/JourneyNav";
import { Button, Card, SegmentedControl, StatusMark } from "../shared/ui";
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

  return (
    <main className="shell setup-shell">
      <JourneyNav activeStage="explain" />

      {isDemo && (
        <div className="demo-top-banner">
          <span className="eyebrow">{t("replayBadge")}</span>
          <Button variant="dark" className="demo-start-btn" onClick={() => navigate("/session?demo=1")}>
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
            {LANGUAGE_ROWS.map((row) => {
              const selected = language === row.code;
              return (
                <button
                  key={row.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  lang={row.code}
                  className={"setup-lang-row" + (selected ? " is-selected" : "")}
                  onClick={() => chooseLanguage(row.code)}
                >
                  <span className={"setup-radio-dot" + (selected ? " is-selected" : "")} aria-hidden="true" />
                  <div>
                    <strong className="setup-lang-script">{row.title}</strong>
                    <span className="setup-lang-sub">{row.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="setup-section setup-mode-row">
          <div>
            <h2 className="setup-section-title" style={{ marginBottom: "2px" }}>Mode</h2>
            <p className="fineprint" style={{ margin: 0 }}>Voice interview or typed chat</p>
          </div>
          <SegmentedControl
            ariaLabel="Voice or Text mode"
            value={inputMode}
            onChange={(m) => chooseInputMode(m)}
            options={[
              {
                value: "voice",
                label: (
                  <>
                    <Microphone size={15} weight="regular" aria-hidden="true" />
                    <span>Voice</span>
                  </>
                )
              },
              {
                value: "text",
                label: (
                  <>
                    <ChatText size={15} weight="regular" aria-hidden="true" />
                    <span>Text</span>
                  </>
                )
              }
            ]}
          />
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

        <div className="setup-section">
          <div className="mic-status-line" role="status" aria-live="polite">
            {micStatus === "waiting" && (
              <>
                <StatusMark tone="neutral" size={16} />
                <span className="fineprint">Microphone permission not checked yet.</span>
                <Button variant="secondary" onClick={() => void checkMicrophone()}>
                  Test mic
                </Button>
              </>
            )}
            {micStatus === "checking" && (
              <>
                <StatusMark tone="review" size={16} />
                <span className="fineprint">{t("micRequesting")}</span>
              </>
            )}
            {micStatus === "granted" && (
              <>
                <StatusMark tone="ok" size={16} />
                <span className="status-text--ok">Microphone ready.</span>
              </>
            )}
            {micStatus === "denied" && (
              <>
                <StatusMark tone="warn" size={16} />
                <span className="status-text--warn">
                  Microphone unavailable — switched to Text mode automatically.
                </span>
              </>
            )}
          </div>
        </div>

        {loadError && (
          <div className="rule-feedback rule-feedback--bad" role="alert">
            <StatusMark tone="bad" size={16} />
            <span>{t("loadSkillsError")}</span>
            <Button variant="secondary" onClick={() => void ensureDefaults()}>
              {t("retry")}
            </Button>
          </div>
        )}

        <Button
          variant="dark"
          size="lg"
          fullWidth
          disabled={loadingSkills || micStatus === "checking"}
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
