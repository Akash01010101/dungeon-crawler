import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy.js';
import { checkCollision } from '../utils/Collision.js';

export class Goblin extends Enemy {
    constructor(x, y, stage) {
        super(x, y, stage, 25, 1.5); // Rebalanced HP to 25 for fast TTK

        // Isometric Goblin sprite
        this.sprite = new PIXI.Graphics();
        drawIsoHumanoid(this.sprite, 0x2ecc71, 0.8, { outline: 0x27ae60 });
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
