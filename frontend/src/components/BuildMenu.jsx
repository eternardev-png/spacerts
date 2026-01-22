import React from 'react';
import { GAME_CONFIG } from '../config/GameConfig';

const BuildMenu = ({ onBuild, credits, baseModules }) => {
    const units = Object.values(GAME_CONFIG.units);

    // Helpers to check unlock
    const isLocked = (unitId) => {
        if (unitId === 'miner') return false; // Always unlocked
        if (unitId === 'fighter') {
            return !baseModules || !baseModules.hangar || baseModules.hangar <= 0;
        }
        if (unitId === 'kamikaze') { // Now requires Silo
            return !baseModules || !baseModules.silo || baseModules.silo <= 0;
        }
        if (unitId === 'tank') {
            return !baseModules || !baseModules.factory || baseModules.factory <= 0;
        }
        return false;
    };

    // Helper for requirements text
    const getReqText = (unitId) => {
        if (unitId === 'fighter') return 'Req: Hangar';
        if (unitId === 'kamikaze') return 'Req: Silo';
        if (unitId === 'tank') return 'Req: Factory';
        return '';
    };

    return (
        <div style={{
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.8)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid #444',
            flexWrap: 'wrap',
            justifyContent: 'center'
        }}>
            {units.map((unit, index) => {
                const locked = isLocked(unit.id);
                const reqText = getReqText(unit.id);

                return (
                    <button
                        key={unit.id}
                        onClick={() => onBuild(unit.id)}
                        disabled={credits < unit.cost || locked}
                        title={unit.description}
                        style={{
                            background: locked ? '#330000' : (credits >= unit.cost ? '#2a2a2a' : '#1a1a1a'),
                            color: locked ? '#888' : (credits >= unit.cost ? 'white' : 'grey'),
                            border: `1px solid ${locked ? '#FF0000' : unit.color}`,
                            borderRadius: '5px',
                            padding: '10px',
                            cursor: (credits >= unit.cost && !locked) ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '100px',
                            opacity: locked ? 0.6 : 1
                        }}
                    >
                        <span style={{ fontWeight: 'bold' }}>[{index + 1}] {unit.name}</span>
                        {locked ? (
                            <span style={{ fontSize: '0.8em', color: '#FF4444' }}>{reqText}</span>
                        ) : (
                            <span style={{ fontSize: '0.7em', color: '#ccc', marginBottom: '2px' }}>{unit.description}</span>
                        )}
                        <span style={{ fontSize: '0.9em', color: '#FFD700' }}>${unit.cost}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BuildMenu;
