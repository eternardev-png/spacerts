import { Unit } from './entities/Unit';
import { GAME_CONFIG } from '../config/GameConfig';

export class WaveManager {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.waveNumber = 1;
        this.waveTimer = 0; // Seconds since wave start
        this.isWaveActive = false;
        this.timeBetweenWaves = 10; // Seconds rest
        this.timeNextWave = this.timeBetweenWaves;
        this.nextSpawnTime = 0;

        // Configuration for standard waves
        this.waves = [
            { count: 3, types: ['fighter'], interval: 2 }, // Wave 1
            { count: 5, types: ['fighter', 'fighter', 'kamikaze'], interval: 1.5 }, // Wave 2
            { count: 4, types: ['tank', 'fighter'], interval: 3 }, // Wave 3
        ];

        this.currentWaveConfig = null;
        this.unitsToSpawn = [];
        this.pendingSpawns = [];

        // PowerUps
        this.powerUpTimer = 0;
        this.powerUpInterval = 30; // Every 30-45s
    }

    start() {
        this.startNextWave();
    }

    startNextWave() {
        this.isWaveActive = true;
        this.waveTimer = 0;

        console.log(`Starting Wave ${this.waveNumber}`);
        this.game.onGameStateChange({ wave: this.waveNumber });

        // Setup Spawning Queue
        if (this.waveNumber <= this.waves.length) {
            // Scripted Wave
            const config = this.waves[this.waveNumber - 1];
            this.prepareSpawnQueue(config);
        } else {
            // Infinite Procedural Wave
            this.prepareInfiniteSpawnQueue();
        }
    }

    prepareSpawnQueue(config) {
        this.unitsToSpawn = [];
        const { types, count, interval } = config;

        // Flatten types to fill count
        for (let i = 0; i < count; i++) {
            const type = types[i % types.length];
            this.unitsToSpawn.push({
                type: type,
                time: (i + 1) * interval
            });
        }
        this.nextSpawnTime = this.unitsToSpawn[0].time;
    }

    prepareInfiniteSpawnQueue() {
        // Budget = Wave * 200
        let budget = this.waveNumber * 200;
        this.unitsToSpawn = [];
        let timeAccumulator = 0;

        while (budget > 0) {
            // Buy random units
            const choices = ['fighter', 'tank', 'kamikaze'];
            const type = choices[Math.floor(Math.random() * choices.length)];
            const cost = GAME_CONFIG.units[type].cost;

            if (budget >= cost) {
                timeAccumulator += 1.0; // 1 sec interval
                this.unitsToSpawn.push({
                    type: type,
                    time: timeAccumulator
                });
                budget -= cost;
            } else {
                break; // Spent
            }
        }

        if (this.unitsToSpawn.length > 0) {
            this.nextSpawnTime = this.unitsToSpawn[0].time;
        }
    }

    update(dt) {
        if (!this.isWaveActive) {
            return;
        }

        this.waveTimer += dt;

        // 1. Check Future Spawns (Pre-warm 3 seconds early for Warning)
        if (this.unitsToSpawn.length > 0) {
            if (this.waveTimer >= this.unitsToSpawn[0].time - 3) {
                const unitData = this.unitsToSpawn.shift();
                this.queuePendingSpawn(unitData.type);
            }
        }

        // 2. Update Pending Spawns
        if (this.pendingSpawns) {
            for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
                const spawn = this.pendingSpawns[i];
                spawn.timer -= dt;

                if (spawn.timer <= 0) {
                    this.spawnUnitAt(spawn.type, spawn.x, spawn.y);
                    this.pendingSpawns.splice(i, 1);
                }
            }
        }

        // 3. Wave Completion Check
        // If queues empty and no pending spawns
        const noSpawnsLeft = this.unitsToSpawn.length === 0 && this.pendingSpawns.length === 0;
        if (noSpawnsLeft) {
            const enemyCount = this.game.units.filter(u => u.team === 'enemy').length;
            if (enemyCount === 0) {
                this.waveComplete();
            }
        }

        // PowerUp Spawning
        this.powerUpTimer += dt;
        if (this.powerUpTimer >= this.powerUpInterval) {
            this.spawnRandomPowerUp();
            this.powerUpTimer = 0;
            this.powerUpInterval = 30 + Math.random() * 20; // 30-50s
        }
    }

    queuePendingSpawn(type) {
        const pos = this.getRandomEdgePosition();

        this.pendingSpawns.push({
            type: type,
            x: pos.x,
            y: pos.y,
            timer: 3.0 // 3 seconds warning
        });

        if (this.game.audio) this.game.audio.play('warning');
    }

    getRandomEdgePosition() {
        const edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
        let x, y;
        const offset = 50;
        const w = this.game.width;
        const h = this.game.height;

        switch (edge) {
            case 0: x = Math.random() * w; y = -offset; break;
            case 1: x = w + offset; y = Math.random() * h; break;
            case 2: x = Math.random() * w; y = h + offset; break;
            case 3: x = -offset; y = Math.random() * h; break;
        }
        return { x, y };
    }

    spawnUnitAt(type, x, y) {
        const unit = new Unit(x, y, 'enemy', type);
        const playerBase = this.game.buildings.find(b => b.team === 'player');
        if (playerBase) {
            unit.moveTo(playerBase.x, playerBase.y);
        } else {
            unit.moveTo(this.game.width / 2, this.game.height / 2);
        }
        this.game.units.push(unit);
    }

    spawnEnemy(type) {
        // Fallback/Direct spawn
        const pos = this.getRandomEdgePosition();
        this.spawnUnitAt(type, pos.x, pos.y);
    }

    spawnRandomPowerUp() {
        const types = ['health', 'health', 'credits', 'credits', 'nuke'];
        const type = types[Math.floor(Math.random() * types.length)];

        const x = Math.random() * (this.game.width - 100) + 50;
        const y = Math.random() * (this.game.height - 100) + 50;

        this.game.spawnPowerUp(x, y, type);
        console.log("Supply Drop Incoming:", type);
    }

    waveComplete() {
        this.isWaveActive = false;
        console.log("Wave Complete!");

        // Bonus?
        // this.game.credits += 100;

        setTimeout(() => {
            this.waveNumber++;
            this.startNextWave();
        }, 5000); // 5 sec break
    }
}
