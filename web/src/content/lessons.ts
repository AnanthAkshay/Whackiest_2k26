import lessonsBundle from "../../public/content/lessons.json";
import type { Language } from "../types";

export interface CuratedLesson {
  id: string;
  topic: string;
  minutes: number;
  title: Record<Language, string>;
  summary: Record<Language, string>;
  example: string;
  needsNativeReview: boolean;
}

export interface PracticeDrillOption {
  id: string;
  label: string;
}

export interface FormativePracticeDrill {
  id: string;
  title: Record<Language, string>;
  prompt: Record<Language, string>;
  options: PracticeDrillOption[];
  correctOptionId: string;
  explanation: Record<Language, string>;
}

export interface CuratedContentBundle {
  version: string;
  roleId: string;
  sourceNote: string;
  lessons: CuratedLesson[];
  practiceDrills: FormativePracticeDrill[];
}

export const DEFAULT_CONTENT_BUNDLE = lessonsBundle as CuratedContentBundle;

export async function loadCuratedContent(): Promise<CuratedContentBundle> {
  if (typeof fetch !== "function") return DEFAULT_CONTENT_BUNDLE;
  try {
    const response = await fetch("/content/lessons.json");
    if (!response.ok) return DEFAULT_CONTENT_BUNDLE;
    return (await response.json()) as CuratedContentBundle;
  } catch {
    return DEFAULT_CONTENT_BUNDLE;
  }
}
