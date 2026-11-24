/**
 * Audio cache for fixed greeting and closing lines.
 *
 * In production, pre-generated audio is stored in S3 at audio/{lang}-{key}.mp3.
 * In MOCK_MODE, audio is stored in /web/public/audio/{lang}-{key}.mp3.
 *
 * Run `npm run cache:audio` to generate the audio files.
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "../config";
import type { Language } from "../types";

export type AudioCacheKey = "greeting" | "closing";

/** Returns the public URL for a cached audio file, or undefined if not cached. */
export function cachedAudioUrl(language: Language, key: AudioCacheKey): string | undefined {
  if (config.mockMode) {
    const path = resolve(process.cwd(), "..", "web", "public", "audio", `${language}-${key}.mp3`);
    return existsSync(path) ? `/audio/${language}-${key}.mp3` : undefined;
  }
  // In production, audio files are on CloudFront/S3
  return `${config.corsOrigin}/audio/${language}-${key}.mp3`;
}

/** Save audio data to the cache. */
export async function writeAudioCache(language: Language, key: AudioCacheKey, data: Buffer): Promise<string> {
  if (config.mockMode) {
    const directory = resolve(process.cwd(), "..", "web", "public", "audio");
    await mkdir(directory, { recursive: true });
    const filePath = resolve(directory, `${language}-${key}.mp3`);
    await writeFile(filePath, data);
    return filePath;
  }
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: config.awsRegion });
  const s3Key = `audio/${language}-${key}.mp3`;
  await client.send(new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: s3Key,
    Body: data,
    ContentType: "audio/mpeg"
  }));
  return s3Key;
}
