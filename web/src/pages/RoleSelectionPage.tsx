import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { MVP_ROLES } from "../mock/demoData";
import { useSetup } from "../setup/SetupContext";
import { JourneyNav } from "../shared/JourneyNav";

export function RoleSelectionPage(): JSX.Element {
  const { selectedRoleId, setSelectedRoleId } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="shell">
      <JourneyNav activeStage="role" />

      <p className="eyebrow">{t("roleEyebrow")}</p>
      <h1>{t("roleTitle")}</h1>
      <p className="lede">{t("roleBody")}</p>

      <div className="tap-stack">
        {MVP_ROLES.map((role) => {
          const isSelected = selectedRoleId === role.roleId;
          return (
            <button
              key={role.roleId}
              type="button"
              className={"tap-card role-card" + (isSelected ? " role-card-selected" : "")}
              onClick={() => {
                setSelectedRoleId(role.roleId);
                navigate("/learn");
              }}
            >
              <span className="sample-pill">{role.sector}</span>
              <strong>{role.title}</strong>
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

      <button type="button" className="text-button" onClick={() => navigate("/profile")}>
        {t("back")}
      </button>
    </main>
  );
}
