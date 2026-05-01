"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    mountRef.current?.appendChild(renderer.domElement);

    // 🌍 Earth geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    const texture = new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/earth_atmos_2048.jpg"
    );

    const material = new THREE.MeshStandardMaterial({
      map: texture,
    });

    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // 💡 Lights
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 3, 5);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambient);

    // ✨ Glow (optional subtle effect)
    const glowGeometry = new THREE.SphereGeometry(1.05, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.1,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // 🔁 Animation
    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      glow.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    // 🧹 Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
}