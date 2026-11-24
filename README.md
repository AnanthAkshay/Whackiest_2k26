# Viva Teach-Back

A mobile-first, voice-led Excel teach-back MVP. A candidate chooses a language, teaches a fake confused beginner by voice, sees an Understanding Meter, then receives a shareable Skill Page.

## Run locally

Requires Node 20 or newer.

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:8787`.

`MOCK_MODE=1` is the default in `.env.example`: it needs no AWS or ElevenLabs key, stores records in `api/.data/store.json`, uses a deterministic local scorer, and uses browser speech APIs plus a fake beginner response. The browser microphone feature needs a supported browser and permission; the text fallback keeps the mock path usable without it.

## Checks

```powershell
npm run typecheck
npm run build
```

## Layout

- `web/` — React + Vite + TypeScript candidate app and Skill Page
- `api/` — Lambda-style TypeScript handlers and local Express wrapper
- `rubrics/` — versioned skill rubric JSON
- `agent/` — ElevenLabs adapter contract
- `infra/` — intended AWS deployment mapping
- `docs/` — implementation notes
- `tests/` — test home for the MVP

The Excel rubric is built from public sources (Microsoft MO-200 skills outline and Microsoft Support help pages). It is not an official Microsoft rubric. See `rubrics/excel.v1.json` for the fixed criteria.
