import Phaser from 'phaser';
import { CustomScene } from '../utils/CustomScene';

// Brand Palette Constants matching official spec
const COLORS = {
    ORANGE: 0xF58324,
    ORANGE_DARK: 0xD96E14,
    PURPLE: 0x7845D8,
    PURPLE_DARK: 0x5C3B8B,
    DEEP_INK: 0x201338,
    WARM_WHITE: 0xFFF6E8,
    CARD_BG: 0x2A1A45,
    ACCENT_GOLD: 0xFFD700
};

export class MainMenu extends CustomScene {
    constructor() {
        super('MainMenu');
    }

    create() {
        super.create();
        this.cameras.main.setBackgroundColor(COLORS.DEEP_INK);

        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        // --- Background Graphic Accent ---
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(COLORS.CARD_BG, 0.4);
        bgGfx.fillCircle(centerX, centerY - 40, 160);

        // --- Title Banner ---
        this.add.text(centerX, Math.floor(centerY - 100), 'SCRAMBLY', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#F58324',
            stroke: '#201338',
            strokeThickness: 6,
            resolution: 2
        }).setOrigin(0.5);

        this.add.text(centerX, Math.floor(centerY - 55), 'REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#FFF6E8',
            stroke: '#201338',
            strokeThickness: 5,
            resolution: 2
        }).setOrigin(0.5);

        // Subtitle / Prompt Text
        this.add.text(centerX, Math.floor(centerY + 10), 'Match tiles & earn points!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5);

        // --- Interactive Play Button ---
        this.createPlayButton(centerX, Math.floor(centerY + 90));
    }

    private createPlayButton(x: number, y: number) {
        const btnWidth = 200;
        const btnHeight = 54;

        const buttonContainer = this.add.container(x, y);

        const btnGfx = this.add.graphics();
        this.drawButtonState(btnGfx, btnWidth, btnHeight, false);

        // High-res play icon & button text
        const playText = this.add.text(0, 0, '▶  PLAY NOW', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#FFF6E8',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        buttonContainer.add([btnGfx, playText]);
        buttonContainer.setSize(btnWidth, btnHeight);
        buttonContainer.setInteractive({ useHandCursor: true });

        // Hover & Click Tweens
        buttonContainer.on('pointerover', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, true);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        buttonContainer.on('pointerout', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, false);
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        buttonContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: buttonContainer,
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

    private drawButtonState(gfx: Phaser.GameObjects.Graphics, width: number, height: number, isHovered: boolean) {
        gfx.clear();

        const halfW = Math.floor(width / 2);
        const halfH = Math.floor(height / 2);

        // Button Shadow
        gfx.fillStyle(0x000000, 0.4);
        gfx.fillRoundedRect(-halfW + 2, -halfH + 4, width, height, 16);

        // Main Fill
        const fillColor = isHovered ? COLORS.ORANGE : COLORS.PURPLE;
        const borderColor = isHovered ? COLORS.ACCENT_GOLD : COLORS.ORANGE;

        gfx.fillStyle(fillColor, 1);
        gfx.fillRoundedRect(-halfW, -halfH, width, height, 16);

        // Top Gloss Highlight
        gfx.fillStyle(0xFFFFFF, 0.2);
        gfx.fillRoundedRect(-halfW + 4, -halfH + 3, width - 8, Math.floor((height - 6) / 2), { tl: 13, tr: 13, bl: 3, br: 3 });

        // Border Rim
        gfx.lineStyle(2, borderColor, 0.9);
        gfx.strokeRoundedRect(-halfW, -halfH, width, height, 16);
    }
}