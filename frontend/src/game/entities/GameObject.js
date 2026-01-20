export class GameObject {
    constructor(x, y, width, height, color, team = 'neutral') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.team = team; // 'player', 'enemy', 'neutral'
        this.maxHealth = 100;
        this.markedForDeletion = false;

        this.sprite = null;
        this.rotation = 0;
    }

    update(deltaTime) {
        // Base update logic
    }

    draw(ctx) {
        if (this.sprite) {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.rotation) {
                ctx.rotate(this.rotation);
            }
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            // Fallback render: simple rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }
}
