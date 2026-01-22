export class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity || { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 };
        this.life = 1.0;
        this.decay = 1.0 + Math.random(); // Random decay
        this.size = Math.random() * 5 + 2;
    }

    update(dt) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life -= this.decay * dt;
        this.size *= 0.95; // Shrink
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}
