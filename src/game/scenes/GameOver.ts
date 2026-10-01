import Phaser from 'phaser';
import { CustomScene } from '../utils/CustomScene';

// Brand Palette Constants matching official spec
const COLORS = {
    ORANGE: 0xF58324,
    ORANGE_DARK: 0xD96E14,
    PURPLE: 0x7845D8,
    PURPLE_DARK: 0x3D246C,
    DEEP_INK: 0x201338,
    WARM_WHITE: 0xFFF6E8,
    CARD_BG: 0x2D1B4E,
    ACCENT_GOLD: 0xFFD700,
    RED_ACCENT: 0xE74C3C,
    GREEN_ACCENT: 0x2ECC71
};

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
        this.camera.setBackgroundColor(COLORS.DEEP_INK);

        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        // Title Header
        this.add.text(centerX, Math.floor(centerY - 160), 'OUT OF LIVES!', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#E74C3C',
            stroke: '#201338',
            strokeThickness: 6,
            resolution: 2
        }).setOrigin(0.5);

        // Final Score Summary
        this.add.text(centerX, Math.floor(centerY - 100), `Coins Collected: ${this.finalScore}`, {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#FFD700',
            fontStyle: 'bold',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        // Subtitle / Reward Pitch
        this.add.text(centerX, Math.floor(centerY - 60), 'Ready to claim real rewards?', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            align: 'center',
            resolution: 2
        }).setOrigin(0.5);

        // --- SCRAMBLY CTA BUTTON ---
        const ctaBg = this.add.rectangle(centerX, centerY, 260, 50, COLORS.ORANGE)
            .setInteractive({ useHandCursor: true });

        const ctaText = this.add.text(centerX, centerY, 'Explore Scrambly 🚀', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#FFF6E8',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        // Interactive Feedback for CTA
        ctaBg.on('pointerover', () => ctaBg.setFillStyle(COLORS.ORANGE_DARK));
        ctaBg.on('pointerout', () => ctaBg.setFillStyle(COLORS.ORANGE));

        ctaBg.on('pointerdown', () => {
            // Requirement 1: Log click in console
            console.log('CTA clicked — demo only');

            // Requirement 2: Show local visual confirmation
            this.add.text(centerX, Math.floor(centerY + 35), 'CTA clicked — demo only', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#2ECC71',
                fontStyle: 'bold',
                resolution: 2
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
        const restartY = Math.floor(centerY + 100);
        const restartBg = this.add.rectangle(centerX, restartY, 180, 40, COLORS.CARD_BG)
            .setStrokeStyle(2, COLORS.PURPLE)
            .setInteractive({ useHandCursor: true });

        this.add.text(centerX, restartY, 'Play Again 🔄', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            fontStyle: 'bold',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        restartBg.on('pointerover', () => restartBg.setFillStyle(COLORS.PURPLE_DARK));
        restartBg.on('pointerout', () => restartBg.setFillStyle(COLORS.CARD_BG));

        restartBg.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}