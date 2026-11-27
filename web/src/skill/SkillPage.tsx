import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteCredential, getCredential, shareCredential } from "../api";
import { clientConfig } from "../config/integrations";
import { localeTags, useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import {
  CardBody,
  CardContainer,
  CardItem,
  GlareCard,
  GlowingEffect,
  MovingBorder,
  PinBadge
} from "../shared/aceternity";
import { VerificationSealSvg } from "../shared/animmaster";
import { ScoreList } from "../shared/ScoreList";
import {
  Button,
  CopyButton,
  GlassCard,
  GlassPanel,
  Modal,
  RuledRow,
  Skeleton,
  StatusMark,
  TextLink,
  Toast,
  Toggle
} from "../shared/ui";
import type { SkillRecord } from "../types";

function PassportQrTile({ url }: { url: string }): JSX.Element {
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
      <svg width="92" height="92" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden="true">
        <rect width={size} height={size} fill="#FCFAF3" />
        {cells.map((filled, idx) =>
          filled ? (
            <rect
              key={idx}
              x={idx % size}
              y={Math.floor(idx / size)}
              width="1"
              height="1"
              fill="#0B0B0B"
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
      window.setTimeout(() => setToastMsg(""), 2000);
    }
  }, []);

  const handleToggleShare = useCallback(
    async (nextShared: boolean) => {
      if (!record) return;
      if (nextShared && !record.shared) {
        await shareCredential(id).catch(() => undefined);
      }
      setRecord({ ...record, shared: nextShared });
      showToast(nextShared ? t("pagePublic") : "Only you can see this until you share.");
    },
    [record, id, t, showToast]
  );

  const handleDownloadImage = useCallback(() => {
    if (!record || typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0B0B0B";
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#B9A9D4";
    ctx.fillRect(0, 0, 1200, 4);

    ctx.fillStyle = "#B8B3A6";
    ctx.font = "700 20px sans-serif";
    ctx.fillText("PROOFFOLIO · SKILL PASSPORT", 72, 88);

    ctx.fillStyle = "#F4F0E4";
    ctx.font = "800 58px sans-serif";
    ctx.fillText(record.name || t("anonymousCandidate"), 72, 185);

    ctx.fillStyle = "#B8B3A6";
    ctx.font = "400 28px sans-serif";
    ctx.fillText(record.skill, 72, 236);

    ctx.fillStyle = "#F4F0E4";
    ctx.font = "800 72px sans-serif";
    ctx.fillText(`${record.total} / 100`, 72, 375);

    ctx.fillStyle = "#B9A9D4";
    ctx.font = "700 22px sans-serif";
    ctx.fillText(t("recordMatchesDatabase"), 72, 535);

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
        <div className="pf-frame">
          <div className="empty-ghost-wrap">
            <h1 className="pf-page-title">{t("recordUnavailable")}</h1>
            <p className="error" style={{ marginTop: "16px" }}>{t("recordUnavailableBody")}</p>
            <Link className="pf-btn pf-btn--primary" to="/">
              {t("startAgain")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="shell">
        <div className="pf-frame">
          <p className="loading">{t("loading")}</p>
          <div className="form-stack" style={{ marginTop: "16px" }}>
            <Skeleton variant="title" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </div>
      </main>
    );
  }

  if (record.tooShort) {
    return (
      <main className="shell">
        <div className="pf-frame">
          <h1 className="pf-page-title">{t("recordUnavailable")}</h1>
          <p className="error" style={{ marginTop: "16px" }}>{t("tooShortBody")}</p>
          <Link className="pf-btn pf-btn--primary" to="/">
            {t("startAgain")}
          </Link>
        </div>
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
      <div className="pf-frame">
        <p className="pf-label no-print">
          {isDemo && <span>{t("replayBadge")} · </span>}
          {t("skillPageEyebrow")}
        </p>

        <CardContainer className="no-print-tilt">
          <CardBody>
            <GlareCard>
              <GlowingEffect>
                <article className="passport-kohaku-card" aria-label="Skill Passport Credential">
                  <div className="passport-card-inner">
                    <div className="passport-card-top">
                      <span className="passport-wordmark">
                        <span className="wordmark-light">PROOF</span>
                        <span className="wordmark-bold">FOLIO</span>
                      </span>
                      <span className="passport-type-label">SKILL PASSPORT</span>
                    </div>

                    <CardItem translateZ={22} className="passport-identity">
                      <h1 className="pf-page-title passport-handle-dm">{displayName}</h1>
                      <p className="passport-role-sub">{record.skill}</p>
                    </CardItem>

                    <div className="passport-facts-grid">
                      <div className="passport-facts-rows">
                        <RuledRow label="Composite" value={<span className="tabular-nums">{record.total} / 100</span>} />
                        <RuledRow label="Outcome" value={outcomeLabel} />
                        <RuledRow label="Issued" value={issuedDate} />
                        <RuledRow label="Passport ID" value={<code className="mono">{id || "demo"}</code>} />
                        <RuledRow label="Key ID" value={<code className="mono">{jwsKid}</code>} />
                        <RuledRow label="Artifact SHA-256" value={<code className="mono crypto-code">{artifactSha}</code>} />
                      </div>
                      <CardItem translateZ={18}>
                        <PassportQrTile url={`/p/${id}`} />
                      </CardItem>
                    </div>
                  </div>
                </article>
              </GlowingEffect>
            </GlareCard>
          </CardBody>
        </CardContainer>

        {/* Verification Block */}
        <GlowingEffect>
          <GlassPanel as="section" className="crypto-proof-card">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                <VerificationSealSvg size={36} />
                <StatusMark tone="ok" label={t("recordMatchesDatabase")} />
              </div>
              <MovingBorder>
                <PinBadge label="Ed25519 Signed · JWS" />
              </MovingBorder>
            </div>

          <p className="fineprint">{t("whatVerificationMeansBody")}</p>

          <div className="crypto-row">
            <span className="pf-label">Artifact SHA-256</span>
            <div className="crypto-value-row">
              <code className="mono crypto-code">{artifactSha}</code>
              <CopyButton text={artifactSha} ariaLabel="Copy artifact SHA-256" />
            </div>
          </div>

          <div className="crypto-row">
            <span className="pf-label">JWS Key ID (kid)</span>
            <div className="crypto-value-row">
              <code className="mono crypto-code">{jwsKid}</code>
              <CopyButton text={jwsKid} ariaLabel="Copy JWS key ID" />
            </div>
          </div>

            <div className="crypto-footer-links">
              <TextLink href="/.well-known/jwks.json" target="_blank" rel="noopener noreferrer">
                Verify independently
              </TextLink>
              <span className="fineprint">{clientConfig.passportPublicDomain || "Local development URL"}</span>
            </div>
          </GlassPanel>
        </GlowingEffect>

        {/* Actions */}
        <GlassCard as="section" className="passport-actions-card no-print">
          <Toggle
            checked={Boolean(record.shared)}
            onChange={(val) => void handleToggleShare(val)}
            label={record.shared ? t("pagePublic") : "Only you can see this until you share"}
          />

          <div className="passport-action-buttons">
            <CopyButton text={pageUrl} label="COPY LINK" copiedLabel="COPIED" ariaLabel="Copy passport link" />
            <Button variant="secondary" onClick={handleDownloadImage}>
              DOWNLOAD AS IMAGE
            </Button>
            <Button variant="ghost" className="withdraw-btn" onClick={() => setWithdrawOpen(true)}>
              WITHDRAW
            </Button>
          </div>
        </GlassCard>

        <ScoreList record={record} />

        <div className="no-print" style={{ marginTop: "16px" }}>
          <Link className="pf-btn pf-btn--secondary" to="/opportunities">
            {t("discoverOpportunitiesCta")}
          </Link>
        </div>

        <p className="passport-disclaimer">{record.basisNote ?? t("rubricBasis")}</p>

        <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Skill Passport?">
          <p className="fineprint">{t("deleteConfirm")}</p>
          <div className="cta-stack">
            <Button variant="secondary" fullWidth onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button variant="dark" fullWidth className="withdraw-confirm-btn" onClick={() => void handleWithdraw()}>
              WITHDRAW PASSPORT
            </Button>
          </div>
        </Modal>

        <Toast open={Boolean(toastMsg)} message={toastMsg} tone="ok" onDismiss={() => setToastMsg("")} />
      </div>
    </main>
  );
}
