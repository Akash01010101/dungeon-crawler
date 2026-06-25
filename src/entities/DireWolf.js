import * as PIXI from 'pixi.js';
import { Character } from './Character.js';
import { Wolf } from './Wolf.js';

export class DireWolf extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 150, 1.2, 'predator');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw();
        this.attackCooldown = 0;
        this.attackPower = 25;
        this.state = 'Wander';
        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        
        this.hasHowled = false; // Only summons pack once
    }

    draw(color) {
        this.sprite.clear();
        this.sprite.circle(0, 0, 20); // Larger than normal wolf
        this.sprite.fill(0x333333); // Darker
        this.sprite.stroke({ color: 0xff0000, width: 2 }); // Red glowing eyes
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let targetNear = false;
        let closestTarget = null;
        let closestDist = Infinity;

        // Hunt logic
        for (const entity of allEntities) {
            if ((entity.faction === 'herbivore' || entity.faction === 'player' || entity.faction === 'neutral') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 600) {
                    targetNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestTarget = entity;
                    }
                }
            }
        }

        if (targetNear) {
            this.state = 'Hunt';
            
            // Pack Summon Mechanic
            if (!this.hasHowled) {
                this.hasHowled = true;
                // Spawn 2 normal wolves nearby
                for (let i = 0; i < 2; i++) {
                    const wolf = new Wolf(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, this.stage);
                    allEntities.push(wolf);
                }
                // Optional: show some text or effect
            }
        } else {
            this.state = 'Wander';
        }

        let moveSpeedMod = 1.0;
        switch (this.state) {
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

            case 'Hunt':
                if (closestTarget) {
                    if (closestDist < 50) {
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestTarget.takeDamage(this.attackPower, 0xff0000, 'predator');
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
                }
                moveSpeedMod = 1.3;
                break;
        }

        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
