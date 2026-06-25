import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Skeleton extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 30, 1.3, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Fast, low HP
        this.attackCooldown = 0;
        this.attackPower = 8;
        this.state = 'Hunt'; // Always hunts
    }

    draw(color) {
        this.sprite.clear();
        this.sprite.rect(-8, -15, 16, 30);
        this.sprite.fill(0xecf0f1); // Bone white
        this.sprite.stroke({ color: 0x000000, width: 1 });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Night time logic: if daytime, take damage (burn)
        // We don't have global game reference directly, but we can access it through player if needed, or assume game handles it. 
        // Actually, we can check a simple global flag if we added it to entities, or just use Game.js. 
        // Let's rely on Game.js garbage collector or a simple check if we want them to burn in sunlight.
        // For now, they just spawn at night and exist until killed.

        let closestTarget = null;
        let closestDist = Infinity;

        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 1000) { // Large aggro
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (closestTarget) {
            if (closestDist < 30) {
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                    this.attackCooldown = 40; // Fast attack rate
                }
            } else {
                this.targetDx = closestTarget.x - this.x;
                this.targetDy = closestTarget.y - this.y;
                
                const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                if (len > 0) {
                    this.targetDx /= len;
                    this.targetDy /= len;
                }
            }
        } else {
            this.targetDx = 0;
            this.targetDy = 0;
        }

        this.move(this.targetDx, this.targetDy, delta);
    }
}
