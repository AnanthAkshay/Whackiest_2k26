import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getStarterWorkbookUrl, startChallengeAttempt, uploadChallengeArtifact } from "../api";
import { useTranslation } from "../i18n";
import { createMockValidationReport, MVP_CHALLENGE } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import {
  Badge,
  Button,
  Card,
  IconAlert,
  IconCheck,
  IconClock,
  IconCopy,
  IconSheet,
  IconUpload,
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
  return `${sha.slice(0, 8)}…${sha.slice(-6)}`;
}

export function ChallengePage(): JSX.Element {
  const { setValidationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [verifiedSha, setVerifiedSha] = useState("");
  const [shaCopied, setShaCopied] = useState(false);

  function validateFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return t("uploadInvalidFormat");
    }
    if (file.size > MAX_BYTES) {
      return t("uploadTooLarge", { maxMb: MVP_CHALLENGE.maxSizeMb });
    }
    if (file.size === 0) {
      return t("uploadEmptyFile");
    }
    return null;
  }

  function startSimulatedCheck(fileName: string, fileSize: number): void {
    setError("");
    setSelectedFile({ name: fileName, size: fileSize });
    setPhase("uploading");
    setProgress(20);

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    let current = 20;
    timerRef.current = window.setInterval(() => {
      current += 28;
      if (current >= 100) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(100);
        setPhase("validating");
        const report = createMockValidationReport(fileName, fileSize);
        setVerifiedSha(report.sha256);
        window.setTimeout(() => {
          setPhase("success");
          setValidationReport(report);
          window.setTimeout(() => {
            navigate("/validation");
          }, 420);
        }, 380);
      } else {
        setProgress(current);
        if (current >= 65) setPhase("validating");
      }
    }, 160);
  }

  function startRealOrMockUpload(file: File): void {
    setError("");
    setSelectedFile({ name: file.name, size: file.size });
    setPhase("uploading");
    setProgress(25);

    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        try {
          const resultStr = typeof reader.result === "string" ? reader.result : "";
          const base64 = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
          setProgress(55);
          setPhase("validating");
          const started = await startChallengeAttempt(MVP_CHALLENGE.challengeId);
          const uploaded = await uploadChallengeArtifact(started.attempt.attemptId, {
            fileName: file.name,
            mimeType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            contentBase64: base64,
            idempotencyKey: `upload_${started.attempt.attemptId}_${file.name}_${file.size}`
          });
          setProgress(100);
          const report = createMockValidationReport(file.name, uploaded.artifact.size);
          report.attemptId = started.attempt.attemptId;
          report.sha256 = uploaded.artifact.sha256;
          setVerifiedSha(report.sha256);
          setPhase("success");
          setValidationReport(report);
          window.setTimeout(() => {
            navigate("/validation");
          }, 420);
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

  async function handleCopySha(): Promise<void> {
    if (!verifiedSha || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(verifiedSha);
    setShaCopied(true);
    window.setTimeout(() => setShaCopied(false), 1800);
  }

  const isBusy = phase === "uploading" || phase === "validating";

  return (
    <main className="shell">
      <JourneyNav activeStage="demonstrate" />

      <p className="eyebrow">{t("challengeEyebrow")}</p>

      <Card as="section" className="brief-card">
        <div className="card-header-row">
          <Badge tone="lavender">Brief</Badge>
          <span className="fineprint">
            v{MVP_CHALLENGE.version} / Rubric v{MVP_CHALLENGE.rubricVersion}
          </span>
        </div>

        <h1 className="brief-title">{MVP_CHALLENGE.title}</h1>
        <p className="lede">{MVP_CHALLENGE.instructions}</p>

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

        <h2 className="steps-heading">{t("estimatedStepsLabel")}</h2>
        <ol className="brief-steps-list">
          {MVP_CHALLENGE.estimatedSteps.map((step, idx) => (
            <li key={step} className="brief-step-item">
              <span className="brief-step-num" aria-hidden="true">{idx + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <a
          href={getStarterWorkbookUrl()}
          className={buttonClasses({ variant: "secondary", className: "brief-download-btn" })}
          download="retail_sales_starter.xlsx"
        >
          <IconSheet size={18} />
          <span>Download starter workbook</span>
        </a>
      </Card>

      <section className="upload-section" aria-label={t("uploadSectionTitle")}>
        <div className="card-header-row">
          <h2>{t("uploadSectionTitle")}</h2>
          <Badge tone="review">{t("onlineOnlyBadge")}</Badge>
        </div>
        <p className="fineprint">{t("onlineOnlyValidationNote")}</p>
        <p className="fineprint mock-disclosure">{t("mockUploadNotice")}</p>

        <div
          className={"dropzone-premium" + (dragOver ? " dropzone-active" : "")}
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
          <span className="dropzone-icon-wrap" aria-hidden="true">
            <IconUpload size={26} />
          </span>
          <p className="dropzone-title">Drop your .xlsx here or tap to browse</p>
          <p className="fineprint">{t("dropzonePrompt")}</p>
          <label
            htmlFor="challenge-file-input"
            className={buttonClasses({ variant: "primary", className: "dropzone-browse-btn" })}
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

        {(phase === "uploading" || phase === "validating") && selectedFile && (
          <Card as="div" className="upload-state-card" role="status" aria-live="polite">
            <div className="meter-heading">
              <span>{t("uploadingFile", { file: selectedFile.name })}</span>
              <strong>{progress}%</strong>
            </div>
            <div className="meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span className="upload-bar-shimmer" style={{ width: `${progress}%` }} />
            </div>

            {phase === "validating" && (
              <ul className="validating-checklist" aria-label="Safety and integrity checks">
                {VALIDATING_STEPS.map((label, idx) => (
                  <li key={label} className="validating-step" style={{ animationDelay: `${idx * 90}ms` }}>
                    <IconClock size={14} className="spin-icon" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="ghost" onClick={handleCancel}>
              {t("cancelUpload")}
            </Button>
          </Card>
        )}

        {phase === "success" && (
          <Card as="div" className="upload-state-card upload-success-morph" role="status" aria-live="polite">
            <div className="upload-success-head">
              <IconCheck size={22} className="upload-success-icon" />
              <strong>Workbook verified &amp; fingerprinted</strong>
            </div>
            {verifiedSha && (
              <button
                type="button"
                className="sha-copy-chip"
                onClick={() => void handleCopySha()}
                title={verifiedSha}
              >
                <code className="mono">{formatShaPreview(verifiedSha)}</code>
                {shaCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </button>
            )}
          </Card>
        )}

        {phase === "error" && error && (
          <Card as="div" variant="error" className="upload-state-card upload-error-shake" role="alert">
            <div className="upload-error-head">
              <IconAlert size={20} />
              <p className="error" style={{ margin: 0 }}>{error}</p>
            </div>
            <Button variant="secondary" onClick={handleRetry} className="cta-spacer">
              {t("retry")}
            </Button>
          </Card>
        )}
      </section>

      <Button variant="ghost" fullWidth onClick={() => navigate("/learn")}>
        {t("back")}
      </Button>
    </main>
  );
}
