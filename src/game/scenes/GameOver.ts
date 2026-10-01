import { CustomScene } from '../utils/CustomScene';

export class GameOver extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;
    private finalScore: number = 0;

    constructor() {
        super('GameOver');
    }

    init(data: { score?: number }) {
        // Receive final coin score from Game scene
        this.finalScore = data.score || 0;
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x201338); // Brand background color

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Title Header
        this.add.text(centerX, centerY - 160, 'OUT OF LIVES!', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#E74C3C',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Final Score Summary
        this.add.text(centerX, centerY - 100, `Coins Collected: ${this.finalScore}`, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle / Reward Pitch
        this.add.text(centerX, centerY - 60, 'Ready to claim real rewards?', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            align: 'center'
        }).setOrigin(0.5);

        // --- SCRAMBLY CTA BUTTON ---
        const ctaBg = this.add.rectangle(centerX, centerY, 260, 50, 0xF58324)
            .setInteractive({ useHandCursor: true });

        const ctaText = this.add.text(centerX, centerY, 'Explore Scrambly 🚀', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#FFF6E8'
        }).setOrigin(0.5);

        // Interactive Feedback for CTA
        ctaBg.on('pointerover', () => ctaBg.setFillStyle(0xD96E14));
        ctaBg.on('pointerout', () => ctaBg.setFillStyle(0xF58324));

        ctaBg.on('pointerdown', () => {
            // Requirement 1: Log click in console
            console.log('CTA clicked — demo only');

            // Requirement 2: Show local visual confirmation
            this.add.text(centerX, centerY + 35, 'CTA clicked — demo only', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#2ECC71',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Button bounce animation
            this.tweens.add({
                targets: [ctaBg, ctaText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true
            });

            // Prevent repeated toasts
            ctaBg.disableInteractive();
        });

        // --- RESTART / PLAY AGAIN BUTTON ---
        const restartBg = this.add.rectangle(centerX, centerY + 100, 180, 40, 0x2D1B4E)
            .setStrokeStyle(2, 0x7845D8)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX, centerY + 100, 'Play Again 🔄', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartBg.on('pointerover', () => restartBg.setFillStyle(0x3D246C));
        restartBg.on('pointerout', () => restartBg.setFillStyle(0x2D1B4E));

        restartBg.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}