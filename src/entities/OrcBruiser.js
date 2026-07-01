import { drawIsoBrute } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class OrcBruiser extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 150, 0.7, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Elite Orc
        this.attackCooldown = 0;
        this.attackPower = 25; // High damage
    }

    draw() {
        this.sprite.clear();
        drawIsoBrute(this.sprite, 0x8B0000, 1.3, { outline: 0xe74c3c });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let targetNear = false;
        let closestTarget = null;
        let closestDist = Infinity;

        // Hunt player, neutral, predator
        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral' || entity.faction === 'predator') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 800) {
                    targetNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (targetNear && closestTarget) {
            if (closestDist < 45) {
                // Melee range
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                    // Huge Knockback
                    closestTarget.x += (closestTarget.x - this.x) * 1.2;
                    closestTarget.y += (closestTarget.y - this.y) * 1.2;
                    this.attackCooldown = 90; // Slow swing
                }
            } else {
                // Chase
                this.targetDx = closestTarget.x - this.x;
                this.targetDy = closestTarget.y - this.y;
                
                const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                if (len > 0) {
                    this.targetDx /= len;
                    this.targetDy /= len;
                }
            }
        } else {
            // Wander
            this.targetDx = (Math.random() - 0.5);
            this.targetDy = (Math.random() - 0.5);
        }

        this.move(this.targetDx, this.targetDy, delta);
    }
}
