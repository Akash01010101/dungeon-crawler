import { drawIsoBrute } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Troll extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 500, 0.8, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Boss stats
        this.attackCooldown = 0;
        this.attackPower = 40; // High damage
    }

    draw() {
        this.sprite.clear();
        drawIsoBrute(this.sprite, 0x17a589, 1.6, { outline: 0x1abc9c });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        // Troll Regeneration (5% per second)
        // delta is roughly 1 for 60fps. So 60 frames = 1 sec.
        if (this.health < this.maxHealth) {
            this.health += (this.maxHealth * 0.05 / 60) * delta;
            if (this.health > this.maxHealth) this.health = this.maxHealth;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let closestTarget = null;
        let closestDist = Infinity;

        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 1000) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (closestTarget) {
            if (closestDist < 50) {
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                    // Knockback
                    closestTarget.x += (closestTarget.x - this.x) * 1.5;
                    closestTarget.y += (closestTarget.y - this.y) * 1.5;
                    this.attackCooldown = 90; // Slow attacks
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
