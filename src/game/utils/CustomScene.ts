import { Scene, Cameras } from 'phaser';

export class CustomScene extends Scene {
    constructor(key: string) {
        super(key);
    }

    create() {
        // Smooth camera fade-in on every scene start
        this.cameras.main.fadeIn(250, 0, 0, 0);
    }

    /**
     * Fades out the main camera before starting the target scene
     */
    protected transitionTo(targetSceneKey: string, data?: object, duration: number = 250) {
        this.cameras.main.fadeOut(duration, 0, 0, 0);
        this.cameras.main.once(Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(targetSceneKey, data);
        });
    }
}
