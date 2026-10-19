/**
 * RAVAN — THE NIGHT OF LIGHT
 * Creator: Anjesh Awasthi
 * Tagline: One arrow. A thousand lights. A night to remember.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameScene, GameState } from './scene/GameScene';
import { OpeningScreen } from './ui/OpeningScreen';
import { GameHUD } from './ui/GameHUD';
import { VictoryScreen } from './ui/VictoryScreen';
import { soundManager } from './audio/SoundManager';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);

  const [gameState, setGameState] = useState<GameState>('opening');
  const [drawProgress, setDrawProgress] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize 3D WebGL scene once
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const gameScene = new GameScene(canvasContainerRef.current);
    gameSceneRef.current = gameScene;

    gameScene.onStateChange = (state: GameState) => {
      setGameState(state);
    };

    gameScene.onDrawProgress = (progress: number) => {
      setDrawProgress(progress);
    };

    return () => {
      gameScene.dispose();
      gameSceneRef.current = null;
    };
  }, []);

  // Enter festival from opening screen
  const handleEnterFestival = useCallback(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.enterFestival();
      // Auto-request pointer lock on desktop for immersive look-around
      if (window.innerWidth > 768) {
        gameSceneRef.current.requestPointerLock();
      }
    }
  }, []);

  // Toggle master sound
  const handleToggleSound = useCallback(() => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Play Again (resets state without page reload)
  const handlePlayAgain = useCallback(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.resetGame();
    }
  }, []);

  // Mobile Draw/Fire controls
  const handleMobileDrawStart = useCallback(() => {
    gameSceneRef.current?.handleMobileDrawStart();
  }, []);

  const handleMobileDrawEnd = useCallback(() => {
    gameSceneRef.current?.handleMobileDrawEnd();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasContainerRef} className="absolute inset-0 z-0 cursor-crosshair" />

      {/* Opening Screen Overlay */}
      {gameState === 'opening' && (
        <OpeningScreen
          onEnter={handleEnterFestival}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* In-Game HUD (visible while aiming, shooting, or burning) */}
      {gameState !== 'opening' && gameState !== 'victory' && (
        <GameHUD
          gameState={gameState}
          drawProgress={drawProgress}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
          onMobileDrawStart={handleMobileDrawStart}
          onMobileDrawEnd={handleMobileDrawEnd}
        />
      )}

      {/* Victory Celebration Screen */}
      {gameState === 'victory' && (
        <VictoryScreen
          onPlayAgain={handlePlayAgain}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}
    </div>
  );
}
