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
            repair: 0  // Healing
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
        super.draw(ctx);

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
