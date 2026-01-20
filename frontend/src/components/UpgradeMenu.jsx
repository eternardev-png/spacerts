import React from 'react';

const UpgradeMenu = ({ onUpgrade, credits }) => {
    const upgrades = [
        { id: 'solar', name: 'Solar Array', cost: 100, icon: '⚡' },
        { id: 'radar', name: 'Radar', cost: 100, icon: '📡' },
        { id: 'repair', name: 'Repair Arm', cost: 150, icon: '🔧' }
    ];

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #444'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px', textAlign: 'center' }}>Base Modules</h3>
            {upgrades.map((upg) => (
                <button
                    key={upg.id}
                    onClick={() => onUpgrade(upg.id)}
                    disabled={credits < upg.cost}
                    style={{
                        background: credits >= upg.cost ? '#2a2a2a' : '#1a1a1a',
                        color: credits >= upg.cost ? 'white' : 'grey',
                        border: '1px solid #666',
                        borderRadius: '5px',
                        padding: '8px',
                        cursor: credits >= upg.cost ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minWidth: '150px'
                    }}
                >
                    <span>{upg.icon} {upg.name}</span>
                    <span style={{ fontSize: '0.8em', color: '#aaa' }}>${upg.cost}</span>
                </button>
            ))}
        </div>
    );
};

export default UpgradeMenu;
