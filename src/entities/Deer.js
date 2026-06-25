import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Deer extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 30, 2.5, 'herbivore'); // Low health, high speed

        this.sprite = new PIXI.Graphics();
        this.sprite.rect(-10, -15, 20, 30);
        this.sprite.fill(0x8B4513); // SaddleBrown
        this.container.addChild(this.sprite);

        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
        
        this.state = 'Wander';
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        let threatNear = false;
        let closestThreat = null;
        let closestDist = Infinity;

        // Detect predators, hostile enemies, or player
        for (const entity of allEntities) {
            if (entity.faction === 'predator' || entity.faction === 'hostile' || entity.faction === 'player') {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 400) {
                    threatNear = true;
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestThreat = entity;
                    }
                }
            }
        }

        if (threatNear) {
            this.state = 'Flee';
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
                
                // Normalize
                const wanderLen = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                if (wanderLen > 0) {
                    this.targetDx /= wanderLen;
                    this.targetDy /= wanderLen;
                }
                
                moveSpeedMod = 0.3; // Walk slowly
                break;

            case 'Flee':
                if (closestThreat) {
                    // Run directly away
                    this.targetDx = this.x - closestThreat.x;
                    this.targetDy = this.y - closestThreat.y;

                    // Normalize
                    const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
                    if (len > 0) {
                        this.targetDx /= len;
                        this.targetDy /= len;
                    }
                }
                moveSpeedMod = 1.5; // Sprint!
                break;
        }

        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
