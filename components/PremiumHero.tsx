"use client";

export default function PremiumHero() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center text-white pointer-events-none">
      <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 px-10 py-8 rounded-3xl shadow-2xl">

        <h1 className="text-5xl font-bold tracking-wide animate-fadeInUp">
          🌍 Accessible AI
        </h1>

        <h2 className="mt-4 text-2xl text-blue-400 animate-fadeInUp delay-200">
          Nearby Accessible Places Platform
        </h2>

        <p className="mt-4 text-gray-300 animate-fadeInUp delay-400">
          Navigate the world with intelligence & inclusivity
        </p>

      </div>
    </div>
  );
}