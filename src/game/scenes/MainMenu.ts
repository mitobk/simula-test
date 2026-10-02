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

interface CoinParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravity: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    alpha: number;
    life: number;
    maxLife: number;
    color: number;
}

export class MainMenu extends CustomScene {
    // Coin Fountain Particle System State
    private coinParticles: CoinParticle[] = [];
    private fountainGraphics!: Phaser.GameObjects.Graphics;
    private fountainOriginX: number = 0;
    private fountainOriginY: number = 0;
    private readonly MAX_COINS = 80;

    constructor() {
        super('MainMenu');
    }

    create() {
        super.create();
        this.cameras.main.setBackgroundColor(COLORS.DEEP_INK);

        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        this.fountainOriginX = centerX;
        this.fountainOriginY = centerY + 30;

        // Dedicated graphics object for full-screen coin fountain particles
        this.fountainGraphics = this.add.graphics();

        // Pre-warm / bake particle system so large coins are flowing screen-wide instantly
        this.prewarmCoinFountain();

        // --- Background Graphic Accent Glow ---
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(COLORS.ORANGE, 0.2);
        bgGfx.fillCircle(centerX, centerY - 60, 220);
        bgGfx.fillStyle(COLORS.CARD_BG, 0.65);
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

    update(_time: number, delta: number) {
        this.updateCoinFountain(delta / 1000);
    }

    /**
     * Pre-warms the particle physics state so large coins are arcing screen-wide at scene start
     */
    private prewarmCoinFountain() {
        const simulatedDt = 0.016; // Simulate 60fps
        const prewarmFrames = 100;  // Pre-sim 1.6s

        for (let frame = 0; frame < prewarmFrames; frame++) {
            if (this.coinParticles.length < this.MAX_COINS && Math.random() < 0.85) {
                this.spawnCoinParticle();
            }

            for (let i = this.coinParticles.length - 1; i >= 0; i--) {
                const p = this.coinParticles[i];
                p.life += simulatedDt;
                if (p.life >= p.maxLife) {
                    this.coinParticles.splice(i, 1);
                    continue;
                }
                p.vy += p.gravity * simulatedDt;
                p.x += p.vx * simulatedDt;
                p.y += p.vy * simulatedDt;
                p.rotation += p.rotationSpeed * simulatedDt;
            }
        }
    }

    /**
     * Spawns large high-impact coin particles bursting across full screen width
     */
    private spawnCoinParticle() {
        const angle = PhaserMath.FloatBetween(-Math.PI * 0.88, -Math.PI * 0.12);
        const speed = PhaserMath.FloatBetween(450, 950);

        const p: CoinParticle = {
            x: this.fountainOriginX + PhaserMath.Between(-120, 120),
            y: this.fountainOriginY + PhaserMath.Between(0, 80),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: PhaserMath.FloatBetween(600, 1100),
            size: PhaserMath.FloatBetween(22, 42),
            rotation: PhaserMath.FloatBetween(0, Math.PI * 2),
            rotationSpeed: PhaserMath.FloatBetween(-9, 9),
            alpha: 1.0,
            life: 0,
            maxLife: PhaserMath.FloatBetween(1.5, 2.6),
            color: PhaserMath.RND.pick([COLORS.ACCENT_GOLD, COLORS.ORANGE, 0xFFE082, 0xFFFFFF])
        };

        this.coinParticles.push(p);
    }

    /**
     * Updates physics and draws detailed 3D spinning coins each frame
     */
    private updateCoinFountain(dt: number) {
        this.fountainGraphics.clear();

        while (this.coinParticles.length < this.MAX_COINS) {
            this.spawnCoinParticle();
        }

        for (let i = this.coinParticles.length - 1; i >= 0; i--) {
            const p = this.coinParticles[i];

            p.life += dt;
            if (p.life >= p.maxLife) {
                this.coinParticles.splice(i, 1);
                continue;
            }

            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotationSpeed * dt;

            const lifeProgress = p.life / p.maxLife;
            if (lifeProgress > 0.75) {
                p.alpha = 1 - ((lifeProgress - 0.75) / 0.25);
            }

            const spinWidthScale = Math.abs(Math.cos(p.rotation));
            const width = Math.max(4, p.size * spinWidthScale);
            const height = p.size;

            // Render Coin Shadow
            this.fountainGraphics.fillStyle(0x000000, p.alpha * 0.3);
            this.fountainGraphics.fillEllipse(p.x + 3, p.y + 4, width + 4, height + 4);

            // Render Dark Outer Rim
            this.fountainGraphics.fillStyle(0x381E08, p.alpha * 0.85);
            this.fountainGraphics.fillEllipse(p.x, p.y + 1, width, height);

            // Render Coin Base
            this.fountainGraphics.fillStyle(p.color, p.alpha);
            this.fountainGraphics.fillEllipse(p.x, p.y, width - 2, height - 2);

            // Render Specular Highlight
            this.fountainGraphics.fillStyle(0xFFFFFF, p.alpha * 0.9);
            this.fountainGraphics.fillEllipse(
                p.x - width * 0.22, 
                p.y - height * 0.22, 
                Math.max(2, width * 0.35), 
                height * 0.35
            );
        }
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

        // Outer Egg Outline
        gfx.beginPath();
        gfx.moveTo(-12 * scale, -32 * scale);
        drawQuadCurve(-12 * scale, -32 * scale, 0 * scale, -44 * scale, 12 * scale, -32 * scale);
        drawQuadCurve(12 * scale, -32 * scale, 32 * scale, -8 * scale, 24 * scale, 20 * scale);
        drawQuadCurve(24 * scale, 20 * scale, 14 * scale, 38 * scale, -10 * scale, 32 * scale);
        drawQuadCurve(-10 * scale, 32 * scale, -32 * scale, 20 * scale, -24 * scale, -10 * scale);
        drawQuadCurve(-24 * scale, -10 * scale, -20 * scale, -26 * scale, -12 * scale, -32 * scale);
        gfx.strokePath();

        // Internal S-Swirl Branching Curve
        gfx.beginPath();
        gfx.moveTo(-10 * scale, 32 * scale);
        drawQuadCurve(-10 * scale, 32 * scale, 8 * scale, 26 * scale, 8 * scale, 10 * scale);
        drawQuadCurve(8 * scale, 10 * scale, 8 * scale, -8 * scale, -2 * scale, -12 * scale);
        drawQuadCurve(-2 * scale, -12 * scale, -8 * scale, -16 * scale, 16 * scale, -26 * scale);
        gfx.strokePath();

        return gfx;
    }

    private createPlayButton(x: number, y: number) {
        const btnWidth = 210;
        const btnHeight = 54;

        const buttonContainer = this.add.container(x, y);

        const btnGfx = this.add.graphics();
        this.drawButtonState(btnGfx, btnWidth, btnHeight, false);

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

        // Pulsing animation
        const pulseTween = this.tweens.add({
            targets: buttonContainer,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        buttonContainer.on('pointerover', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, true);
        });

        buttonContainer.on('pointerout', () => {
            this.drawButtonState(btnGfx, btnWidth, btnHeight, false);
        });

        buttonContainer.on('pointerdown', () => {
            // Prevent multiple clicks
            buttonContainer.disableInteractive();
            pulseTween.stop();

            // 1. Fire a massive explosion of 45 high-speed coins from the button position
            for (let i = 0; i < 45; i++) {
                const angle = PhaserMath.FloatBetween(-Math.PI * 0.95, -Math.PI * 0.05);
                const speed = PhaserMath.FloatBetween(600, 1100);

                this.coinParticles.push({
                    x: x + PhaserMath.Between(-20, 20),
                    y: y - 10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    gravity: PhaserMath.FloatBetween(700, 1200),
                    size: PhaserMath.FloatBetween(24, 46),
                    rotation: PhaserMath.FloatBetween(0, Math.PI * 2),
                    rotationSpeed: PhaserMath.FloatBetween(-12, 12),
                    alpha: 1.0,
                    life: 0,
                    maxLife: PhaserMath.FloatBetween(1.2, 2.0),
                    color: PhaserMath.RND.pick([COLORS.ACCENT_GOLD, COLORS.ORANGE, 0xFFE082, 0xFFFFFF])
                });
            }

            // 2. Button click bounce tween
            this.tweens.add({
                targets: buttonContainer,
                scaleX: 0.92,
                scaleY: 0.92,
                duration: 90,
                yoyo: true
            });

            // 3. Camera flash / punch effect for feedback
            this.cameras.main.shake(150, 0.005);

            // 4. Delay scene transition by 350ms so the user watches the burst fly across the screen
            this.time.delayedCall(350, () => {
                this.scene.start('Game');
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