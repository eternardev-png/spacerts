import { GameObject } from './GameObject';

export class PowerUp extends GameObject {
    constructor(x, y, type) {
        super(x, y, 30, 30, '#FFFFFF', 'neutral');
        this.type = type; // 'health', 'nuke', 'credits'
        this.life = 30; // 30 seconds before despawn
        this.pulseTimer = 0;
    }

    update(dt) {
        this.life -= dt;
        this.pulseTimer += dt * 5;
    }

    draw(ctx) {
        ctx.save();
        const scale = 1 + Math.sin(this.pulseTimer) * 0.2;

        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        // Box
        ctx.fillStyle = this.getColor();
        ctx.fillRect(-15, -15, 30, 30);

        // Icon / Text
        ctx.fillStyle = 'black';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getIcon(), 0, 0);

        ctx.restore();
    }

    getColor() {
        switch (this.type) {
            case 'health': return '#00FF00';
            case 'nuke': return '#FF0000';
            case 'credits': return '#FFFF00';
            default: return '#FFFFFF';
        }
    }

    getIcon() {
        switch (this.type) {
            case 'health': return '+';
            case 'nuke': return '☢';
            case 'credits': return '$';
            default: return '?';
        }
    }
}
