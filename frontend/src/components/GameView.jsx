import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { api } from '../api';
import BuildMenu from './BuildMenu';
import UpgradeMenu from './UpgradeMenu';

const GameView = ({ userId }) => {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const [credits, setCredits] = useState(150);
    const [energy, setEnergy] = useState(0);
    const [energyMax, setEnergyMax] = useState(500); // New
    const [energyRate, setEnergyRate] = useState(0); // New
    const [baseModules, setBaseModules] = useState({});
    const [wave, setWave] = useState(1);
    const [gameOver, setGameOver] = useState(null);
    const [isLassoActive, setLassoActive] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); // 'ships' | 'base' | null

    useEffect(() => {
        // ... (resize logic same) ...
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (engineRef.current) engineRef.current.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (engineRef.current) engineRef.current.destroy();
        };
    }, []);

    const handleStartGame = (selectedDifficulty) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let upgrades = {};
        const engine = new GameEngine(canvas, (state) => {
            if (state.credits !== undefined) setCredits(state.credits);
            if (state.energy !== undefined) setEnergy(state.energy);
            if (state.energyMax !== undefined) setEnergyMax(state.energyMax);
            if (state.energyRate !== undefined) setEnergyRate(state.energyRate);
            if (state.baseModules !== undefined) setBaseModules(state.baseModules);
            if (state.wave !== undefined) setWave(state.wave);
            if (state.gameOver) setGameOver(state.gameOver);
            if (state.isLassoMode !== undefined) setLassoActive(state.isLassoMode);
        }, upgrades, selectedDifficulty);

        engineRef.current = engine;
        engine.start();
        setGameStarted(true);
    };

    const handleSelectAll = () => {
        if (engineRef.current) engineRef.current.selectAllArmy();
    };

    const handleRestart = () => {
        window.location.reload();
    };

    const handleBuild = (type) => {
        if (engineRef.current) engineRef.current.spawnUnit(type);
    };

    const handleUpgrade = (type) => {
        if (engineRef.current) engineRef.current.upgradeBase(type);
    };

    // Style Helper
    const btnStyle = (color) => ({
        padding: '15px 40px',
        fontSize: '24px',
        background: 'transparent',
        color: color,
        border: `2px solid ${color}`,
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        textShadow: `0 0 10px ${color}`,
        boxShadow: `0 0 10px ${color}`
    });

    // Hotkeys for Menus
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Menu Toggles
            if (e.key === 'x' || e.key === 'X') {
                setActiveMenu(prev => prev === 'ships' ? null : 'ships');
            }
            if (e.key === 'c' || e.key === 'C') {
                setActiveMenu(prev => prev === 'base' ? null : 'base');
            }

            // Quick Buy (1-4)
            // Need to know active menu. But activeMenu is state, accessible here via closure? 
            // useEffect dependency on activeMenu needed or use functional state updater?
            // To access up-to-date activeMenu in event listener without re-binding, use ref or dependency.
            // Let's use a Ref for activeMenu to avoid re-binding listener constantly.
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Problem: activeMenu is stale.

    // Solution: Use a separate effect for keys that depend on state, or Ref.
    const activeMenuRef = useRef(null);
    useEffect(() => { activeMenuRef.current = activeMenu; }, [activeMenu]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const menu = activeMenuRef.current;

            // Toggles
            if (e.key === 'x' || e.key === 'X') setActiveMenu(prev => prev === 'ships' ? null : 'ships');
            if (e.key === 'c' || e.key === 'C') setActiveMenu(prev => prev === 'base' ? null : 'base');

            // Items
            if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
                if (menu === 'ships') {
                    const map = { '1': 'miner', '2': 'fighter', '3': 'tank', '4': 'kamikaze' };
                    if (map[e.key]) handleBuild(map[e.key]);
                } else if (menu === 'base') {
                    const map = {
                        '1': 'solar',
                        '2': 'battery',
                        '3': 'turret',
                        '4': 'repair',
                        '5': 'hangar',
                        '6': 'factory',
                        '7': 'silo'
                    };
                    if (map[e.key]) handleUpgrade(map[e.key]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);



    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
            />

            {/* Start Screen logic remains same... */}
            {!gameStarted && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, color: 'white'
                }}>
                    <h1 style={{ fontSize: '4em', color: '#00FFFF', marginBottom: '40px', textShadow: '0 0 20px #00FFFF' }}>SPACE RTS</h1>
                    <h2 style={{ marginBottom: '20px' }}>SELECT DIFFICULTY</h2>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={() => handleStartGame('EASY')} style={btnStyle('#00FF00')}>EASY</button>
                        <button onClick={() => handleStartGame('MEDIUM')} style={btnStyle('#FFFF00')}>MEDIUM</button>
                        <button onClick={() => handleStartGame('HARD')} style={btnStyle('#FF0000')}>HARD</button>
                    </div>
                </div>
            )}

            {/* HUD */}
            {gameStarted && (
                <>
                    {/* Top Info */}
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px #ff0000',
                        pointerEvents: 'none',
                        display: 'flex', gap: '20px'
                    }}>
                        <span>WAVE {wave}</span>
                        <span style={{ color: '#00FFFF' }}>CREDITS: ${Math.floor(credits)}</span>
                        <span style={{ color: energy > 0 ? '#00FF00' : '#FF0000' }}>
                            ENERGY: {Math.floor(energy)}/{energyMax} ({energyRate >= 0 ? '+' : ''}{Math.floor(energyRate)}/s)⚡
                        </span>
                    </div>

                    {/* Top Left Buttons */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleSelectAll}
                            style={{
                                background: '#444', color: '#fff', border: '1px solid #fff',
                                padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                            }}
                        >
                            [Q] ALL ARMY
                        </button>
                        <button
                            onClick={() => engineRef.current && engineRef.current.toggleLassoMode()}
                            style={{
                                background: isLassoActive ? '#00FF00' : '#444',
                                color: isLassoActive ? '#000' : '#fff',
                                border: '1px solid #fff',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            [E] LASSO
                        </button>
                    </div>

                    {/* Bottom Tabs */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '20px',
                        zIndex: 100
                    }}>
                        <button
                            onClick={() => setActiveMenu(activeMenu === 'ships' ? null : 'ships')}
                            style={{
                                padding: '15px 30px',
                                fontSize: '18px',
                                background: activeMenu === 'ships' ? '#00FFFF' : 'rgba(0, 0, 0, 0.8)',
                                color: activeMenu === 'ships' ? '#000' : '#fff',
                                border: '2px solid #00FFFF',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: activeMenu === 'ships' ? '0 0 15px cyan' : 'none'
                            }}
                        >
                            [X] SHIPS
                        </button>

                        <button
                            onClick={() => setActiveMenu(activeMenu === 'base' ? null : 'base')}
                            style={{
                                padding: '15px 30px',
                                fontSize: '18px',
                                background: activeMenu === 'base' ? '#00FF00' : 'rgba(0, 0, 0, 0.8)',
                                color: activeMenu === 'base' ? '#000' : '#fff',
                                border: '2px solid #00FF00',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: activeMenu === 'base' ? '0 0 15px lime' : 'none'
                            }}
                        >
                            [C] BASE
                        </button>
                    </div>

                    {/* Conditional Menus */}
                    {activeMenu === 'ships' && (
                        <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)' }}>
                            <BuildMenu onBuild={handleBuild} credits={credits} baseModules={baseModules} />
                        </div>
                    )}

                    {activeMenu === 'base' && (
                        <div style={{ position: 'absolute', bottom: '90px', left: '50%', transform: 'translateX(-50%)' }}>
                            <UpgradeMenu onUpgrade={handleUpgrade} credits={credits} baseModules={baseModules} />
                        </div>
                    )}
                </>
            )}

            {/* Game Over Screen */}
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

            {/* Tutorial Overlay */}
            {gameStarted && wave === 1 && !gameOver && (
                <div style={{
                    position: 'absolute',
                    top: '100px',
                    right: '20px',
                    width: '300px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid #00FFFF',
                    color: '#fff',
                    padding: '20px',
                    borderRadius: '10px',
                    pointerEvents: 'none',
                    zIndex: 50
                }}>
                    <h3 style={{ marginTop: 0, color: '#00FFFF' }}>HOW TO PLAY</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
                        <li><strong>Build Drones</strong> ($50) to mine resources.</li>
                        <li><strong>Select Drone</strong> and click an <strong>Asteroid</strong> to mine.</li>
                        <li><strong>Build Interceptors</strong> to defend.</li>
                        <li>Find and destroy the <strong>Enemy Base</strong>!</li>
                    </ul>
                    <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '10px' }}>
                        Tip: WASD to Move Camera.
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameView;
