import * as PIXI from 'pixi.js';

/**
 * Sprite drawing helpers for isometric 2.5D entities.
 * Each function draws directly onto a PIXI.Graphics object,
 * creating the illusion of 3D height with ground shadows,
 * vertically-extruded bodies, and perspective-appropriate shapes.
 */

/**
 * Draw a humanoid character (Player, Goblin, Bandit, Skeleton, etc.)
 * Renders: ground shadow ellipse → vertical body → head circle
 */
export function drawIsoHumanoid(graphics, bodyColor, size = 1.0, options = {}) {
    const w = 16 * size;
    const h = 32 * size;
    const headR = w * 0.38;
    const outlineColor = options.outline || null;
    const headColor = options.headColor || bodyColor;

    // Ground shadow
    graphics.ellipse(0, 4, w * 0.9, w * 0.4);
    graphics.fill({ color: 0x000000, alpha: 0.3 });

    // Body (vertical rounded rect)
    graphics.roundRect(-w / 2, -h, w, h, 3);
    graphics.fill(bodyColor);
    if (outlineColor) {
        graphics.stroke({ color: outlineColor, width: 2 });
    }

    // Head
    graphics.circle(0, -h - headR * 0.6, headR);
    graphics.fill(headColor);
    if (outlineColor) {
        graphics.stroke({ color: outlineColor, width: 1.5 });
    }
}

/**
 * Draw a four-legged animal (Wolf, Deer, Bear, etc.)
 * Renders: ground shadow → horizontal body ellipse → head
 */
export function drawIsoAnimal(graphics, bodyColor, size = 1.0, options = {}) {
    const w = 22 * size;
    const h = 14 * size;
    const headR = h * 0.4;
    const outlineColor = options.outline || null;

    // Ground shadow
    graphics.ellipse(0, 4, w * 0.85, w * 0.35);
    graphics.fill({ color: 0x000000, alpha: 0.3 });

    // Body (horizontal ellipse)
    graphics.ellipse(0, -h, w * 0.8, h * 0.7);
    graphics.fill(bodyColor);
    if (outlineColor) {
        graphics.stroke({ color: outlineColor, width: 2 });
    }

    // Head (offset to front)
    graphics.circle(w * 0.55, -h * 1.1, headR);
    graphics.fill(bodyColor);
}

/**
 * Draw a blob/amorphous monster (Slime, Spider, etc.)
 * Renders: ground shadow → blobby body
 */
export function drawIsoBlob(graphics, bodyColor, size = 1.0, options = {}) {
    const r = 14 * size;
    const outlineColor = options.outline || null;

    // Ground shadow
    graphics.ellipse(0, 4, r * 1.1, r * 0.5);
    graphics.fill({ color: 0x000000, alpha: 0.3 });

    // Body (slightly squished sphere)
    graphics.ellipse(0, -r * 0.5, r, r * 0.75);
    graphics.fill(bodyColor);
    if (outlineColor) {
        graphics.stroke({ color: outlineColor, width: 2 });
    }
}

/**
 * Draw a large brute/boss (Troll, OrcBruiser, etc.)
 * Renders: large shadow → wide body → small head
 */
export function drawIsoBrute(graphics, bodyColor, size = 1.0, options = {}) {
    const w = 22 * size;
    const h = 40 * size;
    const headR = w * 0.3;
    const outlineColor = options.outline || null;

    // Large ground shadow
    graphics.ellipse(0, 6, w * 1.1, w * 0.5);
    graphics.fill({ color: 0x000000, alpha: 0.35 });

    // Wide body
    graphics.roundRect(-w / 2, -h, w, h, 5);
    graphics.fill(bodyColor);
    if (outlineColor) {
        graphics.stroke({ color: outlineColor, width: 2.5 });
    }

    // Small head
    graphics.circle(0, -h - headR * 0.4, headR);
    graphics.fill(bodyColor);
}

/**
 * Draw a structure/building (Shop, Campfire, etc.)
 * Renders as isometric cuboid with top/front faces
 */
export function drawIsoStructure(graphics, wallColor, topColor, w, h, depth) {
    // Ground shadow
    graphics.ellipse(0, depth * 0.3, w * 0.7, depth * 0.35);
    graphics.fill({ color: 0x000000, alpha: 0.2 });

    // Front face
    graphics.rect(-w / 2, -h, w, h);
    graphics.fill(wallColor);
    graphics.stroke({ color: 0x000000, width: 1 });

    // Top face (parallelogram for perspective)
    graphics.moveTo(-w / 2, -h);
    graphics.lineTo(-w / 2 + depth * 0.4, -h - depth * 0.3);
    graphics.lineTo(w / 2 + depth * 0.4, -h - depth * 0.3);
    graphics.lineTo(w / 2, -h);
    graphics.closePath();
    graphics.fill(topColor);
    graphics.stroke({ color: 0x000000, width: 1 });

    // Right face
    graphics.moveTo(w / 2, -h);
    graphics.lineTo(w / 2 + depth * 0.4, -h - depth * 0.3);
    graphics.lineTo(w / 2 + depth * 0.4, -depth * 0.3);
    graphics.lineTo(w / 2, 0);
    graphics.closePath();
    graphics.fill(wallColor);
    graphics.stroke({ color: 0x000000, width: 1 });
}
