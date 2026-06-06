import { useCallback, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

type ResultListener = (transcript: string, isFinal: boolean) => void;

// Wraps native speech-to-text. The caller receives the running transcript of the
// current dictation session; merging it with any existing text is left to the UI.
export function useVoiceInput(onResult: ResultListener) {
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest callback without re-subscribing the native listeners.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    // Guard every access: some result/end/error events arrive with `results`
    // undefined, and an unguarded throw here is dispatched from a native event
    // emitter — which trips the Hermes dev inspector and segfaults the app.
    const transcript = event?.results?.[0]?.transcript ?? "";
    if (transcript.length > 0) onResultRef.current(transcript, !!event?.isFinal);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setError(event?.message || "Voice input failed. Please try again.");
    setRecognizing(false);
  });

  const start = useCallback(async () => {
    setError(null);
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone and speech access are needed to dictate.");
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
      });
    } catch {
      setError("Could not start voice input.");
      setRecognizing(false);
    }
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { recognizing, error, start, stop };
}
