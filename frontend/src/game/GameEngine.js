import { BaseStation } from './entities/BaseStation';
import { Asteroid } from './entities/Asteroid';
import { Unit } from './entities/Unit';
import { GAME_CONFIG } from '../config/GameConfig';
import { EnemyAI } from './EnemyAI';
import { Particle } from './entities/Particle';
import { PowerUp } from './entities/PowerUp';
import { AudioManager } from './AudioManager';

export class GameEngine {
    constructor(canvas, onGameStateChange, upgrades = {}, difficulty = 'MEDIUM') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.worldWidth = GAME_CONFIG.world.width;
        this.worldHeight = GAME_CONFIG.world.height;
        this.camera = { x: 0, y: 0 };
        this.keys = {};

        this.onGameStateChange = onGameStateChange;

        // Upgrades: { drill: lvl, armor: lvl, speed: lvl }
        this.upgrades = upgrades;
        console.log("GameEngine initialized with Upgrades:", this.upgrades);

        this.isRunning = false;
        this.lastTime = 0;

        this.credits = GAME_CONFIG.economy.startingCredits;

        // Entity Collections
        this.units = [];
        this.buildings = [];
        this.asteroids = [];
        this.particles = [];
        this.powerups = [];
        this.stars = [];
        this.initStars();

        // Initialize Audio
        this.audio = new AudioManager();

        // Effects
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // UI Throttling
        this.uiTimer = 0;

        // Input Handling
        // Input Handling
        this.selectedUnits = [];
        this.selectedUnit = null; // Deprecated but might linger logic, remove usage.

        this.loop = this.loop.bind(this);

        // Bind Input Handlers for Cleanup
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);

        this.initWorld();
        this.setupInput();
    }

    initWorld() {
        this.units = [];
        this.buildings = [];
        this.asteroids = [];

        // Stats
        this.kills = 0;
        this.startTime = Date.now();

        // Spawn Bases
        // Player: Top-Left
        const pBase = new BaseStation(200, 200, 'player');
        this.buildings.push(pBase);

        // Enemy: Bottom-Right
        const eBase = new BaseStation(this.worldWidth - 200, this.worldHeight - 200, 'enemy');
        this.buildings.push(eBase);

        // Spawn Starter Drone for Player
        const miner = new Unit(pBase.x + 50, pBase.y + 50, 'player', 'miner', this.upgrades);
        this.units.push(miner);

        // Initialize Enemy AI
        this.enemyAI = new EnemyAI(this);
        this.enemyAI.start();

        // Spawn Asteroids Randomly
        for (let i = 0; i < 30; i++) {
            this.spawnAsteroid();
        }
    }

    spawnAsteroid() {
        // Random position if not provided
        let x = Math.random() * this.worldWidth;
        let y = Math.random() * this.worldHeight;

        // Ensure not on top of bases (simple check)
        const pBase = this.buildings.find(b => b.team === 'player');
        const eBase = this.buildings.find(b => b.team === 'enemy');

        if (pBase && Math.abs(x - pBase.x) < 300 && Math.abs(y - pBase.y) < 300) return;
        if (eBase && Math.abs(x - eBase.x) < 300 && Math.abs(y - eBase.y) < 300) return;

        const r = Math.random();
        let type = 'medium';
        if (r < 0.3) type = 'small';
        else if (r > 0.8) type = 'large'; // 20% large

        this.asteroids.push(new Asteroid(x, y, type));
    }

    setupInput() {
        this.lastClickTime = 0;
        this.lastClickType = null;

        // Lasso State
        this.isLassoMode = false;
        this.isDraggingLasso = false;
        this.lassoStart = { x: 0, y: 0 };
        this.lassoCurrent = { x: 0, y: 0 };

        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);

        // Keyboard for Camera
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            if (e.key === 'e' || e.key === 'E' || e.key === 'u' || e.key === 'U') {
                this.toggleLassoMode();
            }
            if (e.key === 'q' || e.key === 'Q') {
                this.selectAllArmy();
            }
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
    }

    handlePointerDown(e) {
        // Resume Audio Context on interaction
        this.audio.init();

        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const worldX = screenX + this.camera.x;
        const worldY = screenY + this.camera.y;

        if (this.isLassoMode) {
            this.isDraggingLasso = true;
            this.lassoStart = { x: worldX, y: worldY };
            this.lassoCurrent = { x: worldX, y: worldY };
        } else {
            this.handleInput(worldX, worldY);
        }
    }

    handlePointerMove(e) {
        if (this.isDraggingLasso) {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            this.lassoCurrent = {
                x: screenX + this.camera.x,
                y: screenY + this.camera.y
            };
        }
    }

    handlePointerUp(e) {
        if (this.isDraggingLasso) {
            this.isDraggingLasso = false;
            this.finishLassoSelection();
        }
    }

    toggleLassoMode() {
        this.isLassoMode = !this.isLassoMode;
        console.log("Lasso Mode:", this.isLassoMode);
        this.onGameStateChange({ isLassoMode: this.isLassoMode });
        return this.isLassoMode;
    }

    finishLassoSelection() {
        // Calculate Rect
        const x1 = Math.min(this.lassoStart.x, this.lassoCurrent.x);
        const y1 = Math.min(this.lassoStart.y, this.lassoCurrent.y);
        const x2 = Math.max(this.lassoStart.x, this.lassoCurrent.x);
        const y2 = Math.max(this.lassoStart.y, this.lassoCurrent.y);

        this.selectedUnits = this.units.filter(u => {
            return u.team === 'player' &&
                u.x >= x1 && u.x <= x2 &&
                u.y >= y1 && u.y <= y2;
        });

        console.log(`Lasso Selected: ${this.selectedUnits.length} units`);

        // Auto-disable lasso after select? Or keep it?
        // Usually toggle off makes sense to allow immediate command.
        this.isLassoMode = false;
        this.onGameStateChange({ isLassoMode: false });
    }

    handleInput(x, y) {
        const currentTime = performance.now();

        // 1. Try to select a unit (Smart Selection with 30px radius)
        let clickedUnit = null;
        let minDist = 30; // Expanded hitbox

        for (const unit of this.units) {
            if (unit.team === 'player') {
                const dx = unit.x - x;
                const dy = unit.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Use unit's specific hit radius (+ small buffer to make clicking easier)
                const hitR = (unit.hitRadius || 20) + 10;

                if (dist < hitR) {
                    // Check if it's "closer" than previous candidate (z-order ish)
                    if (dist < minDist) {
                        minDist = dist;
                        clickedUnit = unit;
                    }
                }
            }
        }

        if (clickedUnit) {
            // DOUBLE TAP CHECK
            if (this.lastClickType === clickedUnit.type && (currentTime - this.lastClickTime) < 400) {
                // Select ALL of this type
                this.selectedUnits = this.units.filter(u => u.type === clickedUnit.type && u.team === 'player');
                console.log(`Double Tap! Selected all ${clickedUnit.type}`);
            } else {
                // Single Select
                this.selectedUnits = [clickedUnit];
                this.selectedUnit = clickedUnit;
                console.log("Unit Selected:", clickedUnit);
                this.audio.play('select');
            }

            this.lastClickTime = currentTime;
            this.lastClickType = clickedUnit.type;
            return;
        }

        // 2. If valid selection exists, issue command
        if (this.selectedUnits && this.selectedUnits.length > 0) {
            // Check for Asteroid (Mining) - Expanded hitbox for rocks too
            let clickedAsteroid = null;
            let minAstDist = 40; // Easier to click rocks

            for (const ast of this.asteroids) {
                const dx = ast.x - x;
                const dy = ast.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minAstDist) { // Use fixed radius for clicking simplicity
                    minAstDist = dist;
                    clickedAsteroid = ast;
                }
            }

            if (clickedAsteroid) {
                // MINE COMMAND
                this.selectedUnits.forEach(u => {
                    u.moveTo(clickedAsteroid.x, clickedAsteroid.y);
                    u.targetEntity = clickedAsteroid;
                });
                console.log("Command: Mine");
            } else {
                // MOVE COMMAND
                this.selectedUnits.forEach(u => {
                    u.moveTo(x, y);
                    // Clear target entity if moving into empty space
                    u.targetEntity = null;
                    u.state = 'MOVING';
                });
                console.log("Command: Move to", x, y);
            }
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
    }

    destroy() {
        this.stop();
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerup', this.handlePointerUp);
        console.log("GameEngine destroyed, listeners removed.");
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        if (this.buildings.length === 0) this.initWorld();
        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    loop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(this.loop);
    }

    update(dt) {
        if (this.enemyAI) this.enemyAI.update(dt);

        // Physics Updates
        this.asteroids.forEach(a => {
            a.update(dt);
            // Wrap around world? or Bounce? Let's just wrap for now or let them drift off and delete equivalent
            // Simple bound check to keep them somewhat in field
            if (a.x < -100) a.x = this.worldWidth + 100;
            if (a.x > this.worldWidth + 100) a.x = -100;
            if (a.y < -100) a.y = this.worldHeight + 100;
            if (a.y > this.worldHeight + 100) a.y = -100;
        });

        // Respawn Asteroids
        if (this.asteroids.length < 20) {
            if (Math.random() < 0.05) this.spawnAsteroid(); // Slowly repopulate
        }

        // Camera Movement
        const camSpeed = 500 * dt;
        if (this.keys['w'] || this.keys['ArrowUp']) this.camera.y -= camSpeed;
        if (this.keys['s'] || this.keys['ArrowDown']) this.camera.y += camSpeed;
        if (this.keys['a'] || this.keys['ArrowLeft']) this.camera.x -= camSpeed;
        if (this.keys['d'] || this.keys['ArrowRight']) this.camera.x += camSpeed;

        // Clamp Camera
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.height));

        // UI Throttling (10Hz update)
        this.uiTimer += dt;
        if (this.uiTimer > 0.1) {
            this.uiTimer = 0;
            this.onGameStateChange({
                credits: this.credits,
                energy: this.energy || 0,
                energyMax: this.energyMax || 500,
                energyRate: this.energyRate || 0,
                baseModules: this.buildings[0] ? this.buildings[0].modules : {}
            });
        }

        // Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) this.shakeIntensity = 0;
        }

        // Particles
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);

        this.units.forEach(u => u.update(dt));
        this.buildings.forEach(b => b.update(dt));
        this.buildings.forEach(b => b.update(dt));
        this.asteroids.forEach(a => a.update(dt));

        // PowerUps
        this.powerups.forEach(p => p.update(dt));
        this.powerups = this.powerups.filter(p => p.life > 0);

        // Check PowerUp Collisions
        this.powerups.forEach((p, pIndex) => {
            for (const u of this.units) {
                if (u.team === 'player') {
                    const dx = u.x - p.x;
                    const dy = u.y - p.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 30) {
                        // PICKUP!
                        this.activatePowerUp(p.type);
                        this.powerups.splice(pIndex, 1);
                        this.spawnExplosion(p.x, p.y, '#FFFFFF', 10);
                        break; // One pickup event
                    }
                }
            }
        });

        // Combat & Logic Loop
        const allEntities = [...this.units, ...this.buildings];

        // Base Modules Logic
        this.buildings.forEach(b => {
            if (b.team === 'player') {
                // --- Energy Calculation ---
                const solarOutput = GAME_CONFIG.base.modules.solar.power; // 50
                const turretLoad = -GAME_CONFIG.base.modules.turret.power; // 10
                const repairLoad = -GAME_CONFIG.base.modules.repair.power; // 15
                // Hangar/Factory loads will be added when implemented in state

                let energyProd = b.modules.solar * solarOutput;
                // Safe check for keys
                const turretLvl = b.modules.turret || b.modules.radar || 0;
                let energyLoad = (turretLvl * turretLoad) + (b.modules.repair * repairLoad);

                // Add Hangar/Factory load
                if (b.modules.hangar) energyLoad += b.modules.hangar * GAME_CONFIG.base.modules.hangar.power; // -20
                if (b.modules.factory) energyLoad += b.modules.factory * GAME_CONFIG.base.modules.factory.power; // -40

                // Add base load? 
                let energyNet = energyProd + energyLoad; // energyLoad is already negative
                this.energy = energyNet; // Store for UI

                // --- Modules Logic (Power Dependent) ---

                // 1. Solar Array (Income)
                // Bonus income from excess power? Or just base income?
                // Let's keep the $5/sec but say it needs to be powered? Solar powers itself.
                if (b.modules.solar > 0) {
                    this.credits += b.modules.solar * 5 * dt;
                }

                // 2. Repair Arm
                if (b.modules.repair > 0 && energyNet >= 0) { // Needs Power
                    const healRange = 300;
                    const healAmount = 10 * b.modules.repair * dt;

                    this.units.forEach(u => {
                        if (u.team === 'player' && u.health < u.maxHealth) {
                            const dist = Math.sqrt((u.x - b.x) ** 2 + (u.y - b.y) ** 2);
                            if (dist < healRange) {
                                u.health = Math.min(u.health + healAmount, u.maxHealth);
                                if (Math.random() < 0.1) this.particles.push(new Particle(u.x, u.y, '#00FF00', { x: 0, y: -10 }));
                            }
                        }
                    });
                }

                // 3. Turret Network
                const turretLevel = b.modules.turret || b.modules.radar || 0; // Support both for safety
                if (turretLevel > 0 && hasPower) { // Needs Power
                    const range = 400;
                    const damage = 20 * turretLevel;
                    const cooldown = 1.0;

                    b.turretTimer = (b.turretTimer || 0) + dt;

                    if (b.turretTimer > cooldown) {
                        const target = this.units.find(u => u.team === 'enemy' && Math.abs(u.x - b.x) < range && Math.abs(u.y - b.y) < range);
                        if (target) {
                            const dist = Math.sqrt((target.x - b.x) ** 2 + (target.y - b.y) ** 2);
                            if (dist < range) {
                                b.turretTimer = 0;
                                this.audio.play('shoot');
                                target.takeDamage(damage);
                                this.particles.push({
                                    update: (dt) => { this.life -= dt; },
                                    draw: (ctx) => {
                                        ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(target.x, target.y); ctx.stroke();
                                    },
                                    life: 0.1
                                });
                            }
                        }
                    }
                }
            }
        });

        this.units.forEach(u => {
            // 1. Mining
            if (u.state === 'MINING' && u.targetEntity instanceof Asteroid) {
                if (u.targetEntity.resources > 0) {
                    const baseRate = GAME_CONFIG.economy.miningRatePerSecond;
                    const bonus = (this.upgrades.drill || 0) * 0.10; // +10% per level
                    const miningRate = baseRate * (1 + bonus);

                    const mined = miningRate * dt;
                    u.targetEntity.resources -= mined;

                    if (u.team === 'player') {
                        this.credits += mined;
                    } else if (u.team === 'enemy' && this.enemyAI) {
                        this.enemyAI.credits += mined;
                    }
                } else {
                    u.state = 'IDLE';
                    u.targetEntity = null;
                }
            }

            // 2. Auto-Attack Targeting
            if ((u.state === 'IDLE' || u.state === 'MOVING') && u.damage > 0) {
                let closest = null;
                let minDist = u.attackRange;

                for (const target of allEntities) {
                    if (target.team !== u.team && target.team !== 'neutral' && target.health > 0) {
                        const dx = target.x - u.x;
                        const dy = target.y - u.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < minDist) {
                            minDist = dist;
                            closest = target;
                        }
                    }
                }

                if (closest) {
                    u.state = 'ATTACKING';
                    u.targetEntity = closest;
                }
            }

            // --- Mining Logic (Player & AI) ---
            if (u.state === 'MINING' && u.targetEntity instanceof Asteroid) {
                const asteroid = u.targetEntity;
                const dx = asteroid.x - u.x;
                const dy = asteroid.y - u.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    // Mine
                    if (asteroid.resources > 0) {
                        const amount = GAME_CONFIG.economy.miningRatePerSecond * dt;
                        // Check capacity
                        if (u.cargo < u.maxCargo) {
                            asteroid.resources -= amount;
                            u.cargo += amount;
                            if (u.cargo > u.maxCargo) u.cargo = u.maxCargo;

                            // Clean up asteroid if empty
                            if (asteroid.resources <= 0) {
                                this.asteroids = this.asteroids.filter(a => a !== asteroid);
                                if (u.type === 'miner') u.state = 'IDLE'; // Or return instantly if cargo > 0?
                                if (u.cargo > 0) this.orderReturnToBase(u);
                            }
                        } else {
                            // Full -> Return to Base
                            this.orderReturnToBase(u);
                        }
                    } else {
                        // Empty asteroid
                        u.state = 'IDLE';
                    }
                } else {
                    // Too far to mine, move closer (should be handled by MoveTo but safety check)
                    u.moveTo(asteroid.x, asteroid.y);
                    u.targetEntity = asteroid; // Re-assign ensuring state correct
                    u.state = 'MINING'; // Force state back if movement finished but not mining
                }
            }

            // --- Returning Logic ---
            if (u.state === 'RETURNING') {
                // Check distance to base
                const base = this.buildings.find(b => b.team === u.team);
                if (base) {
                    const dx = base.x - u.x;
                    const dy = base.y - u.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 200) { // Deposit Range
                        // Deposit
                        if (u.team === 'player') {
                            this.credits += u.cargo;
                            this.particles.push(new Particle(base.x, base.y, '#FFD700', { x: 0, y: -20 }, `+$${Math.floor(u.cargo)}`));
                        } else {
                            // Enemy income
                            // Simplification for AI: Just add to pool if we tracked it, but AI uses unlimited/cheat usually?
                            // No, we removed cheat. AI needs this credits.
                            if (this.enemyAI) this.enemyAI.credits += u.cargo;
                        }
                        u.cargo = 0;

                        // Return to mining?
                        if (u.lastAsteroid && this.asteroids.includes(u.lastAsteroid)) {
                            u.state = 'MINING';
                            u.targetEntity = u.lastAsteroid;
                            u.moveTo(u.lastAsteroid.x, u.lastAsteroid.y);
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < (base.width / 2 + u.hitRadius + 10)) {
                                u.state = 'OFFLOADING'; // New State
                            } else {
                                u.moveTo(base.x, base.y);
                            }
                        } else {
                            u.state = 'IDLE'; // Base destroyed
                        }
                    } else if (u.state === 'OFFLOADING') {
                        const base = u.targetEntity;
                        if (!base || !base.modules.depot) {
                            u.state = 'IDLE';
                            return;
                        }

                        // Offload Rate
                        const offloadRate = 10; // Resources per second
                        const amount = Math.min(u.cargo, offloadRate * dt);

                        u.cargo -= amount;

                        // Add to credits
                        if (u.team === 'player') {
                            this.credits += amount;
                            this.onGameStateChange({ credits: this.credits });
                        } else {
                            // Enemy logic (AI class handles or assume similar?)
                            // EnemyAI monitors credits, but GameEngine owns the 'truth'.
                            // We should add to AI credits if we track it here, OR 
                            // EnemyAI checks its own units?
                            // Currently EnemyAI has its own 'this.credits'.
                            // This is a split source of truth problem.
                            // IMPORTANT: GameEngine should manage ALL credits.
                            // But for now, let's keep it simple: Player gets credits here.
                            // EnemyAI logic might break if it doesn't see credits increasing.
                            // EnemyAI.js reads `miners` to check eco, but credits are `this.credits` in AI class.
                            // I should fix AI to read from GameEngine or push to AI.
                            // Let's create `addCredits(team, amount)` helper.
                            this.addCredits(u.team, amount);
                        }

                        // Visuals for offload
                        if (Math.random() < 0.2) {
                            this.particles.push(new Particle(u.x, u.y, '#00FF00', { x: 0, y: -20 }));
                        }

                        if (u.cargo <= 0) {
                            u.cargo = 0;
                            u.state = 'IDLE';
                            // Resume Mining
                            if (u.lastAsteroid && u.lastAsteroid.resources > 0) {
                                this.orderMine(u, u.lastAsteroid);
                            } else {
                                const nearest = this.findNearestAsteroid(u);
                                if (nearest) this.orderMine(u, nearest);
                            }
                        }
                    }

                    // 3. Attacking Logic
                    if (u.state === 'ATTACKING') {
                        if (u.targetEntity && u.targetEntity.health > 0) {
                            const dx = u.targetEntity.x - u.x;
                            const dy = u.targetEntity.y - u.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist > u.attackRange) {
                                u.state = 'IDLE';
                                u.targetEntity = null;
                            } else {
                                // Kamikaze Logic
                                if (u.type === 'kamikaze') {
                                    if (u.targetEntity.takeDamage) {
                                        u.targetEntity.takeDamage(u.damage);
                                    } else {
                                        u.targetEntity.health -= u.damage;
                                    }

                                    u.health = 0; // Destroy self
                                    console.log("BOOM! Kamikaze hit.");
                                    this.spawnExplosion(u.x, u.y, '#FFA500', 30);
                                    this.triggerShake(10, 0.5);
                                } else {
                                    // Normal Ranged Attack
                                    u.lastAttackTime += dt * 1000;
                                    if (u.lastAttackTime >= u.cooldown) {
                                        u.lastAttackTime = 0;
                                        this.audio.play('shoot');
                                        if (u.targetEntity.takeDamage) {
                                            u.targetEntity.takeDamage(u.damage);
                                        } else {
                                            u.targetEntity.health -= u.damage;
                                        }
                                    } // End Attack Cooldown
                                }
                            }
                        } else {
                            // Target Dead or Invalid
                            u.state = 'IDLE';
                            u.targetEntity = null;
                        }
                    }
                }
            }
        }
                }); // End forEach

        // --- End of Unit Loop ---

        // Cleanup Dead Entities
        // Count kills before removing
        this.units.forEach(u => {
            if (u.health <= 0 && u.team === 'enemy') {
                this.kills++;
            }
        });

this.units = this.units.filter(u => u.health > 0);
this.buildings = this.buildings.filter(b => {
    if (b.health <= 0) {
        console.log("BASE DESTROYED:", b.team);
        this.spawnExplosion(b.x, b.y, b.team === 'player' ? '#FFFF00' : '#0000FF', 100);
        this.triggerShake(20, 1.0);
        this.audio.play('gameover');

        const isPlayerWin = b.team === 'enemy';
        const survivalTime = Math.floor((Date.now() - this.startTime) / 1000);

        this.onGameStateChange({
            credits: this.credits,
            gameOver: isPlayerWin ? 'win' : 'lose',
            stats: {
                wave: this.waveManager ? this.waveManager.waveNumber : 1,
                kills: this.kills,
                time: survivalTime
            }
        });

        this.stop();
        return false;
    }
    return true;
});
this.asteroids = this.asteroids.filter(a => a.resources > 0);
    }

// --- Helper Methods for Logistics ---

orderReturnToDepot(unit) {
    // Find nearest base with Depot
    const myBases = this.buildings.filter(b => b.team === unit.team && b.modules.depot > 0);

    let nearest = null;
    let minDist = Infinity;

    myBases.forEach(b => {
        const d = (b.x - unit.x) ** 2 + (b.y - unit.y) ** 2;
        if (d < minDist) {
            minDist = d;
            nearest = b;
        }
    });

    if (nearest) {
        unit.targetEntity = nearest;
        unit.state = 'RETURNING';
        unit.moveTo(nearest.x, nearest.y);
    } else {
        // No depot? Stop.
        unit.state = 'IDLE';
        console.log("No Depot found for miner!");
    }
}

addCredits(team, amount) {
    if (team === 'player') {
        this.credits += amount;
        this.onGameStateChange({ credits: this.credits });
    } else if (team === 'enemy' && this.enemyAI) {
        this.enemyAI.addCredits(amount);
    }
}

findNearestAsteroid(unit) {
    let nearest = null;
    let minDst = Infinity;
    for (const ast of this.asteroids) {
        if (ast.resources > 0) {
            const d = (unit.x - ast.x) ** 2 + (unit.y - ast.y) ** 2;
            if (d < minDst) {
                minDst = d;
                nearest = ast;
            }
        }
    }
    return nearest;
}

orderMine(unit, asteroid) {
    unit.state = 'MINING';
    unit.targetEntity = asteroid;
    unit.moveTo(asteroid.x, asteroid.y);
}

spawnUnit(type) {
    const unitConfig = GAME_CONFIG.units[type];
    if (this.credits >= unitConfig.cost) {
        this.credits -= unitConfig.cost;

        // Find player base
        const base = this.buildings.find(b => b.team === 'player');
        const spawnX = base ? base.x : 100;
        const spawnY = base ? base.y : 100;

        // Random offset
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        const newUnit = new Unit(spawnX + offsetX, spawnY + offsetY, 'player', type, this.upgrades);
        // newUnit.speed = newUnit.speed; // Already set in constructor

        this.units.push(newUnit);

        this.onGameStateChange({ credits: this.credits });
        return true;
    }
    return false;
}


upgradeBase(moduleType) {
    // Use Config for costs to ensure consistency
    const moduleConfig = GAME_CONFIG.base.modules[moduleType];
    if (!moduleConfig) return false;

    const cost = moduleConfig.cost;

    if (this.credits >= cost) {
        const base = this.buildings.find(b => b.team === 'player');
        if (base) {
            this.credits -= cost;

            // key mapping if needed (radar vs turret legacy)
            // If the UI sends 'turret', and config has 'turret', we use 'turret'.
            // If game logic uses 'radar' (BaseStation.js), we need to ensure it checks 'turret' too or we migrate.
            // Let's migrate logic to use the config key passed (e.g. 'turret').

            let key = moduleType;
            // Init if undefined
            if (base.modules[key] === undefined) base.modules[key] = 0;

            base.modules[moduleType]++;
            this.onGameStateChange({
                credits: this.credits,
                baseModules: base.modules // Update UI
            });
            console.log(`Upgraded ${moduleType} to level ${base.modules[moduleType]}`);
            return true;
        }
    }
    return false;
}

selectAllArmy() {
    this.selectedUnits = this.units.filter(u =>
        u.team === 'player' &&
        u.type !== 'miner' &&
        u.health > 0
    );
    console.log("Selected All Army:", this.selectedUnits.length);
}

triggerShake(amount, duration) {
    this.shakeIntensity = amount;
    this.shakeTimer = duration;
}

spawnExplosion(x, y, color, count = 10) {
    this.audio.play('explode');
    for (let i = 0; i < count; i++) {
        const speed = Math.random() * 50 + 20; // Explosion force
        const angle = Math.random() * Math.PI * 2;
        const vel = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.particles.push(new Particle(x, y, color, vel));
    }
}

activatePowerUp(type) {
    console.log("PowerUp Activated:", type);
    this.audio.play('powerup');
    // Effects
    if (type === 'health') {
        this.units.filter(u => u.team === 'player').forEach(u => {
            u.health = u.maxHealth;
            this.spawnExplosion(u.x, u.y, '#00FF00', 5); // Heal FX
        });
        this.triggerShake(5, 0.2);
    } else if (type === 'nuke') {
        this.units.filter(u => u.team === 'enemy').forEach(u => {
            u.takeDamage(1000);
            this.spawnExplosion(u.x, u.y, '#FF0000', 10);
        });
        this.triggerShake(20, 1.0);
    } else if (type === 'credits') {
        this.credits += 250;
        this.onGameStateChange({ credits: this.credits });
    }
}

spawnPowerUp(x, y, type) {
    this.powerups.push(new PowerUp(x, y, type));
}

draw() {
    this.ctx.fillStyle = '#111'; // Darker "Space" black
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawStars(this.ctx);

    this.ctx.save();

    // Apply Camera
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Apple Screen Shake (Applied ON TOP of camera)
    if (this.shakeTimer > 0) {
        const dx = (Math.random() - 0.5) * this.shakeIntensity;
        const dy = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(dx, dy);
    }

    this.asteroids.forEach(a => a.draw(this.ctx));
    this.powerups.forEach(p => p.draw(this.ctx));
    this.buildings.forEach(b => b.draw(this.ctx));
    this.units.forEach(u => u.draw(this.ctx));
    this.particles.forEach(p => p.draw(this.ctx));

    // Draw selections (World Space)
    this.drawSelections();

    // Lasso
    if (this.isDraggingLasso) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        const w = this.lassoCurrent.x - this.lassoStart.x;
        const h = this.lassoCurrent.y - this.lassoStart.y;
        this.ctx.strokeRect(this.lassoStart.x, this.lassoStart.y, w, h);
        this.ctx.setLineDash([]);
    }

    this.ctx.restore(); // End Camera & Shake

    // UI (Screen Space) defined below...

    // Draw Warning Indicators (WaveManager)
    if (this.waveManager && this.waveManager.pendingSpawns) {
        this.ctx.save();
        this.waveManager.pendingSpawns.forEach(spawn => {
            // Blink effect
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = '30px Arial';

                // Clamp to screen edge so it's visible
                let bx = Math.max(20, Math.min(this.width - 20, spawn.x));
                let by = Math.max(20, Math.min(this.height - 20, spawn.y));

                // If spawn is outside, draw indicator on edge
                // Simple text for now
                this.ctx.fillText("⚠️", bx - 15, by + 10);
            }
        });
        this.ctx.restore();
    }

    // UI
    this.ctx.fillStyle = 'white';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Units: ${this.units.length}`, 20, 70);
} // End draw

drawSelections() {
    this.selectedUnits.forEach(u => {
        this.ctx.strokeStyle = 'cyan';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(u.x, u.y, 25, 0, Math.PI * 2);
        this.ctx.stroke();

        if (u.state === 'MOVING') {
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(u.x, u.y);
            this.ctx.lineTo(u.targetX, u.targetY);
            this.ctx.stroke();
        }
    });
}

// Helper for circular vision
cutVision(x, y, radius) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
}
drawStars(ctx) {
    ctx.fillStyle = 'white';
    this.stars.forEach(star => {
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}
}
