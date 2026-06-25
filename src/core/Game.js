import * as PIXI from 'pixi.js';
import { Warrior } from '../entities/Warrior.js';
import { Input } from './Input.js';
import { WorldGenerator } from '../world/WorldGenerator.js';

export class Game {
    constructor() {
        this.app = new PIXI.Application();
        this.entities = [];
        this.input = new Input();
        
        // Global Director State
        this.timeOfDay = 0; // 0 (Morning) to 24000
        this.isNight = false;
    }

    async init() {
        await this.app.init({ resizeTo: window, backgroundColor: 0x222222 });
        document.getElementById('game-container').appendChild(this.app.canvas);

        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);
        
        // Spawn player
        this.player = new Warrior(0, 0, this.worldContainer);
        this.entities.push(this.player);

        this.worldGenerator = new WorldGenerator(this);

        // Day/Night Overlay (Added to stage so it covers the world but sits behind HTML UI)
        this.nightOverlay = new PIXI.Graphics();
        this.nightOverlay.rect(0, 0, 4000, 4000); // arbitrarily large, will center on screen
        this.nightOverlay.fill({ color: 0x000022, alpha: 0 }); // Dark blue, starts invisible
        this.app.stage.addChild(this.nightOverlay);

        this.mapOpen = false;
        this.charSheetOpen = false;
        
        const mapBtn = document.getElementById('map-btn');
        if (mapBtn) {
            mapBtn.addEventListener('click', () => {
                this.toggleMap();
            });
        }
        
        const closeMapBtn = document.getElementById('close-map-btn');
        if (closeMapBtn) {
            closeMapBtn.addEventListener('click', () => {
                if (this.mapOpen) this.toggleMap();
            });
        }

        this.app.ticker.add((time) => {
            this.update(time.deltaTime);
        });
    }

    toggleMap() {
        this.mapOpen = !this.mapOpen;
        const mapOverlay = document.getElementById('map-overlay');
        if (mapOverlay) {
            mapOverlay.style.display = this.mapOpen ? 'block' : 'none';
            if (this.mapOpen) this.renderMap();
        }
    }

    renderMap() {
        const canvas = document.getElementById('map-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 600, 600);

        const playerCx = Math.floor(this.player.x / this.worldGenerator.chunkSize);
        const playerCy = Math.floor(this.player.y / this.worldGenerator.chunkSize);

        if (this.input.isKeyPressed('4')) {
            if (this.player.inSafeZone) {
                if (this.player.gold >= 15) {
                    this.player.gold -= 15;
                    this.player.inventory.bread++;
                    this.player.showDamageText("Bought Bread!", 0xf1c40f);
                } else {
                    this.player.showDamageText("Not enough gold!", 0xffffff);
                }
            }
        }

        if (this.input.isKeyPressed('f') || this.input.isKeyPressed('F')) {
            // Cooking/Eating Logic
            if (this.player.inventory.rawMeat > 0) {
                // If near shop/village, cook. Else eat raw.
                if (this.player.inSafeZone) {
                    this.player.inventory.rawMeat--;
                    this.player.inventory.cookedMeat++;
                    this.player.showDamageText("Cooked Meat!", 0xe67e22);
                } else {
                    this.player.inventory.rawMeat--;
                    this.player.hunger += 10;
                    this.player.showDamageText("Ate Raw Meat (+10)", 0xe67e22);
                    if (Math.random() < 0.2) {
                        this.player.takeDamage(10, 0xff0000, 'food_poisoning');
                        this.player.showDamageText("Poisoned!", 0x8e44ad);
                    }
                }
            } else if (this.player.inventory.cookedMeat > 0) {
                this.player.inventory.cookedMeat--;
                this.player.hunger += 40;
                this.player.showDamageText("Ate Cooked Meat (+40)", 0xe67e22);
            } else if (this.player.inventory.bread > 0) {
                this.player.inventory.bread--;
                this.player.hunger += 30;
                this.player.showDamageText("Ate Bread (+30)", 0xf1c40f);
            } else {
                this.player.showDamageText("No food!", 0xffffff);
            }
            if (this.player.hunger > this.player.maxHunger) this.player.hunger = this.player.maxHunger;
        }

        // Center map on player (scale 1 chunk = 20px)
        const scale = 20;
        const centerMapX = 300;
        const centerMapY = 300;

        for (const key in this.worldGenerator.chunks) {
            const chunk = this.worldGenerator.chunks[key];
            const dx = chunk.cx - playerCx;
            const dy = chunk.cy - playerCy;

            ctx.fillStyle = chunk.type === 'village' ? '#2980b9' : '#27ae60';
            ctx.fillRect(centerMapX + dx * scale - scale/2, centerMapY + dy * scale - scale/2, scale, scale);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(centerMapX + dx * scale - scale/2, centerMapY + dy * scale - scale/2, scale, scale);
        }

        // Draw player dot
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(centerMapX, centerMapY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    update(delta) {
        const playerCx = Math.floor(this.player.x / this.worldGenerator.chunkSize);
        const playerCy = Math.floor(this.player.y / this.worldGenerator.chunkSize);

        this.renderMinimap(playerCx, playerCy);

        // Movement
        this.player.targetDx = 0;
        this.player.targetDy = 0;
        this.player.isSprinting = this.input.isKeyDown('Shift');

        // Player Input handling
        const dx = (this.input.isKeyDown('d') || this.input.isKeyDown('ArrowRight') ? 1 : 0) - (this.input.isKeyDown('a') || this.input.isKeyDown('ArrowLeft') ? 1 : 0);
        const dy = (this.input.isKeyDown('s') || this.input.isKeyDown('ArrowDown') ? 1 : 0) - (this.input.isKeyDown('w') || this.input.isKeyDown('ArrowUp') ? 1 : 0);
        
        this.player.move(dx, dy, delta);

        if (this.input.isMousePressed('left')) {
            // Player attacks
            this.player.attack(this.entities);
        }

        if (this.input.isMousePressed('right')) {
            // Player ranged attack
            if (this.player.rangedAttack) {
                this.player.rangedAttack(this.entities);
            }
        }

        if (this.input.isKeyPressed('e') || this.input.isKeyPressed('E')) {
            // Player power attack
            if (this.player.powerAttack) {
                this.player.powerAttack(this.entities);
            }
        }

        if (this.input.isKeyPressed('f') || this.input.isKeyPressed('F')) {
            if (this.player.inSafeZone) {
                // Cook meat
                if (this.player.inventory.rawMeat > 0) {
                    this.player.inventory.rawMeat--;
                    this.player.inventory.cookedMeat++;
                    this.player.showDamageText("Cooked Meat!", 0xffa500);
                } else {
                    this.player.showDamageText("No Raw Meat to cook!", 0xffffff);
                }
            } else {
                // Eat food
                if (this.player.inventory.cookedMeat > 0) {
                    this.player.inventory.cookedMeat--;
                    this.player.hunger += 40;
                    this.player.showDamageText("+40 Hunger", 0x2ecc71);
                } else if (this.player.inventory.bread > 0) {
                    this.player.inventory.bread--;
                    this.player.hunger += 30;
                    this.player.showDamageText("+30 Hunger", 0x2ecc71);
                } else if (this.player.inventory.rawMeat > 0) {
                    this.player.inventory.rawMeat--;
                    this.player.hunger += 10;
                    this.player.takeDamage(5, 0x00ff00, 'food_poisoning'); // small poison dmg
                    this.player.showDamageText("+10 Hunger (Raw)", 0x2ecc71);
                } else {
                    this.player.showDamageText("No food to eat!", 0xffffff);
                }
                
                if (this.player.hunger > this.player.maxHunger) {
                    this.player.hunger = this.player.maxHunger;
                }
            }
        }

        if (this.input.isKeyPressed('1')) {
            this.player.wantsToBuyHealth = true;
        }

        if (this.input.isKeyPressed('2')) {
            this.player.wantsToBuyMana = true;
        }

        if (this.input.isKeyPressed('3')) {
            this.player.wantsToHire = true;
        }

        if (this.input.isKeyPressed('m') || this.input.isKeyPressed('M')) {
            this.toggleMap();
        }

        if (this.input.isKeyPressed('c') || this.input.isKeyPressed('C')) {
            this.charSheetOpen = !this.charSheetOpen;
            const sheet = document.getElementById('stat-sheet');
            if (sheet) {
                sheet.style.display = this.charSheetOpen ? 'block' : 'none';
            }
        }
        
        if (this.input.isKeyPressed('5')) {
            if (this.player.inSafeZone) {
                this.saveGame();
            } else {
                this.player.showDamageText("Must be in a Safe Zone to save!", 0xffffff);
            }
        }
        
        this.input.update(); // clear single-frame key presses

        // Generate and load chunks
        this.worldGenerator.update(this.player);

        // Check safe zone resting
        const chunkKey = this.worldGenerator.getChunkKey(playerCx, playerCy);
        const currentChunk = this.worldGenerator.chunks[chunkKey];
        // UI Updates
        document.getElementById('health-text').innerText = Math.floor(this.player.health);
        document.getElementById('health-bar').style.width = `${Math.max(0, (this.player.health / this.player.maxHealth) * 100)}%`;
        
        document.getElementById('mana-text').innerText = Math.floor(this.player.mana);
        document.getElementById('mana-bar').style.width = `${Math.max(0, (this.player.mana / this.player.maxMana) * 100)}%`;

        document.getElementById('hunger-text').innerText = Math.floor(this.player.hunger);
        document.getElementById('hunger-bar').style.width = `${Math.max(0, (this.player.hunger / this.player.maxHunger) * 100)}%`;

        document.getElementById('gold-text').innerText = this.player.gold;
        document.getElementById('level-text').innerText = this.player.level;
        document.getElementById('xp-text').innerText = `${this.player.xp} / ${this.player.nextLevelXp}`;
        document.getElementById('xp-bar').style.width = `${(this.player.xp / this.player.nextLevelXp) * 100}%`;

        document.getElementById('inv-raw-meat').innerText = this.player.inventory.rawMeat;
        document.getElementById('inv-cooked-meat').innerText = this.player.inventory.cookedMeat;
        document.getElementById('inv-bread').innerText = this.player.inventory.bread;
        if (currentChunk && currentChunk.type === 'village') {
            this.player.inSafeZone = true;
            // Safe zone: slowly regenerate health, scaling with level
            if (this.player.health < this.player.maxHealth) {
                const regenRate = 0.05 + (0.01 * this.player.level);
                this.player.health += regenRate * delta;
            }
        } else {
            this.player.inSafeZone = false;
        }

        // Camera follow (Center player in full screen)
        this.worldContainer.x = (window.innerWidth / 2) - this.player.x;
        this.worldContainer.y = (window.innerHeight / 2) - this.player.y;

        // Day/Night Cycle Logic
        this.timeOfDay += delta * 2; // Advance time
        if (this.timeOfDay > 24000) this.timeOfDay = 0;
        this.isNight = this.timeOfDay > 12000 && this.timeOfDay < 22000;
        
        // Smoothly fade night overlay
        if (this.isNight) {
            this.nightOverlay.alpha = Math.min(0.7, this.nightOverlay.alpha + 0.005 * delta);
        } else {
            this.nightOverlay.alpha = Math.max(0, this.nightOverlay.alpha - 0.005 * delta);
        }
        
        // Keep night overlay centered on screen
        this.nightOverlay.x = 0;
        this.nightOverlay.y = 0;
        this.nightOverlay.width = window.innerWidth;
        this.nightOverlay.height = window.innerHeight;

        // Polymorphism: Calling update on all entities regardless of their specific class.
        for (const entity of this.entities) {
            entity.update(delta, this.entities, this.player);

            // Sunlight burns Undead
            if (!this.isNight && (entity.constructor.name === 'Skeleton' || entity.constructor.name === 'Vampire')) {
                entity.takeDamage(20 * delta, 0xffa500, 'environment');
            }
            
            // Safe Zone Aura: Hostiles and predators in villages take massive damage
            if (entity.faction === 'enemy' || entity.faction === 'predator') {
                const ecx = Math.floor(entity.x / this.worldGenerator.chunkSize);
                const ecy = Math.floor(entity.y / this.worldGenerator.chunkSize);
                const eChunkKey = this.worldGenerator.getChunkKey(ecx, ecy);
                const eChunk = this.worldGenerator.chunks[eChunkKey];
                
                if (eChunk && eChunk.type === 'village') {
                    // Instantly kill hostiles entering villages
                    if (typeof entity.takeDamage === 'function') {
                        entity.takeDamage(9999, 0x8e44ad, 'environment');
                    }
                } else {
                    // Enemy AI: Avoid entering village chunks
                    // Check nearby chunks to see if we are approaching a village border
                    for (let xOffset = -1; xOffset <= 1; xOffset++) {
                        for (let yOffset = -1; yOffset <= 1; yOffset++) {
                            const nChunkKey = this.worldGenerator.getChunkKey(ecx + xOffset, ecy + yOffset);
                            const nChunk = this.worldGenerator.chunks[nChunkKey];
                            if (nChunk && nChunk.type === 'village') {
                                // Center of the village chunk
                                const vCenterPx = (ecx + xOffset) * this.worldGenerator.chunkSize + 500;
                                const vCenterPy = (ecy + yOffset) * this.worldGenerator.chunkSize + 500;
                                
                                // Square boundary check (with 150px buffer outside the chunk)
                                const chunkLeft = (ecx + xOffset) * this.worldGenerator.chunkSize;
                                const chunkRight = chunkLeft + this.worldGenerator.chunkSize;
                                const chunkTop = (ecy + yOffset) * this.worldGenerator.chunkSize;
                                const chunkBottom = chunkTop + this.worldGenerator.chunkSize;
                                const buffer = 150;
                                
                                if (entity.x > chunkLeft - buffer && entity.x < chunkRight + buffer &&
                                    entity.y > chunkTop - buffer && entity.y < chunkBottom + buffer) {
                                    
                                    // Steer strongly away from the village center
                                    const vCenterPx = chunkLeft + 500;
                                    const vCenterPy = chunkTop + 500;
                                    const repulseX = entity.x - vCenterPx;
                                    const repulseY = entity.y - vCenterPy;
                                    const len = Math.sqrt(repulseX**2 + repulseY**2);
                                    if (len > 0) {
                                        entity.x += (repulseX / len) * 4 * delta; // 4 speed pushing away
                                        entity.y += (repulseY / len) * 4 * delta;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Clean up dead entities
        this.entities = this.entities.filter(e => {
            if (e.isDead && e.isDead()) {
                let playerDamage = (e.damageTracker && e.damageTracker['player']) || 0;
                let maxHp = e.maxHealth || 1;
                let contributionPercentage = playerDamage / maxHp;

                if (contributionPercentage >= 0.3) {
                    if (e.faction === 'enemy' || e.faction === 'predator') {
                        let grantedGold = Math.floor(10 * contributionPercentage);
                        this.player.gold += grantedGold;
                        
                        // Grant XP based on enemy level
                        this.player.addXP(20, 1);
                        
                        // Food Drops
                        if (e.faction === 'predator') {
                            this.player.inventory.rawMeat += 1;
                            this.player.showDamageText("+1 Raw Meat", 0xe74c3c);
                        } else if (e.faction === 'enemy' && Math.random() < 0.3) {
                            // 30% chance for goblins/orcs to drop bread
                            this.player.inventory.bread += 1;
                            this.player.showDamageText("+1 Bread", 0xf1c40f);
                        }
                    } else if (e.faction === 'herbivore') {
                        // Drop 1 Raw Meat
                        this.player.inventory.rawMeat += 1;
                        this.player.showDamageText("+1 Raw Meat", 0xe74c3c);
                    }
                } else {
                }
                e.destroy();
                return false;
            }
            return true;
        });

        if (this.player.isDead()) {
            // handle game over
        }

        // Handle Hiring Mercenaries Anywhere
        if (this.player.wantsToHire) {
            this.player.wantsToHire = false;
            if (this.player.gold >= 50) {
                let hired = false;
                for (const entity of this.entities) {
                    if (entity.faction === 'neutral' && entity.constructor.name === 'Villager') {
                        const distToVillager = Math.sqrt((entity.x - this.player.x) ** 2 + (entity.y - this.player.y) ** 2);
                        if (distToVillager < 1000) { // 1000px radius around player
                            this.player.gold -= 50;
                            entity.hire(this.player);
                            this.player.showDamageText("-50 Gold", 0xffff00);
                            hired = true;
                            break;
                        }
                    }
                }
                if (!hired) {
                    this.player.showDamageText("No villagers nearby!", 0xffffff);
                }
            } else {
                this.player.showDamageText("Not enough gold!", 0xff0000);
            }
        }
    }

    saveGame() {
        const saveData = {
            x: this.player.x,
            y: this.player.y,
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            mana: this.player.mana,
            maxMana: this.player.maxMana,
            hunger: this.player.hunger,
            maxHunger: this.player.maxHunger,
            gold: this.player.gold,
            level: this.player.level,
            xp: this.player.xp,
            xpRequired: this.player.xpRequired,
            inventory: this.player.inventory,
            strength: this.player.strength,
            agility: this.player.agility,
            intelligence: this.player.intelligence,
            defense: this.player.defense,
            luck: this.player.luck,
            timeOfDay: this.timeOfDay
        };
        
        localStorage.setItem('wasteland_save', JSON.stringify(saveData));
        this.player.showDamageText("GAME SAVED", 0xf1c40f);
    }

    loadGame(saveData) {
        if (!saveData) return;
        
        this.player.x = saveData.x;
        this.player.y = saveData.y;
        this.player.maxHealth = saveData.maxHealth;
        this.player.health = saveData.health;
        this.player.maxMana = saveData.maxMana;
        this.player.mana = saveData.mana;
        this.player.maxHunger = saveData.maxHunger;
        this.player.hunger = saveData.hunger;
        this.player.gold = saveData.gold;
        this.player.level = saveData.level;
        this.player.xp = saveData.xp;
        this.player.xpRequired = saveData.xpRequired;
        
        this.player.inventory = saveData.inventory;
        
        this.player.strength = saveData.strength;
        this.player.agility = saveData.agility;
        this.player.intelligence = saveData.intelligence;
        this.player.defense = saveData.defense;
        this.player.luck = saveData.luck;
        
        this.timeOfDay = saveData.timeOfDay || 0;
        
        // Clear all non-player entities and chunk cache so they can reload naturally around the new position
        for (let i = this.entities.length - 1; i >= 0; i--) {
            if (this.entities[i] !== this.player) {
                this.entities[i].destroy();
                this.entities.splice(i, 1);
            }
        }
        
        for (const key of Object.keys(this.worldGenerator.chunks)) {
            const chunk = this.worldGenerator.chunks[key];
            if (chunk.graphics) {
                chunk.graphics.destroy();
            }
            delete this.worldGenerator.chunks[key];
        }
        this.worldGenerator.loadedChunks.clear();
        
        this.player.showDamageText("GAME LOADED", 0x2ecc71);
    }

    renderMinimap(playerCx, playerCy) {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 150, 150);

        const scale = 15;
        const centerX = 75;
        const centerY = 75;

        for (const key in this.worldGenerator.chunks) {
            const chunk = this.worldGenerator.chunks[key];
            const dx = chunk.cx - playerCx;
            const dy = chunk.cy - playerCy;

            // Only draw nearby chunks on minimap
            if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5) {
                ctx.fillStyle = chunk.type === 'village' ? '#2980b9' : '#27ae60';
                ctx.fillRect(centerX + dx * scale - scale/2, centerY + dy * scale - scale/2, scale, scale);
                ctx.strokeStyle = '#222';
                ctx.strokeRect(centerX + dx * scale - scale/2, centerY + dy * scale - scale/2, scale, scale);
            }
        }

        // Draw player dot
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
