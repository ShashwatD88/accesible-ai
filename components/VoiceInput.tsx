"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { speak } from "@/lib/speak";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function VoiceInput() {
  const [isMobile, setIsMobile] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(isMobileDevice());

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported.");
      setSupported(false);
      return;
    }

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
    } catch (e) {
      console.warn("Failed to init SpeechRecognition:", e);
      setSupported(false);
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
      // On mobile, stop on error (don't auto-restart)
      if (isMobileDevice()) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Desktop: auto-restart for always-on listening
      // Mobile: stop — user has to tap again
      if (!isMobileDevice()) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) { /* ignore */ }
        }, 400);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    // Desktop: auto-start always-on listening
    if (!isMobileDevice()) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
      }
    }

    return () => {
      try { recognition.stop(); } catch (e) { /* ignore */ }
    };
  }, []);

  async function handleCommand(text: string) {
    if (processingRef.current) return;
    processingRef.current = true;

    const store = useAppStore.getState();

    try {
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
      processingRef.current = false;
    }
  }

  const toggleMic = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      // Stop listening
      try { recognition.stop(); } catch (e) { /* ignore */ }
      setIsListening(false);
    } else {
      // Start listening
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  }, [isListening]);

  // Desktop: render nothing (always-on background listener)
  if (!isMobile) return null;

  // Mobile: not supported
  if (!supported) return null;

  // Mobile: render a mic button
  return (
    <button
      onClick={toggleMic}
      className={`fixed z-40 right-4 bottom-20 p-4 rounded-full shadow-2xl transition-all duration-300 ${
        isListening
          ? "bg-red-500 animate-pulse scale-110 shadow-red-500/50"
          : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
      }`}
      aria-label={isListening ? "Stop listening" : "Start voice command"}
    >
      {isListening ? (
        /* Animated mic-on icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
      ) : (
        /* Mic-off icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
      )}

      {/* "Listening" label */}
      {isListening && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
          Listening...
        </span>
      )}
    </button>
  );
}