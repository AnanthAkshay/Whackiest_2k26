import { ConversationProvider, type MessagePayload, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishSession, getConfig, sendTurn, startSession, type VoiceConnection } from "../api";
import { localeTags, useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import { Badge, Button, IconMessage, IconMic, IconSend, IconSheet, IconVolume, Sheet } from "../shared/ui";
import type { Language, Session, SkillRecord, TranscriptTurn } from "../types";
import { listenOnce, speak } from "../voice";

const languageKeys = { en: "languageEnglish", hi: "languageHindi", kn: "languageKannada" } as const;
type FallbackReason = "connection" | "microphone";
type OrbState = "idle" | "listening" | "speaking" | "thinking";

const DEFAULT_FACTSHEET_CELLS = [
  { ref: "Sheet1!A1:F1", desc: "Column headers: Date, Region, SKU, Qty, UnitPrice, Total" },
  { ref: "Sheet1!D2:D48", desc: "Cleaned quantity values & removed blank/duplicate rows" },
  { ref: "Sheet1!F2:F48", desc: "Formula consistency: =D2*E2 across all sales rows" },
  { ref: "Summary!B2:B6", desc: "Regional totals computed with SUM / SUMIF" }
];

function isAgentGoodbye(text: string): boolean {
  return /(?:\bgoodbye\b|\bbye\b|अलविदा|फिर मिलेंगे|ವಿದಾಯ|ಮತ್ತೆ ಭೇಟಿಯಾಗೋಣ)/i.test(text);
}

function timeLabel(value: string, language: Language): string {
  return new Intl.DateTimeFormat(localeTags[language], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function SessionPage(): JSX.Element {
  return <ConversationProvider><SessionExperience /></ConversationProvider>;
}

function SessionExperience(): JSX.Element {
  const { skill, language, level, inputMode, chooseInputMode, validationReport } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";

  const [session, setSession] = useState<Session>();
  const [voice, setVoice] = useState<VoiceConnection>();
  const [agentText, setAgentText] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [partialCandidateText, setPartialCandidateText] = useState("");
  const [textFallbackOpen, setTextFallbackOpen] = useState(inputMode === "text");
  const [statusNote, setStatusNote] = useState("");
  const [fallbackReason, setFallbackReason] = useState<FallbackReason>();
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecordingMock, setIsRecordingMock] = useState(false);
  const [editingTurnIdx, setEditingTurnIdx] = useState<number | null>(null);
  const [editTurnDraft, setEditTurnDraft] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number>();
  const [durationWarning, setDurationWarning] = useState(false);
  const [agentSaidGoodbye, setAgentSaidGoodbye] = useState(false);
  const [factSheetOpen, setFactSheetOpen] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  const startedRef = useRef(false);
  const endRequestedRef = useRef(false);
  const endingRef = useRef(false);
  const sessionIdRef = useRef<string>();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seenMessageIds = useRef(new Set<number>());
  const pendingTypedMessages = useRef(new Set<string>());

  const moveToTextFallback = useCallback((reason: FallbackReason) => {
    setFallbackReason(reason);
    setTextFallbackOpen(true);
    chooseInputMode("text");
  }, [chooseInputMode]);

  const saveLiveTurn = useCallback((turn: TranscriptTurn) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || isDemo) return;
    void sendTurn(sessionId, turn.text, turn.speaker).then((next) => {
      setSession((current) => current ? { ...current, understanding: next.session.understanding, stalled: next.session.stalled ?? false, updatedAt: next.session.updatedAt, meterTrace: next.session.meterTrace ?? current.meterTrace } : next.session);
    }).catch(() => setStatusNote(t("couldNotSave")));
  }, [isDemo, t]);

  const addLiveTurn = useCallback((turn: TranscriptTurn) => {
    setTranscript((current) => [...current, turn]);
    saveLiveTurn(turn);
  }, [saveLiveTurn]);

  const onProviderMessage = useCallback((message: MessagePayload) => {
    if (seenMessageIds.current.has(message.event_id) || !message.message.trim()) return;
    seenMessageIds.current.add(message.event_id);
    if (message.role === "user" && pendingTypedMessages.current.delete(message.message)) return;
    const turn: TranscriptTurn = {
      speaker: message.role === "agent" ? "agent" : "candidate",
      text: message.message,
      createdAt: new Date().toISOString()
    };
    if (turn.speaker === "candidate") setPartialCandidateText("");
    if (turn.speaker === "agent") {
      setAgentText(turn.text);
      setIsThinking(false);
      if (isAgentGoodbye(turn.text)) setAgentSaidGoodbye(true);
    }
    addLiveTurn(turn);
  }, [addLiveTurn]);

  const conversation = useConversation({
    onConnect: () => setStatusNote(""),
    onError: (message) => {
      if (endRequestedRef.current) return;
      const microphoneProblem = /microphone|audio input|media device|notallowed|permission/i.test(message);
      moveToTextFallback(microphoneProblem ? "microphone" : "connection");
    },
    onDisconnect: (details) => {
      if (!endRequestedRef.current && details.reason === "error") moveToTextFallback("connection");
    },
    onMessage: onProviderMessage
  });

  useEffect(() => { sessionIdRef.current = session?.id; }, [session?.id]);

  useEffect(() => {
    if (!session?.startedAt || isDemo) return;
    const startedAt = Date.parse(session.startedAt);
    const updateTimer = (): void => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [isDemo, session?.startedAt]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [partialCandidateText, transcript, isThinking]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    if (isDemo) {
      void (async () => {
        try {
          const resp = await fetch("/demo/session.json");
          const demoData = await resp.json() as {
            session: Session;
            record: SkillRecord;
            timings: { turnIndex: number; offsetMs: number }[];
          };
          if (cancelled) return;

          const fullTranscript = demoData.session.transcript;
          const fullMeter = demoData.session.meterTrace;
          sessionIdRef.current = demoData.session.id;

          setSession({
            ...demoData.session,
            understanding: 0,
            transcript: [],
            meterTrace: [{ turnIndex: 0, value: 0 }]
          });
          setVoice({
            mode: "mock",
            dynamicVariables: {},
            languageOverride: demoData.session.language
          });

          let turnIdx = 0;
          const interval = window.setInterval(() => {
            if (cancelled || endingRef.current) {
              window.clearInterval(interval);
              return;
            }
            if (turnIdx >= fullTranscript.length) {
              window.clearInterval(interval);
              setAgentSaidGoodbye(true);
              return;
            }
            const currentTurn = fullTranscript[turnIdx];
            const partialTranscript = fullTranscript.slice(0, turnIdx + 1);
            setTranscript(partialTranscript);

            if (currentTurn.speaker === "agent") {
              setAgentText(currentTurn.text);
              if (isAgentGoodbye(currentTurn.text)) setAgentSaidGoodbye(true);
            } else {
              const candCount = partialTranscript.filter((item) => item.speaker === "candidate").length;
              const traceItem = fullMeter.find((m) => m.turnIndex === candCount) ?? fullMeter[fullMeter.length - 1];
              if (traceItem) {
                setSession((curr) => curr ? {
                  ...curr,
                  understanding: traceItem.value,
                  meterTrace: fullMeter.slice(0, candCount + 1)
                } : curr);
              }
            }
            setElapsedSeconds((sec) => sec + 2);
            turnIdx++;
          }, 2200);

          return () => window.clearInterval(interval);
        } catch {
          if (!cancelled) setStatusNote(t("couldNotStart"));
        }
      })();
      return () => { cancelled = true; };
    }

    if (!skill || !level) {
      navigate("/setup-viva", { replace: true });
      return;
    }

    void (async () => {
      try {
        const [started, publicConfig] = await Promise.all([
          startSession(skill.skill, language, level),
          getConfig().catch(() => undefined)
        ]);
        if (cancelled) return;
        setSession(started.session);
        setVoice(started.voice);
        setTranscript(started.session.transcript);
        setAgentText(started.agentText ?? "");
        setMaxDurationSeconds(publicConfig?.maxSessionDurationSeconds ?? 600);
        sessionIdRef.current = started.session.id;
        if (started.voice.mode === "elevenlabs") {
          if (!started.voice.signedUrl) {
            moveToTextFallback("connection");
            return;
          }
          setStatusNote(t("sessionConnecting"));
          conversation.startSession({
            signedUrl: started.voice.signedUrl,
            dynamicVariables: started.voice.dynamicVariables,
            overrides: { agent: { language: started.voice.languageOverride } },
            ...(inputMode === "text" ? { textOnly: true } : {})
          });
        }
      } catch {
        setStatusNote(t("couldNotStart"));
      }
    })();
    return () => { cancelled = true; };
  }, [conversation, inputMode, isDemo, language, level, moveToTextFallback, navigate, skill, t]);

  useEffect(() => {
    if (voice?.mode !== "mock" || !agentText || isDemo) return;
    speak(agentText, language);
  }, [agentText, isDemo, language, voice?.mode]);

  useEffect(() => {
    if (voice?.mode !== "elevenlabs" || inputMode !== "voice" || !navigator.mediaDevices || isDemo) return;
    const onDeviceChange = (): void => {
      if (conversation.status === "connected") moveToTextFallback("microphone");
    };
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
  }, [conversation.status, inputMode, isDemo, moveToTextFallback, voice?.mode]);

  useEffect(() => {
    if (!session || !maxDurationSeconds || endingRef.current || isDemo) return;
    if (elapsedSeconds >= Math.ceil(maxDurationSeconds * 0.8)) setDurationWarning(true);
    if (elapsedSeconds >= maxDurationSeconds) {
      setStatusNote(t("capReached"));
      void finish();
    }
  }, [elapsedSeconds, isDemo, maxDurationSeconds, session]);

  useEffect(() => {
    if (agentSaidGoodbye && !endingRef.current) void finish();
  }, [agentSaidGoodbye, session]);

  async function submitMockTurn(text: string): Promise<void> {
    if (!session || !text.trim()) return;
    setIsThinking(true);
    setStatusNote(t("sending"));
    try {
      const next = await sendTurn(session.id, text);
      setSession(next.session);
      setTranscript(next.session.transcript);
      setPartialCandidateText("");
      setAgentText(next.agentText ?? "");
      if (next.agentText && isAgentGoodbye(next.agentText)) setAgentSaidGoodbye(true);
      setDraft("");
      setStatusNote("");
    } catch {
      setStatusNote(t("couldNotSave"));
    } finally {
      setIsThinking(false);
    }
  }

  function saveTypedTurn(text: string): void {
    const turn: TranscriptTurn = { speaker: "candidate", text, createdAt: new Date().toISOString() };
    addLiveTurn(turn);
  }

  async function submitText(text: string): Promise<void> {
    if (!session || !text.trim()) return;
    if (session.voiceMode === "mock") return submitMockTurn(text);
    const cleanText = text.trim();
    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setIsThinking(true);
    saveTypedTurn(cleanText);
    if (conversation.status === "connected") {
      pendingTypedMessages.current.add(cleanText);
      conversation.sendUserMessage(cleanText);
    }
  }

  async function finish(): Promise<void> {
    if (!session || endingRef.current) return;
    endingRef.current = true;
    endRequestedRef.current = true;
    setEndConfirmOpen(false);
    if (isDemo) {
      navigate("/results/" + (session.id || "demo") + "?demo=1");
      return;
    }
    if (voice?.mode === "elevenlabs") conversation.endSession();
    setStatusNote(t("scoring"));
    try {
      const record = await finishSession(session.id);
      navigate("/results/" + record.id);
    } catch {
      endingRef.current = false;
      setStatusNote(t("couldNotFinish"));
    }
  }

  function handleMockSpeak(): void {
    setIsRecordingMock(true);
    listenOnce(
      language,
      (text) => {
        setIsRecordingMock(false);
        setPartialCandidateText("");
        void submitMockTurn(text);
      },
      () => {
        setIsRecordingMock(false);
        setStatusNote(t("speechUnavailable"));
        moveToTextFallback("microphone");
      },
      setPartialCandidateText
    );
  }

  function handleDraftChange(val: string): void {
    setDraft(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
    if (voice?.mode === "elevenlabs" && conversation.status === "connected") {
      conversation.sendUserActivity();
    }
  }

  const showTextEntry = textFallbackOpen || inputMode === "text" || Boolean(fallbackReason);
  const showMockSpeech = session?.voiceMode === "mock" && !showTextEntry && !isDemo;

  const orbState: OrbState = isThinking
    ? "thinking"
    : voice?.mode === "elevenlabs"
    ? conversation.isSpeaking
      ? "speaking"
      : conversation.isListening
      ? "listening"
      : "idle"
    : isRecordingMock
    ? "listening"
    : "idle";

  const orbStateLabel =
    orbState === "speaking"
      ? t("agentSpeaking")
      : orbState === "listening"
      ? t("agentListening")
      : orbState === "thinking"
      ? "Thinking…"
      : t("agentReady");

  const time = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0") + ":" + String(elapsedSeconds % 60).padStart(2, "0");
  const durationTime = maxDurationSeconds === undefined ? "" : String(Math.floor(maxDurationSeconds / 60)).padStart(2, "0") + ":" + String(maxDurationSeconds % 60).padStart(2, "0");

  // Thin violet arc math for provisional confidence meter
  const confidenceVal = Math.max(0, Math.min(100, session?.understanding ?? 0));
  const arcRadius = 46;
  const arcCircumference = Math.PI * arcRadius;
  const arcOffset = arcCircumference - (confidenceVal / 100) * arcCircumference;

  const factSheetCells = validationReport?.checks.length
    ? validationReport.checks.map((c) => ({ ref: c.title, desc: c.detail }))
    : DEFAULT_FACTSHEET_CELLS;

  if (!session) {
    return (
      <main className="shell">
        <p className="loading">{statusNote || t("sessionStarting")}</p>
      </main>
    );
  }

  return (
    <main className="shell viva-shell">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {orbStateLabel}
        {showTextEntry ? " — Text chat mode active" : ""}
      </div>

      <div className="viva-topbar-meta">
        <div className="viva-badges">
          {isDemo && <Badge tone="lavender">{t("replayBadge")}</Badge>}
          <Badge tone="lavender">{t(languageKeys[session.language ?? language])}</Badge>
          <Badge tone="review">{t("onlineOnlyBadge")}</Badge>
          <button
            type="button"
            className="grounded-chip"
            onClick={() => setFactSheetOpen(true)}
          >
            <IconSheet size={13} />
            <span>Grounded in your file</span>
          </button>
        </div>
        <span className="session-time mono">{time}</span>
      </div>

      {durationWarning && (
        <p className="duration-warning" role="status">
          {t("durationWarning", { time: durationTime })}
        </p>
      )}

      {!showTextEntry ? (
        /* VOICE EXPERIENCE */
        <section className="viva-voice-stage" aria-label={t("sessionTitle")}>
          <div className="viva-confidence-arc-wrap" aria-label={`Confidence ${confidenceVal}%, Provisional, not final`}>
            <svg viewBox="0 0 110 62" className="viva-confidence-arc-svg" aria-hidden="true">
              <path
                d="M 9 54 A 46 46 0 0 1 101 54"
                fill="none"
                stroke="var(--line)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 9 54 A 46 46 0 0 1 101 54"
                fill="none"
                stroke="var(--violet)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={arcCircumference}
                strokeDashoffset={arcOffset}
                className="viva-confidence-arc-fill"
              />
            </svg>
            <div className="viva-confidence-meta">
              <strong>{confidenceVal}%</strong>
              <span>Provisional, not final</span>
            </div>
          </div>

          {agentText && (
            <div className="viva-question-wrap">
              <h1 className="viva-question-serif">{agentText}</h1>
              <button
                type="button"
                className="viva-repeat-btn"
                onClick={() => speak(agentText, session.language ?? language)}
                aria-label={t("repeatQuestion")}
                title={t("repeatQuestion")}
              >
                <IconVolume size={16} />
                <span>{t("repeatQuestion")}</span>
              </button>
            </div>
          )}

          <div className="viva-orb-stage">
            <div className={`viva-orb viva-orb--${orbState}`} aria-hidden="true">
              <span className="viva-orb-ripple" />
              <span className="viva-orb-conic" />
              <span className="viva-orb-core" />
            </div>
            <span className={`viva-orb-state-pill viva-orb-state--${orbState}`}>
              {orbStateLabel}
            </span>
          </div>

          <section className="viva-glass-transcript" aria-labelledby="transcript-heading">
            <div className="viva-glass-header">
              <h2 id="transcript-heading">{t("whatHeard")}</h2>
              {!isDemo && voice?.mode === "mock" && <span className="fineprint">{t("mockSession")}</span>}
            </div>
            <div className="viva-glass-scroll" id="session-transcript">
              {transcript.map((turn, index) => (
                <p
                  key={turn.createdAt + "-" + index}
                  className={"viva-glass-line " + (turn.speaker === "candidate" ? "is-candidate" : "is-agent")}
                >
                  <strong>{turn.speaker === "agent" ? t("beginner") : t("you")}: </strong>
                  <span>{turn.text}</span>
                </p>
              ))}
              {partialCandidateText && (
                <p className="viva-glass-line is-candidate">
                  <strong>{t("you")}: </strong>
                  <span>{partialCandidateText}</span>
                </p>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </section>

          <div className="viva-voice-controls">
            {showMockSpeech && (
              <Button
                variant="primary"
                size="lg"
                className="viva-mic-pill"
                onMouseDown={handleMockSpeak}
                onClick={handleMockSpeak}
              >
                <IconMic size={20} />
                <span>{isRecordingMock ? t("agentListening") : t("speakExplanation")}</span>
              </Button>
            )}

            {isDemo && (
              <Button variant="secondary" onClick={() => void finish()}>
                {t("skipToResults")}
              </Button>
            )}

            <div className="viva-secondary-controls">
              {!isDemo && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTextFallbackOpen(true);
                    chooseInputMode("text");
                  }}
                >
                  <IconMessage size={16} />
                  <span>Switch to text</span>
                </Button>
              )}

              <Button variant="ghost" onClick={() => setEndConfirmOpen(true)}>
                {t("endSession")}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        /* TEXT CHAT EXPERIENCE */
        <section className="viva-chat-stage" aria-label={t("sessionTitle")}>
          {fallbackReason && (
            <p className="voice-fallback" role="alert">
              {fallbackReason === "microphone" ? t("microphoneLost") : t("connectionFailed")}
            </p>
          )}

          <div className="viva-chat-scroll" id="session-transcript">
            {transcript.map((turn, index) => (
              <article
                key={turn.createdAt + "-" + index}
                className={"chat-bubble " + (turn.speaker === "agent" ? "chat-bubble--agent" : "chat-bubble--candidate")}
              >
                <strong className="chat-bubble-author">
                  {turn.speaker === "agent" ? t("beginner") : t("you")}
                </strong>
                {editingTurnIdx === index ? (
                  <div className="transcript-edit-box">
                    <textarea
                      value={editTurnDraft}
                      onChange={(e) => setEditTurnDraft(e.target.value)}
                      aria-label={t("correctTranscript")}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const cleaned = editTurnDraft.trim();
                        if (cleaned) {
                          setTranscript((curr) => curr.map((item, idx) => (idx === index ? { ...item, text: cleaned } : item)));
                          void submitText(cleaned);
                        }
                        setEditingTurnIdx(null);
                      }}
                    >
                      {t("saveCorrection")}
                    </Button>
                  </div>
                ) : (
                  <p className="chat-bubble-text">{turn.text}</p>
                )}
                <div className="chat-bubble-footer">
                  <time dateTime={turn.createdAt}>{timeLabel(turn.createdAt, session.language ?? language)}</time>
                  {turn.speaker === "candidate" && !isDemo && editingTurnIdx !== index && (
                    <button
                      type="button"
                      className="chat-correct-btn"
                      onClick={() => {
                        setEditingTurnIdx(index);
                        setEditTurnDraft(turn.text);
                      }}
                    >
                      {t("correctTranscript")}
                    </button>
                  )}
                </div>
              </article>
            ))}

            {isThinking && (
              <div className="chat-bubble chat-bubble--agent typing-bubble" aria-label="Examiner is typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {!isDemo && (
            <div className="chat-composer">
              <textarea
                ref={textareaRef}
                rows={1}
                className="chat-input"
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitText(draft);
                  }
                }}
                placeholder={t("textPlaceholder")}
                aria-label={t("textPlaceholder")}
              />
              <Button
                variant="primary"
                className="chat-send-btn"
                disabled={!draft.trim() || isThinking}
                onClick={() => void submitText(draft)}
                aria-label={t("sendText")}
              >
                <IconSend size={18} />
              </Button>
            </div>
          )}

          <div className="viva-secondary-controls">
            {!isDemo && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTextFallbackOpen(false);
                  setFallbackReason(undefined);
                  chooseInputMode("voice");
                }}
              >
                <IconMic size={16} />
                <span>{t("useVoiceInstead")}</span>
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEndConfirmOpen(true)}>
              {t("endSession")}
            </Button>
          </div>
        </section>
      )}

      {statusNote && <p className="fineprint" role="status">{statusNote}</p>}

      <Sheet
        open={factSheetOpen}
        onClose={() => setFactSheetOpen(false)}
        title="Grounded in your file"
      >
        <p className="fineprint">
          The AI Examiner references these deterministic FactSheet cells from your submitted workbook:
        </p>
        <ul className="factsheet-cell-list">
          {factSheetCells.map((cell) => (
            <li key={cell.ref} className="factsheet-cell-item">
              <code className="mono">{cell.ref}</code>
              <span>{cell.desc}</span>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet
        open={endConfirmOpen}
        onClose={() => setEndConfirmOpen(false)}
        title="End AI Viva session?"
      >
        <p className="fineprint">
          Ending now will score your current responses and generate your ECVE breakdown.
        </p>
        <div className="cta-stack">
          <Button variant="primary" fullWidth onClick={() => void finish()}>
            Finish &amp; score
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setEndConfirmOpen(false)}>
            Keep going
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
