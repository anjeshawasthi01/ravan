import React from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface VictoryScreenProps {
  onPlayAgain: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  onPlayAgain,
  isMuted,
  onToggleSound
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 md:p-10 pointer-events-none select-none bg-gradient-to-t from-black/80 via-black/35 to-black/50 backdrop-blur-[2px] overflow-hidden">
      {/* Top Bar with Sound Toggle */}
      <div className="w-full max-w-7xl flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-amber-400/60 flex items-center justify-center bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            <span className="text-amber-300 text-sm font-serif">ॐ</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300 text-xs tracking-[0.3em] uppercase font-bold font-display">
            <span>THE TRIUMPH OF LIGHT OVER DARKNESS</span>
          </div>
        </div>

        <button
          onClick={onToggleSound}
          className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 hover:bg-amber-950/70 text-amber-200/90 hover:text-amber-100 border border-amber-500/30 hover:border-amber-400/70 transition-all duration-300 backdrop-blur-md cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] active:scale-95"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-amber-400/70 group-hover:text-amber-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
          )}
          <span className="text-xs uppercase tracking-[0.18em] font-semibold font-display">
            {isMuted ? 'Muted' : 'Sound On'}
          </span>
        </button>
      </div>

      {/* Central Regal Animated Movie Climax Treatment */}
      <div className="flex flex-col items-center text-center max-w-3xl px-4 pointer-events-auto my-auto relative animate-fade-in">
        {/* Sacred Golden Sunburst & Radiant Ring */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="absolute w-48 h-48 rounded-full bg-amber-500/15 blur-3xl animate-pulse" />
          <div className="flex items-center gap-4 text-amber-400">
            <span className="h-[1px] w-14 sm:w-24 bg-gradient-to-r from-transparent via-amber-400 to-yellow-300" />
            <div className="w-9 h-9 rounded-full border border-amber-300 flex items-center justify-center bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <span className="text-amber-300 text-base">✦</span>
            </div>
            <span className="h-[1px] w-14 sm:w-24 bg-gradient-to-l from-transparent via-amber-400 to-yellow-300" />
          </div>
        </div>

        {/* HAPPY DUSSEHRA Title */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-b from-amber-50 via-yellow-200 to-amber-500 font-display drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] text-gold-glow">
          HAPPY DUSSEHRA
        </h1>

        {/* Spiritual Blessing */}
        <p className="mt-4 sm:mt-6 text-xl sm:text-3xl text-amber-100 font-serif italic tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] max-w-2xl">
          May light always triumph over darkness.
        </p>

        {/* Accolades Badge */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-5 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 backdrop-blur-md shadow-lg text-[11px] sm:text-xs text-amber-200 uppercase tracking-[0.25em] font-bold font-display">
          <span>✦ 10 Heads Vanquished</span>
          <span className="text-amber-400">·</span>
          <span>Dharma Restored</span>
          <span className="text-amber-400">·</span>
          <span>A Thousand Lights Awakened ✦</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-9 sm:mt-11">
          {/* PLAY AGAIN BUTTON */}
          <button
            onClick={onPlayAgain}
            className="group relative flex items-center gap-3.5 px-10 sm:px-14 py-4 sm:py-5 rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-700/40 to-amber-900/50 hover:from-amber-500/45 hover:via-amber-600/55 hover:to-amber-800/65 border-2 border-amber-300/90 hover:border-yellow-200 transition-all duration-300 transform hover:scale-105 active:scale-95 box-gold-glow cursor-pointer backdrop-blur-md shadow-[0_15px_40px_rgba(245,158,11,0.4)]"
          >
            <RotateCcw className="w-5 h-5 text-amber-300 group-hover:-rotate-90 transition-transform duration-300" />
            <span className="text-amber-50 group-hover:text-white font-display font-extrabold text-base sm:text-lg tracking-[0.3em] uppercase">
              PLAY AGAIN
            </span>
          </button>

          {/* SOUND TOGGLE BUTTON */}
          <button
            onClick={onToggleSound}
            className="flex items-center gap-3 px-7 py-4 sm:py-5 rounded-2xl bg-black/60 hover:bg-black/80 border border-amber-500/40 hover:border-amber-400/70 text-amber-200 hover:text-amber-100 transition-all duration-200 cursor-pointer backdrop-blur-md shadow-lg active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-amber-400/70" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase font-display">
              {isMuted ? 'Sound: Off' : 'Sound: On'}
            </span>
          </button>
        </div>

        <p className="mt-4 text-xs text-amber-300/50 tracking-[0.2em] uppercase">
          Press [R] to shoot again
        </p>
      </div>

      {/* Mandatory Creator Credit at the absolute bottom */}
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
