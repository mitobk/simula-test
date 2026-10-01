import Phaser from 'phaser';
import { CustomScene } from '../utils/CustomScene';

// Brand Palette Constants matching the official spec
const COLORS = {
    ORANGE: 0xF58324,
    ORANGE_DARK: 0xD96E14,
    PURPLE: 0x7845D8,
    DEEP_INK: 0x201338,
    WARM_WHITE: 0xFFF6E8,
    CARD_BG: 0x2A1A45,
    ACCENT_GOLD: 0xFFD700
};

export class MainMenu extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;

    constructor() {
        super('MainMenu');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(COLORS.DEEP_INK);

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // --- BACKGROUND DECORATIVE ACCENTS ---
        const bgGlow = this.add.graphics();
        bgGlow.fillStyle(COLORS.PURPLE, 0.15);
        bgGlow.fillCircle(centerX, centerY - 60, 180);

        // --- BRAND LOGO / TITLE HEADER ---
        const titleText = this.add.text(centerX, centerY - 190, 'SCRAMBLY', {
            fontFamily: 'Arial Black',
            fontSize: '38px',
            color: '#F58324',
            stroke: '#201338',
            strokeThickness: 6
        }).setOrigin(0.5);

        const subtitleText = this.add.text(centerX, centerY - 148, 'Play & Claim Rewards', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#FFF6E8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtle pulsing effect on title
        this.tweens.add({
            targets: [titleText, subtitleText],
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- TUTORIAL CARD CONTAINER ---
        const cardWidth = 310;
        const cardHeight = 210;
        const cardY = centerY - 10;

        // Outer Shadow & Card Frame
        const cardGfx = this.add.graphics();
        // Drop Shadow
        cardGfx.fillStyle(0x000000, 0.3);
        cardGfx.fillRoundedRect(centerX - cardWidth / 2 + 4, cardY - cardHeight / 2 + 4, cardWidth, cardHeight, 16);
        // Main Card Fill
        cardGfx.fillStyle(COLORS.CARD_BG, 0.95);
        cardGfx.fillRoundedRect(centerX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 16);
        // Border
        cardGfx.lineStyle(2, COLORS.PURPLE, 0.8);
        cardGfx.strokeRoundedRect(centerX - cardWidth / 2, cardY - cardHeight / 2, cardWidth, cardHeight, 16);

        // Header Label inside Card
        this.add.text(centerX, cardY - 80, 'HOW TO PLAY', {
            fontFamily: 'Arial Black',
            fontSize: '15px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Tutorial Steps Data
        const steps = [
            { icon: '🧩', text: 'Match 3 tiles of the same color' },
            { icon: '⚡', text: 'Beat the bottom countdown timer' },
            { icon: '🪙', text: 'Earn coins & protect your 3 lives!' }
        ];

        steps.forEach((step, index) => {
            const stepY = cardY - 42 + (index * 42);

            // Row background pill
            const rowGfx = this.add.graphics();
            rowGfx.fillStyle(COLORS.DEEP_INK, 0.6);
            rowGfx.fillRoundedRect(centerX - 135, stepY - 16, 270, 32, 8);

            // Icon Badge
            this.add.text(centerX - 118, stepY, step.icon, {
                fontSize: '16px'
            }).setOrigin(0.5);

            // Step Description
            this.add.text(centerX - 98, stepY, step.text, {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#FFF6E8',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
        });

        // --- START GAME BUTTON ---
        const btnY = centerY + 145;
        const btnWidth = 220;
        const btnHeight = 50;

        // Button Container
        const btnContainer = this.add.container(centerX, btnY);

        const btnGfx = this.add.graphics();

        const drawButton = (isHover: boolean = false) => {
            btnGfx.clear();
            const color = isHover ? COLORS.ORANGE_DARK : COLORS.ORANGE;
            
            // Button Shadow
            btnGfx.fillStyle(0x000000, 0.35);
            btnGfx.fillRoundedRect(-btnWidth / 2 + 3, -btnHeight / 2 + 4, btnWidth, btnHeight, 25);

            // Main Base
            btnGfx.fillStyle(color, 1);
            btnGfx.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);

            // Top Inner Highlight for depth
            btnGfx.fillStyle(0xFFFFFF, 0.2);
            btnGfx.fillRoundedRect(-btnWidth / 2 + 6, -btnHeight / 2 + 4, btnWidth - 12, (btnHeight - 8) / 2, { tl: 18, tr: 18, bl: 4, br: 4 });
        };

        drawButton(false);

        const btnText = this.add.text(0, 0, 'PLAY NOW 🎮', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#FFF6E8'
        }).setOrigin(0.5);

        btnContainer.add([btnGfx, btnText]);

        // Hit Area setup using Container dimensions
        btnContainer.setSize(btnWidth, btnHeight);
        btnContainer.setInteractive({ useHandCursor: true });

        // Hover & Click Interactions
        btnContainer.on('pointerover', () => drawButton(true));
        btnContainer.on('pointerout', () => drawButton(false));

        btnContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: btnContainer,
                scaleX: 0.94,
                scaleY: 0.94,
                duration: 70,
                yoyo: true,
                onComplete: () => {
                    this.scene.start('Game');
                }
            });
        });
    }
}