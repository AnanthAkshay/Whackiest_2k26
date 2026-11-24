import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createCredential, getSkillRecord } from "../api";
import { useTranslation } from "../i18n";
import { ScoreList } from "../shared/ScoreList";
import { Sparkline } from "../shared/Sparkline";
import type { SkillRecord } from "../types";

export function ResultsPage(): JSX.Element {
  const { id = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SkillRecord>();
  const [creating, setCreating] = useState(false);
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1" || id === "demo";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await getSkillRecord(id);
        if (!cancelled) setRecord(res);
      } catch {
        if (isDemo) {
          try {
            const resp = await fetch("/demo/session.json");
            const data = await resp.json() as { record: SkillRecord };
            if (!cancelled) setRecord(data.record);
            return;
          } catch {
            // Ignore demo fallback failure
          }
        }
        if (!cancelled) setRecord(undefined);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isDemo]);

  async function handleCreatePage(): Promise<void> {
    if (creating) return;
    setCreating(true);
    try {
      const { pageId } = await createCredential(id);
      navigate(`/skill/${pageId}${isDemo ? "?demo=1" : ""}`);
    } catch {
      if (isDemo) {
        navigate(`/skill/demo?demo=1`);
      } else {
        setCreating(false);
      }
    }
  }

  if (!record) return <main className="shell"><p className="loading">{t("loading")}</p></main>;

  if (record.tooShort) {
    return (
      <main className="shell">
        <p className="eyebrow">{isDemo && <span className="replay-badge">{t("replayBadge")}</span>} {t("resultsEyebrow")}</p>
        <h1>{t("tooShortTitle")}</h1>
        <p className="lede">{t("tooShortBody")}</p>
        <Link className="primary link-button" to="/">{t("startAgain")}</Link>
      </main>
    );
  }

  const weakScores = record.scores.filter((s) => s.status !== "correct" && s.improveTip);

  return (
    <main className="shell">
      <p className="eyebrow">{isDemo && <span className="replay-badge">{t("replayBadge")}</span>} {t("resultsEyebrow")}</p>
      <div className="result-total" aria-label={t("totalLabel")}>{record.total}</div>
      <h1>{resultName(record.overallLevel, t)}</h1>
      <p className="lede">{t("resultIntro")}</p>
      {record.meterTrace.length >= 2 && (
        <div className="sparkline-section">
          <p className="label">{t("meterProgress")}</p>
          <Sparkline trace={record.meterTrace} />
        </div>
      )}
      <ScoreList record={record} />
      {weakScores.length > 0 && (
        <section className="improve-list">
          <h2>{t("whereToImprove")}</h2>
          {weakScores.map((s) => (
            <article key={s.criterionId}>
              <strong>{s.label}</strong>
              <p>{s.improveTip}</p>
            </article>
          ))}
        </section>
      )}
      <button className="primary link-button" disabled={creating} onClick={handleCreatePage}>
        {creating ? t("creatingPage") : t("createSkillPage")}
      </button>
      <Link className="text-link" to="/">{t("startAgain")}</Link>
    </main>
  );
}

function resultName(level: SkillRecord["overallLevel"], t: ReturnType<typeof useTranslation>["t"]): string {
  return level === "Starting" ? t("resultStarting") : level === "Developing" ? t("resultDeveloping") : t("resultReady");
}
