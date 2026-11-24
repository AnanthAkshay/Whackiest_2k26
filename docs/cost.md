# Cost Tracking and Caching

This document explains how Viva Teach-Back tracks costs, enforces per-session
caps, and caches fixed audio to keep costs low.

## Cost sources

| Service | What is billed | Unit |
|---------|----------------|------|
| **ElevenLabs Conversational AI** | Active conversation time | seconds |
| **AWS Bedrock (Claude 3.5 Sonnet v2)** | Input tokens + output tokens per evaluator call | tokens |

Pricing constants live in [`/api/src/pricing.ts`](../api/src/pricing.ts).
All prices are stored in **INR** using a single `USD_INR` exchange-rate
constant you can edit when the rate changes.

## Per-session cost tracker

Every `Session` carries a `costTracker` object:

```json
{
  "elevenLabsSeconds": 285,
  "bedrockInputTokens": 4800,
  "bedrockOutputTokens": 2100,
  "estimatedCostInr": 3.72
}
```

- **ElevenLabs seconds** are estimated from the session wall-clock duration
  when `voiceMode === "elevenlabs"`.
- **Bedrock tokens** are summed from every `evaluateTurn` and `finalScore`
  call. The Bedrock Converse API returns `usage.inputTokens` and
  `usage.outputTokens` in every response.
- **estimatedCostInr** is recomputed after each turn and after the final
  scoring call.

The tracker is saved in the session record so it survives restarts.

## Admin costs endpoint

```
GET /api/admin/costs
Header: X-Admin-Key: <your ADMIN_KEY>
```

Returns the **average and per-session costs** for all completed sessions.
Set `ADMIN_KEY` in your environment; requests without a matching key get a
401.

## Per-session cost cap

`GET /api/config` returns `maxSessionDurationSeconds`, computed as:

```
maxSeconds = min(MAX_SESSION_DURATION_SECONDS, COST_CAP_INR / estimatedCostPerSecond)
```

- `MAX_SESSION_DURATION_SECONDS` defaults to 600 (10 min).
- `COST_CAP_INR` defaults to ₹25. Set to 0 to disable the cap.
- `estimatedCostPerSecond` is a constant in `pricing.ts` that combines
  ElevenLabs per-second rate and an average Bedrock rate (~2 scorer calls
  per minute).

The frontend enforces the cap:
1. At **80 %** elapsed, a warning banner appears.
2. At **100 %**, a graceful goodbye message is shown and the session
   auto-finishes.

## What is cached (FR-33)

Fixed greeting and closing lines are identical across all sessions in the
same language. Instead of generating them live (which costs ElevenLabs
conversation seconds), we pre-generate them once.

### Cached audio files

| Language | Key | Text |
|----------|-----|------|
| en | greeting | First practice question (opening prompt) |
| en | closing | "Thank you. I have asked my five practice questions. Goodbye." |
| hi | greeting | First practice question in Hindi |
| hi | closing | Hindi closing |
| kn | greeting | First practice question in Kannada |
| kn | closing | Kannada closing |

### How to generate

```bash
# Mock mode — writes silent placeholder files to web/public/audio/
cd api
MOCK_MODE=1 npx tsx src/generateAudioCache.ts

# Production — calls ElevenLabs TTS, uploads to S3
MOCK_MODE=0 ELEVENLABS_API_KEY=... AWS_S3_BUCKET=... npx tsx src/generateAudioCache.ts
```

Storage:
- **Mock mode**: `web/public/audio/{lang}-{greeting|closing}.mp3`
- **Production**: S3 at `audio/{lang}-{greeting|closing}.mp3`, served via
  CloudFront.

### Evaluator call efficiency

Scorer calls are kept cheap by:
1. **Short context**: `evaluateTurn` sends only the last 6 transcript turns
   (not the full transcript) plus the rubric criteria.
2. **Small max tokens**: `evaluateTurn` uses `maxTokens: 800` and
   `finalScore` uses `maxTokens: 1500`.
3. **Temperature 0**: deterministic output, no wasted tokens on variation.
4. **JSON-only output**: no Markdown preamble overhead.

## How to measure real average cost per session

1. Run several sessions (at least 10 for a reliable average).
2. Call `GET /api/admin/costs` with the admin key.
3. Compare `averageCostInr` against your `COST_CAP_INR`.
4. Cross-check with your ElevenLabs dashboard (Usage → Conversation minutes)
   and AWS Cost Explorer (Bedrock → InvokeModel charges).
5. Adjust `USD_INR`, the per-token prices, or `COST_CAP_INR` in
   `pricing.ts` / `.env` as needed.
