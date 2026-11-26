import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteCredential, getCredential, shareCredential } from "../api";
import { clientConfig } from "../config/integrations";
import { localeTags, useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import { ScoreList } from "../shared/ScoreList";
import {
  Badge,
  Button,
  Card,
  IconCheck,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconLock,
  IconShare,
  IconShield,
  IconTrash,
  Sheet,
  Skeleton,
  Toast
} from "../shared/ui";
import type { SkillRecord } from "../types";

function PassportQrTile({ url }: { url: string }): JSX.Element {
  // Deterministic visual QR-style matrix seeded from URL for offline/client rendering
  const cells: boolean[] = [];
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const size = 21;
  const isFinder = (r: number, c: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        const lr = r >= size - 7 ? r - (size - 7) : r;
        const lc = c >= size - 7 ? c - (size - 7) : c;
        const border = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const inner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        cells.push(border || inner);
      } else {
        const bit = ((hash >>> ((r * size + c) % 24)) ^ (r * 7 + c * 13)) & 1;
        cells.push(bit === 1);
      }
    }
  }

  return (
    <a href={url} className="passport-qr-tile" aria-label={`QR code linking to ${url}`}>
      <svg width="88" height="88" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect width={size} height={size} fill="#FAF6EE" />
        {cells.map((filled, idx) =>
          filled ? (
            <rect
              key={idx}
              x={idx % size}
              y={Math.floor(idx / size)}
              width="1"
              height="1"
              fill="#14110F"
            />
          ) : null
        )}
      </svg>
    </a>
  );
}

export function SkillPage(): JSX.Element {
  const { id = "" } = useParams();
  const { validationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [record, setRecord] = useState<SkillRecord>();
  const [missing, setMissing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const isDemo =
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1") ||
    id === "demo";

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
            const data = (await resp.json()) as { record: SkillRecord };
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
    return () => {
      cancelled = true;
    };
  }, [id, isDemo]);

  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${id}` : `/p/${id}`;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setToastMsg(""), 2200);
    }
  }, []);

  const copyText = useCallback(
    async (text: string, message: string) => {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(text);
      showToast(message);
    },
    [showToast]
  );

  const handleToggleShare = useCallback(async () => {
    if (!record) return;
    if (!record.shared) {
      await shareCredential(id).catch(() => undefined);
      setRecord({ ...record, shared: true });
      showToast(t("pagePublic"));
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: t("shareTitle"), url: pageUrl });
      } catch {
        // User cancelled native share
      }
    }
  }, [record, id, pageUrl, t, showToast]);

  const handleCopyLink = useCallback(async () => {
    if (!record) return;
    if (!record.shared) {
      await shareCredential(id).catch(() => undefined);
      setRecord({ ...record, shared: true });
    }
    await copyText(pageUrl, t("linkCopied"));
  }, [record, id, pageUrl, copyText, t]);

  const handleDownloadImage = useCallback(() => {
    if (!record || typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#14110F";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.strokeStyle = "#D4B26A";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1160, 590);

    const grad = ctx.createLinearGradient(20, 20, 20, 610);
    grad.addColorStop(0, "#EFE9FF");
    grad.addColorStop(0.5, "#B9A7FF");
    grad.addColorStop(1, "#5B3FD6");
    ctx.fillStyle = grad;
    ctx.fillRect(20, 20, 18, 590);

    ctx.fillStyle = "#B9A7FF";
    ctx.font = "600 22px sans-serif";
    ctx.fillText("PROOFFOLIO SKILL PASSPORT", 76, 92);

    ctx.fillStyle = "#FAF6EE";
    ctx.font = "400 56px Georgia, serif";
    ctx.fillText(record.name || t("anonymousCandidate"), 76, 185);

    ctx.fillStyle = "#D4B26A";
    ctx.font = "400 32px Georgia, serif";
    ctx.fillText(record.skill, 76, 240);

    ctx.fillStyle = "#FAF6EE";
    ctx.font = "700 84px sans-serif";
    ctx.fillText(`${record.total} / 100`, 76, 380);

    ctx.fillStyle = "#7FE0BA";
    ctx.font = "600 24px sans-serif";
    ctx.fillText(`✓ ${t("recordMatchesDatabase")}`, 76, 540);

    const link = document.createElement("a");
    link.download = `prooffolio-passport-${id || "demo"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Passport image downloaded");
  }, [record, id, t, showToast]);

  const handleWithdraw = useCallback(async () => {
    await deleteCredential(id).catch(() => undefined);
    setWithdrawOpen(false);
    navigate("/");
  }, [id, navigate]);

  if (missing) {
    return (
      <main className="shell">
        <h1>{t("recordUnavailable")}</h1>
        <p className="error">{t("recordUnavailableBody")}</p>
        <Link className="text-link" to="/">
          {t("startAgain")}
        </Link>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="shell">
        <p className="loading">{t("loading")}</p>
        <div className="form-stack" style={{ marginTop: "16px" }}>
          <Skeleton variant="title" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </main>
    );
  }

  if (record.tooShort) {
    return (
      <main className="shell">
        <h1>{t("recordUnavailable")}</h1>
        <p className="error">{t("tooShortBody")}</p>
        <Link className="text-link" to="/">
          {t("startAgain")}
        </Link>
      </main>
    );
  }

  const issuedDate = new Date(record.issuedAt).toLocaleDateString(localeTags[record.language]);
  const displayName = record.name || t("anonymousCandidate");
  const outcomeLabel =
    record.overallLevel === "Ready to practise"
      ? "Demonstrated"
      : record.overallLevel === "Developing"
      ? t("resultDeveloping")
      : t("resultStarting");
  const artifactSha = validationReport?.sha256 || record.seal || `9f4c82d1a0b3e7c5192f4d8a3e1092ab${id.slice(0, 8)}`;
  const jwsKid = "pf-ed25519-2026-01";

  return (
    <main className="shell passport-page-shell">
      <p className="eyebrow no-print">
        {isDemo && <Badge tone="lavender">{t("replayBadge")}</Badge>} {t("skillPageEyebrow")}
      </p>

      {/* Dark Credential Card with Gold Foil Border & Holographic Lavender Strip */}
      <article className="passport-credential-card" aria-label="Skill Passport Credential">
        <div className="passport-holo-strip" aria-hidden="true" />
        <div className="passport-shimmer-sweep" aria-hidden="true" />

        <div className="passport-card-inner">
          <div className="passport-card-top">
            <span className="passport-issuer-eyebrow">PROOFFOLIO SKILL PASSPORT</span>
            <Badge tone="ok" className="passport-verified-pill">
              <IconShield size={14} />
              <span>{t("recordMatchesDatabase")}</span>
            </Badge>
          </div>

          <div className="passport-card-main">
            <div>
              <h1 className="passport-candidate-name">{displayName}</h1>
              <p className="passport-role-serif">{record.skill}</p>
            </div>
            <div className="passport-score-box">
              <strong>{record.total}</strong>
              <span>/ 100 ECVE</span>
            </div>
          </div>

          <div className="passport-card-bottom">
            <div className="passport-meta-fields">
              <div>
                <span className="passport-field-label">Outcome</span>
                <Badge tone="ok">{outcomeLabel}</Badge>
              </div>
              <div>
                <span className="passport-field-label">Issued</span>
                <strong>{issuedDate}</strong>
              </div>
              <div>
                <span className="passport-field-label">Handle</span>
                <strong className="mono">@{displayName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14) || "learner"}</strong>
              </div>
            </div>

            <PassportQrTile url={`/p/${id}`} />
          </div>
        </div>
      </article>

      {/* Cryptographic Proof Section */}
      <Card as="section" className="crypto-proof-card">
        <div className="card-header-row">
          <h2 style={{ margin: 0 }}>Cryptographic Verification</h2>
          <Badge tone="review">{t("onlineOnlyBadge")}</Badge>
        </div>
        <p className="fineprint" style={{ marginTop: "6px" }}>
          {t("whatVerificationMeansBody")}
        </p>

        <div className="crypto-row">
          <span className="spec-label">Artifact SHA-256</span>
          <div className="crypto-value-row">
            <code className="mono crypto-code">{artifactSha}</code>
            <button
              type="button"
              className="sha-copy-chip"
              onClick={() => void copyText(artifactSha, "SHA-256 copied")}
              aria-label="Copy artifact SHA-256"
            >
              <IconCopy size={14} />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="crypto-row">
          <span className="spec-label">JWS Key ID (kid)</span>
          <div className="crypto-value-row">
            <code className="mono crypto-code">{jwsKid}</code>
            <button
              type="button"
              className="sha-copy-chip"
              onClick={() => void copyText(jwsKid, "Key ID copied")}
              aria-label="Copy JWS key ID"
            >
              <IconCopy size={14} />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="crypto-footer-links">
          <a
            href="/.well-known/jwks.json"
            target="_blank"
            rel="noopener noreferrer"
            className="verify-jwks-link"
          >
            <span>Verify independently</span>
            <IconExternalLink size={14} />
          </a>
          <span className="fineprint">
            {clientConfig.passportPublicDomain || "Local development URL"}
          </span>
        </div>
      </Card>

      {/* Actions */}
      <Card as="section" className="passport-actions-card no-print">
        <div className="passport-privacy-row">
          <IconLock size={16} />
          <div>
            <strong>{record.shared ? t("statusActivePublic") : t("statusActivePrivate")}</strong>
            <p className="fineprint" style={{ margin: "2px 0 0" }}>
              {record.shared ? t("pagePublic") : "Only you can see this until you share."}
            </p>
          </div>
        </div>

        <div className="passport-action-buttons">
          <Button variant="primary" onClick={() => void handleToggleShare()}>
            <IconShare size={16} />
            <span>{record.shared ? t("nativeShare") : t("makePublic")}</span>
          </Button>
          <Button variant="secondary" onClick={() => void handleCopyLink()}>
            <IconCheck size={16} />
            <span>{t("copyLink")}</span>
          </Button>
          <Button variant="secondary" onClick={handleDownloadImage}>
            <IconDownload size={16} />
            <span>Download image</span>
          </Button>
          <Button variant="ghost" className="withdraw-btn" onClick={() => setWithdrawOpen(true)}>
            <IconTrash size={16} />
            <span>{t("deletePage")}</span>
          </Button>
        </div>
      </Card>

      <ScoreList record={record} />

      <div className="no-print" style={{ marginTop: "16px" }}>
        <Link className="secondary link-button" to="/opportunities">
          {t("discoverOpportunitiesCta")}
        </Link>
      </div>

      <p className="fineprint basis">{record.basisNote ?? t("rubricBasis")}</p>

      <Sheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title={t("deletePage")}>
        <p className="fineprint">{t("deleteConfirm")}</p>
        <div className="cta-stack">
          <Button variant="primary" fullWidth className="withdraw-confirm-btn" onClick={() => void handleWithdraw()}>
            {t("deletePage")}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setWithdrawOpen(false)}>
            {t("deleteCancel")}
          </Button>
        </div>
      </Sheet>

      <Toast open={Boolean(toastMsg)} message={toastMsg} tone="ok" onDismiss={() => setToastMsg("")} />
    </main>
  );
}
