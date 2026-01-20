import React from 'react';
import { GAME_CONFIG } from '../config/GameConfig';

const BuildMenu = ({ onBuild, credits }) => {
    const units = Object.values(GAME_CONFIG.units);

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #444',
            flexWrap: 'wrap',
            justifyContent: 'center'
        }}>
            {units.map((unit) => (
                <button
                    key={unit.id}
                    onClick={() => onBuild(unit.id)}
                    disabled={credits < unit.cost}
                    style={{
                        background: credits >= unit.cost ? '#2a2a2a' : '#1a1a1a',
                        color: credits >= unit.cost ? 'white' : 'grey',
                        border: `1px solid ${unit.color}`,
                        borderRadius: '5px',
                        padding: '10px',
                        cursor: credits >= unit.cost ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '80px'
                    }}
                >
                    <span style={{ fontWeight: 'bold' }}>{unit.name}</span>
                    <span style={{ fontSize: '0.8em', color: '#aaa' }}>${unit.cost}</span>
                </button>
            ))}
        </div>
    );
};

export default BuildMenu;
