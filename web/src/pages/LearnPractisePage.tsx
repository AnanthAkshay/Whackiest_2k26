import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_CONTENT_BUNDLE,
  loadCuratedContent,
  type CuratedContentBundle
} from "../content/lessons";
import { useTranslation } from "../i18n";
import { getTrybPracticeUrl } from "../mock/demoData";
import {
  computeSyncSummary,
  defaultMockSyncSender,
  defaultOfflineStore,
  emptyOfflineState,
  type OfflineProgressState
} from "../offline/offlineStore";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { Badge, Button, Card, Chip, IconCheck, IconClock, IconCloudCheck, ProgressRing } from "../shared/ui";

function TrybQrSvg(): JSX.Element {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="QR code for Tryb external practice"
      className="tryb-qr-svg"
    >
      <rect width="24" height="24" rx="2" fill="#ffffff" stroke="#d3dcd6" />
      <rect x="3" y="3" width="6" height="6" fill="#14251d" />
      <rect x="4" y="4" width="4" height="4" fill="#ffffff" />
      <rect x="5" y="5" width="2" height="2" fill="#14251d" />
      <rect x="15" y="3" width="6" height="6" fill="#14251d" />
      <rect x="16" y="4" width="4" height="4" fill="#ffffff" />
      <rect x="17" y="5" width="2" height="2" fill="#14251d" />
      <rect x="3" y="15" width="6" height="6" fill="#14251d" />
      <rect x="4" y="16" width="4" height="4" fill="#ffffff" />
      <rect x="5" y="17" width="2" height="2" fill="#14251d" />
      <rect x="11" y="5" width="2" height="2" fill="#1f8a70" />
      <rect x="11" y="9" width="2" height="4" fill="#14251d" />
      <rect x="15" y="11" width="6" height="2" fill="#1f8a70" />
      <rect x="11" y="15" width="4" height="2" fill="#14251d" />
      <rect x="17" y="15" width="4" height="6" fill="#14251d" />
      <rect x="19" y="17" width="1" height="2" fill="#ffffff" />
    </svg>
  );
}

export function LearnPractisePage(): JSX.Element {
  const { language } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState<CuratedContentBundle>(DEFAULT_CONTENT_BUNDLE);
  const [offlineState, setOfflineState] = useState<OfflineProgressState>(emptyOfflineState);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const trybUrl = getTrybPracticeUrl();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [loadedBundle, loadedProgress] = await Promise.all([
        loadCuratedContent(),
        defaultOfflineStore.load()
      ]);
      if (!cancelled) {
        setBundle(loadedBundle);
        setOfflineState(loadedProgress);
      }
    })();

    const onOnline = (): void => {
      setIsOnline(true);
      void defaultOfflineStore.syncPendingActions(defaultMockSyncSender).then((next) => {
        if (!cancelled) setOfflineState(next);
      });
    };
    const onOffline = (): void => setIsOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
    };
  }, []);

  async function handleCompleteLesson(lessonId: string): Promise<void> {
    const next = await defaultOfflineStore.markLessonCompleted(lessonId);
    if (isOnline) {
      const synced = await defaultOfflineStore.syncPendingActions(defaultMockSyncSender);
      setOfflineState(synced);
    } else {
      setOfflineState(next);
    }
  }

  async function handleAnswerDrill(
    drillId: string,
    optionId: string,
    correctOptionId: string
  ): Promise<void> {
    const next = await defaultOfflineStore.recordPracticeAnswer(
      drillId,
      optionId,
      optionId === correctOptionId
    );
    if (isOnline) {
      const synced = await defaultOfflineStore.syncPendingActions(defaultMockSyncSender);
      setOfflineState(synced);
    } else {
      setOfflineState(next);
    }
  }

  async function handleOpenTryb(): Promise<void> {
    if (!trybUrl) return;
    const next = await defaultOfflineStore.recordExternalLinkOpened(trybUrl);
    if (isOnline) {
      const synced = await defaultOfflineStore.syncPendingActions(defaultMockSyncSender);
      setOfflineState(synced);
    } else {
      setOfflineState(next);
    }
  }

  async function handleRetrySync(): Promise<void> {
    const next = await defaultOfflineStore.syncPendingActions(defaultMockSyncSender);
    setOfflineState(next);
  }

  const syncSummary = computeSyncSummary(offlineState.syncQueue);

  return (
    <main className="shell">
      <JourneyNav activeStage="learn" />

      <div className="offline-status-bar" role="status" aria-live="polite">
        <Chip tone={isOnline ? "lavender" : "bad"}>
          {isOnline ? t("networkOnline") : t("networkOffline")}
        </Chip>
        <span className={`sync-badge sync-badge--${syncSummary.overallStatus}`}>
          {syncSummary.overallStatus === "pending"
            ? t("syncPending", { count: syncSummary.pendingCount })
            : syncSummary.overallStatus === "failed"
            ? t("syncFailed")
            : syncSummary.overallStatus === "synced"
            ? t("syncSynced")
            : t("offlineReadyBadge")}
        </span>
        {(syncSummary.overallStatus === "pending" || syncSummary.overallStatus === "failed") && isOnline && (
          <button type="button" className="transcript-correct-btn" onClick={() => void handleRetrySync()}>
            {t("retrySync")}
          </button>
        )}
      </div>

      <p className="eyebrow">{t("learnEyebrow")}</p>
      <h1>{t("learnTitle")}</h1>
      <p className="lede">{t("learnBody")}</p>

      <section className="lesson-stack" aria-label={t("learnCardsLabel")}>
        {bundle.lessons.map((lesson) => {
          const completed = offlineState.completedLessonIds.includes(lesson.id);
          return (
            <Card as="article" key={lesson.id} className="lesson-card" padding="sm">
              <div className="lesson-card-head">
                <div className="lesson-card-meta">
                  <Chip tone="lavender">
                    <IconClock size={12} />
                    <span>{lesson.minutes} min</span>
                  </Chip>
                  <Badge tone="ok" className="offline-cached-badge">
                    <IconCloudCheck size={12} />
                    <span>Available offline</span>
                  </Badge>
                </div>
                <ProgressRing
                  value={completed ? 100 : 0}
                  size={48}
                  strokeWidth={5}
                  tone={completed ? "ok" : "violet"}
                  label={lesson.title[language] ?? lesson.title.en}
                />
              </div>

              <div className="lesson-card-body">
                <h2 className="lesson-card-title">{lesson.title[language] ?? lesson.title.en}</h2>
                <p className="lesson-body-text">{lesson.summary[language] ?? lesson.summary.en}</p>
                <code className="code-example">{lesson.example}</code>
                <div className="lesson-actions-row">
                  <Button
                    variant={completed ? "secondary" : "primary"}
                    onClick={() => void handleCompleteLesson(lesson.id)}
                  >
                    {completed && <IconCheck size={16} />}
                    <span>{completed ? t("lessonCompleted") : t("markLessonDone")}</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <p className="fineprint basis">{bundle.sourceNote}</p>

      <section className="practice-section" aria-label={t("formativePracticeTitle")}>
        <Chip tone="lavender">{t("formativeNotCredentialBadge")}</Chip>
        <h2 style={{ marginTop: "12px" }}>{t("formativePracticeTitle")}</h2>
        <p className="fineprint">{t("formativePracticeSubtitle")}</p>

        <div className="card-list">
          {bundle.practiceDrills.map((drill) => {
            const saved = offlineState.practiceAnswers[drill.id];
            return (
              <Card as="article" key={drill.id}>
                <strong>{drill.title[language] ?? drill.title.en}</strong>
                <p>{drill.prompt[language] ?? drill.prompt.en}</p>
                <div className="drill-options">
                  {drill.options.map((opt) => {
                    const selected = saved?.selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={"drill-option-btn" + (selected ? " selected" : "")}
                        aria-pressed={selected}
                        onClick={() => void handleAnswerDrill(drill.id, opt.id, drill.correctOptionId)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {saved && (
                  <p className={saved.isCorrect ? "drill-feedback-ok" : "drill-feedback-try"} role="status">
                    <strong>{saved.isCorrect ? t("drillCorrect") : t("drillTryAgain")}:</strong>{" "}
                    {drill.explanation[language] ?? drill.explanation.en}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="external-practice-card" aria-label={t("trybTitle")}>
        <div className="external-practice-text">
          <Chip tone="lavender">{t("externalActivityBadge")}</Chip>
          <h2 style={{ marginTop: "10px" }}>{t("trybTitle")}</h2>
          {trybUrl ? (
            <>
              <p>{t("trybBody")}</p>
              <a
                href={trybUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary link-button"
                onClick={() => void handleOpenTryb()}
              >
                {t("openTrybPractice")}
              </a>
              <p className="fineprint">{t("trybNoScoreImportNote")}</p>
              {offlineState.externalLinksOpened.length > 0 && (
                <p className="fineprint">
                  {t("trybOpenedObserved", { count: offlineState.externalLinksOpened.length })}
                </p>
              )}
            </>
          ) : (
            <>
              <p><strong>{t("trybNotConfiguredTitle")}</strong></p>
              <p className="fineprint">{t("trybNotConfiguredBody")}</p>
            </>
          )}
        </div>
        {trybUrl && (
          <div className="external-practice-qr">
            <TrybQrSvg />
          </div>
        )}
      </section>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="cta-spacer"
        onClick={() => navigate("/challenge")}
      >
        {t("continueToChallenge")}
      </Button>

      <Button variant="ghost" fullWidth onClick={() => navigate("/role")}>
        {t("back")}
      </Button>
    </main>
  );
}
