import { drawIsoAnimal } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Bear extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 200, 0.8, 'predator');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // High HP, slow, territorial
        this.attackCooldown = 0;
        this.attackPower = 30;
        this.state = 'Sleep';
        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
    }

    // Override to draw a large brown bear
    draw() {
        this.sprite.clear();
        drawIsoAnimal(this.sprite, 0x6E2C00, 1.5, { outline: 0x873600 });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let targetNear = false;
        let closestTarget = null;
        let closestDist = Infinity;

        // Only attack if something gets very close (territorial)
        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'enemy') && typeof entity.takeDamage === 'function' && entity !== this) {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 150) { // Small aggro radius
                    targetNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        // If injured, stay angry and increase aggro radius
        if (this.health < this.maxHealth) {
            for (const entity of allEntities) {
                if ((entity.faction === 'player' || entity.faction === 'enemy') && typeof entity.takeDamage === 'function') {
                    const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                    if (dist < 800) { // Enraged radius
                        targetNear = true;
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestTarget = entity;
                        }
                    }
                }
            }
        }

        if (targetNear) {
            this.state = 'Attack';
        } else if (this.health === this.maxHealth) {
            this.state = 'Sleep';
        } else {
            this.state = 'Wander';
        }

        let moveSpeedMod = 1.0;
        switch (this.state) {
            case 'Sleep':
                this.targetDx = 0;
                this.targetDy = 0;
                moveSpeedMod = 0;
                break;
            case 'Wander':
                this.wanderCooldown -= delta;
                if (this.wanderCooldown <= 0) {
                    this.targetDx = (Math.random() - 0.5) * 2;
                    this.targetDy = (Math.random() - 0.5) * 2;
                    this.wanderCooldown = Math.random() * 120 + 60;
                }
                const wanderLen = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                if (wanderLen > 0) {
                    this.targetDx /= wanderLen;
                    this.targetDy /= wanderLen;
                }
                moveSpeedMod = 0.5;
                break;
            case 'Attack':
                if (closestTarget) {
                    if (closestDist < 40) {
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestTarget.takeDamage(this.attackPower, 0xff0000, 'predator');
                            this.attackCooldown = 80;
                            // Small knockback logic
                            closestTarget.x += (closestTarget.x - this.x) * 0.5;
                            closestTarget.y += (closestTarget.y - this.y) * 0.5;
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
                }
                moveSpeedMod = 1.5; // Charges fast when angry
                break;
        }

        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
