import { drawIsoBlob } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Slime extends Character {
    constructor(x, y, stage, size = 3) {
        // Base health 50 * size, base speed 0.5 * size
        super(x, y, stage, 50 * size, 0.5 + (3 - size) * 0.2, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw();
        this.size = size;
        this.attackCooldown = 0;
        this.attackPower = 10 * size;
    }

    draw() {
        this.sprite.clear();
        drawIsoBlob(this.sprite, 0x2ecc71, this.size * 0.8, { outline: 0x27ae60 });
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
                if (dist < 500) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (closestTarget) {
            if (closestDist < 10 * this.size + 10) {
                this.targetDx = 0;
                this.targetDy = 0;
                if (this.attackCooldown <= 0) {
                    closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
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
            this.targetDx = 0;
            this.targetDy = 0;
        }

        this.move(this.targetDx, this.targetDy, delta);

        if (this.health <= 0 && this.size > 1 && !this.hasSplit) {
            this.hasSplit = true;
            allEntities.push(new Slime(this.x - 15, this.y - 15, this.stage, this.size - 1));
            allEntities.push(new Slime(this.x + 15, this.y + 15, this.stage, this.size - 1));
        }
    }
}
