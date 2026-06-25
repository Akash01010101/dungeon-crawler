import { Character } from './Character.js';

/**
 * INHERITANCE: Player inherits from Character, gaining health, speed, and movement logic.
 */
export class Player extends Character {
    constructor(x, y, stage, health, speed) {
        super(x, y, stage, health, speed, 'player');
        this.maxHealth = health;
        this.maxMana = 100;
        this.mana = 100;
        this.gold = 0;
        this.wantsToBuyHealth = false;
        this.wantsToBuyMana = false;
        this.wantsToHire = false;
        this.inSafeZone = false;

        // Hunger & Survival
        this.maxHunger = 100;
        this.hunger = 100;
        this.inventory = {
            rawMeat: 0,
            cookedMeat: 0,
            bread: 0
        };

        // Core RPG Stats
        this.level = 1;
        this.xp = 0;
        this.xpRequired = 100;

        this.strength = 5;
        this.agility = 5;
        this.intelligence = 5;
        this.defense = 5;
        this.luck = 5;
    }

    addXP(amount, enemyLevel = 1) {
        // Diminishing returns formula
        let multiplier = Math.max(0, 1 - (this.level - enemyLevel) * 0.2);
        let grantedXP = Math.floor(amount * multiplier);

        if (grantedXP > 0) {
            this.xp += grantedXP;
            this.showDamageText(`+${grantedXP} XP`, 0xffff00);
            
            if (this.xp >= this.xpRequired) {
                this.levelUp();
            }
        }
    }

    levelUp() {
        this.xp -= this.xpRequired;
        this.level += 1;
        this.xpRequired = Math.floor(100 * Math.pow(this.level, 1.8));

        // Increase stats
        this.strength += 2;
        this.agility += 1;
        this.intelligence += 1;
        this.defense += 1;

        // Update derived stats
        this.maxHealth += 15;
        this.maxMana += 10;
        this.health = this.maxHealth;
        this.mana = this.maxMana;

        this.showDamageText("LEVEL UP!", 0xffd700);
    }

    // Abstract method: To be implemented by specific player classes (Warrior/Mage)
    attack(allEntities) {
        throw new Error("attack() must be implemented by subclass");
    }

    update(delta, allEntities) {
        // Player input is handled in Game.js which sets targetDx and targetDy
        
        // Sprinting is set by Game.js input
        let currentSpeed = this.speed;
        let hungerDrainRate = 0.5; // per second
        
        if (this.isSprinting) {
            currentSpeed *= 1.5;
            hungerDrainRate = 3.0; // Sprinting drains much faster
        }

        // Drain hunger
        this.hunger -= (hungerDrainRate / 60) * delta;
        if (this.hunger < 0) {
            this.hunger = 0;
            // Starving damage
            this.takeDamage(0.1 * delta, 0xff0000, 'hunger');
            currentSpeed *= 0.5; // 50% speed penalty
        } else if (this.hunger < 25) {
            currentSpeed *= 0.7; // 30% speed penalty
        }

        this.move(this.targetDx * currentSpeed, this.targetDy * currentSpeed, delta);
        
        // Regenerate mana, scaling with level
        if (this.mana < this.maxMana) {
            const manaRegenRate = 0.1 + (0.02 * this.level);
            this.mana += manaRegenRate * delta;
            if (this.mana > this.maxMana) this.mana = this.maxMana;
        }

        // Update UI
        const healthText = document.getElementById('health-text');
        const healthBar = document.getElementById('health-bar');
        if (healthText && healthBar) {
            healthText.innerText = Math.floor(this.health);
            healthBar.style.width = (this.health / this.maxHealth * 100) + '%';
        }

        const manaText = document.getElementById('mana-text');
        const manaBar = document.getElementById('mana-bar');
        if (manaText && manaBar) {
            manaText.innerText = Math.floor(this.mana);
            manaBar.style.width = (this.mana / this.maxMana * 100) + '%';
        }

        const goldText = document.getElementById('gold-text');
        if (goldText) {
            goldText.innerText = this.gold;
        }

        const xpText = document.getElementById('xp-text');
        const xpBar = document.getElementById('xp-bar');
        const levelText = document.getElementById('level-text');
        if (xpText && xpBar && levelText) {
            levelText.innerText = this.level;
            xpText.innerText = `${Math.floor(this.xp)} / ${this.xpRequired}`;
            xpBar.style.width = (this.xp / this.xpRequired * 100) + '%';
        }

        const statSheet = document.getElementById('stat-sheet');
        if (statSheet && statSheet.style.display !== 'none') {
            document.getElementById('stat-str').innerText = this.strength;
            document.getElementById('stat-agi').innerText = this.agility;
            document.getElementById('stat-int').innerText = this.intelligence;
            document.getElementById('stat-def').innerText = this.defense;
            document.getElementById('stat-luc').innerText = this.luck;
        }
    }
}
