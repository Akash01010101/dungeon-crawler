# Wasteland Crawler (OOP Dungeon Crawler)

This game is a post-apocalyptic, procedurally generated survival RPG. It is built entirely in vanilla JavaScript (ES6) with PixiJS for rendering. The project serves as a comprehensive demonstration of **Object-Oriented Programming (OOP) principles**, **Low-Level System Design (LLD)**, and efficient **Graphics Pipeline** management.

---

## 🌟 Game Features

- **Infinite Procedural World**: The map generates endlessly in all directions as the player moves. The world consists of toxic wilderness and fortified scrap-metal villages (Safe Zones).
- **Dynamic Ecosystem & Director AI**: 13 unique enemy/NPC types belong to different factions (Player, Neutral, Herbivore, Predator, Enemy). Factions interact dynamically (e.g., Bandits attack wolves, bears sleep until provoked). A "Director AI" controls spawn rates and entity caps to prevent lag.
- **Day/Night Cycle**: The world smoothly transitions between Day and Night. At night, terrifying Undead enemies (Skeletons, Vampires) spawn. When the sun rises, any remaining Undead burn to death.
- **Survival Mechanics**: Players must manage Hunger by hunting wildlife (Rabbits, Deer), looting raw meat, and cooking it at village fires.
- **RPG Progression**: Features XP, Leveling, and stats (Strength, Agility, Intelligence). Health and Mana regeneration scale with the player's level.
- **Combat & Abilities**: Melee attacks, ranged magic projectiles (costs mana), and AoE power attacks. Features vampiric lifesteal and floating damage text.
- **Persistent State**: A Main Menu with Save/Load functionality using browser `localStorage` to preserve exact stats, inventory, and location.

---

## 🏛️ The 4 Pillars of OOP

### 1. Encapsulation
Encapsulation is the bundling of data and the methods that operate on that data, restricting direct access.
**How it's used:**
In `Character.js`, core stats like `#health`, `#speed`, and `#faction` are strictly private (using ES6 `#` fields). The outside world (like the Game Loop or an Enemy) cannot arbitrarily execute `player.health = 0`. They must use public methods like `takeDamage(amount)`, allowing the class to safely update the HP bar and handle death logic internally.

### 2. Abstraction
Abstraction hides complex implementation details, exposing only essential features.
**How it's used:**
The `Entity` class (`Entity.js`) abstracts away WebGL rendering and PixiJS math. The `Game.js` loop simply calls `entity.update(delta)`. The child classes (like `Warrior` or `Goblin`) only deal with high-level game logic (e.g., `this.move()`, `this.attack()`) without ever needing to touch the low-level rendering context.

### 3. Inheritance
Inheritance allows classes to inherit properties/methods from others, promoting massive code reuse.
**How it's used:**
The game utilizes a deep hierarchy:
`Entity` -> `Character` -> `Player` -> `Warrior`
`Entity` -> `Character` -> `Enemy` -> `BanditArcher`
An `OrcBruiser` doesn't write its own collision or HP bar logic; it inherits rendering from `Entity` and health management from `Character`. It only implements its unique knockback AI.

### 4. Polymorphism
Polymorphism allows objects of different classes to be treated as a common superclass, dynamically invoking overridden methods.
**How it's used:**
In `Game.js`, the main loop iterates over an array of abstract `Entity` objects and calls `entity.update(delta)`. The loop doesn't care if the entity is a `Slime`, a `Projectile`, or a `Villager`. Each class overrides `update()` to perform completely different logic (e.g., Slimes split in half, Projectiles check hitboxes, Villagers wander).

---

## ⚙️ Low-Level System Design (LLD)

### 1. The Master Game Loop
At the core of the engine is `Game.js`, utilizing the PixiJS `Ticker`. This is a classic pattern that decouples logic from rendering:
- **Input Polling**: Reads buffered keystrokes.
- **State Updates**: Calculates Delta Time (`delta`) to ensure physics and movement remain consistent regardless of monitor refresh rate.
- **Garbage Collection**: Reaps dead entities (`isDead()`) and cleans up memory references.

### 2. Spatial Hashing & Chunk Management
To support an infinite world without melting the CPU, the game uses **Chunk-based Spatial Hashing** in `WorldGenerator.js`.
- The world is mathematically divided into 1000x1000 pixel chunks.
- As the player moves, the system calculates `chunkX` and `chunkY`.
- **Spatial Garbage Collection**: Chunks that fall too far outside the player's view radius are serialized to memory and their graphical assets are destroyed to free GPU VRAM. When the player returns, the chunk is rebuilt.

### 3. Director AI
Instead of spawning monsters randomly on a timer, a "Director AI" continuously analyzes the current `activeChunks`. It maintains a strict Global Cap (e.g., Max 15 Hostiles) and calculates spawn probabilities based on the Day/Night cycle, ensuring the game remains balanced and performant.

### 4. State Serialization
Game states are managed via a lightweight serializer that extracts primitive data (Level, XP, Inventory, Coordinates) from complex OOP objects and writes them to browser `localStorage` via JSON. Upon loading, this JSON is parsed and injected directly into the active instances.

---

## 🎨 Graphics Library Integration (PixiJS)

Rather than manipulating the DOM, the game uses **PixiJS** as a WebGL wrapper for hardware-accelerated 2D rendering.

### 1. Scene Graph (Containers)
Every `Entity` is assigned a `PIXI.Container`. If an entity has multiple graphical parts (e.g., a sprite, a floating HP bar, a text nameplate, and a scary red aura), they are all added to the *container*. Moving the container moves everything at once, preventing relative-coordinate desyncs.

### 2. Primitive Vector Graphics
Instead of loading `.png` textures, all assets are dynamically drawn using `PIXI.Graphics` primitives (Circles, Rectangles, Polygons). This results in a near-instant boot time and zero bandwidth overhead.

### 3. Screen-Space Overlays & Filters
- **Day/Night Transition**: A global `PIXI.Graphics` overlay is rendered on top of the world container but below the UI layer. Its `alpha` (opacity) smoothly transitions from `0.0` to `0.7` based on the internal `timeOfDay` clock to simulate nightfall.
- **Dynamic Tinting**: When characters take damage or heal, their core sprite's `tint` property is temporarily set to `0xff0000` (Red) or `0x00ff00` (Green), providing visceral combat feedback without needing alternative texture frames.

---

## 🚀 Running the Game

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Click **New Game** or **Load Game** on the Main Menu.

**Controls:**
- **WASD**: Move
- **Left Click**: Melee Attack
- **Right Click**: Ranged Magic Projectile (Costs Mana)
- **E**: 3-Way Power Attack (Costs 50 Mana)
- **Shift**: Sprint (Accelerates Hunger Drain)
- **F**: Eat Food (Wilderness) / Cook Raw Meat (Inside Villages)
- **M**: Toggle Minimap
- **C**: View Character Stat Sheet
- **1/2/3/4**: Shop hotkeys (Inside Villages)
- **5**: Save Game (Inside Villages)
