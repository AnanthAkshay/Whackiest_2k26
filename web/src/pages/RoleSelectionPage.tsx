import { useNavigate } from "react-router-dom";
import { Check } from "@phosphor-icons/react";
import { useTranslation } from "../i18n";
import { MVP_ROLES } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";
import { Button, GlassBadge } from "../shared/ui";

export function RoleSelectionPage(): JSX.Element {
  const { selectedRoleId, setSelectedRoleId } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="shell">
      <div className="pf-frame">
        <JourneyNav activeStage="role" />

        <p className="pf-label">{t("roleEyebrow")}</p>
        <h1 className="pf-page-title" style={{ marginTop: "8px" }}>{t("roleTitle")}</h1>
        <p className="pf-lead" style={{ marginTop: "16px" }}>{t("roleBody")}</p>

        <div className="tap-stack" style={{ marginTop: "24px" }}>
          {MVP_ROLES.map((role) => {
            const isSelected = selectedRoleId === role.roleId;
            return (
              <button
                key={role.roleId}
                type="button"
                className={"tap-card glass-card role-card" + (isSelected ? " role-card-selected" : "")}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedRoleId(role.roleId);
                  navigate("/learn");
                }}
              >
                <div className="role-card-head">
                  <GlassBadge>{role.sector}</GlassBadge>
                  {isSelected && (
                    <span className="role-selected-check" aria-label="Selected">
                      <Check size={16} weight="bold" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <strong style={{ marginTop: "8px" }}>{role.title}</strong>
                <span>{role.description}</span>
                <ul className="mini-skill-list">
                  {role.skills.map((sk) => (
                    <li key={sk}>{sk}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <Button variant="ghost" onClick={() => navigate("/profile")} style={{ marginTop: "16px" }}>
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
