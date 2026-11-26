import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { getDevnovateUrl, MVP_ROLES, SAMPLE_OPPORTUNITIES } from "../mock/demoData";
import { JourneyNav } from "../shared/JourneyNav";
import { AnimatedTabs, FocusCard, GlareCard, PinBadge, useFocusCards } from "../shared/aceternity";
import {
  Accordion,
  Button,
  Card,
  GlassPanel,
  InfoNote,
  RuledRow,
  TextLink
} from "../shared/ui";
import { appendOutboundUtm, getStoredUtm } from "../shared/utm";
import type { OpportunityItem } from "../types";

function computeMatchDetails(opp: OpportunityItem): {
  matchPct: number;
  matchedWeight: number;
  totalWeight: number;
} {
  const positiveReqs = opp.requiredSkills.filter((s) => s.weight > 0);
  const totalWeight = positiveReqs.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight <= 0) return { matchPct: 0, matchedWeight: 0, totalWeight: 0 };
  const matchedWeight = positiveReqs.reduce((sum, s) => sum + (s.matched ? s.weight : 0), 0);
  return {
    matchPct: Math.round((matchedWeight / totalWeight) * 100),
    matchedWeight,
    totalWeight
  };
}

export function OpportunitiesPage(): JSX.Element {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<"all" | "nearby" | "entry" | "language">("all");
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<{
    oppId: string;
    label: string;
    weight: number;
    matched: boolean;
  } | null>(null);
  const rawDevnovateUrl = getDevnovateUrl();
  const devnovateUrl = rawDevnovateUrl ? appendOutboundUtm(rawDevnovateUrl, getStoredUtm()) : "";
  const { hovered, setHovered, gridClassName } = useFocusCards<string>();

  const normalizedQuery = locationQuery.trim().toLowerCase();
  const filtered = SAMPLE_OPPORTUNITIES.filter((opp) => {
    const matchesRole = roleFilter === "all" || opp.roleId === roleFilter;
    const matchesLocation =
      !normalizedQuery ||
      opp.city.toLowerCase().includes(normalizedQuery) ||
      opp.district.toLowerCase().includes(normalizedQuery) ||
      opp.pincode.includes(normalizedQuery);
    const matchesQuick =
      quickFilter === "all" ||
      (quickFilter === "entry" && opp.roleId === "data_entry_operator") ||
      (quickFilter === "nearby" && (opp.city.toLowerCase().includes("bengaluru") || Boolean(normalizedQuery))) ||
      quickFilter === "language";
    return matchesRole && matchesLocation && matchesQuick;
  });

  function handleOptionalGps(): void {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("GPS is unavailable on this device. Filter by city, district, or pincode above.");
      return;
    }
    setGpsStatus("Requesting optional location permission...");
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus("Location permission granted."),
      () => setGpsStatus("Location permission declined. Filter manually by city, district, or pincode.")
    );
  }

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="connect" />

        <p className="pf-label">{t("opportunitiesEyebrow")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("opportunitiesTitle")}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{t("opportunitiesBody")}</p>

        <div style={{ marginTop: "16px" }}>
          <InfoNote>
            <strong>You decide. Prooffolio never applies or rejects for you.</strong> {t("humanAgencyNotice")}
          </InfoNote>
        </div>

        <div className="menu-filter-section">
          <span className="pf-label">FILTER BY</span>
          <div style={{ marginTop: "8px" }}>
            <AnimatedTabs
              ariaLabel="Quick opportunity filters"
              value={quickFilter}
              onChange={setQuickFilter}
              tabs={[
                { value: "all", label: "All" },
                { value: "nearby", label: "Nearby" },
                { value: "entry", label: "Entry-level" },
                { value: "language", label: "Language" }
              ]}
            />
          </div>
        </div>

        <GlassPanel as="section" className="filter-card cta-spacer" aria-label={t("filterOpportunitiesLabel")}>
          <label className="field-label" htmlFor="opp-role-filter" style={{ marginTop: 0 }}>
            {t("filterRoleLabel")}
          </label>
          <select
            id="opp-role-filter"
            className="pf-input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">{t("allRolesOption")}</option>
            {MVP_ROLES.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                {r.title}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="opp-location-filter">
            {t("filterLocationLabel")}
          </label>
          <input
            id="opp-location-filter"
            type="text"
            className="pf-input"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder={t("filterLocationPlaceholder")}
          />

          <Button variant="secondary" fullWidth className="cta-spacer" onClick={handleOptionalGps}>
            Use GPS location (Optional)
          </Button>
          {gpsStatus && (
            <p className="fineprint" role="status">
              {gpsStatus}
            </p>
          )}
        </GlassPanel>

        {filtered.length === 0 ? (
          <section className="empty-ghost-wrap" role="status">
            <h2>{t("opportunitiesEmptyTitle")}</h2>
            <p className="fineprint">
              {t("opportunitiesEmptyBody")} Earn a Demonstrated outcome in the challenge to unlock verified matches.
            </p>
            <div className="cta-stack" style={{ marginTop: "12px", maxWidth: "420px" }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setRoleFilter("all");
                  setLocationQuery("");
                  setQuickFilter("all");
                }}
              >
                {t("resetFilters")}
              </Button>
              <Link to="/challenge" className="pf-btn pf-btn--primary">
                START THE CHALLENGE
              </Link>
            </div>
          </section>
        ) : (
          <section className={`ruled-list ${gridClassName}`} style={{ display: "grid", gap: "16px", borderTop: 0 }} aria-label={t("opportunitiesListLabel")}>
            {filtered.map((opp) => {
              const { matchPct, matchedWeight, totalWeight } = computeMatchDetails(opp);
              const matchedSkills = opp.requiredSkills.filter((s) => s.matched);
              const gaps = opp.requiredSkills.filter((s) => !s.matched);
              const initial = (opp.employer || opp.title).trim().charAt(0).toUpperCase();

              return (
                <FocusCard
                  key={opp.id}
                  focused={hovered === opp.id}
                  onEnter={() => setHovered(opp.id)}
                  onLeave={() => setHovered(null)}
                >
                  <GlareCard>
                    <article className="pf-card pf-card--glass menu-lesson-row">
                      <div className="menu-lesson-grid">
                        <div className="menu-lesson-thumb" aria-hidden="true">
                          {initial}
                        </div>
                        <div className="menu-lesson-main">
                          <div className="opp-row-head">
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                                <span className="pf-label">
                                  {opp.isSample ? opp.sourceLabel : t("liveSourceLabel")} · Updated {opp.postedDate}
                                </span>
                                <PinBadge label={opp.city} />
                              </div>
                              <h2 className="opp-role-dm">{opp.title}</h2>
                          <p className="fineprint" style={{ margin: 0 }}>
                            {opp.employer} · {opp.city}, {opp.district} ({opp.pincode})
                          </p>
                        </div>
                        <div className="opp-match-score">
                          <strong className="numeral-lg tabular-nums">{matchPct}%</strong>
                          <span className="pf-label">{t("matchLabel")}</span>
                        </div>
                      </div>

                      <p className="fineprint" style={{ margin: 0 }}>
                        ({matchedWeight} / {totalWeight}) × 100 = {matchPct}% · Demonstrated skills only · Decision support, not a job offer.
                      </p>

                      <div className="opp-skills-inline">
                        <span className="pf-label">{t("matchedSkillsLabel")}: </span>
                        {matchedSkills.map((s, idx) => (
                          <Fragment key={s.skillId}>
                            {idx > 0 && <span className="fineprint"> / </span>}
                            <button
                              type="button"
                              className="skill-inline-btn is-matched"
                              onClick={() =>
                                setSelectedSkill({ oppId: opp.id, label: s.label, weight: s.weight, matched: true })
                              }
                            >
                              {s.label}
                            </button>
                          </Fragment>
                        ))}
                      </div>

                      {gaps.length > 0 && (
                        <div className="opp-skills-inline">
                          <span className="pf-label">{t("skillGapsLabel")}: </span>
                          {gaps.map((s, idx) => (
                            <Fragment key={s.skillId}>
                              {idx > 0 && <span className="fineprint"> / </span>}
                              <button
                                type="button"
                                className="skill-inline-btn is-gap"
                                onClick={() =>
                                  setSelectedSkill({ oppId: opp.id, label: s.label, weight: s.weight, matched: false })
                                }
                              >
                                {s.label}
                              </button>
                            </Fragment>
                          ))}
                          <span className="fineprint">
                            {" "}— <TextLink to="/learn">{t("openLearnLink")}</TextLink>
                          </span>
                        </div>
                      )}

                      {selectedSkill?.oppId === opp.id && (
                        <div className="opp-weight-panel" role="status">
                          <strong>{selectedSkill.label}</strong> · Weight: <code className="mono">{selectedSkill.weight}</code> ·{" "}
                          {selectedSkill.matched ? "Matched from Demonstrated skill" : `Gap (${opp.recommendedPractice})`}
                        </div>
                      )}

                      <Accordion title="Requirement weights">
                        {opp.requiredSkills.map((req) => (
                          <RuledRow
                            key={req.skillId}
                            label={req.label}
                            value={<span className="tabular-nums">{req.weight}% · {req.matched ? "Matched" : "Gap"}</span>}
                          />
                        ))}
                      </Accordion>
                        </div>
                      </div>
                    </article>
                  </GlareCard>
                </FocusCard>
              );
            })}
          </section>
        )}

        {devnovateUrl && (
          <Card as="section" style={{ marginTop: "24px" }}>
            <h2>Devnovate Portfolio Link-Out</h2>
            <p className="fineprint">Optional external portfolio and opportunity link.</p>
            <a href={devnovateUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn--secondary">
              Open Devnovate Profile
            </a>
          </Card>
        )}
      </div>
    </main>
  );
}
