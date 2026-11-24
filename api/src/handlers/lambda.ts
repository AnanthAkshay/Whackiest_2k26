import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import type { HttpEvent } from "../types";
import {
  startSessionHandler as _startSession,
  addTurnHandler as _addTurn,
  finishSessionHandler as _finishSession,
  getSessionHandler as _getSession
} from "./sessions";
import { listSkillsHandler as _listSkills } from "./skills";
import { getConfigHandler as _getConfig } from "./config";
import {
  createCredentialHandler as _createCredential,
  getCredentialHandler as _getCredential,
  shareCredentialHandler as _shareCredential,
  deleteCredentialHandler as _deleteCredential
} from "./credential";
import { verifyCredentialHandler as _verifyCredential } from "./verify";
import { getAdminCostsHandler as _getAdminCosts } from "./admin";
import { getHealthHandler as _getHealth } from "./health";

function adaptEvent(event: APIGatewayProxyEventV2): HttpEvent<unknown> {
  return {
    body: event.body ? JSON.parse(event.body) as unknown : undefined,
    pathParameters: event.pathParameters as Record<string, string | undefined> | undefined,
    headers: event.headers as Record<string, string | undefined>
  };
}

function adaptResult(result: { statusCode: number; body: unknown }): APIGatewayProxyResultV2 {
  return {
    statusCode: result.statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.body)
  };
}

type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;

function wrap(handler: (event: HttpEvent<never>) => Promise<{ statusCode: number; body: unknown }>): Handler {
  return async (event) => {
    try {
      return adaptResult(await handler(adaptEvent(event) as HttpEvent<never>));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      return adaptResult({ statusCode: 500, body: { error: message } });
    }
  };
}

export const startSessionHandler: Handler = wrap(_startSession);
export const addTurnHandler: Handler = wrap(_addTurn);
export const finishSessionHandler: Handler = wrap(_finishSession);
export const getSessionHandler: Handler = wrap(_getSession);
export const listSkillsHandler: Handler = wrap(_listSkills);
export const getConfigHandler: Handler = wrap(_getConfig);
export const verifyCredentialHandler: Handler = wrap(_verifyCredential);
export const createCredentialHandler: Handler = wrap(_createCredential);
export const getCredentialHandler: Handler = wrap(_getCredential);
export const shareCredentialHandler: Handler = wrap(_shareCredential);
export const deleteCredentialHandler: Handler = wrap(_deleteCredential);
export const getAdminCostsHandler: Handler = wrap(_getAdminCosts);
export const healthHandler: Handler = wrap(_getHealth);
export const getHealthHandler: Handler = wrap(_getHealth);
