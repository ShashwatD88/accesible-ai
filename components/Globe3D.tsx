"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Globe3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Match dark mode background

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Move camera closer to make Earth fill the screen
    camera.position.z = 1.5; 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current?.appendChild(renderer.domElement);

    // 🌍 Earth geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
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

    // ✨ Glow (atmosphere effect)
    const glowGeometry = new THREE.SphereGeometry(1.03, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // 🌟 Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const posArray = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount * 3; i++) {
        // Spread stars far away
        posArray[i] = (Math.random() - 0.5) * 20; 
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const starMaterial = new THREE.PointsMaterial({ size: 0.015, color: 0xffffff, transparent: true, opacity: 0.8 });
    const starMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starMesh);

    // 🖱️ Mouse Interaction for Rotation Speed
    let currentSpeed = 0.001; // Base slow rotation
    let targetSpeed = 0.001;
    let mouseTimeout: NodeJS.Timeout;

    const onMouseMove = (e: MouseEvent) => {
      // Calculate mouse velocity (distance from center as a multiplier)
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      
      // When mouse moves, increase target speed dramatically based on mouse position
      targetSpeed = 0.005 + Math.abs(mouseX) * 0.015;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        targetSpeed = 0.001; // Return to slow speed when mouse stops
      }, 100);
    };

    window.addEventListener("mousemove", onMouseMove);

    // 🔁 Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Smoothly interpolate between speeds for realistic acceleration/deceleration
      currentSpeed += (targetSpeed - currentSpeed) * 0.05;
      
      globe.rotation.y += currentSpeed;
      glow.rotation.y += currentSpeed;
      starMesh.rotation.y -= currentSpeed * 0.1; // Stars rotate slowly in background
      
      renderer.render(scene, camera);
    };
    animate();

    // 🪟 Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // 🧹 Cleanup
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      mountRef.current?.removeChild(renderer.domElement);
      clearTimeout(mouseTimeout);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 bg-slate-950" />;
}