# 3-Minute Demo Script: Prooffolio

> **Product**: Prooffolio  
> **Tagline**: Work. Explain. Verify. Learn. Connect.  
> **Target Duration**: Exactly 3 minutes (180 seconds)  
> **Primary Screen**: Mobile browser (360px viewport or actual smartphone)  
> **Secondary Device**: Second smartphone for verifier check  
> **Mode**: Voice or Text fallback (or `?demo=1` safety replay)

---

## Quick Reference: Core Q&A

**Question from judges / audience**: *"Who checked your rubric?"*  
**Exact Answer**:  
> **"It is built from Microsoft's public MO-200 skills outline; a trainer co-sign is planned for the pilot."**

---

## Act 1: The Problem (0:00 – 0:30 · 30 Seconds)

### What to say
> "Millions of informal learners and vocational workers across India acquire real-world digital skills through YouTube, community centres, or peer practice. Yet when they apply for entry-level jobs, they get screened out. Why? Because conventional hiring demands English resumes and expensive multiple-choice certifications that cost money they do not have.
>
> Multiple-choice tests can be memorised or guessed. But you cannot fake teaching someone. In a viva voce teach-back, if you can guide a beginner step-by-step in your own native language, you prove you actually understand the skill."

### Setup / Screen
- Show phone screen on the home screen at `https://<domain>/` (or localhost in MOCK_MODE).
- The viewport is clean, mobile-first (360px width), with zero login, zero passwords, and zero typing required.

---

## Act 2: Live Teach-Back Session in Kannada / Hindi (0:30 – 2:00 · 90 Seconds)

### Exact Clicks
1. **[0:30] Step 1 - Choose Skill**:
   - Tap **"Microsoft Excel (Basic)"** from the skill list.
2. **[0:35] Step 2 - Choose Language**:
   - Tap **"ಕನ್ನಡ (Kannada)"** (or **"हिन्दी (Hindi)"**).
3. **[0:40] Step 3 - Choose Persona**:
   - Tap **"New to this"** (curious novice student agent).
4. **[0:45] Step 4 - Consent & Mic**:
   - Tap **"I agree & check mic"** (one tap grants audio permission and enters the session).

### Spoken Interaction (Kannada Flow)
*50 seconds of live conversational back-and-forth:*

- **[0:50] Student Agent (Spoken Voice & Live Transcript)**:
  > *"ನಮಸ್ಕಾರ! ನಾನು ಹೊಸದಾಗಿ Excel ಕಲಿಯುತ್ತಿದ್ದೇನೆ. ನನಗೆ A1 ಇಂದ A10 ವರೆಗಿನ ಸಂಖ್ಯೆಗಳನ್ನು ಹೇಗೆ ಕೂಡಿಸುವುದು (Total ಮಾಡುವುದು) ಎಂದು ಹೇಳಿಕೊಡುತ್ತೀರಾ?"*  
  > *(Live transcript immediately displays the prompt on screen.)*

- **[1:05] Presenter (Speaking naturally as Candidate)**:
  > *"ಖಂಡಿತ. ಮೊದಲು ನೀವು ಮೊತ್ತ ಬರಬೇಕಾದ ಸೆಲ್ B1 ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ. ನಂತರ ಕೀಬೋರ್ಡ್‌ನಲ್ಲಿ `=SUM(A1:A10)` ಎಂದು ಟೈಪ್ ಮಾಡಿ ಎಂಟರ್ ಒತ್ತಿ. ಅದು ಎಲ್ಲಾ ಸಂಖ್ಯೆಗಳನ್ನು ಒಟ್ಟುಗೂಡಿಸುತ್ತದೆ."*

- **[1:20] The Understanding Meter Reacts**:
  - Point to the **Understanding Meter** at the top of the mobile screen.
  - The bar smoothly climbs from **0% to 55%** in real-time.
  - *Audience takeaway*: The meter is not a timer; it reflects semantic rubric coverage evaluated turn-by-turn.

- **[1:30] AI Examiner (Adaptive Follow-up Probe)**:
  > *"ಆಯ್ತು, ಅರ್ಥವಾಯಿತು. ಒಂದು ವೇಳೆ ನಾನು ಈ ಫಾರ್ಮುಲಾವನ್ನು ಪಕ್ಕದ ಕಾಲಮ್‌ಗೆ ಕಾಪಿ ಮಾಡಿದರೆ ಏನಾಗುತ್ತದೆ? ಸೆಲ್ ಅಡ್ರೆಸ್ ಬದಲಾಗುತ್ತದೆಯೇ?"*

- **[1:45] Presenter (Explaining Relative vs Absolute References)**:
  > *"ಹೌದು, Excel ನಲ್ಲಿ ಸಾಧಾರಣವಾಗಿ ಸೆಲ್ ರೆಫರೆನ್ಸ್ ರಿಲೇಟಿವ್ ಆಗಿರುತ್ತದೆ, ಹಾಗಾಗಿ ಪಕ್ಕದ ಕಾಲಮ್‌ಗೆ ಕಾಪಿ ಮಾಡಿದಾಗ ಅದು B1:B10 ಆಗುತ್ತದೆ. ಫಿಕ್ಸ್ ಮಾಡಬೇಕಿದ್ದರೆ `$A$1` ತರಹ ಡಾಲರ್ ಚಿಹ್ನೆ ಬಳಸಬೇಕು."*
  - Understanding Meter jumps to **85%**.
  - *(Demo Safety note: If ambient room noise interferes, toggle **Text Mode** or append `?demo=1` to replay the pre-recorded transcript seamlessly.)*

---

## Act 3: Results & Skill Passport on Second Phone (2:00 – 2:30 · 30 Seconds)

### Exact Clicks
1. **[2:00] End Session**:
   - Tap **"Finish and see my passport"**.
2. **[2:05] Results Screen**:
   - Show the candidate score breakdown: **85 / 100**, level: **"Ready to practise"**.
   - Show **"Where to improve"**: targeted tips on data filtering and table headers.
   - Show the rubric disclaimer: *"Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."*
3. **[2:12] Create Credential & Share**:
   - Tap **"Create my Skill Passport"** (generates an unguessable 16-char ID and computes an HMAC-SHA256 seal over the canonical record).
   - Tap **"Share"** -> Tap **"Make Public"** and tap **"Copy Link"**.
4. **[2:20] Open on Second Phone**:
   - Paste URL (`https://<domain>/p/{pageId}`) into the second phone's browser.
   - Point out key architectural features:
     - **Pure Static HTML & Inline CSS**: Loads instantaneously on 2G/3G networks; zero JavaScript required to read the scores.
     - **Verification Badge**: Calls `/api/verify/:pageId` to recompute the cryptographic HMAC seal.
     - **Exact Badge Text**: **"Record matches our database"**. (Honest, factual, non-inflated).

---

## Act 4: Cost Architecture & Pilot Plan (2:30 – 3:00 · 30 Seconds)

### What to say
> "We engineered this for extreme cost efficiency so it can scale to millions of jobseekers:
> 
> 1. **Per-Session Hard Cap**: Every session enforces a strict ₹25 cap. Blended execution cost averages only ₹0.134 per second.
> 2. **Audio Caching**: Greeting and closing lines in English, Hindi, and Kannada are pre-generated with ElevenLabs TTS and served from CDN cache, saving over 30% of voice generation tokens.
> 3. **The Pilot Plan**: Today's rubric is built from public sources (Microsoft's MO-200 skills outline). In our upcoming pilot, we will conduct formal co-signing with accredited vocational trainers and run our 80% agreement separation test against human master trainers before commercial employer rollout."

---

## Checklist for Demo Day

- [ ] Mobile browser open in 360px viewport or live mobile device on Wi-Fi/4G.
- [ ] Second phone on standby with QR code scanner or WhatsApp web open to receive link.
- [ ] Backup fallback ready: if microphone permissions fail, click **"Text Mode"** on step 1; if network fails, reload with `?demo=1` for deterministic playback.
- [ ] Exact answer memorised: *"It is built from Microsoft's public MO-200 skills outline; a trainer co-sign is planned for the pilot."*
