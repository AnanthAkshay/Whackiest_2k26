import type { Session, SkillRecord } from "../types";

export interface Store {
  createSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listSessions(): Promise<Session[]>;
  saveCredential(record: SkillRecord): Promise<void>;
  getCredential(pageId: string): Promise<SkillRecord | undefined>;
  deleteCredential(pageId: string): Promise<void>;
}
