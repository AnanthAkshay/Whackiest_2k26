import { config } from "../config";
import type { Store } from "./Store";
import { DynamoStore } from "./DynamoStore";
import { LocalFileStore } from "./LocalFileStore";

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;
  store = config.mockMode
    ? new LocalFileStore(config.localDataDirectory)
    : new DynamoStore(config.sessionsTable!, config.credentialsTable!, config.awsRegion!);
  return store;
}
