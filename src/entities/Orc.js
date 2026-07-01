import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy.js';
import { checkCollision } from '../utils/Collision.js';

export class Orc extends Enemy {
    constructor(x, y, stage) {
        super(x, y, stage, 80, 0.8); // Rebalanced HP to 80

        // Isometric Orc sprite
        this.sprite = new PIXI.Graphics();
        drawIsoHumanoid(this.sprite, 0xc0392b, 1.2, { outline: 0xe74c3c });
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
