import * as PIXI from 'pixi.js';

/**
 * ABSTRACTION: Entity class abstracts away the complexity of PixiJS rendering.
 * Child classes don't need to know how to draw themselves to the canvas,
 * they just need to manage their logic (update, move).
 */
export class Entity {
    constructor(x, y, stage) {
        this._x = x;
        this._y = y;
        this.stage = stage;
        
        this.container = new PIXI.Container();
        this.container.x = x;
        this.container.y = y;
        this.stage.addChild(this.container);

        // Subclasses should populate this
        this.sprite = null; 
    }

    get x() { return this._x; }
    set x(val) {
        this._x = val;
        this.container.x = val;
    }

    get y() { return this._y; }
    set y(val) {
        this._y = val;
        this.container.y = val;
    }

    update(delta, allEntities, player) {
        // To be overridden (Polymorphism)
    }

    destroy() {
        this.stage.removeChild(this.container);
        this.container.destroy({ children: true });
    }
}
