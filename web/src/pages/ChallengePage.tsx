import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getStarterWorkbookUrl, startChallengeAttempt, uploadChallengeArtifact } from "../api";
import { useTranslation } from "../i18n";
import { createMockValidationReport, MVP_CHALLENGE } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";

const MAX_BYTES = MVP_CHALLENGE.maxSizeMb * 1024 * 1024;

export function ChallengePage(): JSX.Element {
  const { setValidationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    setUploading(true);
    setProgress(15);

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }

    let current = 15;
    timerRef.current = window.setInterval(() => {
      current += 30;
      if (current >= 100) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(100);
        setUploading(false);
        setValidationReport(createMockValidationReport(fileName, fileSize));
        navigate("/validation");
      } else {
        setProgress(current);
      }
    }, 180);
  }

  function startRealOrMockUpload(file: File): void {
    setError("");
    setSelectedFile({ name: file.name, size: file.size });
    setUploading(true);
    setProgress(25);

    const reader = new FileReader();
    reader.onload = () => {
      void (async () => {
        try {
          const resultStr = typeof reader.result === "string" ? reader.result : "";
          const base64 = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
          setProgress(55);
          const started = await startChallengeAttempt(MVP_CHALLENGE.challengeId);
          const uploaded = await uploadChallengeArtifact(started.attempt.attemptId, {
            fileName: file.name,
            mimeType: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            contentBase64: base64,
            idempotencyKey: `upload_${started.attempt.attemptId}_${file.name}_${file.size}`
          });
          setProgress(100);
          setUploading(false);
          const report = createMockValidationReport(file.name, uploaded.artifact.size);
          report.attemptId = started.attempt.attemptId;
          report.sha256 = uploaded.artifact.sha256;
          setValidationReport(report);
          navigate("/validation");
        } catch (err: unknown) {
          setUploading(false);
          setProgress(0);
          setError(err instanceof Error ? err.message : t("uploadInvalidFormat"));
        }
      })();
    };
    reader.onerror = () => {
      setUploading(false);
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
    setUploading(false);
    setProgress(0);
    setError(t("uploadCancelled"));
  }

  function handleRetry(): void {
    if (selectedFile) {
      startSimulatedCheck(selectedFile.name, selectedFile.size);
    } else {
      fileInputRef.current?.click();
    }
  }

  return (
    <main className="shell">
      <JourneyNav activeStage="demonstrate" />

      <p className="eyebrow">{t("challengeEyebrow")}</p>
      <h1>{MVP_CHALLENGE.title}</h1>
      <p className="lede">{MVP_CHALLENGE.instructions}</p>

      <section className="info-card challenge-specs">
        <div className="spec-grid">
          <div>
            <span className="spec-label">{t("acceptedFormatLabel")}</span>
            <strong>{MVP_CHALLENGE.acceptedFormat}</strong>
          </div>
          <div>
            <span className="spec-label">{t("maxSizeLabel")}</span>
            <strong>{MVP_CHALLENGE.maxSizeMb} MB</strong>
          </div>
          <div>
            <span className="spec-label">{t("versionLabel")}</span>
            <strong>v{MVP_CHALLENGE.version} / Rubric v{MVP_CHALLENGE.rubricVersion}</strong>
          </div>
        </div>
        <h2 className="steps-heading">{t("estimatedStepsLabel")}</h2>
        <ol className="steps-list">
          {MVP_CHALLENGE.estimatedSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <a href={getStarterWorkbookUrl()} className="secondary link-button" download="retail_sales_starter.xlsx">
          Download Starter Workbook (.xlsx)
        </a>
      </section>

      <section className="upload-section" aria-label={t("uploadSectionTitle")}>
        <div className="card-header-row">
          <h2>{t("uploadSectionTitle")}</h2>
          <span className="online-only-pill">{t("onlineOnlyBadge")}</span>
        </div>
        <p className="fineprint">{t("onlineOnlyValidationNote")}</p>
        <p className="fineprint mock-disclosure">{t("mockUploadNotice")}</p>

        <div
          className={"dropzone" + (dragOver ? " dropzone-active" : "")}
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
          <p>{t("dropzonePrompt")}</p>
          <label htmlFor="challenge-file-input" className="primary link-button" role="button" tabIndex={0}>
            {t("chooseXlsxFile")}
          </label>
        </div>

        <button
          type="button"
          className="secondary"
          disabled={uploading}
          onClick={() => startSimulatedCheck("retail_sales_cleaned_demo.xlsx", 42500)}
        >
          {t("loadDemoXlsx")}
        </button>

        {uploading && selectedFile && (
          <div className="progress-card" role="status" aria-live="polite">
            <div className="meter-heading">
              <span>{t("uploadingFile", { file: selectedFile.name })}</span>
              <strong>{progress}%</strong>
            </div>
            <div className="meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span className="meter-fill" style={{ width: `${progress}%` }} />
            </div>
            <button type="button" className="text-button" onClick={handleCancel}>
              {t("cancelUpload")}
            </button>
          </div>
        )}

        {error && (
          <div className="mic-help" role="alert">
            <p className="error">{error}</p>
            <button type="button" className="secondary" onClick={handleRetry}>
              {t("retry")}
            </button>
          </div>
        )}
      </section>

      <button type="button" className="text-button" onClick={() => navigate("/learn")}>
        {t("back")}
      </button>
    </main>
  );
}
