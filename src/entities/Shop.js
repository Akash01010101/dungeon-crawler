import { drawIsoStructure } from '../utils/SpriteHelpers.js';
import * as PIXI from 'pixi.js';
import { Entity } from './Entity.js';
import { checkCollision } from '../utils/Collision.js';

export class Shop extends Entity {
    constructor(x, y, stage) {
        super(x, y, stage);
        this.faction = 'neutral';

        // Isometric Shop building
        this.sprite = new PIXI.Graphics();
        drawIsoStructure(this.sprite, 0x8e44ad, 0xa569bd, 50, 45, 25);
        
        // Add a 'SHOP' label
        const text = new PIXI.Text({
            text: 'SHOP',
            style: { fill: 0xffffff, fontSize: 14, fontFamily: 'Courier New', stroke: { color: 0x000000, width: 2 } }
        });
        text.anchor.set(0.5);
        text.y = -55;
        
        this.container.addChild(this.sprite);
        this.container.addChild(text);
    }

    update(delta, allEntities, player) {
        // Check if player is near
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Show shop prompt
            const shopUI = document.getElementById('shop-prompt');
            if (distance < 100) {
                if (shopUI) shopUI.style.display = 'block';
                
                // If player presses 1 or 2
                if (player.wantsToBuyHealth) {
                    player.wantsToBuyHealth = false;
                    if (player.gold >= 20) {
                        player.gold -= 20;
                        player.health += 50;
                        if (player.health > player.maxHealth) player.health = player.maxHealth;
                        player.showDamageText("+50 HP", 0x00ff00);
                    } else {
                        player.showDamageText("Not enough gold!", 0xff0000);
                    }
                }
                
                if (player.wantsToBuyMana) {
                    player.wantsToBuyMana = false;
                    if (player.gold >= 20) {
                        player.gold -= 20;
                        player.mana += 50;
                        if (player.mana > player.maxMana) player.mana = player.maxMana;
                        player.showDamageText("+50 Mana", 0x3498db);
                    } else {
                        player.showDamageText("Not enough gold!", 0xff0000);
                    }
                }
            } else {
                if (shopUI) shopUI.style.display = 'none';
            }
        }
    }
}
