import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Vampire extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 250, 1.4, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Elite, fast
        this.attackCooldown = 0;
        this.attackPower = 20;
    }

    draw() {
        this.sprite.clear();
        drawIsoHumanoid(this.sprite, 0x6c3483, 1.1, { outline: 0xbb8fce });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let closestTarget = null;
        let closestDist = Infinity;

        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 1200) { // Huge aggro
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (closestTarget) {
            if (closestDist < 40) {
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                    
                    // Lifesteal
                    this.health += this.attackPower * 0.5;
                    if (this.health > this.maxHealth) this.health = this.maxHealth;
                    // Optional: show healing text if implemented
                    
                    this.attackCooldown = 50;
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
            // Wander
            this.targetDx = (Math.random() - 0.5);
            this.targetDy = (Math.random() - 0.5);
        }

        this.move(this.targetDx, this.targetDy, delta);
    }
}
