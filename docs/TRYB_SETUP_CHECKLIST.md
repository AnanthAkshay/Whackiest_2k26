# Tryb Practice Game Integration Checklist

Tryb is an optional external practice-game hand-off in Prooffolio's **Learn & Practise** stage. It is **not** a credential evidence source and does **not** feed scores into the ECVE framework.

## Manual Configuration Steps
1. Obtain the approved Tryb practice activity URL from the partner/program coordinator.
2. Set `VITE_TRYB_PRACTICE_URL` in your `.env` (for local development) or in your CI/hosting build environment variables:
   ```env
   VITE_TRYB_PRACTICE_URL=https://...
   ```
3. Rebuild the web application (`npm run build --workspace web`) so Vite embeds `VITE_TRYB_PRACTICE_URL`.
4. Verify in `/learn` that the **Tryb Practice Drill** card displays the external link and QR code, and that clicking it records only the local `external_link_opened` timestamp.

## Rules & Boundaries
- When `VITE_TRYB_PRACTICE_URL` is unset or empty, Prooffolio renders **"Tryb game link not configured"** with a setup note.
- Do **not** invent a placeholder URL or claim automatic score import or game completion unless a documented partner integration exists.
