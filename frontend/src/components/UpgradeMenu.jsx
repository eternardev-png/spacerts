import React from 'react';

const UpgradeMenu = ({ onUpgrade, credits, baseModules }) => {
    const upgrades = [
        { id: 'solar', name: 'Solar Array', cost: 100, icon: '⚡' },
        { id: 'battery', name: 'Battery', cost: 150, icon: '🔋' },
        { id: 'turret', name: 'Turret Network', cost: 150, icon: '🛡️' },
        { id: 'repair', name: 'Repair Arm', cost: 150, icon: '🔧' },
        { id: 'hangar', name: 'Hangar', cost: 200, icon: '🛸' },
        { id: 'factory', name: 'Factory', cost: 400, icon: '🏭' },
        { id: 'silo', name: 'Tech Silo', cost: 300, icon: '☢️' } // New
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row', // Make it horizontal for bottom bar
            gap: '10px',
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #444',
            alignItems: 'center'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px', textAlign: 'center' }}>Base Modules</h3>
            {upgrades.map((upg, index) => {
                // Check if already built (for non-stackable ones if wanted, but lets assume levels for now)
                // Or show current level
                const level = (baseModules && baseModules[upg.id]) || 0;

                return (
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>[{index + 1}] {upg.icon} {upg.name}</span>
                            <span style={{ fontSize: '10px', color: 'cyan' }}>Lvl: {level}</span>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#aaa' }}>${upg.cost}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default UpgradeMenu;
