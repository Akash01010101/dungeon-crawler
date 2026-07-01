/**
 * Isometric Coordinate Utilities
 * 
 * Converts between Cartesian world coordinates (used for all game logic:
 * movement, collision, distance) and Isometric screen coordinates (used
 * for visual rendering).
 * 
 * Uses a standard 2:1 diamond isometric projection with a scale factor.
 */

const ISO_SCALE = 0.5;

/**
 * Convert Cartesian world coordinates to Isometric screen coordinates.
 * @param {number} x - World X position
 * @param {number} y - World Y position
 * @returns {{ x: number, y: number }} Isometric screen position
 */
export function cartToIso(x, y) {
    return {
        x: (x - y) * ISO_SCALE,
        y: (x + y) * ISO_SCALE * 0.5
    };
}

/**
 * Convert Isometric screen coordinates back to Cartesian world coordinates.
 * @param {number} isoX - Screen X position
 * @param {number} isoY - Screen Y position
 * @returns {{ x: number, y: number }} World position
 */
export function isoToCart(isoX, isoY) {
    return {
        x: isoX / ISO_SCALE + (isoY / (ISO_SCALE * 0.5)) * 0.5,
        y: (isoY / (ISO_SCALE * 0.5)) * 0.5 - isoX / ISO_SCALE
    };
}
