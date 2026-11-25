import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { DEMO_LEARNER_PROFILE } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import type { Language } from "../types";

export function ProfileSetupPage(): JSX.Element {
  const { learnerProfile, language, setLearnerProfile, chooseLanguage } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(learnerProfile?.displayName ?? "");
  const [careerGoal, setCareerGoal] = useState(
    learnerProfile?.careerGoal ?? "Entry-Level Data Entry Operator"
  );
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    learnerProfile?.preferredLanguage ?? language
  );
  const [coarseLocation, setCoarseLocation] = useState(learnerProfile?.coarseLocation ?? "");
  const [isDemoData, setIsDemoData] = useState(learnerProfile?.isDemoData ?? false);
  const [aiConsent, setAiConsent] = useState(true);
  const [transcriptConsent, setTranscriptConsent] = useState(false);
  const [publicShareConsent, setPublicShareConsent] = useState(false);
  const [error, setError] = useState("");

  function handleUseDemoLearner(): void {
    setDisplayName(DEMO_LEARNER_PROFILE.displayName);
    setCareerGoal(DEMO_LEARNER_PROFILE.careerGoal);
    setPreferredLanguage(DEMO_LEARNER_PROFILE.preferredLanguage);
    chooseLanguage(DEMO_LEARNER_PROFILE.preferredLanguage);
    setCoarseLocation(DEMO_LEARNER_PROFILE.coarseLocation);
    setIsDemoData(true);
    setError("");
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError(t("profileNameRequired"));
      return;
    }
    setLearnerProfile({
      displayName: trimmedName,
      careerGoal: careerGoal.trim() || "Entry-Level Data Entry Operator",
      preferredLanguage,
      coarseLocation: coarseLocation.trim(),
      isDemoData
    });
    navigate("/role");
  }

  return (
    <main className="shell">
      <JourneyNav activeStage="profile" />

      <p className="eyebrow">{t("profileEyebrow")}</p>
      <h1>{t("profileTitle")}</h1>
      <p className="lede">{t("profileBody")}</p>

      <div className="demo-fill-box">
        <button type="button" className="secondary" onClick={handleUseDemoLearner}>
          {t("useDemoLearner")}
        </button>
        {isDemoData && <span className="sample-pill">{t("demoDataLabel")}</span>}
      </div>

      <form onSubmit={handleSubmit} className="form-stack" noValidate>
        <label className="field-label" htmlFor="profile-name">
          {t("profileNameLabel")}
        </label>
        <input
          id="profile-name"
          type="text"
          className="text-input"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setIsDemoData(false);
            setError("");
          }}
          placeholder={t("profileNamePlaceholder")}
          maxLength={80}
          required
        />

        <label className="field-label" htmlFor="profile-goal">
          {t("profileGoalLabel")}
        </label>
        <input
          id="profile-goal"
          type="text"
          className="text-input"
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          placeholder="Entry-Level Data Entry Operator"
          maxLength={120}
        />

        <fieldset className="field-group">
          <legend className="field-label">{t("profileLanguageLabel")}</legend>
          <div className="lang-pill-row">
            {(
              [
                { code: "en", label: t("languageEnglish") },
                { code: "hi", label: t("languageHindi") },
                { code: "kn", label: t("languageKannada") }
              ] as const
            ).map((opt) => (
              <button
                key={opt.code}
                type="button"
                className={"lang-pill" + (preferredLanguage === opt.code ? " active" : "")}
                aria-pressed={preferredLanguage === opt.code}
                onClick={() => {
                  setPreferredLanguage(opt.code);
                  chooseLanguage(opt.code);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="field-label" htmlFor="profile-location">
          {t("profileLocationLabel")}
        </label>
        <input
          id="profile-location"
          type="text"
          className="text-input"
          value={coarseLocation}
          onChange={(e) => setCoarseLocation(e.target.value)}
          placeholder={t("profileLocationPlaceholder")}
          maxLength={80}
        />

        <fieldset className="info-card" style={{ marginTop: "8px" }}>
          <legend className="field-label">Privacy & Consent Controls (Policy v2026.1)</legend>
          <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} />
            <span>Allow AI processing for Viva & rubric evaluation</span>
          </label>
          <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <input type="checkbox" checked={transcriptConsent} onChange={(e) => setTranscriptConsent(e.target.checked)} />
            <span>Save text transcript for review & Skill Passport (optional)</span>
          </label>
          <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
            <input type="checkbox" checked={publicShareConsent} onChange={(e) => setPublicShareConsent(e.target.checked)} />
            <span>Allow public Skill Passport sharing (private by default; withdrawable anytime)</span>
          </label>
          <p className="fineprint" style={{ marginTop: "8px", marginBottom: 0 }}>
            Raw voice audio retention is <strong>OFF by default</strong>.
          </p>
        </fieldset>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary large-button">
          {t("continueToRole")}
        </button>
      </form>
    </main>
  );
}
