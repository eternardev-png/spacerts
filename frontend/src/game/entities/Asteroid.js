import { GameObject } from './GameObject';
import { GAME_CONFIG } from '../../config/GameConfig';

export class Asteroid extends GameObject {
    constructor(x, y, type = 'medium') {
        let size, resources, color;

        switch (type) {
            case 'small':
                size = 40;
                resources = 200;
                color = '#888';
                break;
            case 'large':
                size = 120;
                resources = 1500;
                color = '#555';
                break;
            case 'medium':
            default:
                size = 70;
                resources = 500;
                color = '#666';
                break;
        }

        super(x, y, size, size, color, 'neutral');
        this.resources = resources;
        this.type = type;

        // Physics
        const massFactor = type === 'large' ? 0.5 : (type === 'small' ? 1.5 : 1.0);
        this.vx = (Math.random() - 0.5) * 10 * massFactor;
        this.vy = (Math.random() - 0.5) * 10 * massFactor;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.5 * massFactor;

        // Visuals: Generate persistent craters
        this.craters = [];
        const numCraters = Math.floor(Math.random() * 3) + 2 + (type === 'large' ? 3 : 0);
        for (let i = 0; i < numCraters; i++) {
            this.craters.push({
                dist: Math.random() * (size * 0.4), // distance from center
                angle: Math.random() * Math.PI * 2,
                r: Math.random() * (size * 0.1) + 4
            });
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += this.rotationSpeed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Main Body (Centered at 0,0)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Craters
        ctx.fillStyle = '#555'; // Darker gray
        this.craters.forEach(c => {
            const cx = Math.cos(c.angle) * c.dist;
            const cy = Math.sin(c.angle) * c.dist;
            ctx.beginPath();
            ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Effect: Border glow if rich?
        if (this.resources > 0) {
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();

        // Draw Resource Count (Fixed orientation)
        ctx.fillStyle = '#FFD700'; // Gold text
        ctx.fillStyle = '#FFD700'; // Gold text
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.floor(this.resources).toString(), this.x, this.y);
    }
}
