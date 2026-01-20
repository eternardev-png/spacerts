import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { api } from '../api';
import BuildMenu from './BuildMenu';
import UpgradeMenu from './UpgradeMenu';

const GameView = () => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const [credits, setCredits] = useState(150);
    const [wave, setWave] = useState(1);
    const [gameOver, setGameOver] = useState(null); // 'win' or 'lose'
    const [isLassoActive, setLassoActive] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const initGame = async () => {
            // Fetch Profile for Upgrades
            let upgrades = {};
            if (userId) { // Passed from prop
                const profile = await api.getProfile(userId);
                if (profile && profile.upgrades) {
                    upgrades = profile.upgrades;
                    console.log("Loaded Upgrades:", upgrades);
                }
            }

            // Initialize Game Engine with Upgrades
            const engine = new GameEngine(canvas, (state) => {
                if (state.credits !== undefined) setCredits(state.credits);
                if (state.wave !== undefined) setWave(state.wave);
                if (state.gameOver) setGameOver(state.gameOver);
                if (state.isLassoMode !== undefined) setLassoActive(state.isLassoMode);
            }, upgrades); // Pass upgrades here

            engineRef.current = engine;
            engine.start();
        };

        initGame();

        // Cleanup
        return () => {
            if (engineRef.current) engineRef.current.stop();
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [userId]);

    const handleSelectAll = () => {
        if (engineRef.current) {
            engineRef.current.selectAllArmy();
        }
    };

    const handleRestart = () => {
        window.location.reload();
    };

    const handleBuild = (type) => {
        if (engineRef.current) {
            engineRef.current.spawnUnit(type);
        }
    };

    const handleUpgrade = (type) => {
        if (engineRef.current) {
            engineRef.current.upgradeBase(type);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
            />

            {/* HUD / Buttons */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 0 5px #ff0000'
            }}>
                WAVE {wave}
            </div>

            <button
                onClick={handleSelectAll}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: '#444',
                    color: '#fff',
                    border: '1px solid #fff',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                SELECT ARMY
            </button>

            <button
                onClick={() => {
                    if (engineRef.current) {
                        const active = engineRef.current.toggleLassoMode();
                        // Force update to show active state?
                        // Simple toggle color if we tracked UI state.
                        // For MVP just a button.
                    }
                }}
                style={{
                    position: 'absolute',
                    top: '70px',
                    left: '20px',
                    background: isLassoActive ? '#00FF00' : '#444',
                    color: isLassoActive ? '#000' : '#fff',
                    border: '1px solid #fff',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    borderColor: '#00FF00'
                }}
            >
                LASSO SELECT
            </button>

            <UpgradeMenu onUpgrade={handleUpgrade} credits={credits} />
            <BuildMenu onBuild={handleBuild} credits={credits} />

            {/* Game Over Overlay */}
            {gameOver && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    zIndex: 100
                }}>
                    <h1 style={{ fontSize: '3em', color: gameOver === 'win' ? '#0f0' : '#f00' }}>
                        {gameOver === 'win' ? 'VICTORY' : 'DEFEAT'}
                    </h1>
                    <button
                        onClick={handleRestart}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.5em',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default GameView;
