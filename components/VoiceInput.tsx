"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { speak } from "@/lib/speak";

export default function VoiceInput() {
  useEffect(() => {
    let processing = false;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

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

    recognition.onend = () => {
      setTimeout(() => recognition.start(), 400);
    };

    recognition.start();

    async function handleCommand(text: string) {
      if (processing) return;
      processing = true;

      const store = useAppStore.getState();
      
      try {
        console.log("🗣️ Sending command to Gemini:", text);
        
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        
        const data = await res.json();
        
        if (data && data.action && data.action !== "unknown") {
          console.log("🤖 Gemini Action:", data.action, data);
          store.setIntent(data);
          
          if (data.message) {
            speak(data.message);
          }
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
  }, []);

  return null;
}