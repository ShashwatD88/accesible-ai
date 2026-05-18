"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animFrameId: number;
    let mouseTimeout: ReturnType<typeof setTimeout>;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020617);

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 1.5;

      // Try creating WebGL renderer — may fail on some mobile browsers
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Cap pixel ratio to 2 to avoid crashes on high-DPI mobile screens
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      // 🌍 Earth
      const geometry = new THREE.SphereGeometry(1, 48, 48); // Reduced segments for mobile perf
      const texture = new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/earth_atmos_2048.jpg"
      );
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const globe = new THREE.Mesh(geometry, material);
      scene.add(globe);

      // 💡 Lights
      const light = new THREE.DirectionalLight(0xffffff, 1.2);
      light.position.set(5, 3, 5);
      scene.add(light);
      const ambient = new THREE.AmbientLight(0x404040, 1.5);
      scene.add(ambient);

      // ✨ Glow
      const glowGeometry = new THREE.SphereGeometry(1.03, 48, 48);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.add(glow);

      // 🌟 Starfield — reduce count on mobile
      const isMobile = window.innerWidth < 768;
      const starCount = isMobile ? 1000 : 3000;
      const starGeometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20;
      }
      starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(posArray, 3)
      );
      const starMaterial = new THREE.PointsMaterial({
        size: 0.015,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });
      const starMesh = new THREE.Points(starGeometry, starMaterial);
      scene.add(starMesh);

      // 🖱️ Mouse interaction (desktop only)
      let currentSpeed = 0.001;
      let targetSpeed = 0.001;

      const onMouseMove = (e: MouseEvent) => {
        const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetSpeed = 0.005 + Math.abs(mouseX) * 0.015;
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
          targetSpeed = 0.001;
        }, 100);
      };

      if (!isMobile) {
        window.addEventListener("mousemove", onMouseMove);
      }

      // 🔁 Animation
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        globe.rotation.y += currentSpeed;
        glow.rotation.y += currentSpeed;
        starMesh.rotation.y -= currentSpeed * 0.1;
        renderer!.render(scene, camera);
      };
      animate();

      // 🪟 Resize
      const onResize = () => {
        if (!renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // 🧹 Cleanup
      return () => {
        cancelAnimationFrame(animFrameId);
        clearTimeout(mouseTimeout);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        if (renderer && mountRef.current) {
          try { mountRef.current.removeChild(renderer.domElement); } catch {}
          renderer.dispose();
        }
        geometry.dispose();
        material.dispose();
        glowGeometry.dispose();
        glowMaterial.dispose();
        starGeometry.dispose();
        starMaterial.dispose();
      };
    } catch (err) {
      // WebGL not supported on this device — fail silently, show fallback background
      console.warn("WebGL not supported, hiding Globe3D:", err);
    }
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 bg-slate-950" />;
}