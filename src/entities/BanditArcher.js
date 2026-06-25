import * as PIXI from 'pixi.js';
import { Character } from './Character.js';
import { Projectile } from './Projectile.js';

export class BanditArcher extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 60, 1.3, 'enemy');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw();
        this.attackCooldown = 0;
        
        // Mana system to prevent endless rapid fire
        this.maxMana = 50;
        this.mana = 50;
    }

    draw(color) {
        this.sprite.clear();
        this.sprite.rect(-10, -10, 20, 20);
        this.sprite.fill(0x34495e); // Dark grey
        this.sprite.stroke({ color: 0x2ecc71, width: 2 }); // Green trim
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Regenerate mana
        if (this.mana < this.maxMana) {
            this.mana += 0.2 * delta;
            if (this.mana > this.maxMana) this.mana = this.maxMana;
        }

        let closestTarget = null;
        let closestDist = Infinity;

        for (const entity of allEntities) {
            if ((entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 600) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (closestTarget) {
            if (closestDist < 250) {
                // Too close, kite backwards!
                this.targetDx = this.x - closestTarget.x;
                this.targetDy = this.y - closestTarget.y;
            } else if (closestDist > 350) {
                // Too far, move in!
                this.targetDx = closestTarget.x - this.x;
                this.targetDy = closestTarget.y - this.y;
            } else {
                // Perfect shooting range, stand still
                this.targetDx = 0;
                this.targetDy = 0;
            }
            
            const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
            if (len > 0) {
                this.targetDx /= len;
                this.targetDy /= len;
            }

            if (this.attackCooldown <= 0 && this.mana >= 20) {
                const dirX = closestTarget.x - this.x;
                const dirY = closestTarget.y - this.y;
                
                // Normalize direction
                const len = Math.sqrt(dirX ** 2 + dirY ** 2);
                let normX = 0, normY = 0;
                if (len > 0) {
                    normX = dirX / len;
                    normY = dirY / len;
                }

                // Consume mana and shoot
                this.mana -= 20;
                allEntities.push(new Projectile(this.x, this.y, this.stage, normX, normY, 4, 15, 'enemy', 'enemy'));
                this.attackCooldown = 90; // Slower attack rate
            }

        } else {
            this.targetDx = 0;
            this.targetDy = 0;
        }

        this.move(this.targetDx, this.targetDy, delta);
    }
}
