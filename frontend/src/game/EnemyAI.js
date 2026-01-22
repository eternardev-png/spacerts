import { Unit } from './entities/Unit';
import { GAME_CONFIG } from '../config/GameConfig';

export class EnemyAI {
    constructor(gameEngine, difficulty = 'MEDIUM') {
        this.game = gameEngine;
        this.difficulty = difficulty;
        this.searchTimer = 0;
        this.decisionTimer = 0;
        this.credits = 200;

        this.state = 'BUILDING';
        this.targetBase = null;
        this.myBase = null;

        // Difficulty Presets
        const presets = {
            EASY: { buildInterval: 4.0, miningLimit: 3, attackThreshold: 10 },
            MEDIUM: { buildInterval: 2.0, miningLimit: 5, attackThreshold: 6 },
            HARD: { buildInterval: 1.0, miningLimit: 8, attackThreshold: 4 }
        };

        this.config = presets[difficulty] || presets.MEDIUM;
        console.log(`Enemy AI initialized on ${difficulty} mode:`, this.config);
    }

    start() {
        console.log("Enemy AI Activated");
    }

    update(dt) {
        // AI Income (Fair Mode: Mining Only)
        const myUnits = this.game.units.filter(u => u.team === 'enemy');
        const miners = myUnits.filter(u => u.type === 'miner');

        // Deadlock prevention (Emergency Income)
        if (miners.length === 0 && this.credits < 50) {
            this.credits += 5 * dt; // Slow trickle to get back in game
        }

        // Find Bases (Cache rarely)
        this.searchTimer += dt;
        if (this.searchTimer > 1.0) {
            this.searchTimer = 0;
            this.myBase = this.game.buildings.find(b => b.team === 'enemy');
            this.targetBase = this.game.buildings.find(b => b.team === 'player');

            // Calculate my energy
            // Simplified energy check without accessing GameEngine state directly
            // We can calculate from modules
            if (this.myBase) {
                const modules = this.myBase.modules;
                // Use configs
                const solarProd = (modules.solar || 0) * (GAME_CONFIG.base.modules.solar.energyRate || 20);

                // Consumption
                let consumption = 0;
                // Map logical keys to config keys
                // Config: turret, repair, hangar, factory, silo, depot
                // Base modules might use 'radar' instead of 'turret'
                const turretLvl = modules.turret || modules.radar || 0;
                consumption += turretLvl * Math.abs(GAME_CONFIG.base.modules.turret.energyRate || 5);

                if (modules.repair) consumption += modules.repair * Math.abs(GAME_CONFIG.base.modules.repair.energyRate || 8);
                if (modules.hangar) consumption += modules.hangar * Math.abs(GAME_CONFIG.base.modules.hangar.energyRate || 10);
                if (modules.factory) consumption += modules.factory * Math.abs(GAME_CONFIG.base.modules.factory.energyRate || 20);
                if (modules.silo) consumption += modules.silo * Math.abs(GAME_CONFIG.base.modules.silo.energyRate || 15);
                if (modules.depot) consumption += modules.depot * Math.abs(GAME_CONFIG.base.modules.depot.energyRate || 5);

                this.energyNet = solarProd - consumption;
            }
        }

        if (!this.myBase) return; // AI is dead

        // Make Decisions
        this.decisionTimer += dt;
        if (this.decisionTimer > this.config.buildInterval) {
            this.decisionTimer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myUnits = this.game.units.filter(u => u.team === 'enemy');
        const miners = myUnits.filter(u => u.type === 'miner');
        const fighters = myUnits.filter(u => u.type === 'fighter' || u.type === 'tank');

        // 0. Energy Check (Critical)
        if (this.energyNet < 20) { // Safety buffer
            // Need power
            this.buildModule('solar');
            return;
        }

        // 1. Eco Check
        if (miners.length < this.config.miningLimit) {
            if (this.credits >= GAME_CONFIG.units.miner.cost) {
                this.spawnUnit('miner');
                return;
            }
        }

        // 2. Tech Check (Unlock Units)
        // If we want fighters but have no hangar
        if (this.credits > 400) { // Rich? Upgrade
            if (!this.myBase.modules.hangar) {
                this.buildModule('hangar');
                return;
            }
        }
        if (this.credits > 600) {
            // Maybe build Silo for nukes?
            if (!this.myBase.modules.silo) {
                this.buildModule('silo');
                return;
            }
        }

        // 2.5 Defense
        if (this.credits > 300 && (this.myBase.modules.turret || this.myBase.modules.radar || 0) < 2) {
            this.buildModule('turret');
        }

        // 3. Army Check
        const limit = GAME_CONFIG.gameplay.maxUnits || 50;
        if (myUnits.length < limit) {
            if (fighters.length < this.config.attackThreshold) {
                // Build Army
                const hasHangar = this.myBase.modules.hangar > 0;
                const hasFactory = this.myBase.modules.factory > 0;
                const hasSilo = this.myBase.modules.silo > 0;

                // Random Strategy
                const rnd = Math.random();

                if (hasFactory && rnd < 0.3) {
                    if (this.credits >= GAME_CONFIG.units.tank.cost) this.spawnUnit('tank');
                } else if (hasSilo && rnd > 0.8) {
                    if (this.credits >= GAME_CONFIG.units.kamikaze.cost) this.spawnUnit('kamikaze');
                } else if (hasHangar) {
                    if (this.credits >= GAME_CONFIG.units.fighter.cost) this.spawnUnit('fighter');
                } else {
                    // Try to save for modules
                }
            } else {
                // 4. Attack!
                this.launchAttack(fighters);
            }
        }
    }

    addCredits(amount) {
        this.credits += amount;
    }

    buildModule(type) {
        // Map abstract types to config keys if needed
        // Key mapping: 'turret' -> 'radar' (legacy key in GameEngine?) or update GameEngine?
        // GameEngine upgradeBase hardcodes: const costs = { solar: 100, radar: 100, repair: 150 };
        // I need to update GameEngine to assume 'turret', 'hangar', 'factory'.
        // For now, I will invoke a direct upgrade method if I can, or simulate player action.
        // Actually, I should call a method on GameEngine to upgrade ENEMY base.
        // GameEngine.upgradeBase finds 'player' base strictly.
        // I need to add enemy upgrade support to GameEngine or handle it here.

        // Direct manipulation for AI since GameEngine is Player-Centric for upgrades
        const moduleConfig = GAME_CONFIG.base.modules[type];
        // Note: 'radar' key vs 'turret' key issue. Config used 'turret'. Logic used 'radar'.
        // I should fix this discrepancy. 
        // Let's assume I fix GameEngine to use 'turret' key or mapped correctly.
        // For now, I will modify myBase directly if affordable.

        let cost = moduleConfig ? moduleConfig.cost : 0;
        // Fix for 'turret' vs 'radar'
        if (type === 'turret' && !moduleConfig) cost = GAME_CONFIG.base.modules.turret.cost;

        if (this.credits >= cost) {
            this.credits -= cost;

            // Handle key mapping for existing logic
            let key = type;
            if (type === 'turret') key = 'radar'; // Legacy support for visual/loop

            if (this.myBase.modules[key] !== undefined) {
                this.myBase.modules[key]++;
                console.log(`AI Built ${key}`);
            } else {
                // Initialize if missing (Hangar/Factory might be undefined initally)
                this.myBase.modules[key] = 1;
                console.log(`AI Built New ${key} module`);
            }
        }
    }

    spawnUnit(type) {
        const cost = GAME_CONFIG.units[type].cost;
        if (this.credits >= cost) {
            this.credits -= cost;
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            const unit = new Unit(this.myBase.x + offsetX, this.myBase.y + offsetY, 'enemy', type);
            this.game.units.push(unit);
            console.log(`AI Spawned ${type}`);

            if (type === 'miner') {
                const nearestAsteroid = this.findNearestAsteroid(unit.x, unit.y);
                if (nearestAsteroid) {
                    // Need to use GameEngine helper or manual?
                    // GameEngine helper orderMine works for any unit object
                    this.game.orderMine(unit, nearestAsteroid);
                }
            }
        }
    }
    // ... keep existing launchAttack and findNearestAsteroid

    launchAttack(squad) {
        if (!this.targetBase) return;

        console.log("AI Launching Attack!");
        squad.forEach(u => {
            if (u.state !== 'ATTACKING') {
                u.moveTo(this.targetBase.x, this.targetBase.y);
                u.targetEntity = this.targetBase; // Prioritize Base
                // u.state = 'ATTACKING'; // Let movement logic handle state
            }
        });
    }

    findNearestAsteroid(x, y) {
        let nearest = null;
        let minInfo = Infinity;
        this.game.asteroids.forEach(ast => {
            const d = (ast.x - x) ** 2 + (ast.y - y) ** 2;
            if (d < minInfo && ast.resources > 0) {
                minInfo = d;
                nearest = ast;
            }
        });
        return nearest;
    }
}
