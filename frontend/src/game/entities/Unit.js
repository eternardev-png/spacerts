import { GameObject } from './GameObject';
import { Asteroid } from './Asteroid';
import { GAME_CONFIG } from '../../config/GameConfig';

export class Unit extends GameObject {
    constructor(x, y, team, type, upgrades = {}) {
        const config = GAME_CONFIG.units[type];
        // Use hitRadius * 2 as visual size base
        super(x, y, config.hitRadius * 2, config.hitRadius * 2, config.color, team);

        this.type = type;

        // Upgrades Modifiers
        const speedBonus = (upgrades.speed || 0) * 0.05; // +5% per level
        const hpBonus = (upgrades.armor || 0) * 0.10;    // +10% per level

        this.speed = config.speed * 60 * (1 + speedBonus);
        this.maxHealth = config.hp * (1 + hpBonus);
        this.health = this.maxHealth;
        this.hitRadius = config.hitRadius || 20;

        // Cargo
        this.cargo = 0;
        this.maxCargo = config.capacity || 0;

        this.damage = config.damage;
        this.attackRange = config.attackRange;
        this.visionRange = config.visionRange || 200;
        this.cooldown = config.attackCooldown;
        this.lastAttackTime = 0;

        this.state = 'IDLE'; // IDLE, MOVING, ATTACKING, MINING
        this.targetX = x;
        this.targetY = y;
        this.targetEntity = null; // Entity to interact with (attack/mine)

        // Visual
        this.flashTimer = 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 0.1; // Flash for 100ms
    }

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.state = 'MOVING';
        this.targetEntity = null;
    }

    update(deltaTime) {
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }

        if (this.state === 'MOVING') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check for arrival
            if (distance < 5) {
                this.x = this.targetX;
                this.y = this.targetY;

                // If we were moving to an entity (Asteroid), switch to Mining?
                if (this.targetEntity instanceof Asteroid && this.type === 'miner') {
                    this.state = 'MINING';
                } else {
                    this.state = 'IDLE';
                }
            } else {
                // Normalize and move
                const moveX = (dx / distance) * this.speed * deltaTime;
                const moveY = (dy / distance) * this.speed * deltaTime;
                this.x += moveX;
                this.y += moveY;

                // Update rotation
                this.rotation = Math.atan2(dy, dx) + Math.PI / 2; // +90deg if sprite faces up
            }
        }
    }

    draw(ctx) {
        // Draw Unit Shape
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.color;
        }

        const size = this.hitRadius;

        // Save context for rotation
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation || 0);

        ctx.beginPath();
        ctx.moveTo(0, -size);             // Tip
        ctx.lineTo(size, size);           // Bottom Right
        ctx.lineTo(-size, size);          // Bottom Left
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Draw Health Bar
        const barWidth = size * 2;
        const hpPercent = this.health / this.maxHealth;

        const hpY = this.y - size - 10;

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - size, hpY, barWidth, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - size, hpY, barWidth * hpPercent, 4);

        // Draw Cargo Bar (if Miner and has cargo)
        if (this.maxCargo > 0) {
            const cargoPercent = this.cargo / this.maxCargo;
            if (cargoPercent > 0) {
                const cargoY = hpY - 6; // Above HP bar
                ctx.fillStyle = '#555';
                ctx.fillRect(this.x - size, cargoY, barWidth, 4);
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.fillRect(this.x - size, cargoY, barWidth * cargoPercent, 4);
            }
        }

        // Draw Mining Laser
        if (this.state === 'MINING' && this.targetEntity) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetEntity.x, this.targetEntity.y);
            ctx.stroke();
        }

        // Draw Returning Beam? Or text?
        if (this.state === 'RETURNING') {
            // Maybe a small icon or text?
        }

        // Draw Attack Laser
        if (this.state === 'ATTACKING' && this.targetEntity) {
            ctx.strokeStyle = '#FF0000'; // Red Laser
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetEntity.x, this.targetEntity.y);
            ctx.stroke();
        }
    }
}
