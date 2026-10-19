import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameState } from '../scene/GameScene';

interface GameHUDProps {
  gameState: GameState;
  drawProgress: number;
  isMuted: boolean;
  onToggleSound: () => void;
  onMobileDrawStart: () => void;
  onMobileDrawEnd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  drawProgress,
  isMuted,
  onToggleSound,
  onMobileDrawStart,
  onMobileDrawEnd
}) => {
  const powerPercent = Math.round(drawProgress * 100);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-8 overflow-hidden">
      {/* Top Header Bar */}
      <div className="w-full flex justify-between items-center pointer-events-auto">
        {/* Top-Left Title Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-amber-400/60 flex items-center justify-center bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            <span className="text-amber-300 text-sm font-serif">ॐ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold tracking-[0.25em] uppercase text-amber-100 font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-gold-glow">
              RAVAN · THE NIGHT OF LIGHT
            </span>
            <span className="text-[10px] text-amber-400/80 uppercase tracking-[0.3em] font-medium hidden sm:inline">
              One Arrow · A Thousand Lights · An Epic Dussehra Night
            </span>
          </div>
        </div>

        {/* Top-Right Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-amber-950/70 text-amber-200/90 hover:text-amber-100 border border-amber-500/30 hover:border-amber-400/70 transition-all duration-300 backdrop-blur-md cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.6)] active:scale-95"
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

      {/* Celestial Archery Mandala Reticle (visible while aiming & shooting) */}
      {(gameState === 'playing' || gameState === 'arrow_in_flight') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Outer Sacred Rotating Ring */}
            <div
              className={`absolute inset-0 rounded-full border border-dashed transition-all duration-300 ${
                drawProgress > 0
                  ? 'border-amber-300 scale-110 rotate-45 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                  : 'border-amber-400/40'
              }`}
            />

            {/* 4 Cardinal Sun-Ray Brackets */}
            <div className="absolute -top-2 w-1.5 h-1 bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
            <div className="absolute -bottom-2 w-1.5 h-1 bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
            <div className="absolute -left-2 h-1.5 w-1 bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
            <div className="absolute -right-2 h-1.5 w-1 bg-amber-300 shadow-[0_0_6px_#fbbf24]" />

            {/* Glowing Golden Diamond Pin-Point Core */}
            <div
              className={`w-2 h-2 rotate-45 rounded-[1px] transition-all duration-150 ${
                drawProgress > 0
                  ? 'bg-yellow-200 scale-150 shadow-[0_0_12px_#ffffff]'
                  : 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              }`}
            />
          </div>
        </div>
      )}

      {/* Bottom Center Dynamic Prompt, Power Meter & Controls */}
      <div className="flex flex-col items-center justify-center gap-3 mb-2">
        {/* ARROW OF DHARMA Glorious Flight Banner */}
        {gameState === 'arrow_in_flight' && (
          <div className="animate-pulse flex items-center gap-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-950/90 via-amber-900/95 to-amber-950/90 border-2 border-amber-300 text-amber-200 font-display text-xs sm:text-sm tracking-[0.35em] uppercase backdrop-blur-md shadow-[0_0_35px_rgba(245,158,11,0.6)]">
            <span className="text-amber-300 text-base">✦</span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300">
              ARROW OF DHARMA IN FLIGHT
            </span>
            <span className="text-amber-300 text-base">✦</span>
          </div>
        )}

        {/* Gameplay Instruction & Celestial Bow Charge Gauge */}
        {gameState === 'playing' && (
          <div className="flex flex-col items-center gap-2">
            {/* Instruction Title */}
            <div className="flex items-center gap-3 text-amber-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              <span className="text-amber-400 text-xs">✦</span>
              <span className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase font-display">
                {drawProgress > 0 ? `DRAWING BOW · ${powerPercent}%` : 'HOLD TO DRAW · RELEASE TO FIRE'}
              </span>
              <span className="text-amber-400 text-xs">✦</span>
            </div>

            {/* Regal Segmented Golden Power Bar */}
            <div className="relative w-56 sm:w-72 h-3 rounded-full bg-black/80 border border-amber-500/40 p-0.5 overflow-hidden backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 transition-all duration-75 shadow-[0_0_14px_#f59e0b]"
                style={{ width: `${powerPercent}%` }}
              />
              {/* Segment notches */}
              <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
                <span className="w-[1px] h-full bg-black/40" />
                <span className="w-[1px] h-full bg-black/40" />
                <span className="w-[1px] h-full bg-black/40" />
                <span className="w-[1px] h-full bg-black/40" />
              </div>
            </div>

            <span className="text-[11px] text-amber-300/70 tracking-[0.2em] uppercase font-medium">
              [Left Mouse Button / Spacebar / Touch Button below]
            </span>
          </div>
        )}

        {/* Mobile Dedicated Ceremonial Archery Pad Button */}
        {gameState === 'playing' && (
          <div className="sm:hidden mt-2 pointer-events-auto">
            <button
              onPointerDown={onMobileDrawStart}
              onPointerUp={onMobileDrawEnd}
              onPointerCancel={onMobileDrawEnd}
              className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-150 backdrop-blur-md active:scale-95 shadow-[0_8px_25px_rgba(0,0,0,0.8)] cursor-pointer ${
                drawProgress > 0
                  ? 'bg-gradient-to-b from-amber-500/40 to-amber-700/60 border-yellow-300 text-white shadow-[0_0_35px_rgba(245,158,11,0.7)] scale-105'
                  : 'bg-black/60 border-amber-500/60 text-amber-300 hover:border-amber-400'
              }`}
            >
              <span className="text-amber-300 text-sm">✦</span>
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase">
                {drawProgress > 0 ? 'RELEASE' : 'HOLD'}
              </span>
              <span className="text-xs font-display font-black tracking-wider uppercase mt-0.5">
                {drawProgress > 0 ? 'TO FIRE' : 'TO DRAW'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Mandatory Creator Credit at the absolute bottom */}
      <div className="w-full text-center pb-1 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 border border-amber-500/20 backdrop-blur-sm">
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
