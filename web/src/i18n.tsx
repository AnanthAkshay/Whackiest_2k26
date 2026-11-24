import { useCallback, useEffect } from "react";
import en from "./i18n/en.json";
import hi from "./i18n/hi.json";
import kn from "./i18n/kn.json";
import { useSetup } from "./setup/SetupContext";
import type { Language } from "./types";

type TranslationKey = keyof typeof en;
type Variables = Record<string, string | number>;

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, hi, kn };

export const localeTags: Record<Language, string> = { en: "en-IN", hi: "hi-IN", kn: "kn-IN" };

export function useTranslation(): { t: (key: TranslationKey, variables?: Variables) => string } {
  const { language } = useSetup();
  const dictionary = dictionaries[language];

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const t = useCallback((key: TranslationKey, variables: Variables = {}): string => {
    return dictionary[key].replace(/\{(\w+)\}/g, (_match, variable: string) => String(variables[variable] ?? `{${variable}}`));
  }, [dictionary]);

  return { t };
}
