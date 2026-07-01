import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';
import { checkCollision } from '../utils/Collision.js';
import { Projectile } from './Projectile.js';

export class Adventurer extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 150, 2.0, 'player'); // 150 health, fast speed, player faction

        this.sprite = new PIXI.Graphics();
        this.sprite.rect(-15, -15, 30, 30);
        this.sprite.fill(0xe67e22); // Orange
        this.container.addChild(this.sprite);

        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        
        this.state = 'Wander';
        this.attackCooldown = 0;
        this.attackPower = 15;
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        // State evaluation
        let enemyNear = false;
        let closestEnemy = null;
        let closestDist = Infinity;

        for (const entity of allEntities) {
            if (entity.faction === 'enemy' && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 600) {
                    enemyNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = entity;
                    }
                }
            }
        }

        if (enemyNear) {
            this.state = 'Combat';
        } else {
            this.state = 'Wander';
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // State Execution
        let moveSpeedMod = 1.0;
        switch (this.state) {
            case 'Wander':
                this.wanderCooldown -= delta;
                if (this.wanderCooldown <= 0) {
                    this.targetDx = (Math.random() - 0.5) * 2;
                    this.targetDy = (Math.random() - 0.5) * 2;
                    this.wanderCooldown = Math.random() * 120 + 60;
                }
                
                // Normalize
                const wanderLen = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                if (wanderLen > 0) {
                    this.targetDx /= wanderLen;
                    this.targetDy /= wanderLen;
                }
                
                // Slowly wander
                moveSpeedMod = 0.5;
                break;

            case 'Combat':
                if (closestEnemy) {
                    if (closestDist < 50) {
                        // Melee range
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestEnemy.takeDamage(this.attackPower, 0x00ff00, 'adventurer');
                            this.attackCooldown = 60;
                        }
                    } else if (closestDist < 250) {
                        // Ranged attack, stand still
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            // Calculate angle to enemy
                            const dx = closestEnemy.x - this.x;
                            const dy = closestEnemy.y - this.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            
                            // Spawn projectile
                            if (len > 0) {
                                const proj = new Projectile(this.x, this.y, this.stage, dx/len, dy/len, 5, this.attackPower, this.faction, 'adventurer');
                                allEntities.push(proj);
                            }
                            
                            this.attackCooldown = 90;
                        }
                    } else {
                        // Move towards enemy
                        this.targetDx = closestEnemy.x - this.x;
                        this.targetDy = closestEnemy.y - this.y;
                        
                        // Normalize
                        const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                        if (len > 0) {
                            this.targetDx /= len;
                            this.targetDy /= len;
                        }
                    }
                }
                moveSpeedMod = 1.2;
                break;
        }

        // Apply movement
        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
