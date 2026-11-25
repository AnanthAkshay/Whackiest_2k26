# Prooffolio Demo Runbook

## 1. Pre-Demo Startup (`MOCK_MODE=1`)
```powershell
# 1. Verify environment has MOCK_MODE=1 (no cloud keys needed)
Copy-Item .env.example .env -ErrorAction SilentlyContinue

# 2. Start API (port 8787) and Web (port 5173)
npm run dev
```
- Open `http://localhost:5173` in Chrome DevTools Mobile View (**360 × 800**).
- Check `http://localhost:5173/health` and `http://localhost:5173/integrations` before presenting.
- For offline-safe replay, use `http://localhost:5173/?demo=1` (pre-seeded fixtures in `web/public/demo/session.json` and `web/public/demo/prooffolio_demo.json`).

---

## 2. Honest Feature & Integration Status Table

| Feature / Service | Current Status (`MOCK_MODE=1`) | Notes |
|---|---|---|
| **Local Store (`LocalFileStore`)** | **Mock** | Persists to `.data/store.json` and `.data/uploads/` |
| **Python Deterministic Validator** | **Live** | Runs locally via `python -m prooffolio_validator.cli` (`openpyxl`, `pandas`) |
| **ECVE Scoring & Outcome Matrix** | **Live** | Deterministic TypeScript arithmetic ($0.60P + 0.25U + 0.15C$) |
| **Ed25519 JWS Signing & JWKS** | **Mock** (Dev Keypair) | Uses `dev-mock-ed25519-v1` in `MOCK_MODE=1`; production uses server-side PEM keys |
| **ElevenLabs Voice AI** | **Mock** | Scripted local voice/text simulator; `Live` only when API key & agent ID exist |
| **Amazon Bedrock (Claude 3.5)** | **Mock** | Deterministic mock scorer; `Live` only when AWS region & model ID configured |
| **AWS DynamoDB / S3 / CloudFront** | **Mock** | Configured in `infra/template.yaml`; not deployed until `sam deploy` |
| **`.xyz` Public Passport Domain** | **Not configured** | Uses `localhost` development URL until domain registration & DNS/ACM setup |
| **tryb Practice Game** | **Not configured** / **Link only** | Renders `"Tryb game link not configured"` unless `VITE_TRYB_PRACTICE_URL` is set |
| **Devnovate Portfolio Link-Out** | **Not configured** / **Link only** | Renders outbound link only when `VITE_DEVNOVATE_URL` is set |
| **AWS Student Builder Group** | **Community Sponsor** | Community/student-builder sponsor; **not** a runtime API or cloud service |

---

## 3. Troubleshooting During Demo
- **Error Boundary Appears**: Click **"Reload application"**; uploaded files in `.data/uploads/` and local progress in IndexedDB/`localStorage` remain preserved.
- **Health Check Shows Validator Unavailable**: Ensure `python` with `openpyxl`, `pandas`, and `pydantic` is on `PATH` (or set `PYTHON_BIN`).
