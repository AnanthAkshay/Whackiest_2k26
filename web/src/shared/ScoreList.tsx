import { useTranslation } from "../i18n";
import type { SkillRecord } from "../types";

function barColor(status: string): string {
  if (status === "correct") return "var(--meter-high)";
  if (status === "partial") return "var(--meter-mid)";
  if (status === "wrong") return "var(--meter-low)";
  return "#cdd5cf";
}

export function ScoreList({ record }: { record: SkillRecord }): JSX.Element {
  const { t } = useTranslation();
  return (
    <section className="scores">
      <h2>{t("scoresTitle")}</h2>
      {record.scores.map((score) => (
        <article key={score.criterionId}>
          <div><strong>{score.label}</strong><span>{score.score}</span></div>
          <div className="criterion-bar-track">
            <div className="criterion-bar-fill" style={{ width: `${score.score}%`, background: barColor(score.status) }} />
          </div>
          <p>{score.reason}</p>
        </article>
      ))}
    </section>
  );
}
