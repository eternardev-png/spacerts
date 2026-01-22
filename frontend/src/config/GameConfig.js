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
        visionRange: 400,
        initialEnergy: 500, // Starting Energy
        baseMaxEnergy: 500, // Base Capacity
        // Module Config
        modules: {
            solar: {
                name: "Solar Array",
                cost: 100,
                energyRate: 20, // +20/sec
                type: 'generator'
            },
            battery: {
                name: "Battery",
                cost: 150,
                energyRate: 0,
                capacityBonus: 2000, // +2000 Max Energy
                type: 'storage'
            },
            depot: {
                name: "Resource Depot",
                cost: 100,
                energyRate: -5,
                type: 'utility',
                description: 'Required for resource offloading.'
            },
            turret: { // Renamed from radar
                name: "Turret Network",
                cost: 150,
                energyRate: -5, // -5/sec
                damage: 20,
                range: 400,
                type: 'defense'
            },
            repair: {
                name: "Repair Arm",
                cost: 150,
                energyRate: -8, // -8/sec
                healRate: 10,
                type: 'utility'
            },
            hangar: {
                name: "Hangar",
                cost: 200,
                energyRate: -10, // -10/sec
                unlocks: ['fighter'], // Nuke moved to Silo
                type: 'production'
            },
            factory: {
                name: "Factory",
                cost: 400,
                energyRate: -20, // -20/sec
                unlocks: ['tank'],
                type: 'production'
            },
            silo: {
                name: "Tech Silo",
                cost: 300,
                energyRate: -15,
                unlocks: ['kamikaze'],
                type: 'production'
            }
        }
    },
    units: {
        miner: {
            id: 'miner',
            name: 'Diger',
            description: 'Mines resources. Return to deposit.',
            cost: 50,
            hp: 50,
            speed: 2.0, // Was 3
            damage: 0,
            attackRange: 60,
            visionRange: 150,
            hitRadius: 20,
            attackCooldown: 1000,
            capacity: 25, // Was 50
            color: '#00FFFF'
        },
        fighter: {
            id: 'fighter',
            name: 'Interceptor',
            description: 'Fast hit-and-run fighter.',
            cost: 150,
            hp: 120,
            speed: 3.0, // Was 4
            damage: 20,
            attackRange: 150,
            visionRange: 250,
            hitRadius: 25,
            attackCooldown: 1000,
            color: '#FF0000'
        },
        tank: {
            id: 'tank',
            name: 'Destroyer',
            description: 'Heavy armor, long range.',
            cost: 350,
            hp: 400,
            speed: 1.0, // Was 1.5
            damage: 50,
            attackRange: 200,
            visionRange: 300,
            hitRadius: 40,
            attackCooldown: 2000,
            color: '#00FF00'
        },
        kamikaze: {
            id: 'kamikaze',
            name: 'Nuke Bot',
            description: 'Explodes on contact.',
            cost: 100,
            hp: 40,
            speed: 4.5, // Was 6
            damage: 500,
            attackRange: 30,
            visionRange: 150,
            hitRadius: 20,
            attackCooldown: 0,
            color: '#FFA500'
        }
    },
    world: {
        width: 2000,
        height: 2000
    },
    ai: {
        buildInterval: 2.0, // Seconds between decisions
        incomeRate: 20, // Credits per second (cheat)
        miningLimit: 3,
        attackThreshold: 6
    },
    gameplay: {
        maxUnits: 50 // Per team unit limit
    }
};

