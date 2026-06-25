import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy.js';
import { checkCollision } from '../utils/Collision.js';

export class Goblin extends Enemy {
    constructor(x, y, stage) {
        super(x, y, stage, 25, 1.5); // Rebalanced HP to 25 for fast TTK

        // Draw a green triangle/circle for Goblin
        this.sprite = new PIXI.Graphics();
        this.sprite.circle(0, 0, 15);
        this.sprite.fill(0x2ecc71); // Green
        this.container.addChild(this.sprite);

        this.attackPower = 5;
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (!player) return;

        // Try to attack player if close enough
        if (this.attackCooldown <= 0 && checkCollision(this, player)) {
            player.takeDamage(this.attackPower, 0xff0000, 'enemy'); // Red text
            this.attackCooldown = 60; // Attack every ~1 sec at 60fps
        }
    }
}
