import * as Phaser from 'phaser';

export class OrientationManager {
    private scene: Phaser.Scene;
    private overlayContainer!: Phaser.GameObjects.Container;
    private bgRectangle!: Phaser.GameObjects.Rectangle;
    private isLandscape: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.handleResize = this.handleResize.bind(this);

        this.createOverlay();

        // Listen to Phaser Scale Manager and Browser resize events
        this.scene.scale.on('resize', this.handleResize, this);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);

        // Immediate check on creation
        this.checkOrientation(true);

        // Secondary verification after the DOM layout settles on load
        this.scene.time.delayedCall(50, () => this.checkOrientation(true));
        this.scene.time.delayedCall(200, () => this.checkOrientation(true));

        // Cleanup event listeners when scene shuts down or is destroyed
        this.scene.events.once('shutdown', this.destroy, this);
        this.scene.events.once('destroy', this.destroy, this);
    }

    private createOverlay() {
        const { width, height } = this.scene.scale;

        // Dark backdrop blocking all interaction underneath
        this.bgRectangle = this.scene.add.rectangle(0, 0, Math.max(width, height) * 3, Math.max(width, height) * 3, 0x201338, 0.98)
            .setInteractive();

        // Phone rotation graphic icon
        const icon = this.scene.add.graphics();
        icon.lineStyle(4, 0xF58324);
        icon.strokeRoundedRect(-30, -50, 60, 100, 10);
        icon.strokeCircle(0, 30, 5);

        // Instructional Text
        const text = this.scene.add.text(0, 80, 'Please rotate your device\nto Portrait mode', {
            fontSize: '22px',
            color: '#FFF6E8',
            align: 'center',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5);

        this.overlayContainer = this.scene.add.container(width / 2, height / 2, [this.bgRectangle, icon, text]);
        this.overlayContainer.setDepth(99999);
        this.overlayContainer.setVisible(false);
    }

    private handleResize() {
        requestAnimationFrame(() => {
            if (this.overlayContainer && this.overlayContainer.active) {
                const { width, height } = this.scene.scale;
                this.overlayContainer.setPosition(width / 2, height / 2);

                if (this.bgRectangle) {
                    const maxDim = Math.max(width, height) * 3;
                    this.bgRectangle.setSize(maxDim, maxDim);
                }
            }
            this.checkOrientation();
        });
    }

    private checkOrientation(force: boolean = false) {
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        const isLandscapeNow = windowWidth > windowHeight;

        if (force || isLandscapeNow !== this.isLandscape) {
            this.isLandscape = isLandscapeNow;
            const sceneKey = this.scene.scene.key;

            if (this.overlayContainer && this.overlayContainer.active) {
                if (this.isLandscape) {
                    this.overlayContainer.setVisible(true);
                    
                    if (force) {
                        // Allow the camera fadeIn animation (250ms) to complete before pausing 
                        // so the screen doesn't get stuck black on initial landscape boot.
                        this.scene.time.delayedCall(300, () => {
                            const currentWidth = window.innerWidth || document.documentElement.clientWidth;
                            const currentHeight = window.innerHeight || document.documentElement.clientHeight;
                            if (currentWidth > currentHeight && !this.scene.scene.isPaused(sceneKey)) {
                                this.scene.scene.pause(sceneKey);
                                if (this.scene.sound) {
                                    this.scene.sound.pauseAll();
                                }
                            }
                        });
                    } else {
                        if (!this.scene.scene.isPaused(sceneKey)) {
                            this.scene.scene.pause(sceneKey);
                            if (this.scene.sound) {
                                this.scene.sound.pauseAll();
                            }
                        }
                    }
                } else {
                    this.overlayContainer.setVisible(false);
                    
                    if (this.scene.scene.isPaused(sceneKey)) {
                        this.scene.scene.resume(sceneKey);
                        if (this.scene.sound) {
                            this.scene.sound.resumeAll();
                        }
                    }
                }
            }
        }
    }

    public destroy() {
        if (this.scene && this.scene.scale) {
            this.scene.scale.off('resize', this.handleResize, this);
        }
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);

        if (this.overlayContainer) {
            this.overlayContainer.destroy();
        }
    }
}
