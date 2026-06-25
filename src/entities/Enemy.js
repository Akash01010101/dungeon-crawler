import { Character } from './Character.js';

/**
 * INHERITANCE: Enemy inherits from Character.
 */
export class Enemy extends Character {
    constructor(x, y, stage, health, speed) {
        super(x, y, stage, health, speed, 'enemy');
        this.attackCooldown = 0;
        this.attackPower = 10;
        
        this.state = 'Wander';
        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let targetNear = false;
        let closestTarget = null;
        let closestDist = Infinity;

        // Hunt player, mercenaries, adventurers, villagers, or wolves
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

        if (targetNear) {
            this.state = 'Hunt';
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
                    if (closestDist < 40) {
                        // Melee range
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestTarget.takeDamage(this.attackPower, 0xff0000, 'enemy');
                            this.attackCooldown = 60;
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
                }
                moveSpeedMod = 1.2;
                break;
        }

        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
