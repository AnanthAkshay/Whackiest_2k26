import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  AgentLevel,
  ECVEResultUI,
  Language,
  LearnerProfileUI,
  SkillSummary,
  ValidationReportUI
} from "../types";

type InputMode = "voice" | "text";

interface SetupContextValue {
  skill?: SkillSummary;
  language: Language;
  level?: AgentLevel;
  inputMode: InputMode;
  learnerProfile?: LearnerProfileUI;
  selectedRoleId: string;
  validationReport?: ValidationReportUI;
  ecveResult?: ECVEResultUI;
  chooseSkill: (skill: SkillSummary) => void;
  chooseLanguage: (language: Language) => void;
  chooseLevel: (level: AgentLevel) => void;
  chooseInputMode: (inputMode: InputMode) => void;
  setLearnerProfile: (profile: LearnerProfileUI) => void;
  setSelectedRoleId: (roleId: string) => void;
  setValidationReport: (report: ValidationReportUI | undefined) => void;
  setEcveResult: (result: ECVEResultUI | undefined) => void;
}

const defaultSkill: SkillSummary = {
  skill: "excel",
  languages: ["en", "hi", "kn"],
  basisNote: "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot.",
  trainerCoSigned: false
};

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

export function SetupProvider({ children }: { children: ReactNode }): JSX.Element {
  const [skill, chooseSkill] = useState<SkillSummary | undefined>(defaultSkill);
  const [language, chooseLanguage] = useState<Language>("en");
  const [level, chooseLevel] = useState<AgentLevel | undefined>("new");
  const [inputMode, chooseInputMode] = useState<InputMode>("voice");
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfileUI | undefined>();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("data_entry_operator");
  const [validationReport, setValidationReport] = useState<ValidationReportUI | undefined>();
  const [ecveResult, setEcveResult] = useState<ECVEResultUI | undefined>();

  return (
    <SetupContext.Provider
      value={{
        skill,
        language,
        level,
        inputMode,
        learnerProfile,
        selectedRoleId,
        validationReport,
        ecveResult,
        chooseSkill,
        chooseLanguage,
        chooseLevel,
        chooseInputMode,
        setLearnerProfile: (profile) => {
          setLearnerProfile(profile);
          chooseLanguage(profile.preferredLanguage);
        },
        setSelectedRoleId,
        setValidationReport,
        setEcveResult
      }}
    >
      {children}
    </SetupContext.Provider>
  );
}

export function useSetup(): SetupContextValue {
  const context = useContext(SetupContext);
  if (!context) throw new Error("useSetup must be used within SetupProvider.");
  return context;
}
