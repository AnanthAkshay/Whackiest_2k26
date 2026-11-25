import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../i18n";
import { getDevnovateUrl, MVP_ROLES, SAMPLE_OPPORTUNITIES } from "../mock/demoData";
import { JourneyNav } from "../shared/JourneyNav";
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
  const [gpsStatus, setGpsStatus] = useState<string>("");
  const devnovateUrl = getDevnovateUrl();

  const normalizedQuery = locationQuery.trim().toLowerCase();
  const filtered = SAMPLE_OPPORTUNITIES.filter((opp) => {
    const matchesRole = roleFilter === "all" || opp.roleId === roleFilter;
    const matchesLocation =
      !normalizedQuery ||
      opp.city.toLowerCase().includes(normalizedQuery) ||
      opp.district.toLowerCase().includes(normalizedQuery) ||
      opp.pincode.includes(normalizedQuery);
    return matchesRole && matchesLocation;
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

      <section className="filter-card" aria-label={t("filterOpportunitiesLabel")}>
        <label className="field-label" htmlFor="opp-role-filter">
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

        <button type="button" className="secondary" onClick={handleOptionalGps}>
          Use GPS location (Optional)
        </button>
        {gpsStatus && (
          <p className="fineprint" role="status">
            {gpsStatus}
          </p>
        )}
      </section>

      {filtered.length === 0 ? (
        <section className="info-card empty-state" role="status">
          <strong>{t("opportunitiesEmptyTitle")}</strong>
          <p>{t("opportunitiesEmptyBody")}</p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setRoleFilter("all");
              setLocationQuery("");
            }}
          >
            {t("resetFilters")}
          </button>
        </section>
      ) : (
        <section className="card-list" aria-label={t("opportunitiesListLabel")}>
          {filtered.map((opp) => {
            const { matchPct, matchedWeight, totalWeight } = computeMatchDetails(opp);
            const matchedSkills = opp.requiredSkills.filter((s) => s.matched);
            const gaps = opp.requiredSkills.filter((s) => !s.matched);

            return (
              <article key={opp.id} className="info-card opp-card">
                <div className="card-header-row">
                  <span className="sample-pill">
                    {opp.isSample ? opp.sourceLabel : t("liveSourceLabel")}
                  </span>
                  <span className="match-pill">{matchPct}% {t("matchLabel")}</span>
                </div>

                <h2>{opp.title}</h2>
                <p className="opp-meta">
                  {opp.employer} · {opp.city}, {opp.district} ({opp.pincode}) · Updated {opp.postedDate}
                </p>
                <p className="fineprint">
                  Match calculation: ({matchedWeight} / {totalWeight}) × 100 = {matchPct}% (Demonstrated skills only · Decision support, not a job offer).
                </p>

                <div className="opp-skills-block">
                  <strong>{t("matchedSkillsLabel")}</strong>
                  <ul className="mini-skill-list">
                    {matchedSkills.map((s) => (
                      <li key={s.skillId}>✓ {s.label} (weight {s.weight})</li>
                    ))}
                  </ul>
                </div>

                {gaps.length > 0 && (
                  <div className="opp-skills-block opp-gaps-block">
                    <strong>{t("skillGapsLabel")}</strong>
                    <ul className="mini-skill-list">
                      {gaps.map((s) => (
                        <li key={s.skillId}>
                          ○ {s.label} (weight {s.weight}) — <Link to="/learn">{t("openLearnLink")}</Link>
                        </li>
                      ))}
                    </ul>
                    <p className="fineprint">
                      {t("recommendedPracticeLabel")}: {opp.recommendedPractice}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {devnovateUrl && (
        <section className="info-card" style={{ marginTop: "16px" }}>
          <h2>Devnovate Portfolio Link-Out</h2>
          <p className="fineprint">Optional external portfolio and opportunity link.</p>
          <a href={devnovateUrl} target="_blank" rel="noopener noreferrer" className="secondary link-button">
            Open Devnovate Profile
          </a>
        </section>
      )}

      <p className="fineprint basis">{t("humanAgencyNotice")}</p>
    </main>
  );
}
