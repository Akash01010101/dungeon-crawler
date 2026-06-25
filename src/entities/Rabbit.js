import * as PIXI from 'pixi.js';
import { Character } from './Character.js';

export class Rabbit extends Character {
    constructor(x, y, stage) {
        super(x, y, stage, 5, 2.5, 'herbivore');
        this.sprite = new PIXI.Graphics();
        this.container.addChild(this.sprite);
        this.draw(); // Very fast, 5 HP
        this.state = 'Wander';
        this.wanderCooldown = 0;
        this.targetDx = 0;
        this.targetDy = 0;
    }

    // Override to draw a small white rabbit
    draw(color) {
        this.sprite.clear();
        this.sprite.circle(0, 0, 8);
        this.sprite.fill(0xffffff);
        this.sprite.stroke({ color: 0x000000, width: 1 });
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        let predatorNear = false;
        let closestPredator = null;

        // Flee from predators, enemies, and players
        for (const entity of allEntities) {
            if ((entity.faction === 'predator' || entity.faction === 'player' || entity.faction === 'enemy') && entity !== this) {
                const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
                if (dist < 400) {
                    predatorNear = true;
                    closestPredator = entity;
                    break;
                }
            }
        }

        if (predatorNear) {
            this.state = 'Flee';
        } else {
            this.state = 'Wander';
        }

        let moveSpeedMod = 1.0;
        if (this.state === 'Wander') {
            this.wanderCooldown -= delta;
            if (this.wanderCooldown <= 0) {
                this.targetDx = (Math.random() - 0.5) * 2;
                this.targetDy = (Math.random() - 0.5) * 2;
                this.wanderCooldown = Math.random() * 60 + 30; // Jerky fast movements
            }
            const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
            if (len > 0) {
                this.targetDx /= len;
                this.targetDy /= len;
            }
            moveSpeedMod = 0.5;
        } else if (this.state === 'Flee' && closestPredator) {
            this.targetDx = this.x - closestPredator.x;
            this.targetDy = this.y - closestPredator.y;
            const len = Math.sqrt(this.targetDx ** 2 + this.targetDy ** 2);
            if (len > 0) {
                this.targetDx /= len;
                this.targetDy /= len;
            }
            moveSpeedMod = 1.5; // Very fast when fleeing
        }

        this.move(this.targetDx * moveSpeedMod, this.targetDy * moveSpeedMod, delta);
    }
}
