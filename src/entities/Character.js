import { Entity } from './Entity.js';

/**
 * ENCAPSULATION: The Character class encapsulates stats like health and speed.
 * These are kept private (using #) so outside classes can't arbitrarily modify them.
 * They must use methods like takeDamage().
 */
export class Character extends Entity {
    #health;
    #speed;
    #faction;

    constructor(x, y, stage, health, speed, faction) {
        super(x, y, stage);
        this.maxHealth = health;
        this.#health = health;
        this.#speed = speed;
        this.#faction = faction; // 'player' or 'enemy'
        this.floatingTexts = [];
        this.damageTracker = {};
        this.accumulatedDamage = 0;
        this.currentDamageText = null;

        // HP Bar and Name Label
        import('pixi.js').then(PIXI => {
            this.hpBar = new PIXI.Graphics();
            this.container.addChild(this.hpBar);
            
            this.nameLabel = new PIXI.Text({
                text: this.constructor.name,
                style: {
                    fontFamily: 'Courier New',
                    fontSize: 11,
                    fill: 0xffffff,
                    stroke: { color: 0x000000, width: 3 },
                    align: 'center'
                }
            });
            this.nameLabel.anchor.set(0.5);
            this.nameLabel.y = -50;
            this.container.addChild(this.nameLabel);
            
            // Visual hostility aura for enemies (isometric ellipse)
            if (this.#faction === 'enemy' || this.#faction === 'predator') {
                this.scaryAura = new PIXI.Graphics();
                this.container.addChildAt(this.scaryAura, 0); // behind sprite
                
                // Scale aura by maxHealth
                const auraRadiusX = Math.min(60, 16 + (this.maxHealth * 0.15));
                const auraRadiusY = auraRadiusX * 0.45; // foreshortened for iso
                this.scaryAura.ellipse(0, 4, auraRadiusX, auraRadiusY);
                
                // Intensity based on health
                const intensity = Math.min(0.6, this.maxHealth / 400);
                this.scaryAura.fill({ color: 0xff0000, alpha: intensity });
                this.baseAuraAlpha = intensity;
                this.auraTime = Math.random() * 10; // random start phase
            }

            this.updateHpBar();
        });
    }

    updateHpBar() {
        if (!this.hpBar) return;
        this.hpBar.clear();
        
        // Background
        this.hpBar.rect(-20, -42, 40, 4);
        this.hpBar.fill(0x555555);
        
        // Health fill
        const hpPercent = Math.max(0, this.#health / this.maxHealth);
        this.hpBar.rect(-20, -42, 40 * hpPercent, 4);
        
        if (this.#faction === 'enemy') {
            this.hpBar.fill(0xff0000); // Red for enemies
        } else if (this.#faction === 'player') {
            this.hpBar.fill(0x2ecc71); // Green for player/allies
        } else {
            this.hpBar.fill(0xf1c40f); // Yellow for neutral
        }
    }

    // Getters and Setters
    get health() { return this.#health; }
    set health(value) { 
        this.#health = value; 
        this.updateHpBar();
    }
    get speed() { return this.#speed; }
    set speed(value) { this.#speed = value; }
    get faction() { return this.#faction; }
    set faction(value) { this.#faction = value; }

    takeDamage(amount, color = 0xffffff, sourceId = 'unknown') {
        this.#health -= amount;
        if (this.#health <= 0) {
            this.#health = 0;
        }
        
        // Track damage contribution
        this.damageTracker[sourceId] = (this.damageTracker[sourceId] || 0) + amount;

        this.showDamageText(amount, color);
        this.updateHpBar();
        
        // Flash effect
        if (this.sprite) {
            this.sprite.tint = 0xff0000;
            setTimeout(() => {
                if (this.sprite) this.sprite.tint = 0xffffff;
            }, 150);
        }
    }

    showDamageText(amount, color) {
        if (this.currentDamageText && this.currentDamageText.life > 30) {
            // Stack damage onto existing text
            this.accumulatedDamage += amount;
            this.currentDamageText.element.text = this.accumulatedDamage.toString();
            const scale = Math.min(2.0, 1 + (this.accumulatedDamage / 100));
            this.currentDamageText.element.scale.set(scale);
            // Reposition to current iso coordinates
            this.currentDamageText.element.x = this.isoX;
            this.currentDamageText.element.y = this.isoY - 50;
            this.currentDamageText.life = 60; // reset life
            this.currentDamageText.element.alpha = 1;
        } else {
            // New damage text — positioned in isometric screen space
            this.accumulatedDamage = amount;
            import('pixi.js').then(PIXI => {
                const text = new PIXI.Text({
                    text: amount.toString(),
                    style: {
                        fontFamily: 'Courier New',
                        fontSize: 22,
                        fill: color,
                        stroke: { color: 0x000000, width: 4 },
                        fontWeight: 'bold'
                    }
                });
                text.x = this.isoX;
                text.y = this.isoY - 40;
                text.anchor.set(0.5);
                this.stage.addChild(text);
                
                const dt = { element: text, life: 60 };
                this.floatingTexts.push(dt);
                this.currentDamageText = dt;
            });
        }
    }

    isDead() {
        return this.#health <= 0;
    }

    move(dx, dy, delta) {
        // Normalize movement vector so diagonal isn't faster
        let length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        this.x += dx * this.#speed * delta;
        this.y += dy * this.#speed * delta;
    }

    update(delta, allEntities, player) {
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            
            // Float up and fade out smoothly
            if (ft.life < 30) {
                ft.element.alpha = Math.max(0, ft.life / 30);
            }
            ft.element.y -= 1.5 * delta;
            ft.life -= delta;
            
            if (ft.life <= 0) {
                if (this.currentDamageText === ft) {
                    this.currentDamageText = null;
                }
                this.stage.removeChild(ft.element);
                ft.element.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }

        // Animate scary aura
        if (this.scaryAura) {
            this.auraTime += delta * 0.1;
            this.scaryAura.alpha = this.baseAuraAlpha + Math.sin(this.auraTime) * (this.baseAuraAlpha * 0.5);
            this.scaryAura.scale.set(1 + Math.sin(this.auraTime * 1.5) * 0.05);
        }
    }

    destroy() {
        super.destroy();
        for (const ft of this.floatingTexts) {
            this.stage.removeChild(ft.element);
            ft.element.destroy();
        }
    }
}
