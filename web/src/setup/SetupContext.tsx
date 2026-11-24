import { createContext, useContext, useState, type ReactNode } from "react";
import type { AgentLevel, Language, SkillSummary } from "../types";

type InputMode = "voice" | "text";

interface SetupContextValue {
  skill?: SkillSummary;
  language: Language;
  level?: AgentLevel;
  inputMode: InputMode;
  chooseSkill: (skill: SkillSummary) => void;
  chooseLanguage: (language: Language) => void;
  chooseLevel: (level: AgentLevel) => void;
  chooseInputMode: (inputMode: InputMode) => void;
}

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

export function SetupProvider({ children }: { children: ReactNode }): JSX.Element {
  const [skill, chooseSkill] = useState<SkillSummary>();
  const [language, chooseLanguage] = useState<Language>("en");
  const [level, chooseLevel] = useState<AgentLevel>();
  const [inputMode, chooseInputMode] = useState<InputMode>("voice");

  return <SetupContext.Provider value={{ skill, language, level, inputMode, chooseSkill, chooseLanguage, chooseLevel, chooseInputMode }}>{children}</SetupContext.Provider>;
}

export function useSetup(): SetupContextValue {
  const context = useContext(SetupContext);
  if (!context) throw new Error("useSetup must be used within SetupProvider.");
  return context;
}
