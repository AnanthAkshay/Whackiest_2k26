import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "@phosphor-icons/react";
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
import { Button, Card, StatusMark } from "../shared/ui";

function appendStoredUtm(url: string): string {
  if (!url || typeof window === "undefined") return url;
  try {
    const raw = window.sessionStorage.getItem("prooffolio_utm");
    if (!raw) return url;
    const utm = JSON.parse(raw) as Record<string, string>;
    const parsed = new URL(url, window.location.origin);
    for (const [k, v] of Object.entries(utm)) {
      if (!parsed.searchParams.has(k)) parsed.searchParams.set(k, v);
    }
    return parsed.toString();
  } catch {
    return url;
  }
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
  const rawTrybUrl = getTrybPracticeUrl();
  const trybUrl = rawTrybUrl ? appendStoredUtm(rawTrybUrl) : "";

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
        <span className="eyebrow">{isOnline ? t("networkOnline") : t("networkOffline")}</span>
        <span className="fineprint">
          {syncSummary.overallStatus === "pending"
            ? t("syncPending", { count: syncSummary.pendingCount })
            : syncSummary.overallStatus === "failed"
            ? t("syncFailed")
            : syncSummary.overallStatus === "synced"
            ? t("syncSynced")
            : t("offlineReadyBadge")}
        </span>
        {(syncSummary.overallStatus === "pending" || syncSummary.overallStatus === "failed") && isOnline && (
          <button type="button" className="hero-plain-link" onClick={() => void handleRetrySync()}>
            {t("retrySync")}
          </button>
        )}
      </div>

      <p className="eyebrow">{t("learnEyebrow")}</p>
      <h1>{t("learnTitle")}</h1>
      <p className="lede">{t("learnBody")}</p>
      <p className="fineprint">
        Updated <time dateTime="2026-11-26">2026-11-26</time>
      </p>

      <section className="ruled-list" aria-label={t("learnCardsLabel")}>
        {bundle.lessons.map((lesson, idx) => {
          const completed = offlineState.completedLessonIds.includes(lesson.id);
          const num = String(idx + 1).padStart(2, "0");
          return (
            <article key={lesson.id} className="ruled-row lesson-row">
              <div className="lesson-row-top">
                <span className="stage-numeral">{num}</span>
                <div className="lesson-row-meta">
                  <span className="eyebrow">{lesson.minutes} MIN</span>
                  <span className="eyebrow">Offline</span>
                </div>
              </div>

              <h2 className="lesson-row-title">{lesson.title[language] ?? lesson.title.en}</h2>
              <p className="lesson-body-text">{lesson.summary[language] ?? lesson.summary.en}</p>
              <code className="code-example">{lesson.example}</code>

              <div className="lesson-actions-row">
                <Button
                  variant={completed ? "secondary" : "dark"}
                  onClick={() => void handleCompleteLesson(lesson.id)}
                >
                  {completed && <Check size={16} weight="regular" aria-hidden="true" />}
                  <span>{completed ? t("lessonCompleted") : t("markLessonDone")}</span>
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <p className="fineprint basis">{bundle.sourceNote}</p>

      <section className="practice-section" aria-label={t("formativePracticeTitle")}>
        <p className="eyebrow">{t("formativeNotCredentialBadge")}</p>
        <h2 style={{ marginTop: "8px" }}>{t("formativePracticeTitle")}</h2>
        <p className="fineprint">{t("formativePracticeSubtitle")}</p>

        <div className="ruled-list">
          {bundle.practiceDrills.map((drill) => {
            const saved = offlineState.practiceAnswers[drill.id];
            return (
              <article key={drill.id} className="ruled-row">
                <strong>{drill.title[language] ?? drill.title.en}</strong>
                <p className="fineprint" style={{ margin: "6px 0 0" }}>
                  {drill.prompt[language] ?? drill.prompt.en}
                </p>
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
                  <p
                    className={"rule-feedback " + (saved.isCorrect ? "rule-feedback--ok" : "rule-feedback--warn")}
                    role="status"
                  >
                    <StatusMark tone={saved.isCorrect ? "ok" : "warn"} size={15} />
                    <span>
                      <strong>{saved.isCorrect ? t("drillCorrect") : t("drillTryAgain")}:</strong>{" "}
                      {drill.explanation[language] ?? drill.explanation.en}
                    </span>
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <Card as="section" className="external-practice-panel" aria-label={t("trybTitle")}>
        <span className="eyebrow">{t("externalActivityBadge")}</span>
        <h2 style={{ marginTop: "8px" }}>{t("trybTitle")}</h2>
        {trybUrl ? (
          <>
            <p className="fineprint">{t("trybBody")}</p>
            <a
              href={trybUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pf-btn pf-btn--secondary"
              onClick={() => void handleOpenTryb()}
            >
              {t("openTrybPractice")}
            </a>
            <p className="fineprint" style={{ marginTop: "8px" }}>{t("trybNoScoreImportNote")}</p>
          </>
        ) : (
          <>
            <p><strong>{t("trybNotConfiguredTitle")}</strong></p>
            <p className="fineprint">{t("trybNotConfiguredBody")}</p>
          </>
        )}
      </Card>

      <div className="cta-stack" style={{ marginTop: "24px" }}>
        <Button variant="dark" size="lg" fullWidth onClick={() => navigate("/challenge")}>
          {t("continueToChallenge")}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate("/role")}>
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
