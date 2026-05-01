// lib/speak.ts

export function speak(text?: string) {
  if (!text) return;

  // No audio → prevents AbortError completely
  console.log("🔊 Assistant:", text);
}