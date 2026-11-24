import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSkills } from "../api";
import { useTranslation } from "../i18n";
import { useSetup } from "./SetupContext";
import type { AgentLevel, Language, SkillSummary } from "../types";

type SetupStep = "skill" | "language" | "level" | "consent";

const languageKeys: Record<Language, "languageEnglish" | "languageHindi" | "languageKannada"> = {
  en: "languageEnglish",
  hi: "languageHindi",
  kn: "languageKannada"
};

const levelCards: { value: AgentLevel; title: "levelNewTitle" | "levelSomeTitle" | "levelToughTitle"; body: "levelNewBody" | "levelSomeBody" | "levelToughBody" }[] = [
  { value: "new", title: "levelNewTitle", body: "levelNewBody" },
  { value: "some", title: "levelSomeTitle", body: "levelSomeBody" },
  { value: "tough", title: "levelToughTitle", body: "levelToughBody" }
];

export function SetupFlow(): JSX.Element {
  const { skill, language, level, inputMode, chooseSkill, chooseLanguage, chooseLevel, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<SetupStep>(skill ? "language" : "skill");
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [microphoneDenied, setMicrophoneDenied] = useState(false);
  const [requestingMicrophone, setRequestingMicrophone] = useState(false);
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";

  async function loadSkills(): Promise<void> {
    setLoading(true);
    setLoadError(false);
    try {
      setSkills(await getSkills());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadSkills(); }, []);

  function goBack(): void {
    setMicrophoneDenied(false);
    setStep(step === "consent" ? "level" : step === "level" ? "language" : "skill");
  }

  async function startWithMicrophone(): Promise<void> {
    setRequestingMicrophone(true);
    setMicrophoneDenied(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is not supported.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      chooseInputMode("voice");
      navigate("/session" + (isDemo ? "?demo=1" : ""));
    } catch {
      setMicrophoneDenied(true);
    } finally {
      setRequestingMicrophone(false);
    }
  }

  function startTextSession(): void {
    chooseInputMode("text");
    navigate("/session" + (isDemo ? "?demo=1" : ""));
  }

  function useTextFallback(): void {
    startTextSession();
  }

  return <main className="shell setup-shell">
    {isDemo && (
      <div className="demo-top-banner">
        <span className="replay-badge">{t("replayBadge")}</span>
        <button className="primary demo-start-btn" onClick={() => navigate("/session?demo=1")}>{t("startDemoReplay")}</button>
      </div>
    )}
    <header className="home-header">
      <p className="brand">{t("appName")}</p>
      <p className="tagline">{t("tagline")}</p>
      {step === "skill" && (
        <>
          <nav className="journey-pill-stack" aria-label="Prooffolio Journey">
            <span className="journey-pill">1. Learn</span>
            <span className="journey-pill">2. Practise</span>
            <span className="journey-pill">3. Demonstrate</span>
            <span className="journey-pill active">4. Explain (AI Viva)</span>
            <span className="journey-pill">5. Verify</span>
            <span className="journey-pill">6. Connect</span>
          </nav>
          <div className="platform-banner">
            <strong>{t("platformBannerTitle")}</strong>
            <p>{t("platformBannerBody")}</p>
          </div>
        </>
      )}
    </header>
    <p className="step">{t("step", { current: step === "skill" ? 1 : step === "language" ? 2 : step === "level" ? 3 : 4 })}</p>
    {step === "skill" && (
      <SkillStep
        skills={skills}
        loading={loading}
        failed={loadError}
        retry={loadSkills}
        inputMode={inputMode}
        onToggleTextMode={() => chooseInputMode(inputMode === "text" ? "voice" : "text")}
        onChoose={(nextSkill) => { chooseSkill(nextSkill); setStep("language"); }}
      />
    )}
    {step === "language" && <section><p className="eyebrow">{t("languageEyebrow")}</p><h1>{t("languageTitle")}</h1><p className="lede">{t("languageBody")}</p><div className="tap-stack">{(Object.keys(languageKeys) as Language[]).map((nextLanguage) => <button className="tap-card" key={nextLanguage} onClick={() => { chooseLanguage(nextLanguage); setStep("level"); }}>{t(languageKeys[nextLanguage])}</button>)}</div><BackButton onClick={goBack} /></section>}
    {step === "level" && <section><p className="eyebrow">{t("levelEyebrow")}</p><h1>{t("levelTitle")}</h1><p className="lede">{t("levelBody")}</p><div className="tap-stack">{levelCards.map((card) => <button className="tap-card level-card" key={card.value} onClick={() => { chooseLevel(card.value); setStep("consent"); }}><strong>{t(card.title)}</strong><span>{t(card.body)}</span></button>)}</div><BackButton onClick={goBack} /></section>}
    {step === "consent" && (
      <section>
        <p className="eyebrow">{inputMode === "text" ? t("textMode") : t("consentEyebrow")}</p>
        <h1>{inputMode === "text" ? t("textModeReadyTitle") : t("consentTitle")}</h1>
        <p className="lede">{skill?.skill}</p>
        <p className="consent">{inputMode === "text" ? t("textModeReadyBody") : t("consentBody")}</p>
        {inputMode === "text" ? (
          <button className="primary large-button" disabled={!level} onClick={startTextSession}>
            {t("startTextMode")}
          </button>
        ) : (
          <button className="primary large-button" disabled={!level || requestingMicrophone} onClick={() => void startWithMicrophone()}>
            {requestingMicrophone ? t("micRequesting") : t("start")}
          </button>
        )}
        {inputMode !== "text" && microphoneDenied && (
          <section className="mic-help" role="alert">
            <strong>{t("micTitle")}</strong>
            <p>{t("micBody")}</p>
            <button className="secondary" onClick={() => void startWithMicrophone()}>{t("tryAgain")}</button>
            <button className="text-button" onClick={useTextFallback}>{t("useTextInstead")}</button>
          </section>
        )}
        <BackButton onClick={goBack} />
      </section>
    )}
  </main>;
}

function SkillStep({
  skills,
  loading,
  failed,
  retry,
  inputMode,
  onToggleTextMode,
  onChoose
}: {
  skills: SkillSummary[];
  loading: boolean;
  failed: boolean;
  retry: () => Promise<void>;
  inputMode: "voice" | "text";
  onToggleTextMode: () => void;
  onChoose: (skill: SkillSummary) => void;
}): JSX.Element {
  const { t } = useTranslation();
  if (loading) return <p className="loading">{t("loadingSkills")}</p>;
  if (failed) return <section className="mic-help" role="alert"><p>{t("loadSkillsError")}</p><button className="primary" onClick={() => void retry()}>{t("retry")}</button></section>;
  return (
    <section>
      <div className="text-mode-entry">
        <button
          type="button"
          className={"secondary text-mode-button " + (inputMode === "text" ? "text-mode-active" : "")}
          onClick={onToggleTextMode}
        >
          {inputMode === "text" ? `✓ ${t("textModeActive")}` : t("textModeOption")}
        </button>
      </div>
      <p className="eyebrow">{t("skillEyebrow")}</p>
      <h1>{t("skillTitle")}</h1>
      <p className="lede">{t("skillBody")}</p>
      <div className="tap-stack">
        {skills.map((availableSkill) => (
          <button className="tap-card skill-card" key={availableSkill.skill} onClick={() => onChoose(availableSkill)}>
            <strong>{availableSkill.skill}</strong>
            <span>{t("selectSkill", { skill: availableSkill.skill })}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BackButton({ onClick }: { onClick: () => void }): JSX.Element {
  const { t } = useTranslation();
  return <button className="text-button" onClick={onClick}>{t("back")}</button>;
}
