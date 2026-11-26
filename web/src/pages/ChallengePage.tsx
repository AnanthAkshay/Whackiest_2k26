import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileXls } from "@phosphor-icons/react";
import { getStarterWorkbookUrl, startChallengeAttempt, uploadChallengeArtifact } from "../api";
import { useTranslation } from "../i18n";
import { createMockValidationReport, MVP_CHALLENGE } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import {
  Accordion,
  Button,
  Card,
  CopyButton,
  InfoNote,
  RuledRow,
  Skeleton,
  StatusMark,
  buttonClasses
} from "../shared/ui";

const MAX_BYTES = MVP_CHALLENGE.maxSizeMb * 1024 * 1024;
type UploadPhase = "idle" | "uploading" | "validating" | "success" | "error";

const VALIDATING_STEPS = [
  "File type (.xlsx)",
  "Macro scan",
  "Archive safety",
  "SHA-256 fingerprint"
];

function formatShaPreview(sha: string): string {
  if (sha.length <= 16) return sha;
  return `${sha.slice(0, 8)}...${sha.slice(-6)}`;
}

export function ChallengePage(): JSX.Element {
  const { setValidationReport, language, inputMode, validationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [verifiedSha, setVerifiedSha] = useState("");

  function validateFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".xlsx")) return t("uploadInvalidFormat");
    if (file.size > MAX_BYTES) return t("uploadTooLarge", { maxMb: MVP_CHALLENGE.maxSizeMb });
    if (file.size === 0) return t("uploadEmptyFile");
    return null;
  }

  function startSimulatedCheck(fileName: string, fileSize: number): void {
    setError("");
    setSelectedFile({ name: fileName, size: fileSize });
    setPhase("uploading");
    setProgress(25);
    setResolvedCount(0);

    if (timerRef.current !== null) window.clearInterval(timerRef.current);

    let step = 0;
    timerRef.current = window.setInterval(() => {
      step += 1;
      if (step === 1) {
        setProgress(65);
        setPhase("validating");
        setResolvedCount(1);
      } else if (step === 2) {
        setProgress(90);
        setResolvedCount(3);
      } else {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(100);
        setResolvedCount(4);
        const report = createMockValidationReport(fileName, fileSize);
        setVerifiedSha(report.sha256);
        setPhase("success");
        setValidationReport(report);
        window.setTimeout(() => navigate("/validation"), 450);
      }
    }, 220);
  }

  function startRealOrMockUpload(file: File): void {
    setError("");
    setSelectedFile({ name: file.name, size: file.size });
    setPhase("uploading");
    setProgress(25);
    setResolvedCount(0);

    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        try {
          const resultStr = typeof reader.result === "string" ? reader.result : "";
          const base64 = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
          setProgress(60);
          setPhase("validating");
          setResolvedCount(2);
          const started = await startChallengeAttempt(MVP_CHALLENGE.challengeId);
          const uploaded = await uploadChallengeArtifact(started.attempt.attemptId, {
            fileName: file.name,
            mimeType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            contentBase64: base64,
            idempotencyKey: `upload_${started.attempt.attemptId}_${file.name}_${file.size}`
          });
          setProgress(100);
          setResolvedCount(4);
          const report = createMockValidationReport(file.name, uploaded.artifact.size);
          report.attemptId = started.attempt.attemptId;
          report.sha256 = uploaded.artifact.sha256;
          setVerifiedSha(report.sha256);
          setPhase("success");
          setValidationReport(report);
          window.setTimeout(() => navigate("/validation"), 450);
        } catch (err: unknown) {
          setPhase("error");
          setProgress(0);
          setError(err instanceof Error ? err.message : t("uploadInvalidFormat"));
        }
      })();
    };
    reader.onerror = () => {
      setPhase("error");
      setProgress(0);
      setError(t("uploadInvalidFormat"));
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationErr = validateFile(file);
    if (validationErr) {
      setError(validationErr);
      setPhase("error");
      setSelectedFile(null);
      return;
    }
    startRealOrMockUpload(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const validationErr = validateFile(file);
    if (validationErr) {
      setError(validationErr);
      setPhase("error");
      setSelectedFile(null);
      return;
    }
    startRealOrMockUpload(file);
  }

  function handleCancel(): void {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("error");
    setProgress(0);
    setError(t("uploadCancelled"));
  }

  function handleRetry(): void {
    if (selectedFile) {
      startSimulatedCheck(selectedFile.name, selectedFile.size);
    } else {
      setPhase("idle");
      setError("");
      fileInputRef.current?.click();
    }
  }

  const isBusy = phase === "uploading" || phase === "validating";
  const activeSha = verifiedSha || validationReport?.sha256 || "";

  const summaryRows = (
    <>
      <RuledRow label="Role" value="Data Entry Operator" />
      <RuledRow label="Language" value={language.toUpperCase()} />
      <RuledRow label="Mode" value={inputMode === "voice" ? "Voice" : "Text"} />
      <RuledRow label="Starter workbook" value="retail_sales_starter.xlsx" />
      <RuledRow
        label="Upload status"
        value={
          phase === "success"
            ? "Verified"
            : phase === "uploading"
            ? "Uploading"
            : phase === "validating"
            ? "Validating"
            : phase === "error"
            ? "Needs attention"
            : "Waiting for .xlsx"
        }
      />
      <RuledRow
        label="SHA-256"
        value={activeSha ? <code className="mono">{formatShaPreview(activeSha)}</code> : "—"}
      />
      <RuledRow
        label="Outcome so far"
        value={validationReport ? `${validationReport.practicalScore} / 100` : "Not checked yet"}
      />
    </>
  );

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="demonstrate" />

        <p className="pf-label">STEP 3 OF 7: DEMONSTRATE</p>
        <p className="eyebrow" style={{ marginTop: "4px" }}>{t("challengeEyebrow")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{MVP_CHALLENGE.title}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{MVP_CHALLENGE.instructions}</p>

        <div className="form-with-summary-grid">
          <div className="form-main-col">
            <Card as="section" className="brief-panel">
              <div className="card-header-row">
                <span className="pf-label">Brief</span>
                <span className="fineprint">
                  v{MVP_CHALLENGE.version} / Rubric v{MVP_CHALLENGE.rubricVersion}
                </span>
              </div>

              <div className="spec-grid">
                <div>
                  <span className="spec-label">{t("acceptedFormatLabel")}</span>
                  <strong>{MVP_CHALLENGE.acceptedFormat}</strong>
                </div>
                <div>
                  <span className="spec-label">{t("maxSizeLabel")}</span>
                  <strong>{MVP_CHALLENGE.maxSizeMb} MB</strong>
                </div>
              </div>

              <h2 style={{ marginTop: "16px" }}>{t("estimatedStepsLabel")}</h2>
              <ol className="brief-ruled-steps">
                {MVP_CHALLENGE.estimatedSteps.map((step, idx) => (
                  <li key={step} className="brief-ruled-step">
                    <span className="stage-numeral tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <a
                href={getStarterWorkbookUrl()}
                className={buttonClasses({ variant: "secondary", className: "cta-spacer" })}
                download="retail_sales_starter.xlsx"
              >
                DOWNLOAD STARTER WORKBOOK
              </a>
            </Card>

            <section className="upload-section" aria-label={t("uploadSectionTitle")}>
              <div className="card-header-row">
                <h2>{t("uploadSectionTitle")}</h2>
                <span className="pf-chip pf-chip--review">{t("onlineOnlyBadge")}</span>
              </div>
              <InfoNote>{t("onlineOnlyValidationNote")}</InfoNote>
              <p className="fineprint mock-disclosure">{t("mockUploadNotice")}</p>

              <div
                className={"dropzone-monochrome" + (dragOver ? " is-dragover" : "")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="sr-only"
                  id="challenge-file-input"
                  onChange={handleFileChange}
                />
                <FileXls size={28} weight="regular" aria-hidden="true" />
                <p className="dropzone-title">Drop your .xlsx here, or browse</p>
                <label
                  htmlFor="challenge-file-input"
                  className={buttonClasses({ variant: "primary" })}
                  role="button"
                  tabIndex={0}
                >
                  {t("chooseXlsxFile")}
                </label>
              </div>

              <Button
                variant="secondary"
                fullWidth
                disabled={isBusy}
                className="cta-spacer"
                onClick={() => startSimulatedCheck("retail_sales_cleaned_demo.xlsx", 42500)}
              >
                {t("loadDemoXlsx")}
              </Button>

              {phase === "uploading" && selectedFile && (
                <Card as="div" className="cta-spacer" role="status" aria-live="polite">
                  <div className="meter-heading">
                    <span>{t("uploadingFile", { file: selectedFile.name })}</span>
                    <strong className="mono">{progress}%</strong>
                  </div>
                  <div className="upload-line-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <span className="upload-line-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="form-stack" style={{ marginTop: "12px" }}>
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                  </div>
                  <Button variant="ghost" onClick={handleCancel}>
                    {t("cancelUpload")}
                  </Button>
                </Card>
              )}

              {phase === "validating" && (
                <Card as="div" className="cta-spacer" role="status" aria-live="polite">
                  <p className="pf-label" style={{ marginBottom: "8px" }}>Validating workbook</p>
                  <ul className="ruled-list">
                    {VALIDATING_STEPS.map((label, idx) => {
                      const done = idx < resolvedCount;
                      return (
                        <li key={label} className="ruled-row validating-row">
                          <span>{label}</span>
                          {done ? <StatusMark tone="ok" /> : <Skeleton variant="text" width={80} />}
                        </li>
                      );
                    })}
                  </ul>
                  <Button variant="ghost" onClick={handleCancel}>
                    {t("cancelUpload")}
                  </Button>
                </Card>
              )}

              {phase === "success" && (
                <Card as="div" className="cta-spacer rule-feedback--ok" role="status" aria-live="polite">
                  <div className="rule-feedback">
                    <StatusMark tone="ok" label="Workbook verified and fingerprinted." />
                  </div>
                  {verifiedSha && (
                    <div className="sha-chip-row" style={{ marginTop: "12px" }}>
                      <code className="mono">{formatShaPreview(verifiedSha)}</code>
                      <CopyButton text={verifiedSha} ariaLabel="Copy SHA-256" />
                    </div>
                  )}
                </Card>
              )}

              {phase === "error" && error && (
                <Card as="div" variant="error" className="cta-spacer" role="alert">
                  <div className="rule-feedback">
                    <StatusMark tone="bad" />
                    <span>{error}</span>
                  </div>
                  <Button variant="secondary" onClick={handleRetry} className="cta-spacer">
                    {t("retry")}
                  </Button>
                </Card>
              )}
            </section>
          </div>

          <aside className="summary-col" aria-label="Summary">
            <Card className="summary-panel summary-desktop-only">
              <span className="pf-label">SUMMARY</span>
              <div style={{ marginTop: "12px" }}>{summaryRows}</div>
            </Card>
            <div className="summary-mobile-only">
              <Accordion title="SUMMARY">
                {summaryRows}
              </Accordion>
            </div>
          </aside>
        </div>

        <Button variant="ghost" fullWidth onClick={() => navigate("/learn")} style={{ marginTop: "24px" }}>
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
