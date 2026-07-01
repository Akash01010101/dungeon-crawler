import * as PIXI from 'pixi.js';
import { cartToIso } from '../utils/IsoUtils.js';

/**
 * ABSTRACTION: Entity class abstracts away the complexity of PixiJS rendering
 * and isometric coordinate projection. Child classes don't need to know how
 * their world position maps to screen position — they just manage game logic.
 *
 * World coordinates (worldX, worldY) are Cartesian and used for ALL game logic
 * (movement, collision, distance). The container's screen position is automatically
 * computed via isometric projection.
 */
export class Entity {
    constructor(x, y, stage) {
        this.worldX = x;
        this.worldY = y;
        this.stage = stage;

        this.container = new PIXI.Container();
        const iso = cartToIso(x, y);
        this.container.x = iso.x;
        this.container.y = iso.y;
        this.container.zIndex = iso.y;
        this.stage.addChild(this.container);

        // Subclasses should populate this
        this.sprite = null;
    }

    /** Game logic reads/writes world X (Cartesian). Setting it updates iso screen position. */
    get x() { return this.worldX; }
    set x(val) {
        this.worldX = val;
        this._updateIsoPosition();
    }

    /** Game logic reads/writes world Y (Cartesian). Setting it updates iso screen position. */
    get y() { return this.worldY; }
    set y(val) {
        this.worldY = val;
        this._updateIsoPosition();
    }

    /** Recalculate the container's screen position from world coordinates. */
    _updateIsoPosition() {
        const iso = cartToIso(this.worldX, this.worldY);
        this.container.x = iso.x;
        this.container.y = iso.y;
        this.container.zIndex = iso.y; // Depth sorting: further south = rendered on top
    }

    /** Current isometric screen X (read-only, for positioning floating text etc.) */
    get isoX() { return this.container.x; }
    /** Current isometric screen Y (read-only) */
    get isoY() { return this.container.y; }

    update(delta, allEntities, player) {
        // To be overridden (Polymorphism)
    }

    destroy() {
        this.stage.removeChild(this.container);
        this.container.destroy({ children: true });
    }
}
