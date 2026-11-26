import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { DEMO_LEARNER_PROFILE } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { Button, Card, GlassBadge, GlassCard, GlassPanel, Input, SegmentedControl, StatusMark } from "../shared/ui";
import type { Language } from "../types";

export function ProfileSetupPage(): JSX.Element {
  const { learnerProfile, language, setLearnerProfile, chooseLanguage } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameInputRef = useRef<HTMLInputElement>(null);

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
  const [nameError, setNameError] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleUseDemoLearner(): void {
    setDisplayName(DEMO_LEARNER_PROFILE.displayName);
    setCareerGoal(DEMO_LEARNER_PROFILE.careerGoal);
    setPreferredLanguage(DEMO_LEARNER_PROFILE.preferredLanguage);
    chooseLanguage(DEMO_LEARNER_PROFILE.preferredLanguage);
    setCoarseLocation(DEMO_LEARNER_PROFILE.coarseLocation);
    setIsDemoData(true);
    setNameError("");
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setNameError(`${t("profileNameRequired")} Enter a handle or tap "Use Demo Learner".`);
      nameInputRef.current?.focus();
      return;
    }
    setLearnerProfile({
      displayName: trimmedName,
      careerGoal: careerGoal.trim() || "Entry-Level Data Entry Operator",
      preferredLanguage,
      coarseLocation: coarseLocation.trim(),
      isDemoData
    });
    setSavedSuccess(true);
    navigate("/role");
  }

  if (savedSuccess) {
    return (
      <main className="shell">
        <JourneyNav activeStage="profile" />
        <Card as="section" className="rule-feedback--ok">
          <div className="rule-feedback">
            <StatusMark tone="ok" size={18} />
            <div>
              <strong>Profile saved for {displayName}</strong>
              <p className="fineprint" style={{ margin: "4px 0 12px" }}>
                Next step: choose your target workplace role.
              </p>
              <Button variant="dark" onClick={() => navigate("/role")}>
                {t("continueToRole")}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="profile" />

        <GlassPanel as="section" className="profile-glass-panel">
          <div className="profile-progress-head">
            <span className="pf-label">{t("profileEyebrow")}</span>
            <GlassBadge>Step 1 of 7</GlassBadge>
          </div>
          <div className="pillar-track" style={{ marginTop: "10px" }} aria-hidden="true">
            <div className="pillar-fill" style={{ width: "16%" }} />
          </div>

          <h1 className="pf-page-title" style={{ marginTop: "20px" }}>Let&apos;s get to know you.</h1>
          <p className="pf-lead" style={{ marginTop: "12px" }}>{t("profileBody")}</p>

          <div className="demo-fill-box" style={{ marginBottom: "16px" }}>
            <Button variant="secondary" onClick={handleUseDemoLearner}>
              {t("useDemoLearner")}
            </Button>
            {isDemoData && <GlassBadge>{t("demoDataLabel")}</GlassBadge>}
          </div>

          <form onSubmit={handleSubmit} className="form-stack" noValidate>
        <div className="pf-field">
          <label className="field-label" htmlFor="profile-name">
            {t("profileNameLabel")}
          </label>
          <input
            ref={nameInputRef}
            id="profile-name"
            type="text"
            className={"pf-input" + (nameError ? " pf-input--error" : "")}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setIsDemoData(false);
              setNameError("");
            }}
            placeholder={t("profileNamePlaceholder")}
            maxLength={80}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "profile-name-error" : undefined}
            required
          />
          {nameError && (
            <p id="profile-name-error" className="pf-field-error" role="alert">
              {nameError}
            </p>
          )}
        </div>

        <Input
          id="profile-goal"
          label={t("profileGoalLabel")}
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
          placeholder="Entry-Level Data Entry Operator"
          maxLength={120}
        />

        <fieldset className="field-group">
          <legend className="field-label">{t("profileLanguageLabel")}</legend>
          <SegmentedControl
            ariaLabel={t("profileLanguageLabel")}
            value={preferredLanguage}
            onChange={(code) => {
              setPreferredLanguage(code);
              chooseLanguage(code);
            }}
            options={[
              { value: "en", label: t("languageEnglish") },
              { value: "hi", label: t("languageHindi") },
              { value: "kn", label: t("languageKannada") }
            ]}
          />
        </fieldset>

        <Input
          id="profile-location"
          label={t("profileLocationLabel")}
          value={coarseLocation}
          onChange={(e) => setCoarseLocation(e.target.value)}
          placeholder={t("profileLocationPlaceholder")}
          maxLength={80}
        />

        <GlassCard as="div" variant="glass-soft" padding="sm" style={{ marginTop: "8px" }}>
          <fieldset className="field-group" style={{ margin: 0 }}>
            <legend className="field-label" style={{ marginTop: 0 }}>Privacy &amp; Consent Controls (Policy v2026.1)</legend>
            <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} />
              <span>Allow AI processing for Viva &amp; rubric evaluation</span>
            </label>
            <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input type="checkbox" checked={transcriptConsent} onChange={(e) => setTranscriptConsent(e.target.checked)} />
              <span>Save text transcript for review &amp; Skill Passport (optional)</span>
            </label>
            <label className="fineprint" style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input type="checkbox" checked={publicShareConsent} onChange={(e) => setPublicShareConsent(e.target.checked)} />
              <span>Allow public Skill Passport sharing (private by default; withdrawable anytime)</span>
            </label>
            <p className="fineprint" style={{ marginTop: "8px", marginBottom: 0 }}>
              Raw voice audio retention is <strong>OFF by default</strong>.
            </p>
          </fieldset>
        </GlassCard>

        <Button type="submit" variant="primary" size="lg" fullWidth>
          {t("continueToRole")}
        </Button>
      </form>
      </GlassPanel>
      </div>
    </main>
  );
}
