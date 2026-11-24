# Student agent setup

Use this checklist to create the **Student** conversational agent in the ElevenLabs dashboard.

1. Create a conversational agent named `Student`.
2. Paste the contents of [student-agent-prompt.md](student-agent-prompt.md) into its system prompt or equivalent instruction field.
3. Configure the dynamic variables `skill`, `level`, `language`, and `probes` when starting a conversation.
4. Set a first message for each supported language:
   - English: “Hi, I’m new to {{skill}}. Could you teach me the basics?”
   - Hindi: “नमस्ते, मैं {{skill}} में नया हूँ। क्या आप मुझे इसकी बुनियादी बातें सिखा सकते हैं?”
   - Kannada: “ನಮಸ್ಕಾರ, ನಾನು {{skill}} ಗೆ ಹೊಸಬನು. ಅದರ ಮೂಲಭೂತ ವಿಷಯಗಳನ್ನು ನನಗೆ ಕಲಿಸಬಹುದೇ?”
5. Pick a clear, friendly beginner voice for English, Hindi, and Kannada. Confirm that each chosen voice sounds understandable at normal phone-speaker volume.
6. Enable multilingual conversation and enable the language override. Pass the chosen session language through that override.
7. Choose speech-recognition settings that favor clear candidate speech and review the live transcript behavior with each language.
8. Set the maximum conversation duration for the MVP session length.
9. Save the agent and copy its agent ID into the environment file used for deployment.

Dashboard labels and options may change. Adapt these steps to the current ElevenLabs interface while preserving the prompt, language override, and dynamic-variable contract.

## Environment variables

Fill these values only outside version control:

```dotenv
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
```

`MOCK_MODE=1` continues to use the local fake voice-agent path and does not need either value.
