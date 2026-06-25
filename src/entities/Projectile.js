import * as PIXI from 'pixi.js';
import { Entity } from './Entity.js';
import { checkCollision } from '../utils/Collision.js';

export class Projectile extends Entity {
    constructor(x, y, stage, dx, dy, speed, damage, faction, sourceId = 'player') {
        super(x, y, stage);
        this.dx = dx;
        this.dy = dy;
        this.speed = speed;
        this.damage = damage;
        this.faction = faction;
        this.sourceId = sourceId;
        this.lifeTime = 100; // frames to live
        this._isDead = false;

        this.sprite = new PIXI.Graphics();
        this.sprite.circle(0, 0, 8);
        this.sprite.fill(0xf1c40f); // Yellow
        this.container.addChild(this.sprite);
    }

    isDead() {
        return this._isDead || this.lifeTime <= 0;
    }

    update(delta, allEntities) {
        this.x += this.dx * this.speed * delta;
        this.y += this.dy * this.speed * delta;
        this.lifeTime -= delta;

        // Check collision
        for (const entity of allEntities) {
            // Determine if the entity is an enemy to this projectile
            let isHostileTarget = false;
            if (this.faction === 'player' || this.faction === 'neutral') {
                isHostileTarget = (entity.faction === 'enemy' || entity.faction === 'predator');
            } else if (this.faction === 'enemy' || this.faction === 'predator') {
                isHostileTarget = (entity.faction === 'player' || entity.faction === 'neutral');
            }

            if (isHostileTarget && typeof entity.takeDamage === 'function' && checkCollision(this, entity)) {
                const color = this.faction === 'enemy' ? 0xff0000 : 0x00ff00;
                entity.takeDamage(this.damage, color, this.sourceId);
                
                // Lifesteal for player projectiles
                if (this.faction === 'player') {
                    const player = allEntities.find(e => e.faction === 'player');
                    if (player) {
                        const healAmount = 1 + (0.25 * player.level);
                        player.health += healAmount;
                        if (player.health > player.maxHealth) player.health = player.maxHealth;
                    }
                }

                this._isDead = true; // Destroy projectile
                break;
            }
        }
    }
}
