import { Scene } from 'phaser';
import { OrientationManager } from './OrientationManager';

export class CustomScene extends Scene {
    protected orientationManager!: OrientationManager;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config);
        //this.orientationManager = new OrientationManager(this);
    }

    create() {
        // Initialize orientation listener & overlay for this scene
        this.orientationManager = new OrientationManager(this);
    }
}