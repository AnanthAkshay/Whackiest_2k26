/**
 * Pre-generate cached audio for fixed greeting and closing lines.
 *
 * Usage:
 *   MOCK_MODE=1 npx tsx src/generateAudioCache.ts          # writes placeholder files
 *   ELEVENLABS_API_KEY=... npx tsx src/generateAudioCache.ts # calls ElevenLabs TTS
 *
 * Fixed texts come from services/mockAgent.ts.
 */

import { config } from "./config";
import { openingPrompt } from "./services/mockAgent";
import { writeAudioCache } from "./services/audioCache";
import type { Language } from "./types";

const languages: Language[] = ["en", "hi", "kn"];

const closingTexts: Record<Language, string> = {
  en: "Thank you. I have asked my five practice questions. Goodbye.",
  hi: "धन्यवाद। मैंने अपने पाँच अभ्यास वाले सवाल पूछ लिए हैं। अलविदा।",
  kn: "ಧನ್ಯವಾದಗಳು. ನನ್ನ ಐದು ಅಭ್ಯಾಸ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿದ್ದೇನೆ. ವಿದಾಯ."
};

async function generateWithElevenLabs(text: string): Promise<Buffer> {
  const url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"; // default voice
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.elevenLabsApiKey!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.5 }
    })
  });
  if (!response.ok) throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function silentMp3Placeholder(): Buffer {
  // Minimal valid MP3 frame (silent, ~26ms) — enough for the app to detect the file
  return Buffer.from(
    "//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
    "base64"
  );
}

async function main(): Promise<void> {
  const useElevenLabs = !config.mockMode && config.elevenLabsApiKey;
  console.log(useElevenLabs ? "Generating audio with ElevenLabs TTS..." : "Writing placeholder audio files (mock mode)...");

  for (const language of languages) {
    const greetingText = openingPrompt(language);
    const closingText = closingTexts[language];

    const greetingData = useElevenLabs
      ? await generateWithElevenLabs(greetingText)
      : silentMp3Placeholder();
    const greetingPath = await writeAudioCache(language, "greeting", greetingData);
    console.log(`  ${language}-greeting → ${greetingPath}`);

    const closingData = useElevenLabs
      ? await generateWithElevenLabs(closingText)
      : silentMp3Placeholder();
    const closingPath = await writeAudioCache(language, "closing", closingData);
    console.log(`  ${language}-closing  → ${closingPath}`);
  }

  console.log("Audio cache generation complete.");
}

main().catch((error) => { console.error(error); process.exit(1); });
