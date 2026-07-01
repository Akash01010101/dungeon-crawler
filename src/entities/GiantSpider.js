import { drawIsoBlob } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class GiantSpider extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 40, 0.4, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Slow until aggroed
        this.attackCooldown = 0;
        this.attackPower = 15;
        this.state = 'Hide';
        
        // Starts almost invisible
        this.sprite.alpha = 0.1;
    }

    // Override to draw an eight-legged star
    draw() {
        this.sprite.clear();
        drawIsoBlob(this.sprite, 0x2c3e50, 1.2, { outline: 0x1abc9c });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let closestTarget = null;
        let closestDist = Infinity;

        // Ambusher logic
        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 200) { // Very small aggro radius for ambush
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (this.health < this.maxHealth) {
            // Unhide completely if attacked
            this.state = 'Attack';
            this.sprite.alpha = 1.0;
        }

        if (closestTarget) {
            this.state = 'Attack';
            this.sprite.alpha = Math.min(1.0, this.sprite.alpha + 0.05 * delta); // Fade in
            
            if (closestDist < 40) {
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                    // Slow debuff applied manually
                    closestTarget.speed = Math.max(0.5, closestTarget.speed - 0.5); 
                    this.attackCooldown = 60;
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
            // Hide and stay still
            this.state = 'Hide';
            this.targetDx = 0;
            this.targetDy = 0;
            this.sprite.alpha = Math.max(0.1, this.sprite.alpha - 0.01 * delta); // Fade out
        }

        let moveSpeedMod = this.state === 'Attack' ? 2.5 : 0; // Very fast sprint when attacking
        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
