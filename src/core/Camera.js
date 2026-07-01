import { cartToIso } from '../utils/IsoUtils.js';

/**
 * Camera system for the isometric world.
 * Handles smooth follow, zoom (mouse wheel), and viewport transforms.
 * Operates in isometric screen-space coordinates.
 */
export class Camera {
    constructor() {
        this.x = 0; // Current camera center (iso screen X)
        this.y = 0; // Current camera center (iso screen Y)
        this.zoom = 0.8;
        this.targetZoom = 0.8;
        this.followTarget = null;
        this.smoothing = 0.08;
        this.zoomSpeed = 0.15;
    }

    /**
     * Update camera position and zoom each frame.
     * @param {number} delta - Frame delta time
     * @param {number} scrollDelta - Mouse wheel delta (from Input)
     */
    update(delta, scrollDelta) {
        // Handle zoom
        if (scrollDelta) {
            this.targetZoom -= scrollDelta * 0.001;
            this.targetZoom = Math.max(0.3, Math.min(2.5, this.targetZoom));
        }

        // Smooth zoom interpolation
        this.zoom += (this.targetZoom - this.zoom) * this.zoomSpeed;

        // Follow target
        if (this.followTarget) {
            const iso = cartToIso(this.followTarget.x, this.followTarget.y);
            const targetX = iso.x;
            const targetY = iso.y;

            // Smooth lerp towards target
            this.x += (targetX - this.x) * this.smoothing * Math.min(delta, 4);
            this.y += (targetY - this.y) * this.smoothing * Math.min(delta, 4);
        }
    }

    /**
     * Apply camera transform to the world container.
     * Centers the followed target on screen with current zoom.
     * @param {PIXI.Container} container - The worldContainer
     */
    applyTo(container) {
        container.scale.set(this.zoom);
        container.x = window.innerWidth / 2 - this.x * this.zoom;
        container.y = window.innerHeight / 2 - this.y * this.zoom;
    }

    /**
     * Convert a screen pixel coordinate to world coordinate.
     * Useful for click-to-move or mouse interaction.
     */
    screenToWorld(screenX, screenY) {
        const isoX = (screenX - window.innerWidth / 2) / this.zoom + this.x;
        const isoY = (screenY - window.innerHeight / 2) / this.zoom + this.y;
        // isoToCart: x = isoX + 2*isoY, y = 2*isoY - isoX (accounting for ISO_SCALE)
        return {
            x: isoX + isoY * 2,
            y: isoY * 2 - isoX
        };
    }
}
