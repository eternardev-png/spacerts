import { GameObject } from './GameObject';
import { GAME_CONFIG } from '../../config/GameConfig';

export class BaseStation extends GameObject {
    constructor(x, y, team) {
        const config = GAME_CONFIG.base;
        const color = team === 'player' ? '#FFD700' : '#4169E1'; // Gold for Player, Blue for Enemy
        super(x, y, config.width, config.height, color, team);

        this.health = config.hp;
        this.maxHealth = config.hp;
        this.regenRate = config.regenRate;
        this.visionRange = config.visionRange || 400;

        // Modules Levels
        this.modules = {
            solar: 0,  // Income
            radar: 0,  // Vision
            repair: 0, // Healing
            depot: 1   // Default: Has depot
        };
    }

    update(deltaTime) {
        // Passive Regeneration
        if (this.health < this.maxHealth) {
            this.health += this.regenRate * deltaTime;
            if (this.health > this.maxHealth) this.health = this.maxHealth;
        }
    }

    draw(ctx) {
        // Draw Base Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw Structure Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // 1. Solar Panels (Visuals)
        if (this.modules.solar > 0) {
            ctx.fillStyle = '#00CED1'; // Cyan/Solar Color
            // Draw 4 panels around
            const size = 20;
            const offset = this.width / 2 + 5;
            // Top
            ctx.fillRect(this.x - size, this.y - offset - 10, size * 2, 10);
            // Bottom
            ctx.fillRect(this.x - size, this.y + offset, size * 2, 10);
            // Left (Vertical)
            ctx.fillRect(this.x - offset - 10, this.y - size, 10, size * 2);
            // Right (Vertical)
            ctx.fillRect(this.x + offset, this.y - size, 10, size * 2);

            // Level indicator text?
            // ctx.fillStyle = 'white';
            // ctx.font = '10px Arial';
            // ctx.fillText(`LVL ${this.modules.solar}`, this.x, this.y - offset - 15);
        }

        // 2. Turret (Visuals)
        const turretLvl = this.modules.turret || this.modules.radar || 0;
        if (turretLvl > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            // Rotate turret towards nearest enemy? Or just spin? Just visual for now
            ctx.rotate(Date.now() / 1000);

            // Turret Base
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();

            // Barrel
            ctx.fillStyle = '#888';
            ctx.fillRect(0, -5, 30, 10); // Barrel styling
            ctx.restore();

            // Range Indicator (Faint)
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 400, 0, Math.PI * 2); // 400 is vision/turret range
            ctx.stroke();
            ctx.restore();
        }

        // 3. Repair Arm (Visuals)
        if (this.modules.repair > 0) {
            ctx.save();
            ctx.translate(this.x - 40, this.y - 40);
            // Green cross
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(0, 5, 20, 5);
            ctx.fillRect(7.5, -2.5, 5, 20);
            ctx.restore();
        }

        // 4. Depot (Visuals)
        if (this.modules.depot > 0) {
            ctx.save();
            // Draw a "landing pad" area
            ctx.strokeStyle = '#FFFF00';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2 + 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Icon
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(this.x + 30, this.y + 30, 20, 20);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText("$", this.x + 40, this.y + 45);
            ctx.restore();
        }

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("BASE", this.x, this.y + 5);

        // Draw HP Bar
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - this.height / 2 - 15;

        // Background
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Foreground
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
    }
}
