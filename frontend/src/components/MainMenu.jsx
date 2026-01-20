import React from 'react';

export function MainMenu({ onPlay, onHangar }) {
    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#050505', color: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <h1 style={{ fontSize: '4em', margin: '0 0 20px 0', textShadow: '0 0 20px cyan' }}>SpaceRTS</h1>
            <p style={{ color: '#aaa', marginBottom: '50px' }}>SURVIVAL PROTOCOL</p>

            <button
                onClick={onPlay}
                style={{
                    width: '200px', padding: '20px', fontSize: '24px', marginBottom: '20px',
                    background: 'cyan', color: 'black', border: 'none', borderRadius: '5px',
                    fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px cyan'
                }}
            >
                DEPLOY
            </button>

            <button
                onClick={onHangar}
                style={{
                    width: '200px', padding: '20px', fontSize: '24px',
                    background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                HANGAR
            </button>
        </div>
    );
}
