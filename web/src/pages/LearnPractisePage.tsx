import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "@phosphor-icons/react";
import {
  DEFAULT_CONTENT_BUNDLE,
  loadCuratedContent,
  type CuratedContentBundle,
  type CuratedLesson
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
import {
  Accordion,
  Button,
  Card,
  OptionButton,
  RuledRow,
  StatusMark,
  Tabs
} from "../shared/ui";
import { appendOutboundUtm, getStoredUtm } from "../shared/utm";

type LessonGroup = "all" | "basics" | "cleanup" | "formulas" | "reporting";
type LessonFilter = "all" | "completed" | "remaining";

const GROUP_TABS: { id: LessonGroup; label: string; desc: string }[] = [
  { id: "all", label: "All", desc: "Complete MO-200 foundation sequence for Retail Sales Cleanup." },
  { id: "basics", label: "Basics", desc: "Rows, columns, cell ranges, and structured workbook hygiene." },
  { id: "cleanup", label: "Cleanup", desc: "Whitespace trimming, casing, ISO dates, and missing values." },
  { id: "formulas", label: "Formulas", desc: "Dynamic aggregation with =SUM, =AVERAGE, and =COUNTIF." },
  { id: "reporting", label: "Reporting", desc: "Summary verification and quality spot-checking." }
];

function classifyLessonGroup(lesson: CuratedLesson, idx: number): LessonGroup {
  const topic = `${lesson.topic} ${lesson.id}`.toLowerCase();
  if (topic.includes("formula") || topic.includes("sum") || topic.includes("count")) return "formulas";
  if (topic.includes("report") || topic.includes("spot") || topic.includes("summary")) return "reporting";
  if (topic.includes("clean") || topic.includes("trim") || topic.includes("date") || topic.includes("missing")) return "cleanup";
  if (idx <= 1) return "basics";
  return "cleanup";
}

export function LearnPractisePage(): JSX.Element {
  const { language } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState<CuratedContentBundle>(DEFAULT_CONTENT_BUNDLE);
  const [offlineState, setOfflineState] = useState<OfflineProgressState>(emptyOfflineState);
  const [group, setGroup] = useState<LessonGroup>("all");
  const [filter, setFilter] = useState<LessonFilter>("all");
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const rawTrybUrl = getTrybPracticeUrl();
  const trybUrl = rawTrybUrl ? appendOutboundUtm(rawTrybUrl, getStoredUtm()) : "";

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
  const filteredLessons = bundle.lessons.filter((lesson, idx) => {
    if (group !== "all" && classifyLessonGroup(lesson, idx) !== group) return false;
    const done = offlineState.completedLessonIds.includes(lesson.id);
    if (filter === "completed" && !done) return false;
    if (filter === "remaining" && done) return false;
    return true;
  });
  const activeGroupMeta = GROUP_TABS.find((g) => g.id === group) ?? GROUP_TABS[0];

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="learn" />

        <div className="offline-status-bar" role="status" aria-live="polite">
          <StatusMark
            tone={isOnline ? "ok" : "warn"}
            label={isOnline ? t("networkOnline") : t("networkOffline")}
          />
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

        <p className="pf-label">{t("learnEyebrow")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("learnTitle")}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{t("learnBody")}</p>
        <p className="fineprint">
          Last updated: <time dateTime="2026-11-26">2026-11-26</time>
        </p>

        <section className="menu-filter-section" aria-label="Filter lessons">
          <span className="pf-label">FILTER BY</span>
          <div className="menu-filter-row">
            <OptionButton selected={filter === "all"} onClick={() => setFilter("all")}>
              All
            </OptionButton>
            <OptionButton selected={filter === "completed"} onClick={() => setFilter("completed")}>
              Completed
            </OptionButton>
            <OptionButton selected={filter === "remaining"} onClick={() => setFilter("remaining")}>
              Remaining
            </OptionButton>
          </div>
          <p className="fineprint" style={{ marginTop: "8px" }}>
            {filteredLessons.length === bundle.lessons.length
              ? `Showing all ${bundle.lessons.length} lessons.`
              : `Showing ${filteredLessons.length} of ${bundle.lessons.length} lessons.`}
          </p>
        </section>

        <div style={{ marginTop: "24px" }}>
          <Tabs
            ariaLabel="Lesson groups"
            items={GROUP_TABS.map((g) => ({ id: g.id, label: g.label }))}
            activeId={group}
            onSelect={setGroup}
          />
          <p className="fineprint" style={{ marginTop: "12px" }}>
            <strong>{activeGroupMeta.label}:</strong> {activeGroupMeta.desc}
          </p>
        </div>

        <section className="ruled-list" aria-label={t("learnCardsLabel")}>
          {filteredLessons.map((lesson) => {
            const origIdx = bundle.lessons.findIndex((l) => l.id === lesson.id);
            const completed = offlineState.completedLessonIds.includes(lesson.id);
            const num = String((origIdx >= 0 ? origIdx : 0) + 1).padStart(2, "0");
            return (
              <article key={lesson.id} className="ruled-row menu-lesson-row">
                <div className="menu-lesson-grid">
                  <div className="menu-lesson-thumb tabular-nums" aria-hidden="true">
                    {num}
                  </div>
                  <div className="menu-lesson-main">
                    <div className="menu-lesson-head">
                      <h2 className="lesson-row-title">{lesson.title[language] ?? lesson.title.en}</h2>
                      <span className="tabular-nums fineprint">{lesson.minutes} MIN</span>
                    </div>
                    <p className="lesson-body-text">{lesson.summary[language] ?? lesson.summary.en}</p>
                    <div className="menu-lesson-status">
                      <StatusMark tone={completed ? "ok" : "neutral"} label={completed ? "Completed" : "Available offline"} />
                    </div>
                    <Accordion title="Rubric links and notes">
                      <RuledRow label="Topic" value={lesson.topic} />
                      <RuledRow label="Example" value={<code className="mono">{lesson.example}</code>} />
                      <RuledRow label="Offline cache" value="Cached on device" />
                    </Accordion>
                    <div className="lesson-actions-row">
                      <Button
                        variant={completed ? "secondary" : "dark"}
                        onClick={() => void handleCompleteLesson(lesson.id)}
                      >
                        {completed && <Check size={16} weight="regular" aria-hidden="true" />}
                        <span>{completed ? t("lessonCompleted") : t("markLessonDone")}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <p className="fineprint basis">{bundle.sourceNote}</p>

        <section className="practice-section" aria-label={t("formativePracticeTitle")}>
          <p className="pf-label">{t("formativeNotCredentialBadge")}</p>
          <h2 className="pf-section-title" style={{ marginTop: "8px" }}>{t("formativePracticeTitle")}</h2>
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
                        <OptionButton
                          key={opt.id}
                          selected={selected}
                          onClick={() => void handleAnswerDrill(drill.id, opt.id, drill.correctOptionId)}
                        >
                          {opt.label}
                        </OptionButton>
                      );
                    })}
                  </div>
                  {saved && (
                    <div
                      className={"rule-feedback " + (saved.isCorrect ? "rule-feedback--ok" : "rule-feedback--warn")}
                      role="status"
                    >
                      <StatusMark tone={saved.isCorrect ? "ok" : "warn"} />
                      <span>
                        <strong>{saved.isCorrect ? t("drillCorrect") : t("drillTryAgain")}:</strong>{" "}
                        {drill.explanation[language] ?? drill.explanation.en}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <Card as="section" className="external-practice-panel" aria-label={t("trybTitle")}>
          <span className="pf-label">{t("externalActivityBadge")}</span>
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

        <div className="cta-stack" style={{ marginTop: "32px" }}>
          <Button variant="dark" size="lg" fullWidth onClick={() => navigate("/challenge")}>
            {t("continueToChallenge")}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate("/role")}>
            {t("back")}
          </Button>
        </div>
      </div>
    </main>
  );
}
