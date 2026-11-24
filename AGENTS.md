# Viva Teach-Back repository rules

- Build a mobile-first UI: design for a 360px-wide viewport first.
- There is no login and no typing in the main candidate flow.
- List every environment variable in `.env.example`; never commit environment files containing values.
- `MOCK_MODE=1` must run the whole app locally without AWS or ElevenLabs keys, using a local JSON-file store, stub scorer, and fake voice agent.
- Keep modules small and strongly typed.
- After each task, run typecheck and the app, then report what works and what does not.
- Do not add features that were not requested.
- Do not ask the user questions; state assumptions in the final message.
- HONESTY RULE: there is no trainer. The Excel rubric is built from public sources (Microsoft's MO-200 skills outline and Microsoft Support help pages). It is not trainer-verified and not an official Microsoft rubric. Never write "trainer-verified", "validated", "certified", or any agreement percentage in the UI, Skill Page, docs, or reports.
- The `rubricBasis` i18n key must exist in English, Hindi, and Kannada: "Rubric built from public sources (Microsoft MO-200 skills outline). Trainer co-sign planned in the pilot."
- On a Skill Page, a record-match badge means only that the page matches our stored record. Its wording is exactly: "Record matches our database".
