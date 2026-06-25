export class Input {
    constructor() {
        this.keys = {};
        this.pressedKeys = {};
        this.mouse = { left: false, right: false };
        this.pressedMouse = { left: false, right: false };
        
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) {
                this.pressedKeys[e.key] = true;
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                if (!this.mouse.left) this.pressedMouse.left = true;
                this.mouse.left = true;
            } else if (e.button === 2) {
                if (!this.mouse.right) this.pressedMouse.right = true;
                this.mouse.right = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.left = false;
            } else if (e.button === 2) {
                this.mouse.right = false;
            }
        });
    }

    isKeyDown(key) {
        return this.keys[key] === true;
    }

    isKeyPressed(key) {
        return this.pressedKeys[key] === true;
    }

    isMousePressed(button) {
        return this.pressedMouse[button] === true;
    }

    update() {
        this.pressedKeys = {};
        this.pressedMouse = { left: false, right: false };
    }
}
