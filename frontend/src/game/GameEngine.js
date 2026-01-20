import { BaseStation } from './entities/BaseStation';
import { Asteroid } from './entities/Asteroid';
import { Unit } from './entities/Unit';
import { GAME_CONFIG } from '../config/GameConfig';
import { WaveManager } from './WaveManager';
import { Particle } from './entities/Particle';
import { PowerUp } from './entities/PowerUp';
import { AudioManager } from './AudioManager';

export class GameEngine {
    constructor(canvas, onGameStateChange, upgrades = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
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
        this.buildings.push(new BaseStation(150, this.height - 150, 'player'));
        // Enemy Base removed for Survival Mode

        // Initialize Wave Manager
        this.waveManager = new WaveManager(this);
        this.waveManager.start();

        // Spawn Asteroids
        for (let i = 0; i < 5; i++) {
            const x = this.width / 2 + (Math.random() - 0.5) * 600;
            const y = this.height / 2 + (Math.random() - 0.5) * 400;
            this.asteroids.push(new Asteroid(x, y));
        }
    }

    setupInput() {
        this.lastClickTime = 0;
        this.lastClickType = null;

        // Lasso State
        this.isLassoMode = false;
        this.isDraggingLasso = false;
        this.lassoStart = { x: 0, y: 0 };
        this.lassoCurrent = { x: 0, y: 0 };

        this.canvas.addEventListener('pointerdown', (e) => {
            // Resume Audio Context on interaction
            this.audio.init();

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.isLassoMode) {
                this.isDraggingLasso = true;
                this.lassoStart = { x, y };
                this.lassoCurrent = { x, y };
            } else {
                this.handleInput(x, y);
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.isDraggingLasso) {
                const rect = this.canvas.getBoundingClientRect();
                this.lassoCurrent = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        });

        this.canvas.addEventListener('pointerup', (e) => {
            if (this.isDraggingLasso) {
                this.isDraggingLasso = false;
                this.finishLassoSelection();
            }
        });
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
                if (dist < minDist) {
                    minDist = dist;
                    clickedUnit = unit;
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

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;

        if (this.buildings.length === 0) this.initWorld();
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
        if (this.waveManager) this.waveManager.update(dt);

        // UI Throttling (10Hz update)
        this.uiTimer += dt;
        if (this.uiTimer > 0.1) {
            this.uiTimer = 0;
            this.onGameStateChange({ credits: this.credits });
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
                // 1. Solar Array (Passive Income)
                if (b.modules.solar > 0) {
                    const income = b.modules.solar * 1 * dt; // $1 per sec per level
                    this.credits += income;
                    this.onGameStateChange({ credits: this.credits });
                }

                // 2. Repair Arm (Heal nearby)
                if (b.modules.repair > 0) {
                    const healRange = 300;
                    const healAmount = 5 * b.modules.repair * dt; // 5 HP/sec per level

                    this.units.forEach(u => {
                        if (u.team === 'player' && u.health < u.maxHealth) {
                            const dist = Math.sqrt((u.x - b.x) ** 2 + (u.y - b.y) ** 2);
                            if (dist < healRange) {
                                u.health = Math.min(u.health + healAmount, u.maxHealth);
                            }
                        }
                    });
                }

                // 3. Radar (Vision) - Update range
                // Base vision 400 + 100 per level
                b.visionRange = 400 + (b.modules.radar * 100);
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
                    this.credits += mined;
                    // Defers UI update to throttled timer
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
                            }
                        }
                    }
                } else {
                    u.state = 'IDLE';
                    u.targetEntity = null;
                }
            }
        });

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
        const costs = { solar: 100, radar: 100, repair: 150 };
        const cost = costs[moduleType];

        if (this.credits >= cost) {
            const base = this.buildings.find(b => b.team === 'player');
            if (base) {
                this.credits -= cost;
                base.modules[moduleType]++;
                this.onGameStateChange({ credits: this.credits });
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
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        // Apple Screen Shake
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

        this.ctx.restore(); // End Shake

        // Draw selections
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

        // FOG OF WAR
        // 1. Save Context
        this.ctx.save();

        // 2. Draw dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark fog
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 3. Cut out holes for Player Entities
        this.ctx.globalCompositeOperation = 'destination-out';

        // Player Base Vision
        const playerBase = this.buildings.find(b => b.team === 'player');
        if (playerBase) {
            this.cutVision(playerBase.x, playerBase.y, playerBase.visionRange);
        }

        // Player Units Vision
        this.units.forEach(u => {
            if (u.team === 'player') {
                this.cutVision(u.x, u.y, u.visionRange);
            }
        });

        // 4. Restore Context
        this.ctx.restore();

        if (this.isDraggingLasso) {
            this.ctx.strokeStyle = '#00FF00';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            const w = this.lassoCurrent.x - this.lassoStart.x;
            const h = this.lassoCurrent.y - this.lassoStart.y;
            this.ctx.strokeRect(this.lassoStart.x, this.lassoStart.y, w, h);
            this.ctx.setLineDash([]);
        }

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
        this.ctx.fillText(`Credits: $${Math.floor(this.credits)}`, 20, 40);
        this.ctx.fillText(`Units: ${this.units.length}`, 20, 70);
    }
    // Helper for circular vision
    cutVision(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
}
