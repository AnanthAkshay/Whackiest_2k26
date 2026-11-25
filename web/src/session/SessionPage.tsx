import { ConversationProvider, type MessagePayload, useConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { finishSession, getConfig, sendTurn, startSession, type VoiceConnection } from "../api";
import { localeTags, useTranslation } from "../i18n";
import { useSetup } from "../setup/SetupContext";
import type { Language, Session, SkillRecord, TranscriptTurn } from "../types";
import { MeterBar } from "./MeterBar";
import { listenOnce, speak } from "../voice";

const languageKeys = { en: "languageEnglish", hi: "languageHindi", kn: "languageKannada" } as const;
type FallbackReason = "connection" | "microphone";

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
  const { skill, language, level, inputMode, chooseInputMode } = useSetup();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
  const [session, setSession] = useState<Session>();
  const [voice, setVoice] = useState<VoiceConnection>();
  const [agentText, setAgentText] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [partialCandidateText, setPartialCandidateText] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [textFallbackOpen, setTextFallbackOpen] = useState(inputMode === "text");
  const [statusNote, setStatusNote] = useState("");
  const [fallbackReason, setFallbackReason] = useState<FallbackReason>();
  const [draft, setDraft] = useState("");
  const [editingTurnIdx, setEditingTurnIdx] = useState<number | null>(null);
  const [editTurnDraft, setEditTurnDraft] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState<number>();
  const [durationWarning, setDurationWarning] = useState(false);
  const [agentSaidGoodbye, setAgentSaidGoodbye] = useState(false);
  const startedRef = useRef(false);
  const endRequestedRef = useRef(false);
  const endingRef = useRef(false);
  const sessionIdRef = useRef<string>();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
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
    if (transcriptOpen) transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [partialCandidateText, transcript, transcriptOpen]);

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
              const candCount = partialTranscript.filter((t) => t.speaker === "candidate").length;
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
      navigate("/", { replace: true });
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

  const showTextEntry = textFallbackOpen || inputMode === "text" || Boolean(fallbackReason);
  const showMockSpeech = session?.voiceMode === "mock" && inputMode === "voice" && !textFallbackOpen && !isDemo;
  const avatarState = voice?.mode === "elevenlabs"
    ? conversation.isSpeaking ? "speaking" : conversation.isListening ? "listening" : "idle"
    : "listening";
  const time = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0") + ":" + String(elapsedSeconds % 60).padStart(2, "0");
  const durationTime = maxDurationSeconds === undefined ? "" : String(Math.floor(maxDurationSeconds / 60)).padStart(2, "0") + ":" + String(maxDurationSeconds % 60).padStart(2, "0");

  if (!session) return <main className="shell"><p className="loading">{statusNote || t("sessionStarting")}</p></main>;

  return <main className="shell">
    <p className="eyebrow">
      {isDemo && <span className="replay-badge">{t("replayBadge")}</span>}{" "}
      <span className="sample-pill">{t(languageKeys[session.language ?? language])}</span>{" "}
      {t("sessionEyebrow", { skill: session.skill ?? skill?.skill ?? "", language: t(languageKeys[session.language ?? language]) })}
    </p>
    <h1>{t("sessionTitle")}</h1>
    <p className="fineprint"><span className="online-only-pill">{t("onlineOnlyBadge")}</span> {t("onlineOnlyVivaNote")}</p>
    <p className="session-time">{t("elapsedTime", { time })}</p>
    <MeterBar value={session.understanding} stalled={session.stalled ?? false} />
    {durationWarning && <p className="duration-warning" role="status">{t("durationWarning", { time: durationTime })}</p>}
    <section className="agent-card">
      <div className={"agent-orb " + avatarState} aria-hidden="true">?</div>
      <p className="agent-name">{t("beginner")}</p>
      {isDemo && <p className="mode-note">{t("replay")}</p>}
      {!isDemo && voice?.mode === "mock" && <p className="mode-note">{t("mockSession")}</p>}
      {!isDemo && voice?.mode === "elevenlabs" && <p className="mode-note">{avatarState === "speaking" ? t("agentSpeaking") : avatarState === "listening" ? t("agentListening") : t("agentReady")}</p>}
      {agentText && (
        <div className="question-highlight">
          <p>{agentText}</p>
          <button type="button" className="text-button repeat-btn" onClick={() => speak(agentText, session.language ?? language)}>
            {t("repeatQuestion")}
          </button>
        </div>
      )}
      {!isDemo && <button className="secondary type-toggle" aria-pressed={textFallbackOpen} onClick={() => setTextFallbackOpen((open) => !open)}>{textFallbackOpen ? t("useVoiceInstead") : t("typeInstead")}</button>}
      {showMockSpeech && <button className="primary large-button" onClick={() => listenOnce(language, (text) => { setPartialCandidateText(""); void submitMockTurn(text); }, () => { setStatusNote(t("speechUnavailable")); moveToTextFallback("microphone"); }, setPartialCandidateText)}>{t("speakExplanation")}</button>}
      {fallbackReason && <p className="voice-fallback" role="alert">{fallbackReason === "microphone" ? t("microphoneLost") : t("connectionFailed")}</p>}
      {!isDemo && showTextEntry && <div className="text-fallback"><p className="label">{t("textFallback")}</p><textarea value={draft} onChange={(event) => { setDraft(event.target.value); if (voice?.mode === "elevenlabs" && conversation.status === "connected") conversation.sendUserActivity(); }} placeholder={t("textPlaceholder")} /><button className="primary" onClick={() => void submitText(draft)}>{t("sendText")}</button></div>}
      {isDemo && <button className="secondary skip-demo-btn" onClick={() => void finish()}>{t("skipToResults")}</button>}
    </section>
    <section className={"transcript " + (transcriptOpen ? "" : "is-collapsed")} aria-labelledby="transcript-heading">
      <div className="transcript-header"><h2 id="transcript-heading">{t("whatHeard")}</h2><button className="transcript-toggle" aria-expanded={transcriptOpen} aria-controls="session-transcript" onClick={() => setTranscriptOpen((open) => !open)}>{transcriptOpen ? t("hideTranscript") : t("showTranscript")}</button></div>
      {transcriptOpen && <div className="transcript-body" id="session-transcript">
        {transcript.map((turn, index) => (
          <article className={"transcript-bubble " + turn.speaker} key={turn.createdAt + "-" + index}>
            <strong>{turn.speaker === "agent" ? t("beginner") : t("you")}</strong>
            {editingTurnIdx === index ? (
              <div className="transcript-edit-box">
                <textarea
                  value={editTurnDraft}
                  onChange={(e) => setEditTurnDraft(e.target.value)}
                  aria-label={t("correctTranscript")}
                />
                <button
                  type="button"
                  className="secondary"
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
                </button>
              </div>
            ) : (
              <span>{turn.text}</span>
            )}
            <time dateTime={turn.createdAt}>{timeLabel(turn.createdAt, session.language ?? language)}</time>
            {turn.speaker === "candidate" && !isDemo && editingTurnIdx !== index && (
              <button
                type="button"
                className="transcript-correct-btn"
                onClick={() => {
                  setEditingTurnIdx(index);
                  setEditTurnDraft(turn.text);
                }}
              >
                {t("correctTranscript")}
              </button>
            )}
          </article>
        ))}
        {partialCandidateText && <article className="transcript-bubble candidate partial"><strong>{t("you")}</strong><span>{partialCandidateText}</span><em>{t("recognising")}</em></article>}
        <div ref={transcriptEndRef} />
      </div>}
    </section>
    <button className="text-button" onClick={() => void finish()}>{t("endSession")}</button>
    {statusNote && <p className="error" role="status">{statusNote}</p>}
  </main>;
}
