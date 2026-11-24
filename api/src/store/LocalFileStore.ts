import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Session, SkillRecord } from "../types";
import type { Store } from "./Store";

interface LocalDatabase {
  sessions: Record<string, Session>;
  credentials: Record<string, SkillRecord>;
}

const emptyDatabase = (): LocalDatabase => ({ sessions: {}, credentials: {} });

export class LocalFileStore implements Store {
  private readonly filePath: string;

  constructor(directory: string) {
    this.filePath = join(directory, "store.json");
  }

  async createSession(session: Session): Promise<void> {
    const database = await this.read();
    database.sessions[session.id] = session;
    await this.write(database);
  }

  async getSession(id: string): Promise<Session | undefined> {
    return (await this.read()).sessions[id];
  }

  async saveSession(session: Session): Promise<void> {
    const database = await this.read();
    database.sessions[session.id] = session;
    await this.write(database);
  }

  async saveCredential(record: SkillRecord): Promise<void> {
    const database = await this.read();
    database.credentials[record.id] = record;
    await this.write(database);
  }

  async getCredential(pageId: string): Promise<SkillRecord | undefined> {
    return (await this.read()).credentials[pageId];
  }

  async deleteCredential(pageId: string): Promise<void> {
    const database = await this.read();
    delete database.credentials[pageId];
    await this.write(database);
  }

  async deleteSession(id: string): Promise<void> {
    const database = await this.read();
    delete database.sessions[id];
    await this.write(database);
  }

  async listSessions(): Promise<Session[]> {
    return Object.values((await this.read()).sessions);
  }

  private async read(): Promise<LocalDatabase> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as LocalDatabase;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDatabase();
      throw error;
    }
  }

  private async write(database: LocalDatabase): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
  }
}
