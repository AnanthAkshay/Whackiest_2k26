import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteCredential, getCredential, shareCredential } from "../api";
import { localeTags, useTranslation } from "../i18n";
import { ScoreList } from "../shared/ScoreList";
import type { SkillRecord } from "../types";

export function SkillPage(): JSX.Element {
  const { id = "" } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SkillRecord>();
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1" || id === "demo";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await getCredential(id);
        if (!cancelled) setRecord(res);
      } catch {
        if (isDemo) {
          try {
            const resp = await fetch("/demo/session.json");
            const data = await resp.json() as { record: SkillRecord };
            if (!cancelled) {
              setRecord({ ...data.record, pageId: "demo" });
              return;
            }
          } catch {
            // Ignore demo fallback failure
          }
        }
        if (!cancelled) setMissing(true);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isDemo]);

  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${id}` : "";

  const handleShare = useCallback(async () => {
    if (!record) return;
    if (!record.shared) {
      await shareCredential(id);
      setRecord({ ...record, shared: true });
    }
    if (navigator.share) {
      try { await navigator.share({ title: t("shareTitle"), url: pageUrl }); } catch { /* cancelled */ }
    }
  }, [record, id, pageUrl, t]);

  const handleCopy = useCallback(async () => {
    if (!record?.shared) {
      await shareCredential(id);
      setRecord({ ...record!, shared: true });
    }
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [record, id, pageUrl]);

  const handleDelete = useCallback(async () => {
    await deleteCredential(id);
    navigate("/");
  }, [id, navigate]);

  if (missing) return <main className="shell"><h1>{t("recordUnavailable")}</h1><p className="error">{t("recordUnavailableBody")}</p><Link className="text-link" to="/">{t("startAgain")}</Link></main>;
  if (!record) return <main className="shell"><p className="loading">{t("loading")}</p></main>;
  if (record.tooShort) return <main className="shell"><h1>{t("recordUnavailable")}</h1><p className="error">{t("tooShortBody")}</p><Link className="text-link" to="/">{t("startAgain")}</Link></main>;

  const issuedDate = new Date(record.issuedAt).toLocaleDateString(localeTags[record.language]);
  const level = record.overallLevel === "Starting" ? t("resultStarting") : record.overallLevel === "Developing" ? t("resultDeveloping") : t("resultReady");
  const displayName = record.name || t("anonymousCandidate");

  return (
    <main className="shell">
      <p className="eyebrow">{isDemo && <span className="replay-badge">{t("replayBadge")}</span>} {t("skillPageEyebrow")}</p>
      <h1>{record.skill}</h1>
      <p className="skill-page-name">{displayName}</p>
      <div className="result-total" aria-label={t("totalLabel")}>{record.total}</div>
      <p className="lede">{t("levelLabel")}: <strong>{level}</strong></p>
      <p className="fineprint">{t("issued", { date: issuedDate })}</p>
      <p className="record-badge">{t("recordMatchesDatabase")}</p>
      <ScoreList record={record} />
      <p className="basis">{record.basisNote ?? t("rubricBasis")}</p>

      <section className="share-section">
        <h2>{t("shareTitle")}</h2>
        <p className="share-note">{record.shared ? t("pagePublic") : t("pagePrivate")}</p>

        {!record.shared && (
          <button className="primary" onClick={handleShare}>{t("makePublic")}</button>
        )}
        {record.shared && (
          <>
            <button className="secondary" onClick={handleCopy}>{copied ? t("linkCopied") : t("copyLink")}</button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button className="secondary" onClick={handleShare}>{t("nativeShare")}</button>
            )}
          </>
        )}
      </section>

      <section className="delete-section">
        {!confirmDelete && (
          <button className="delete-button" onClick={() => setConfirmDelete(true)}>{t("deletePage")}</button>
        )}
        {confirmDelete && (
          <div className="delete-confirm">
            <p>{t("deleteConfirm")}</p>
            <button className="delete-yes" onClick={handleDelete}>{t("deletePage")}</button>
            <button className="secondary" onClick={() => setConfirmDelete(false)}>{t("deleteCancel")}</button>
          </div>
        )}
      </section>
    </main>
  );
}
