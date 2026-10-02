import Phaser, { Math as PhaserMath } from 'phaser';
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

        // --- Ambient Background Floating Particles ---
        this.createAmbientParticles();

        // --- Background Graphic Accent Glow ---
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(COLORS.CARD_BG, 0.5);
        bgGfx.fillCircle(centerX, centerY - 60, 160);

        // Container to hold Logo + Title for joint float animation
        const headerContainer = this.add.container(centerX, centerY - 110);

        // --- Procedural Scrambly Logo ---
        const logoGfx = this.renderScramblyLogo(0, -45, 0.9);

        // --- Title Banner ---
        const titleText = this.add.text(0, 20, 'SCRAMBLY', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#F58324',
            stroke: '#201338',
            strokeThickness: 6,
            resolution: 2
        }).setOrigin(0.5);

        const subtitleText = this.add.text(0, 57, 'REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#FFF6E8',
            stroke: '#201338',
            strokeThickness: 5,
            resolution: 2
        }).setOrigin(0.5);

        headerContainer.add([logoGfx, titleText, subtitleText]);

        // Gentle Floating Animation on Header Logo & Title
        this.tweens.add({
            targets: headerContainer,
            y: centerY - 118,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Prompt Subtitle Text
        this.add.text(centerX, Math.floor(centerY + 15), 'Match tiles & earn points!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#FFF6E8',
            fontStyle: 'bold',
            resolution: 2
        }).setOrigin(0.5);

        // --- Interactive Play Button ---
        this.createPlayButton(centerX, Math.floor(centerY + 95));
    }

    /**
     * Renders the Scrambly Egg & S-Curve Mark precisely matching the reference SVG vector shape.
     */
    private renderScramblyLogo(x: number, y: number, scale: number = 1.0): Phaser.GameObjects.Graphics {
        const gfx = this.add.graphics();
        gfx.setPosition(x, y);

        const drawQuadCurve = (
            startX: number, startY: number,
            controlX: number, controlY: number,
            endX: number, endY: number,
            steps: number = 12
        ) => {
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const px = PhaserMath.Interpolation.QuadraticBezier(t, startX, controlX, endX);
                const py = PhaserMath.Interpolation.QuadraticBezier(t, startY, controlY, endY);
                gfx.lineTo(px, py);
            }
        };

        const strokeWidth = 10 * scale;
        gfx.lineStyle(strokeWidth, COLORS.ORANGE, 1);

        // 1. Outer Egg Outline
        gfx.beginPath();
        gfx.moveTo(-12 * scale, -32 * scale);
        // Top dome
        drawQuadCurve(-12 * scale, -32 * scale, 0 * scale, -44 * scale, 12 * scale, -32 * scale);
        // Right side curve
        drawQuadCurve(12 * scale, -32 * scale, 32 * scale, -8 * scale, 24 * scale, 20 * scale);
        // Bottom right to bottom curve
        drawQuadCurve(24 * scale, 20 * scale, 14 * scale, 38 * scale, -10 * scale, 32 * scale);
        // Bottom left to top left curve
        drawQuadCurve(-10 * scale, 32 * scale, -32 * scale, 20 * scale, -24 * scale, -10 * scale);
        drawQuadCurve(-24 * scale, -10 * scale, -20 * scale, -26 * scale, -12 * scale, -32 * scale);
        gfx.strokePath();

        // 2. Internal S-Swirl Branching Curve
        gfx.beginPath();
        gfx.moveTo(-10 * scale, 32 * scale); // Connects smoothly from bottom curve
        drawQuadCurve(-10 * scale, 32 * scale, 8 * scale, 26 * scale, 8 * scale, 10 * scale);
        drawQuadCurve(8 * scale, 10 * scale, 8 * scale, -8 * scale, -2 * scale, -12 * scale);
        drawQuadCurve(-2 * scale, -12 * scale, -8 * scale, -16 * scale, 16 * scale, -26 * scale); // Sweeps back up to top right
        gfx.strokePath();

        return gfx;
    }

    /**
     * Creates subtle floating background particles for menu dynamic feel
     */
    private createAmbientParticles() {
        const particleColors = [COLORS.ORANGE, COLORS.PURPLE, COLORS.ACCENT_GOLD];

        for (let i = 0; i < 14; i++) {
            const pX = PhaserMath.Between(20, this.scale.width - 20);
            const pY = PhaserMath.Between(30, this.scale.height - 30);
            const size = PhaserMath.Between(3, 7);
            const color = PhaserMath.RND.pick(particleColors);

            const pGfx = this.add.graphics();
            pGfx.fillStyle(color, PhaserMath.FloatBetween(0.25, 0.5));
            pGfx.fillCircle(pX, pY, size);

            this.tweens.add({
                targets: pGfx,
                y: pY - PhaserMath.Between(20, 45),
                alpha: { from: 0.2, to: 0.7 },
                duration: PhaserMath.Between(2500, 4500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: PhaserMath.Between(0, 1500)
            });
        }
    }

    private createPlayButton(x: number, y: number) {
        const btnWidth = 210;
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

        // Subtle pulsing scale tween on Play button
        this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Hover & Click Tweens
        buttonContainer.on('pointerover', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, true);
        });

        buttonContainer.on('pointerout', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, false);
        });

        buttonContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.94,
                scaleY: 0.94,
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