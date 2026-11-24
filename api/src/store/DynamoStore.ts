import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { Session, SkillRecord } from "../types";
import type { Store } from "./Store";

export interface DynamoStoreOptions {
  endpoint?: string;
}

export class DynamoStore implements Store {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly sessionsTable: string,
    private readonly credentialsTable: string,
    region: string,
    options: DynamoStoreOptions = {}
  ) {
    const baseClient = new DynamoDBClient({
      region,
      ...(options.endpoint ? { endpoint: options.endpoint } : {})
    });
    this.client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: { removeUndefinedValues: true }
    });
  }

  async createSession(session: Session): Promise<void> {
    await this.putSession(session);
  }

  async getSession(id: string): Promise<Session | undefined> {
    const response = await this.client.send(
      new GetCommand({ TableName: this.sessionsTable, Key: { sessionId: id } })
    );
    return response.Item?.record as Session | undefined;
  }

  async saveSession(session: Session): Promise<void> {
    await this.putSession(session);
  }

  async deleteSession(id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({ TableName: this.sessionsTable, Key: { sessionId: id } })
    );
  }

  async listSessions(): Promise<Session[]> {
    const items: Session[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const response = await this.client.send(
        new ScanCommand({
          TableName: this.sessionsTable,
          ExclusiveStartKey: lastKey
        })
      );
      for (const item of response.Items ?? []) {
        if (item.record) items.push(item.record as Session);
      }
      lastKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);
    return items;
  }

  async saveCredential(record: SkillRecord): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.credentialsTable,
        Item: { pageId: record.id, sessionId: record.sessionId, record }
      })
    );
  }

  async getCredential(pageId: string): Promise<SkillRecord | undefined> {
    const response = await this.client.send(
      new GetCommand({ TableName: this.credentialsTable, Key: { pageId } })
    );
    return response.Item?.record as SkillRecord | undefined;
  }

  async deleteCredential(pageId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({ TableName: this.credentialsTable, Key: { pageId } })
    );
  }

  async getCredentialBySessionId(sessionId: string): Promise<SkillRecord | undefined> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.credentialsTable,
        IndexName: "sessionId-index",
        KeyConditionExpression: "sessionId = :sid",
        ExpressionAttributeValues: { ":sid": sessionId },
        Limit: 1
      })
    );
    const item = response.Items?.[0];
    return item?.record as SkillRecord | undefined;
  }

  private async putSession(session: Session): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.sessionsTable,
        Item: { sessionId: session.id, record: session }
      })
    );
  }
}
