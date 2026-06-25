import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class GoblinShaman extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 50, 1.0, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw();
        this.healCooldown = 0;
    }

    draw(color) {
        this.sprite.clear();
        this.sprite.rect(-8, -8, 16, 16);
        this.sprite.fill(0x8e44ad); // Purple
        this.sprite.stroke({ color: 0x2ecc71, width: 2 }); // Green staff
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.healCooldown > 0) {
            this.healCooldown -= delta;
        }

        let lowestAlly = null;
        let lowestHpRatio = 1.0;

        // Find lowest HP ally
        for (const entity of allEntities) {
            if (entity.faction === 'enemy' && entity !== this) {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 400) {
                    const ratio = entity.health / entity.maxHealth;
                    if (ratio < lowestHpRatio) {
                        lowestHpRatio = ratio;
                        lowestAlly = entity;
                    }
                }
            }
        }

        if (lowestAlly && lowestHpRatio < 1.0) {
            const dist = Math.sqrt((this.x - lowestAlly.x) ** 2 + (this.y - lowestAlly.y) ** 2);
            if (dist < 150) {
                // In heal range, heal them!
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.healCooldown <= 0) {
                    lowestAlly.health += 20;
                    if (lowestAlly.health > lowestAlly.maxHealth) lowestAlly.health = lowestAlly.maxHealth;
                    this.healCooldown = 120; // Slow heal rate
                    // Optional: healing visual effect
                }
            } else {
                // Move towards ally
                this.targetDx = lowestAlly.x - this.x;
                this.targetDy = lowestAlly.y - this.y;
            }
        } else {
            // Run away from player/neutral
            let closestThreat = null;
            let closestThreatDist = Infinity;
            for (const entity of allEntities) {
                if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                    const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                    if (dist < 300 && dist < closestThreatDist) {
                        closestThreatDist = dist;
                        closestThreat = entity;
                    }
                }
            }
            
            if (closestThreat) {
                this.targetDx = this.x - closestThreat.x;
                this.targetDy = this.y - closestThreat.y;
            } else {
                this.targetDx = 0;
                this.targetDy = 0;
            }
        }

        const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
        if (len > 0) {
            this.targetDx /= len;
            this.targetDy /= len;
        }

        this.move(this.targetDx, this.targetDy, delta);
    }
}
