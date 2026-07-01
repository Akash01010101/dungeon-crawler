import { drawIsoHumanoid } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Player } from './Player.js';
import { checkCollision } from '../utils/Collision.js';
import { Projectile } from './Projectile.js';

export class Warrior extends Player {
    constructor(x, y, stage) {
        super(x, y, stage, 100, 3); // 100 health, 3 speed

        // Isometric Warrior sprite
        this.sprite = new PIXI.Graphics();
        drawIsoHumanoid(this.sprite, 0x3498db, 1.1, { outline: 0x2980b9 });
        this.container.addChild(this.sprite);

        this.attackCooldown = 0;
        this.rangedCooldown = 0;
        this.facingDx = 1;
        this.facingDy = 0;
    }

    move(dx, dy, delta) {
        super.move(dx, dy, delta);
        if (dx !== 0 || dy !== 0) {
            this.facingDx = dx;
            this.facingDy = dy;
        }
    }

    // POLYMORPHISM: Overriding the attack method specifically for a melee warrior
    attack(allEntities) {
        if (this.inSafeZone) {
            this.showDamageText("Cannot attack in Safe Zone!", 0xffffff);
            return;
        }
        if (this.attackCooldown > 0) return;

        // Visual feedback for attack (thrust forward)
        const originalX = this.sprite.x;
        const originalY = this.sprite.y;
        this.sprite.x += this.facingDx * 15;
        this.sprite.y += this.facingDy * 15;
        setTimeout(() => {
            if (this.sprite) {
                this.sprite.x = originalX;
                this.sprite.y = originalY;
            }
        }, 100);

        // Check melee hit against all enemies
        const damage = 10 + (this.strength * 2); // Scales with strength

        let hitEnemy = false;
        for (const entity of allEntities) {
            if (entity.faction === 'enemy' && typeof entity.takeDamage === 'function' && checkCollision(this, entity)) {
                entity.takeDamage(damage, 0x00ff00, 'player'); // Green text
                hitEnemy = true;
            }
        }

        // Lifesteal
        if (hitEnemy) {
            const healAmount = 2 + (0.5 * this.level);
            this.health += healAmount;
            if (this.health > this.maxHealth) this.health = this.maxHealth;
            
            // Visual feedback for heal
            this.sprite.tint = 0x00ff00;
            setTimeout(() => { if (this.sprite) this.sprite.tint = 0xffffff; }, 150);
        }

        this.attackCooldown = 30; // Frames
    }

    rangedAttack(allEntities) {
        if (this.inSafeZone) {
            this.showDamageText("Cannot attack in Safe Zone!", 0xffffff);
            return;
        }
        if (this.rangedCooldown > 0) return;
        if (this.mana < 20) return; // Need 20 mana

        this.mana -= 20; // Consume mana

        let dx = this.facingDx;
        let dy = this.facingDy;
        if (dx === 0 && dy === 0) {
            dx = 1; // Default direction if somehow zero
        }
        
        let length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;

        // Create projectile
        const proj = new Projectile(this.x, this.y, this.stage, dx, dy, 5, 10 + this.intelligence, 'player');
        allEntities.push(proj);

        this.rangedCooldown = 45; // Frames
    }

    powerAttack(allEntities) {
        if (this.inSafeZone) {
            this.showDamageText("Cannot attack in Safe Zone!", 0xffffff);
            return;
        }
        if (this.rangedCooldown > 0) return;
        if (this.mana < 50) return; // Need 50 mana

        this.mana -= 50; // Consume mana

        let dx = this.facingDx;
        let dy = this.facingDy;
        if (dx === 0 && dy === 0) dx = 1;
        
        const baseAngle = Math.atan2(dy, dx);
        
        // Shoot 3 projectiles in a spread
        const angles = [baseAngle - 0.2, baseAngle, baseAngle + 0.2];
        
        for (const angle of angles) {
            const pDx = Math.cos(angle);
            const pDy = Math.sin(angle);
            const damage = 25 + (this.intelligence * 2);
            const proj = new Projectile(this.x, this.y, this.stage, pDx, pDy, 7, damage, 'player');
            allEntities.push(proj);
        }

        this.rangedCooldown = 60; // Frames
    }

    update(delta, allEntities, player) {
        super.update(delta, allEntities, player);
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
        if (this.rangedCooldown > 0) {
            this.rangedCooldown -= delta;
        }
    }
}
