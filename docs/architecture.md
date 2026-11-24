# MVP architecture

The React client owns only presentation and microphone access. It sends a transcript turn to the API. Lambda-style handlers own the session, Understanding Meter update, rubric lookup, score, and Skill Page record.

In `MOCK_MODE=1`, the same contract runs with a JSON file store, a deterministic scorer, and a fake voice beginner. This lets the end-to-end demo run without cloud or voice-service credentials.
