import { drawIsoAnimal } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Character } from './Character.js';
import { checkCollision } from '../utils/Collision.js';

export class Wolf extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 50, 1.8, 'predator');

        this.sprite = new PIXI.Graphics();
        this.sprite.rect(-15, -10, 30, 20);
        this.sprite.fill(0x555555); // Dark Gray
        this.container.addChild(this.sprite);

        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        
        this.state = 'Wander';
        this.attackCooldown = 0;
        this.attackPower = 15;

        // Wolf Hunger
        this.hunger = Math.random() * 50 + 50; // Start with 50-100 hunger
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        let preyNear = false;
        let closestPrey = null;
        let closestDist = Infinity;

        // Drain hunger
        this.hunger -= (0.5 / 60) * delta;
        if (this.hunger < 0) this.hunger = 0;

        // Aggro radius increases when starving
        let aggroRadius = this.hunger < 30 ? 800 : 400;

        // Hunt herbivores or players
        for (const entity of allEntities) {
            if ((entity.faction === 'herbivore' || entity.faction === 'player') && typeof entity.takeDamage === 'function') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < aggroRadius) {
                    preyNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPrey = entity;
                    }
                }
            }
        }

        if (preyNear) {
            this.state = 'Hunt';
        } else {
            this.state = 'Wander';
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
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
                if (closestPrey) {
                    if (closestDist < 40) {
                        // Melee range
                        this.targetDx = 0;
                        this.targetDy = 0;
                        if (this.attackCooldown <= 0) {
                            closestPrey.takeDamage(this.attackPower, 0xff0000, 'predator');
                            this.attackCooldown = 60;
                            // Eating prey restores hunger
                            if (closestPrey.isDead && closestPrey.isDead()) {
                                this.hunger = 100;
                            }
                        }
                    } else {
                        // Chase
                        this.targetDx = closestPrey.x - this.x;
                        this.targetDy = closestPrey.y - this.y;
                        
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
