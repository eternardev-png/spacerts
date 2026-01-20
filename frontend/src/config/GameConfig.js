// src/config/GameConfig.js

export const GAME_CONFIG = {
    economy: {
        startingCredits: 150,
        miningRatePerSecond: 10,
        asteroidTotalResources: 500
    },
    base: {
        hp: 2000,
        width: 120,
        height: 120,
        regenRate: 1,
        visionRange: 400 // Base has large vision
    },
    units: {
        miner: {
            id: 'miner',
            name: 'Drone',
            cost: 50,
            hp: 50,
            speed: 3,
            damage: 0,
            attackRange: 60,
            visionRange: 150,
            attackCooldown: 1000,
            color: '#00FFFF'
        },
        fighter: {
            id: 'fighter',
            name: 'Interceptor',
            cost: 150,
            hp: 120,
            speed: 4,
            damage: 20,
            attackRange: 150,
            visionRange: 250,
            attackCooldown: 1000,
            color: '#FF0000'
        },
        tank: {
            id: 'tank',
            name: 'Heavy Cruiser',
            cost: 350,
            hp: 400,
            speed: 1.5,
            damage: 50,
            attackRange: 200,
            visionRange: 300,
            attackCooldown: 2000,
            color: '#00FF00'
        },
        kamikaze: {
            id: 'kamikaze',
            name: 'Boom Bot',
            cost: 100,
            hp: 40,
            speed: 6,
            damage: 500,
            attackRange: 30, // Melee
            visionRange: 150,
            attackCooldown: 0,
            color: '#FFA500' // Orange
        }
    }
};
