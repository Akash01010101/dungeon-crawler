import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';
import { checkCollision } from '../utils/Collision.js';
import { Projectile } from './Projectile.js';

export class Villager extends Character {
    constructor(x, y, stage, chunkCx, chunkCy) {
        super(x, y, stage, 50, 0.5, 'neutral'); // 50 health, slow speed, neutral faction

        this.sprite = new PIXI.Graphics();
        drawIsoHumanoid(this.sprite, 0xecf0f1, 0.9, {});
        this.container.addChild(this.sprite);

        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        this.chunkCx = chunkCx;
        this.chunkCy = chunkCy;
        this.state = 'Wander';
        
        // Mercenary properties
        this.owner = null;
        this.attackCooldown = 0;
        this.attackPower = 8;
    }

    hire(player) {
        this.owner = player;
        this.faction = 'player'; // Update faction using setter
        this.speed = player.speed; // Match player speed
        this.state = 'Follow';
        this.sprite.fill(0x3498db); // Turn blue when hired
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
                if (dist < 600) { // Increased from 300 to 600
                    enemyNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = entity;
                    }
                }
            }
        }

        if (this.owner) {
            if (enemyNear) {
                this.state = 'Combat';
            } else {
                this.state = 'Follow';
            }
        } else {
            if (enemyNear) {
                this.state = 'Flee';
            } else {
                this.state = 'Wander';
            }
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

                // Soft Boundary Check
                const centerXPx = this.chunkCx * 1000 + 500;
                const centerYPx = this.chunkCy * 1000 + 500;
                const distFromCenter = Math.sqrt((this.x - centerXPx) ** 2 + (this.y - centerYPx) ** 2);
                
                if (distFromCenter > 400) {
                    // Steer back to center
                    this.targetDx = centerXPx - this.x;
                    this.targetDy = centerYPx - this.y;
                    
                    // Normalize steering vector
                    const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                    if (len > 0) {
                        this.targetDx /= len;
                        this.targetDy /= len;
                    }
                }
                break;

            case 'Flee':
                if (closestEnemy) {
                    // Run directly away from the enemy
                    this.targetDx = this.x - closestEnemy.x;
                    this.targetDy = this.y - closestEnemy.y;

                    // Normalize
                    const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                    if (len > 0) {
                        this.targetDx /= len;
                        this.targetDy /= len;
                    }
                }
                moveSpeedMod = 1.5;
                break;

            case 'Follow':
                if (this.owner) {
                    const distToOwner = Math.sqrt((this.x - this.owner.x) ** 2 + (this.y - this.owner.y) ** 2);
                    if (distToOwner > 100) {
                        this.targetDx = this.owner.x - this.x;
                        this.targetDy = this.owner.y - this.y;
                    } else {
                        this.targetDx = 0;
                        this.targetDy = 0;
                    }
                    
                    // Normalize
                    const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                    if (len > 0) {
                        this.targetDx /= len;
                        this.targetDy /= len;
                    }
                }
                moveSpeedMod = 1.2;
                break;

            case 'Combat':
                if (closestEnemy) {
                    if (closestDist < 50) {
                        // Melee range
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestEnemy.takeDamage(this.attackPower, 0x00ff00, 'player');
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
                                const proj = new Projectile(this.x, this.y, this.stage, dx/len, dy/len, 5, this.attackPower, this.faction);
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
                break;
        }

        // Apply movement
        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
