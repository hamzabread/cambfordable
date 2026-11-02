"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";

// The Web Speech API isn't in TypeScript's DOM types yet; this is the part we use.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

// Desktop Chrome doesn't punctuate dictation, so a few spoken marks are converted.
// ("period" and "colon" are left alone: they're physics and biology words.)
const SPOKEN_MARKS: [RegExp, string][] = [
  [/\s*\bquestion mark\b/gi, "?"],
  [/\s*\bexclamation mark\b/gi, "!"],
  [/\s*\bfull stop\b/gi, "."],
  [/\s*\bcomma\b/gi, ","],
  [/\s*\b(new|next) line\b\s*/gi, "\n"],
];

function spokenToText(transcript: string) {
  let text = transcript;
  for (const [pattern, mark] of SPOKEN_MARKS) text = text.replace(pattern, mark);
  return text.trim();
}

/** Adds a dictated phrase to what's already typed, with sensible spacing and capitals. */
export function appendSpoken(current: string, spoken: string) {
  const chunk = spoken.trim();
  if (!chunk) return current;
  const startsSentence = !current.trim() || /[.?!\n]\s*$/.test(current);
  const text = startsSentence ? chunk[0].toUpperCase() + chunk.slice(1) : chunk;
  const separator = !current || /\s$/.test(current) || /^[?!.,]/.test(text) ? "" : " ";
  return current + separator + text;
}

// Support never changes after load; the server renders without the button.
const noSubscription = () => () => {};
const browserSupport = () => Boolean(recognitionConstructor());
const serverSupport = () => false;

const ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it from the address bar and try again.",
  "service-not-allowed": "Microphone access is blocked. Allow it from the address bar and try again.",
  "audio-capture": "No microphone was found.",
  "no-speech": "Didn't catch anything. Tap the mic and try again.",
  network: "Voice typing needs an internet connection.",
};

interface VoiceInputProps {
  /** Called with each finished phrase; use appendSpoken to add it to the field. */
  onText: (text: string) => void;
  /** What is being dictated, for screen readers: "question", "description". */
  label: string;
  lang?: string;
  className?: string;
}

/** A mic button that types what you say. Hidden in browsers without speech
 * recognition (Firefox); works in Chrome, Edge and Safari. */
export default function VoiceInput({ onText, label, lang = "en-GB", className = "" }: VoiceInputProps) {
  const supported = useSyncExternalStore(noSubscription, browserSupport, serverSupport);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stop = () => recognitionRef.current?.stop();

  const start = () => {
    const Recognition = recognitionConstructor();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = lang;
    // Android Chrome repeats phrases in continuous mode, so it gets one phrase per tap.
    recognition.continuous = !/Android/i.test(navigator.userAgent);
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let pending = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) onTextRef.current(spokenToText(result[0].transcript));
        else pending += result[0].transcript;
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(ERRORS[event.error] || "Voice typing stopped. Try again.");
    };
    recognition.onend = () => {
      setListening(false);
      setInterim("");
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current?.abort();
    recognitionRef.current = recognition;
    setError(null);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Voice typing couldn't start. Try again.");
    }
  };

  if (!supported) return null;

  return (
    <span className={`inline-flex min-w-0 flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? `Stop voice typing for the ${label}` : `Speak the ${label}`}
        title={listening ? "Stop" : "Type by voice"}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          listening
            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-[#0866ef]"
        }`}
      >
        {listening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Listening
            <Square className="h-3 w-3 fill-current" />
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            Speak
          </>
        )}
      </button>
      <span aria-live="polite" className="max-w-full text-right text-[11px] leading-4">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : listening ? (
          <span className="italic text-slate-400">{interim || "Say it as you'd type it. Say “question mark” for ?"}</span>
        ) : null}
      </span>
    </span>
  );
}
