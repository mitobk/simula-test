import { CustomScene } from '../utils/CustomScene';

export class MainMenu extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super('MainMenu');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x201338); // Brand deep ink background

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // --- TITLE HEADER ---
        this.add.text(centerX, centerY - 180, 'SCRAMBLY', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#F58324'
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 140, 'Play & Claim Rewards', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8'
        }).setOrigin(0.5);

        // --- TUTORIAL CARD CONTAINER ---
        const cardWidth = 290;
        const cardHeight = 190;
        
        this.add.rectangle(centerX, centerY - 10, cardWidth, cardHeight, 0x2D1B4E, 0.9)
            .setStrokeStyle(2, 0x7845D8);

        this.add.text(centerX, centerY - 85, 'HOW TO PLAY', {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Tutorial Instructions List
        const steps = [
            '🧩  Match 3 tiles of the same color',
            '⚡  Beat the bottom countdown timer',
            '🪙  Earn coins & protect your 3 lives!'
        ];

        steps.forEach((stepText, index) => {
            this.add.text(centerX - 125, centerY - 50 + (index * 32), stepText, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#FFF6E8',
                align: 'left'
            }).setOrigin(0, 0.5);
        });

        // --- START GAME BUTTON ---
        const startBtnY = centerY + 130;
        const startBtnBg = this.add.rectangle(centerX, startBtnY, 220, 48, 0xF58324)
            .setInteractive({ useHandCursor: true });

        const startBtnText = this.add.text(centerX, startBtnY, 'PLAY NOW 🎮', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#FFF6E8'
        }).setOrigin(0.5);

        // Interactive Feedback
        startBtnBg.on('pointerover', () => startBtnBg.setFillStyle(0xD96E14));
        startBtnBg.on('pointerout', () => startBtnBg.setFillStyle(0xF58324));

        startBtnBg.on('pointerdown', () => {
            // Button pulse before starting
            this.tweens.add({
                targets: [startBtnBg, startBtnText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('Game');
                }
            });
        });
    }
}