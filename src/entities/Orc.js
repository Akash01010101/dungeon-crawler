import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy.js';
import { checkCollision } from '../utils/Collision.js';

export class Orc extends Enemy {
    constructor(x, y, stage) {
        super(x, y, stage, 80, 0.8); // Rebalanced HP to 80

        // Draw a dark red large rectangle for Orc
        this.sprite = new PIXI.Graphics();
        this.sprite.rect(-25, -25, 50, 50);
        this.sprite.fill(0xc0392b); // Dark Red
        this.container.addChild(this.sprite);

        this.attackPower = 15;
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);

        if (!player) return;

        // Try to attack player if close enough
        if (this.attackCooldown <= 0 && checkCollision(this, player)) {
            player.takeDamage(this.attackPower, 0xff0000, 'enemy'); // Red text
            this.attackCooldown = 90; // Attack every ~1.5 sec
        }
    }
}
