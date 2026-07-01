import { Goblin } from '../entities/Goblin.js';
import { Orc } from '../entities/Orc.js';
import { Villager } from '../entities/Villager.js';
import { Shop } from '../entities/Shop.js';
import { Adventurer } from '../entities/Adventurer.js';
import { Deer } from '../entities/Deer.js';
import { Wolf } from '../entities/Wolf.js';
import { Rabbit } from '../entities/Rabbit.js';
import { Bear } from '../entities/Bear.js';
import { GiantSpider } from '../entities/GiantSpider.js';
import { DireWolf } from '../entities/DireWolf.js';
import { Skeleton } from '../entities/Skeleton.js';
import { Vampire } from '../entities/Vampire.js';
import { Bandit } from '../entities/Bandit.js';
import { BanditArcher } from '../entities/BanditArcher.js';
import { GoblinShaman } from '../entities/GoblinShaman.js';
import { OrcBruiser } from '../entities/OrcBruiser.js';
import { Slime } from '../entities/Slime.js';
import { Troll } from '../entities/Troll.js';
import * as PIXI from 'pixi.js';
import { cartToIso } from '../utils/IsoUtils.js';

export class WorldGenerator {
    constructor(game) {
        this.game = game;
        this.chunkSize = 1000;
        this.chunks = {}; // all generated chunks
        this.loadedChunks = new Set(); // chunks currently active
        
        // Director AI State
        this.spawnCooldown = 0;
        this.maxHostiles = 15; // Decreased from 30
    }

    getChunkKey(cx, cy) {
        return `${cx},${cy}`;
    }

    update(player) {
        const cx = Math.floor(player.x / this.chunkSize);
        const cy = Math.floor(player.y / this.chunkSize);

        const chunksToLoad = new Set();

        // Load 3x3 chunks around player
        for (let x = cx - 1; x <= cx + 1; x++) {
            for (let y = cy - 1; y <= cy + 1; y++) {
                const key = this.getChunkKey(x, y);
                chunksToLoad.add(key);

                if (!this.chunks[key]) {
                    this.generateChunk(x, y, key);
                }
                
                if (!this.loadedChunks.has(key)) {
                    this.loadChunk(key);
                }
            }
        }

        // Unload chunks that are out of bounds
        for (const key of this.loadedChunks) {
            if (!chunksToLoad.has(key)) {
                this.unloadChunk(key);
            }
        }

        this.loadedChunks = chunksToLoad;

        // Director AI: Dynamic Spawning
        this.runDirector(player);
    }

    runDirector(player) {
        if (this.spawnCooldown > 0) {
            this.spawnCooldown--;
            return;
        }

        let hostileCount = 0;
        for (const entity of this.game.entities) {
            if (entity.faction === 'enemy' || entity.faction === 'predator') {
                hostileCount++;
            }
        }

        if (hostileCount < this.maxHostiles) {
            // Pick a random loaded chunk
            const loadedArray = Array.from(this.loadedChunks);
            if (loadedArray.length === 0) return;
            const randomKey = loadedArray[Math.floor(Math.random() * loadedArray.length)];
            const chunk = this.chunks[randomKey];

            if (chunk && chunk.type === 'wilderness') {
                this.spawnEnemiesInChunk(chunk);
                this.spawnCooldown = 120; // Wait 2 seconds before spawning again
            }
        }
    }

    spawnEnemiesInChunk(chunk) {
        // Spawn logic based on Day/Night
        const isNight = this.game.isNight;
        const spawnRoll = Math.random();
        
        const spawnX = chunk.cx * this.chunkSize + Math.random() * this.chunkSize;
        const spawnY = chunk.cy * this.chunkSize + Math.random() * this.chunkSize;

        let entity;
        if (isNight) {
            // Night Spawns
            if (spawnRoll < 0.6) {
                // Skeletons (60% at night)
                for(let i=0; i<4; i++) {
                    this.game.entities.push(new Skeleton(spawnX + i*25, spawnY + i*25, this.game.worldContainer));
                }
            } else if (spawnRoll < 0.9) {
                // Giant Spiders (30% at night)
                for(let i=0; i<2; i++) {
                    this.game.entities.push(new GiantSpider(spawnX + i*40, spawnY + i*40, this.game.worldContainer));
                }
            } else {
                // Vampire (10% at night)
                this.game.entities.push(new Vampire(spawnX, spawnY, this.game.worldContainer));
            }
        } else {
            // Day Spawns: Heavily skewed towards non-hostiles
            if (spawnRoll < 0.35) {
                // Adventurers (35%)
                entity = new Adventurer(spawnX, spawnY, this.game.worldContainer);
            } else if (spawnRoll < 0.75) {
                // Herbivores (40%)
                if (Math.random() < 0.5) {
                    for(let i=0; i<3; i++) {
                        this.game.entities.push(new Deer(spawnX + i*20, spawnY + i*20, this.game.worldContainer));
                    }
                } else {
                    for(let i=0; i<4; i++) {
                        this.game.entities.push(new Rabbit(spawnX + i*15, spawnY + i*15, this.game.worldContainer));
                    }
                }
            } else if (spawnRoll < 0.85) {
                // Predators (10%)
                const predatorRoll = Math.random();
                if (predatorRoll < 0.6) {
                    for(let i=0; i<2; i++) {
                        this.game.entities.push(new Wolf(spawnX + i*20, spawnY + i*20, this.game.worldContainer));
                    }
                } else if (predatorRoll < 0.9) {
                    this.game.entities.push(new Bear(spawnX, spawnY, this.game.worldContainer));
                } else {
                    this.game.entities.push(new DireWolf(spawnX, spawnY, this.game.worldContainer));
                }
            } else {
                // Hostile Factions (15%)
                const gobRoll = Math.random();
                for(let i=0; i<3; i++) {
                    if (gobRoll < 0.2) {
                        this.game.entities.push(new Bandit(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                    } else if (gobRoll < 0.4) {
                        this.game.entities.push(new BanditArcher(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                    } else if (gobRoll < 0.5) {
                        this.game.entities.push(new Slime(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                    } else if (gobRoll < 0.6) {
                        this.game.entities.push(new Troll(spawnX, spawnY, this.game.worldContainer));
                        break; // Boss only spawns alone
                    } else {
                        // Mixed Goblins/Orcs
                        const enemyType = Math.random();
                        if (enemyType < 0.3) {
                            this.game.entities.push(new Goblin(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                        } else if (enemyType < 0.6) {
                            this.game.entities.push(new Orc(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                        } else if (enemyType < 0.8) {
                            this.game.entities.push(new GoblinShaman(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                        } else {
                            this.game.entities.push(new OrcBruiser(spawnX + i*30, spawnY + i*30, this.game.worldContainer));
                        }
                    }
                }
            }
        }

        if (entity) {
            this.game.entities.push(entity);
        }
    }

    generateChunk(cx, cy, key) {
        // Simple random biome generator
        // 0,0 is always a village so player starts safe
        let type = 'wilderness';
        if (cx === 0 && cy === 0) {
            type = 'village';
        } else {
            type = Math.random() < 0.2 ? 'village' : 'wilderness';
        }

        const chunkData = {
            type,
            cx,
            cy,
            entities: [],
            graphics: null
        };

        // Draw chunk background as isometric diamond
        const g = new PIXI.Graphics();
        // Post-Apocalyptic Colors:
        const color = type === 'village' ? 0x2b2b2b : 0x3a4030;
        const s = this.chunkSize;
        const wx = cx * s;
        const wy = cy * s;

        // 4 corners of the chunk projected to isometric space
        const tl = cartToIso(wx, wy);
        const tr = cartToIso(wx + s, wy);
        const br = cartToIso(wx + s, wy + s);
        const bl = cartToIso(wx, wy + s);

        g.moveTo(tl.x, tl.y);
        g.lineTo(tr.x, tr.y);
        g.lineTo(br.x, br.y);
        g.lineTo(bl.x, bl.y);
        g.closePath();
        g.fill({ color, alpha: 0.4 });
        g.stroke({ color: type === 'village' ? 0x555555 : 0x2a3020, width: 1.5 });
        chunkData.graphics = g;

        this.chunks[key] = chunkData;

        // For villages, we store fixed entities so they respawn when visiting
        if (type === 'village') {
            const shopX = cx * this.chunkSize + this.chunkSize / 2;
            const shopY = cy * this.chunkSize + this.chunkSize / 2;
            chunkData.entities.push({ type: 'shop', x: shopX, y: shopY });

            for (let i = 0; i < 5; i++) {
                chunkData.entities.push({ 
                    type: 'villager', 
                    x: cx * this.chunkSize + Math.random() * this.chunkSize, 
                    y: cy * this.chunkSize + Math.random() * this.chunkSize 
                });
            }
        }
    }

    loadChunk(key) {
        const chunk = this.chunks[key];
        // Add chunk background
        this.game.worldContainer.addChildAt(chunk.graphics, 0);

        // Instantiate static entities for villages
        for (const data of chunk.entities) {
            let entity;
            if (data.type === 'shop') {
                entity = new Shop(data.x, data.y, this.game.worldContainer);
            } else if (data.type === 'villager') {
                entity = new Villager(data.x, data.y, this.game.worldContainer, chunk.cx, chunk.cy);
            }
            if (entity) {
                this.game.entities.push(entity);
            }
        }
    }

    unloadChunk(key) {
        const chunk = this.chunks[key];
        if (chunk.graphics && chunk.graphics.parent) {
            chunk.graphics.parent.removeChild(chunk.graphics);
        }
        // Note: Entity destruction is now handled dynamically in Game.js
        // based on their real-time physical coordinates, not chunk origin.
    }
}
