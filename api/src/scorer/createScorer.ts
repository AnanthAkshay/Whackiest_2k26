import { config } from "../config";
import type { Scorer } from "./Scorer";
import { BedrockScorer } from "./BedrockScorer";
import { MockScorer } from "./MockScorer";

export function createScorer(): Scorer {
  return config.mockMode ? new MockScorer() : new BedrockScorer();
}
