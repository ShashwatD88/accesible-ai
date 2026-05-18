"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import Script from "next/script";

// Detect if device is mobile — hand gestures are camera-intensive, skip on mobile
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function HandGestureControl() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { setZoom, setPanMode, setIntent } = useAppStore();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (!isActive || !videoRef.current || !scriptsLoaded) return;

    const Camera = (window as any).Camera;
    const Hands = (window as any).Hands;

    if (!Camera || !Hands) return;

    let camera: any;
    let lastPinchDist = 0;
    let pinchZoomActive = false;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (
        results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0
      ) {
        const landmarks = results.multiHandLandmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        const dist = Math.hypot(
          thumbTip.x - indexTip.x,
          thumbTip.y - indexTip.y
        );

        if (dist < 0.05) {
          if (!pinchZoomActive) {
            pinchZoomActive = true;
            lastPinchDist = dist;
          }
        } else if (pinchZoomActive) {
          pinchZoomActive = false;
        }

        if (wrist.x < 0.3) setPanMode("left");
        else if (wrist.x > 0.7) setPanMode("right");
        else if (wrist.y < 0.3) setPanMode("up");
        else if (wrist.y > 0.7) setPanMode("down");
        else setPanMode(null);
      } else {
        setPanMode(null);
      }
    });

    camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 320,
      height: 240,
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
      setPanMode(null);
    };
  }, [isActive, scriptsLoaded]);

  // On mobile, hide entirely — camera gestures not practical and cause crashes
  if (isMobile) return null;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        onLoad={() => setScriptsLoaded(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        onLoad={() => setScriptsLoaded(true)}
      />

      <div className="fixed bottom-24 left-6 z-20 flex flex-col gap-2">
        {isActive && (
          <video
            ref={videoRef}
            className="w-40 rounded-xl border border-white/20 shadow-xl object-cover flip-horizontal"
            autoPlay
            playsInline
            muted
          />
        )}

        <button
          onClick={() => setIsActive(!isActive)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            isActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white font-bold text-sm`}
        >
          {isActive ? "✋ Stop Gestures" : "✋ Start Gestures"}
        </button>

        <style jsx>{`
          .flip-horizontal {
            transform: scaleX(-1);
          }
        `}</style>
      </div>
    </>
  );
}
