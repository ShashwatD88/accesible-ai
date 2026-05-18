"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { speak } from "@/lib/speak";

export default function VoiceInput() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    let processing = false;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      // Many mobile browsers (Firefox, iOS Chrome) don't support this — silently skip
      console.warn("Speech recognition not supported on this device/browser.");
      return;
    }

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
    } catch (e) {
      console.warn("Failed to initialize SpeechRecognition:", e);
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = async (event: any) => {
      const result = event.results[event.results.length - 1];
      if (!result.isFinal) return;
      const text = result[0].transcript.toLowerCase().trim();
      console.log("🎙 FINAL:", text);
      handleCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setTimeout(() => {
        try { recognition.start(); } catch (e) { /* ignore */ }
      }, 400);
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }

    async function handleCommand(text: string) {
      if (processing) return;
      processing = true;

      const store = useAppStore.getState();

      try {
        console.log("🗣️ Sending command to Gemini:", text);

        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const data = await res.json();

        if (data && data.action && data.action !== "unknown") {
          console.log("🤖 Gemini Action:", data.action, data);
          store.setIntent(data);
          if (data.message) speak(data.message);
        } else {
          speak(data.message || "Command not recognized");
        }
      } catch (err) {
        console.error("Failed to parse intent with Gemini", err);
        speak("Network error");
      } finally {
        processing = false;
      }
    }

    return () => {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    };
  }, []);

  return null;
}