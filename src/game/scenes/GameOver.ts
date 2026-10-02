import Phaser, { Math as PhaserMath } from 'phaser';
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

export class GameOver extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;
    private finalScore: number = 0;
    private displayedCoins: number = 0;

    // Coin Fountain Particle System State
    private coinParticles: CoinParticle[] = [];
    private fountainGraphics!: Phaser.GameObjects.Graphics;
    private fountainOriginX: number = 0;
    private fountainOriginY: number = 0;
    private readonly MAX_COINS = 80; // High-density large coin fountain

    constructor() {
        super('GameOver');
    }

    init(data: { score?: number }) {
        // Receive final coin score from Game scene
        this.finalScore = data?.score || 0;
        this.displayedCoins = 0;
        this.coinParticles = [];
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(COLORS.DEEP_INK);

        const centerX = Math.floor(this.scale.width / 2);
        const centerY = Math.floor(this.scale.height / 2);

        this.fountainOriginX = centerX;
        this.fountainOriginY = centerY + 40;

        // Dedicated graphics object for full-screen coin fountain particles
        this.fountainGraphics = this.add.graphics();

        // Pre-warm / bake particle system so large coins are arcing screen-wide at scene start
        this.prewarmCoinFountain();

        // --- Dual-Layer Ambient Background Glow ---
        const bgGfx = this.add.graphics();
        bgGfx.fillStyle(COLORS.ORANGE, 0.2);
        bgGfx.fillCircle(centerX, centerY - 20, 240);
        bgGfx.fillStyle(COLORS.PURPLE, 0.45);
        bgGfx.fillCircle(centerX, centerY - 20, 160);

        // --- Results Container Card ---
        const cardWidth = 310;
        const cardHeight = 350;
        const cardX = centerX - Math.floor(cardWidth / 2);
        const cardY = centerY - Math.floor(cardHeight / 2) - 10;

        const cardGfx = this.add.graphics();
        // Drop Shadow
        cardGfx.fillStyle(0x000000, 0.45);
        cardGfx.fillRoundedRect(cardX + 3, cardY + 4, cardWidth, cardHeight, 20);
        // Main Fill
        cardGfx.fillStyle(COLORS.CARD_BG, 0.95);
        cardGfx.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);
        // Border Rim
        cardGfx.lineStyle(2, COLORS.PURPLE, 0.8);
        cardGfx.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 20);

        // --- Title Header ---
        const titleText = this.add.text(centerX, Math.floor(centerY - 145), 'OUT OF LIVES!', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#E74C3C',
            stroke: '#201338',
            strokeThickness: 6,
            resolution: 2
        }).setOrigin(0.5);

        // Subtle scale pulse on Title
        this.tweens.add({
            targets: titleText,
            scaleX: 1.04,
            scaleY: 1.04,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // --- Procedural Scrambly Logo ---
        this.renderScramblyLogo(centerX, Math.floor(centerY - 85), 0.65);

        // Score Label
        this.add.text(centerX, Math.floor(centerY - 45), 'TOTAL REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '13px',
            color: '#FFF6E8',
            resolution: 2
        }).setOrigin(0.5);

        // Animated Coin Score Counter Text
        const scoreText = this.add.text(centerX, Math.floor(centerY - 20), '🪙 0', {
            fontFamily: 'Arial Black',
            fontSize: '26px',
            color: '#FFD700',
            stroke: '#201338',
            strokeThickness: 4,
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        // Roll up score tween
        this.tweens.add({
            targets: this,
            displayedCoins: this.finalScore,
            duration: 800,
            ease: 'Power2',
            onUpdate: () => {
                scoreText.setText(`🪙 ${Math.floor(this.displayedCoins)}`);
            }
        });

        // Subtitle / Reward Pitch
        this.add.text(centerX, Math.floor(centerY + 20), 'Ready to claim real rewards?', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#FFF6E8',
            fontStyle: 'bold',
            align: 'center',
            resolution: 2
        }).setOrigin(0.5);

        // --- SCRAMBLY CTA BUTTON ---
        const ctaY = Math.floor(centerY + 65);
        const ctaContainer = this.add.container(centerX, ctaY);

        const ctaBg = this.add.graphics();
        this.drawButtonGfx(ctaBg, 250, 48, COLORS.ORANGE, COLORS.ACCENT_GOLD);

        const ctaText = this.add.text(0, 0, 'Explore Scrambly 🚀', {
            fontFamily: 'Arial Black',
            fontSize: '17px',
            color: '#FFF6E8',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        ctaContainer.add([ctaBg, ctaText]);
        ctaContainer.setSize(250, 48);
        ctaContainer.setInteractive({ useHandCursor: true });

        // Pulsing tween on CTA Button
        const ctaPulse = this.tweens.add({
            targets: ctaContainer,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        ctaContainer.on('pointerover', () => {
            this.drawButtonGfx(ctaBg, 250, 48, COLORS.ORANGE_DARK, COLORS.ACCENT_GOLD);
        });

        ctaContainer.on('pointerout', () => {
            this.drawButtonGfx(ctaBg, 250, 48, COLORS.ORANGE, COLORS.ACCENT_GOLD);
        });

        ctaContainer.on('pointerdown', () => {
            console.log('CTA clicked — demo only');

            ctaPulse.stop();

            // Extra surge burst of huge coins on CTA click
            for (let i = 0; i < 30; i++) {
                this.spawnCoinParticle();
            }

            // Local visual confirmation
            const toastText = this.add.text(centerX, Math.floor(centerY + 102), 'CTA clicked — demo only', {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#2ECC71',
                fontStyle: 'bold',
                resolution: 2
            }).setOrigin(0.5);

            toastText.setScale(0);
            this.tweens.add({
                targets: toastText,
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Back.easeOut'
            });

            // Bounce animation
            this.tweens.add({
                targets: ctaContainer,
                scaleX: 0.94,
                scaleY: 0.94,
                duration: 80,
                yoyo: true
            });

            ctaContainer.disableInteractive();
        });

        // --- RESTART / PLAY AGAIN BUTTON ---
        const restartY = Math.floor(centerY + 128);
        const restartContainer = this.add.container(centerX, restartY);

        const restartBg = this.add.graphics();
        this.drawButtonGfx(restartBg, 180, 38, COLORS.CARD_BG, COLORS.PURPLE);

        const restartText = this.add.text(0, 0, 'Play Again 🔄', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#FFF6E8',
            fontStyle: 'bold',
            padding: { top: 4, bottom: 4, left: 4, right: 4 },
            resolution: 2
        }).setOrigin(0.5);

        restartContainer.add([restartBg, restartText]);
        restartContainer.setSize(180, 38);
        restartContainer.setInteractive({ useHandCursor: true });

        restartContainer.on('pointerover', () => {
            this.drawButtonGfx(restartBg, 180, 38, COLORS.PURPLE_DARK, COLORS.ACCENT_GOLD);
            this.tweens.add({
                targets: restartContainer,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        restartContainer.on('pointerout', () => {
            this.drawButtonGfx(restartBg, 180, 38, COLORS.CARD_BG, COLORS.PURPLE);
            this.tweens.add({
                targets: restartContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        restartContainer.on('pointerdown', () => {
            this.tweens.add({
                targets: restartContainer,
                scaleX: 0.94,
                scaleY: 0.94,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    this.transitionTo('Game', {}, 250);
                }
            });
        });

    }

    update(_time: number, delta: number) {
        this.updateCoinFountain(delta / 1000);
    }

    /**
     * Pre-warms the particle physics state so large coins are flowing screen-wide instantly
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
        // Broad upward arc trajectories pushing to screen edges
        const angle = PhaserMath.FloatBetween(-Math.PI * 0.88, -Math.PI * 0.12);
        const speed = PhaserMath.FloatBetween(450, 950);

        const p: CoinParticle = {
            x: this.fountainOriginX + PhaserMath.Between(-120, 120),
            y: this.fountainOriginY + PhaserMath.Between(0, 80),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: PhaserMath.FloatBetween(600, 1100),
            size: PhaserMath.FloatBetween(22, 42), // Significantly increased size
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

            // Physics step
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotationSpeed * dt;

            // Fade out near end of life
            const lifeProgress = p.life / p.maxLife;
            if (lifeProgress > 0.75) {
                p.alpha = 1 - ((lifeProgress - 0.75) / 0.25);
            }

            // Simulate 3D horizontal spinning compression
            const spinWidthScale = Math.abs(Math.cos(p.rotation));
            const width = Math.max(4, p.size * spinWidthScale);
            const height = p.size;

            // Render Coin Shadow
            this.fountainGraphics.fillStyle(0x000000, p.alpha * 0.3);
            this.fountainGraphics.fillEllipse(p.x + 3, p.y + 4, width + 4, height + 4);

            // Render Dark Outer Rim / Coin Edge
            this.fountainGraphics.fillStyle(0x381E08, p.alpha * 0.85);
            this.fountainGraphics.fillEllipse(p.x, p.y + 1, width, height);

            // Render Coin Front Surface
            this.fountainGraphics.fillStyle(p.color, p.alpha);
            this.fountainGraphics.fillEllipse(p.x, p.y, width - 2, height - 2);

            // Render Coin Specular Highlight
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
     * Draws rounded glossy button graphics
     */
    private drawButtonGfx(gfx: Phaser.GameObjects.Graphics, width: number, height: number, fillColor: number, borderColor: number) {
        gfx.clear();

        const halfW = Math.floor(width / 2);
        const halfH = Math.floor(height / 2);

        // Shadow
        gfx.fillStyle(0x000000, 0.35);
        gfx.fillRoundedRect(-halfW + 2, -halfH + 3, width, height, 14);

        // Base Fill
        gfx.fillStyle(fillColor, 1);
        gfx.fillRoundedRect(-halfW, -halfH, width, height, 14);

        // Top Gloss Highlight
        gfx.fillStyle(0xFFFFFF, 0.18);
        gfx.fillRoundedRect(-halfW + 3, -halfH + 2, width - 6, Math.floor((height - 4) / 2), { tl: 11, tr: 11, bl: 3, br: 3 });

        // Outer Rim
        gfx.lineStyle(2, borderColor, 0.85);
        gfx.strokeRoundedRect(-halfW, -halfH, width, height, 14);
    }

    /**
     * Renders the Scrambly Vector Egg Logo
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

        const strokeWidth = 8 * scale;
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
}