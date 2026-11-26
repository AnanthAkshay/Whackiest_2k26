import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { getDevnovateUrl, MVP_ROLES, SAMPLE_OPPORTUNITIES } from "../mock/demoData";
import { JourneyNav } from "../shared/JourneyNav";
import {
  Badge,
  Button,
  Card,
  Chip,
  IconClock,
  IconExternalLink,
  IconGlobe,
  IconMapPin,
  IconShield,
  ProgressRing
} from "../shared/ui";
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

function EmptyOpportunitiesNotice(): JSX.Element {
  return (
    <p className="eyebrow" style={{ margin: 0 }}>
      No matching listings
    </p>
  );
}

export function OpportunitiesPage(): JSX.Element {
  const { t } = useTranslation();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationQuery, setLocationQuery] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<"all" | "nearby" | "entry" | "language">("all");
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const [activeWeightId, setActiveWeightId] = useState<string | null>(null);
  const devnovateUrl = getDevnovateUrl();

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
      (quickFilter === "entry" && opp.roleId === "data-entry-operator") ||
      (quickFilter === "nearby" && (opp.city.toLowerCase().includes("bengaluru") || Boolean(normalizedQuery))) ||
      quickFilter === "language";
    return matchesRole && matchesLocation && matchesQuick;
  });

  function handleOptionalGps(): void {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("GPS is unavailable on this device. Filter by city, district, or pincode above.");
      return;
    }
    setGpsStatus("Requesting optional location permission…");
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsStatus("Location permission granted (sorting/filtering by your area).");
      },
      () => {
        setGpsStatus("Location permission declined. You can filter manually by city, district, or pincode.");
      }
    );
  }

  return (
    <main className="shell">
      <JourneyNav activeStage="connect" />

      <p className="eyebrow">{t("opportunitiesEyebrow")}</p>
      <h1>{t("opportunitiesTitle")}</h1>
      <p className="lede">{t("opportunitiesBody")}</p>

      {/* Calm Human-Agency Notice */}
      <Card as="section" variant="lavender" className="human-agency-card" padding="sm">
        <div className="human-agency-row">
          <IconShield size={20} className="human-agency-icon" />
          <div>
            <strong>We never auto-apply or auto-reject. You decide.</strong>
            <p className="fineprint" style={{ margin: "2px 0 0" }}>{t("humanAgencyNotice")}</p>
          </div>
        </div>
      </Card>

      {/* Horizontally Scrolling Filter Pills */}
      <div className="filter-pills-row" role="group" aria-label="Quick opportunity filters">
        <button
          type="button"
          className={"pf-stepper-pill" + (quickFilter === "nearby" ? " is-active" : "")}
          onClick={() => setQuickFilter((f) => (f === "nearby" ? "all" : "nearby"))}
        >
          <IconMapPin size={14} />
          <span style={{ marginLeft: "6px" }}>Nearby</span>
        </button>
        <button
          type="button"
          className={"pf-stepper-pill" + (quickFilter === "entry" ? " is-active" : "")}
          onClick={() => setQuickFilter((f) => (f === "entry" ? "all" : "entry"))}
        >
          <IconClock size={14} />
          <span style={{ marginLeft: "6px" }}>Entry-level</span>
        </button>
        <button
          type="button"
          className={"pf-stepper-pill" + (quickFilter === "language" ? " is-active" : "")}
          onClick={() => setQuickFilter((f) => (f === "language" ? "all" : "language"))}
        >
          <IconGlobe size={14} />
          <span style={{ marginLeft: "6px" }}>Language</span>
        </button>
      </div>

      <Card as="section" className="filter-card" aria-label={t("filterOpportunitiesLabel")}>
        <label className="field-label" htmlFor="opp-role-filter" style={{ marginTop: 0 }}>
          {t("filterRoleLabel")}
        </label>
        <select
          id="opp-role-filter"
          className="text-input"
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
          className="text-input"
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
      </Card>

      {filtered.length === 0 ? (
        <Card as="section" className="empty-state opp-empty-card" role="status">
          <EmptyOpportunitiesNotice />
          <strong>{t("opportunitiesEmptyTitle")}</strong>
          <p className="fineprint" style={{ maxWidth: "40ch", margin: "4px auto 12px" }}>
            {t("opportunitiesEmptyBody")} Earn a <strong>Demonstrated</strong> outcome in your challenge to unlock more verified matches.
          </p>
          <div className="viva-secondary-controls">
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
              Go to Challenge
            </Link>
          </div>
        </Card>
      ) : (
        <section className="card-list opp-grid" aria-label={t("opportunitiesListLabel")}>
          {filtered.map((opp) => {
            const { matchPct, matchedWeight, totalWeight } = computeMatchDetails(opp);
            const matchedSkills = opp.requiredSkills.filter((s) => s.matched);
            const gaps = opp.requiredSkills.filter((s) => !s.matched);
            const initials = opp.employer
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("");

            return (
              <Card as="article" key={opp.id} className="opp-card" interactive>
                <div className="opp-card-top">
                  <div className="opp-company-head">
                    <span className="opp-company-avatar" aria-hidden="true">
                      {initials}
                    </span>
                    <div>
                      <Badge tone="lavender">
                        {opp.isSample ? opp.sourceLabel : t("liveSourceLabel")}
                      </Badge>
                      <h2 className="opp-role-serif">{opp.title}</h2>
                      <p className="opp-employer-line">{opp.employer}</p>
                    </div>
                  </div>
                  <ProgressRing
                    value={matchPct}
                    size={64}
                    strokeWidth={6}
                    tone={matchPct >= 75 ? "ok" : "violet"}
                    label={`${matchPct}% ${t("matchLabel")}`}
                  />
                </div>

                <div className="opp-location-row">
                  <Chip tone="neutral">
                    <IconMapPin size={12} />
                    <span>{opp.city}, {opp.district} ({opp.pincode})</span>
                  </Chip>
                  <span className="fineprint">Updated {opp.postedDate}</span>
                </div>

                <p className="fineprint">
                  Match calculation: ({matchedWeight} / {totalWeight}) × 100 = {matchPct}% (Demonstrated skills only · Decision support, not a job offer).
                </p>

                <div className="opp-skills-block">
                  <strong>{t("matchedSkillsLabel")}</strong>
                  <div className="opp-chips-wrap">
                    {matchedSkills.map((s) => {
                      const chipKey = `${opp.id}-${s.skillId}`;
                      const showWeight = activeWeightId === chipKey;
                      return (
                        <button
                          key={s.skillId}
                          type="button"
                          className="opp-skill-chip-btn pf-chip pf-chip--ok"
                          title={`Weight: ${s.weight}`}
                          onClick={() => setActiveWeightId(showWeight ? null : chipKey)}
                        >
                          <span>{s.label}</span>
                          <span className={"opp-weight-tag" + (showWeight ? " is-visible" : "")}>
                            w:{s.weight}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {gaps.length > 0 && (
                  <div className="opp-skills-block opp-gaps-block">
                    <strong>{t("skillGapsLabel")}</strong>
                    <div className="opp-chips-wrap">
                      {gaps.map((s) => {
                        const chipKey = `${opp.id}-${s.skillId}`;
                        const showWeight = activeWeightId === chipKey;
                        return (
                          <button
                            key={s.skillId}
                            type="button"
                            className="opp-skill-chip-btn skill-gap-chip"
                            title={`Weight: ${s.weight}`}
                            onClick={() => setActiveWeightId(showWeight ? null : chipKey)}
                          >
                            <span>{s.label}</span>
                            <span className={"opp-weight-tag" + (showWeight ? " is-visible" : "")}>
                              w:{s.weight}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="fineprint" style={{ marginTop: "6px" }}>
                      {t("recommendedPracticeLabel")}: {opp.recommendedPractice} —{" "}
                      <Link to="/learn">{t("openLearnLink")}</Link>
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </section>
      )}

      {devnovateUrl && (
        <Card as="section" style={{ marginTop: "16px" }}>
          <h2>Devnovate Portfolio Link-Out</h2>
          <p className="fineprint">Optional external portfolio and opportunity link.</p>
          <a href={devnovateUrl} target="_blank" rel="noopener noreferrer" className="secondary link-button">
            Open Devnovate Profile
            <IconExternalLink size={15} style={{ marginLeft: "6px" }} />
          </a>
        </Card>
      )}
    </main>
  );
}
