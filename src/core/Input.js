export class Input {
    constructor() {
        this.keys = {};
        this.pressedKeys = {};
        this.mouse = { left: false, right: false };
        this.pressedMouse = { left: false, right: false };
        this.scrollDelta = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        window.addEventListener('wheel', (e) => {
            this.scrollDelta = e.deltaY;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
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

        // Touch controls support
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            const mobControls = document.getElementById('mobile-controls');
            if (mobControls) {
                // We don't want to show it immediately on boot since they might be in main menu, 
                // but actually 'mobile-controls' is outside 'game-ui' or inside? 
                // Ah, it's outside. So we just show it.
                mobControls.style.display = 'block';
                
                // Hide main menu title maybe or just leave it. 
                // But let's attach event listeners to buttons
                const mobBtns = document.querySelectorAll('.mob-btn');
                mobBtns.forEach(btn => {
                    const key = btn.getAttribute('data-key');
                    const mouse = btn.getAttribute('data-mouse');
                    
                    const press = (e) => {
                        e.preventDefault(); // Prevent zoom/scroll
                        btn.style.opacity = '1';
                        
                        if (key) {
                            if (!this.keys[key]) {
                                this.pressedKeys[key] = true;
                            }
                            this.keys[key] = true;
                        }
                        if (mouse !== null) {
                            const m = parseInt(mouse);
                            if (m === 0) {
                                if (!this.mouse.left) this.pressedMouse.left = true;
                                this.mouse.left = true;
                            } else if (m === 2) {
                                if (!this.mouse.right) this.pressedMouse.right = true;
                                this.mouse.right = true;
                            }
                        }
                    };
                    
                    const release = (e) => {
                        e.preventDefault();
                        btn.style.opacity = '';
                        
                        if (key) {
                            this.keys[key] = false;
                        }
                        if (mouse !== null) {
                            const m = parseInt(mouse);
                            if (m === 0) this.mouse.left = false;
                            else if (m === 2) this.mouse.right = false;
                        }
                    };

                    btn.addEventListener('touchstart', press, {passive: false});
                    btn.addEventListener('touchend', release, {passive: false});
                    btn.addEventListener('touchcancel', release, {passive: false});
                });
            }
        }
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
        this.scrollDelta = 0;
    }
}
