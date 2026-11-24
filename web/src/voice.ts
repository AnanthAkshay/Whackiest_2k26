export interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } };
}

export interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function listenOnce(language: string, onTranscript: (text: string) => void, onUnavailable: () => void, onInterim?: (text: string) => void): void {
  const browserWindow = window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor; SpeechRecognition?: SpeechRecognitionConstructor };
  const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
  if (!Recognition) return onUnavailable();
  const recognition = new Recognition();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.onresult = (event) => {
    const finalText: string[] = [];
    const interimText: string[] = [];
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const text = event.results[index][0].transcript;
      if (event.results[index].isFinal) finalText.push(text);
      else interimText.push(text);
    }
    onInterim?.(interimText.join(" ").trim());
    if (finalText.length > 0) {
      recognition.stop();
      onTranscript(finalText.join(" ").trim());
    }
  };
  recognition.onerror = onUnavailable;
  recognition.start();
}

export function speak(text: string, language: string): void {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
