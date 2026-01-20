import React, { useState, useEffect } from 'react';
import { api } from '../api';

export function HangarView({ userId, onBack }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const p = await api.getProfile(userId);
        setProfile(p);
    };

    const handleBuy = async (upgradeId) => {
        setLoading(true);
        const res = await api.buyUpgrade(userId, upgradeId);
        if (res) {
            loadProfile(); // Refresh
        } else {
            alert("Not enough Scrap!");
        }
        setLoading(false);
    };

    if (!profile) return <div style={{ color: 'white' }}>Loading Hangar...</div>;

    const upgrades = [
        { id: 'drill', name: 'Nano-Drills', desc: 'Miners +10% Speed', baseCost: 100 },
        { id: 'armor', name: 'Reactive Armor', desc: 'Base HP +10%', baseCost: 200 },
        { id: 'speed', name: 'Veteran Pilots', desc: 'Units +5% Speed', baseCost: 300 },
    ];

    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#111', color: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px'
        }}>
            <h1>THE HANGAR</h1>
            <div style={{ fontSize: '24px', color: '#FFD700', marginBottom: '20px' }}>
                SCRAP: {profile.scrap} ⚙️
            </div>

            <div style={{ display: 'grid', gap: '20px', width: '100%', maxWidth: '600px' }}>
                {upgrades.map(u => {
                    const level = profile.upgrades[u.id] || 0;
                    const cost = u.baseCost * (level + 1);
                    return (
                        <div key={u.id} style={{
                            border: '1px solid #444', padding: '15px', borderRadius: '10px',
                            background: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{u.name} (Lvl {level})</h3>
                                <p style={{ margin: '5px 0', color: '#aaa' }}>{u.desc}</p>
                            </div>
                            <button
                                onClick={() => handleBuy(u.id)}
                                disabled={loading || profile.scrap < cost}
                                style={{
                                    padding: '10px 20px',
                                    background: profile.scrap >= cost ? '#00cc00' : '#555',
                                    color: 'white', border: 'none', borderRadius: '5px',
                                    cursor: profile.scrap >= cost ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Buy ({cost} ⚙️)
                            </button>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onBack}
                style={{
                    marginTop: '40px', padding: '15px 40px', fontSize: '20px',
                    background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
                }}
            >
                BACK TO MENU
            </button>
        </div>
    );
}
