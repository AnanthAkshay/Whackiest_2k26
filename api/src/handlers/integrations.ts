import { config, getIntegrationsStatus } from "../config";
import type { HttpEvent, HttpResponse } from "../types";

export async function getIntegrationsHandler(_event: HttpEvent): Promise<HttpResponse<unknown>> {
  return {
    statusCode: 200,
    body: {
      mockMode: config.mockMode,
      passportPublicDomain: config.passportPublicDomain ?? null,
      integrations: getIntegrationsStatus(config)
    }
  };
}
