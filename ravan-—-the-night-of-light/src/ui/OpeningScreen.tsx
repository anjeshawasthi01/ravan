import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface OpeningScreenProps {
  onEnter: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({
  onEnter,
  isMuted,
  onToggleSound
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 md:p-10 pointer-events-none select-none overflow-hidden">
      {/* Cinematic Top Letterbox Bar with Golden Filigree & Sound Control */}
      <div className="w-full max-w-7xl flex justify-between items-center pointer-events-auto">
        {/* Film Production Style Studio Badge */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-amber-400/60 flex items-center justify-center bg-amber-950/40 backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <span className="text-amber-300 text-xs font-serif">ॐ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-[0.35em] uppercase text-amber-200/90 font-display">
              A CINEMATIC DUSSEHRA TALE
            </span>
            <span className="text-[9px] text-amber-400/60 uppercase tracking-[0.25em] font-medium">
              Festival of Vijayadashami
            </span>
          </div>
        </div>

        {/* Regal Sound Toggle Button */}
        <button
          onClick={onToggleSound}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-950/60 via-black/70 to-amber-950/60 hover:from-amber-900/70 hover:to-amber-950/80 text-amber-200/90 hover:text-amber-100 border border-amber-500/30 hover:border-amber-400/70 transition-all duration-300 backdrop-blur-md cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)] active:scale-95"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-amber-400/70 group-hover:text-amber-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs uppercase tracking-[0.2em] font-semibold font-display">
            {isMuted ? 'Sound Off' : 'Sound On'}
          </span>
        </button>
      </div>

      {/* Main Hero Animated Movie Title Experience */}
      <div className="flex flex-col items-center text-center max-w-3xl px-4 pointer-events-auto my-auto relative">
        {/* Radiant Celestial Sunburst & Dharma Chakra Motif */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-36 h-36 rounded-full bg-amber-500/10 blur-2xl animate-pulse" />
          
          {/* Ornate Golden Lotus Chakra Crest */}
          <div className="relative flex items-center gap-4 text-amber-400">
            <span className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-amber-400/70 to-amber-300" />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-950/40 backdrop-blur-sm">
              <span className="text-amber-300 text-xs tracking-[0.4em] uppercase font-bold font-display">
                ✦ VICTORY OF LIGHT ✦
              </span>
            </div>
            <span className="h-[1px] w-16 sm:w-24 bg-gradient-to-l from-transparent via-amber-400/70 to-amber-300" />
          </div>
        </div>

        {/* Main Title: RAVAN — Grand Embossed Cinema Treatment */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 font-display drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] text-gold-glow">
          RAVAN
        </h1>

        {/* Sub-Title: THE NIGHT OF LIGHT */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 font-display mt-2 drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
          THE NIGHT OF LIGHT
        </h2>

        {/* Poetic Movie Flow / Disney Quote */}
        <p className="mt-5 sm:mt-7 text-base sm:text-xl text-amber-100/90 font-serif italic tracking-wide max-w-xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
          &ldquo;One arrow. A thousand lights. A night to remember.&rdquo;
        </p>
        <p className="mt-1 text-xs sm:text-sm text-amber-300/70 font-sans tracking-[0.2em] uppercase">
          In the darkest night, a single arrow becomes the dawn.
        </p>

        {/* Majestic Dharma Productions Style Illuminated Ceremonial Button */}
        <div className="mt-9 sm:mt-12">
          <button
            onClick={onEnter}
            className="group relative px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-amber-500/25 via-amber-700/35 to-amber-900/45 hover:from-amber-500/40 hover:via-amber-600/45 hover:to-amber-800/55 border-2 border-amber-300/80 hover:border-yellow-200 transition-all duration-300 transform hover:scale-105 active:scale-95 box-gold-glow cursor-pointer overflow-hidden backdrop-blur-md shadow-[0_15px_40px_rgba(245,158,11,0.35)]"
          >
            {/* Shimmer sweep animation */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />

            <div className="relative flex items-center justify-center gap-3.5 text-amber-50 font-display font-extrabold text-base sm:text-xl tracking-[0.3em] uppercase">
              <span className="text-amber-300 text-lg group-hover:rotate-45 transition-transform duration-300">✦</span>
              <span>ENTER THE FESTIVAL</span>
              <span className="text-amber-300 text-lg group-hover:-rotate-45 transition-transform duration-300">✦</span>
            </div>
          </button>
        </div>

        {/* Subtle Archery Guidance */}
        <div className="mt-5 flex items-center gap-2 text-xs text-amber-200/60 tracking-[0.2em] uppercase">
          <span>Hold to Draw</span>
          <span className="text-amber-400">·</span>
          <span>Release to Fire</span>
          <span className="text-amber-400">·</span>
          <span>Always Hits Ravan</span>
        </div>
      </div>

      {/* Mandatory Creator Credit at the very bottom */}
      <div className="w-full text-center pb-2 pointer-events-auto">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-amber-500/20 backdrop-blur-sm">
          <span className="text-amber-400 text-xs">✦</span>
          <p className="text-xs sm:text-sm font-bold tracking-[0.35em] uppercase text-amber-100/90 font-display">
            CREATOR: ANJESH AWASTHI
          </p>
          <span className="text-amber-400 text-xs">✦</span>
        </div>
      </div>
    </div>
  );
};
