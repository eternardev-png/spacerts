export class Particle {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity || { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
        this.life = 1.0; // 1 second
        this.decay = 2.0; // Life loss per second
        this.size = Math.random() * 3 + 1;
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
