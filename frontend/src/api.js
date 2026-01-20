export const API_URL = 'http://localhost:8000/api';

export const api = {
    async getProfile(userId) {
        try {
            const res = await fetch(`${API_URL}/profile/${userId}`);
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async saveRun(userId, score, scrap, waves) {
        try {
            const res = await fetch(`${API_URL}/save-run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, score, scrap, waves })
            });
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    async buyUpgrade(userId, upgradeId) {
        try {
            const res = await fetch(`${API_URL}/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, upgradeId })
            });
            if (!res.ok) throw new Error('Failed');
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }
};
