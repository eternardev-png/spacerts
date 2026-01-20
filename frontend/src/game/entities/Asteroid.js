import { GameObject } from './GameObject';
import { GAME_CONFIG } from '../../config/GameConfig';

export class Asteroid extends GameObject {
    constructor(x, y) {
        const size = 60 + Math.random() * 40; // Random size
        super(x, y, size, size, '#808080', 'neutral');

        this.resources = GAME_CONFIG.economy.asteroidTotalResources;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw Resource Count (Debug/Info)
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(this.resources).toString(), this.x, this.y + 5);
    }
}
