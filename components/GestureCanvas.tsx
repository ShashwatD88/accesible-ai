"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function GestureCanvas() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setPanMode = useAppStore((s) => s.setPanMode);

  useEffect(() => {
    // 🎥 Camera only (no mediapipe)
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    });

    // 🎮 DEMO GESTURE CONTROLS (keyboard)
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        console.log("➡ RIGHT");
        setPanMode("right");
      }

      if (e.key === "ArrowLeft") {
        console.log("⬅ LEFT");
        setPanMode("left");
      }

      if (e.key === " ") {
        console.log("✋ STOP");
        setPanMode(null);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);

      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-30">
      <video
        ref={videoRef}
        className="w-40 h-32 rounded-xl border border-white/20"
        autoPlay
        muted
        playsInline
      />

      <div className="text-white text-xs mt-2 bg-black/50 p-2 rounded">
        🎮 Demo Controls:<br />
        ← Left | → Right | Space = Stop
      </div>
    </div>
  );
}