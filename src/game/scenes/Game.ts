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
    ACCENT_GOLD: 0xFFD700,
    RED_ACCENT: 0xE74C3C,
    GREEN_ACCENT: 0x2ECC71
};

interface TileData {
    gameObject: Phaser.GameObjects.Container;
    bgGfx: Phaser.GameObjects.Graphics;
    borderGfx: Phaser.GameObjects.Graphics;
    type: number;
    row: number;
    col: number;
}

interface ParticleEffect {
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

export class Game extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;
    
    // Grid configuration
    private readonly GRID_ROWS = 3;
    private readonly GRID_COLS = 3;
    private readonly TILE_SIZE = 86;
    private readonly TILE_SPACING = 16;

    // Styled Tile Palette - Fox Mascot placed on all tile variants
    private readonly TILE_TYPES = [
        { id: 0, color: 0xF58324, border: 0xFFD700 }, // Scrambly Orange / Gold
        { id: 1, color: 0x7845D8, border: 0xB58BFF }, // Deep Purple / Soft Lavender
        { id: 2, color: 0x2ECC71, border: 0xA3E4D7 }  // Vibrant Emerald / Mint
    ];

    private grid: (TileData | null)[][] = [];
    private selectedTiles: TileData[] = [];
    private isProcessing: boolean = false;

    // UI & Score State
    private statusText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private coinsEarned: number = 0;
    private displayedCoins: number = 0;

    // Lives System
    private readonly MAX_LIVES = 3;
    private lives: number = 3;
    private heartIcons: Phaser.GameObjects.Text[] = [];

    // Timer System
    private readonly INITIAL_TIME_MS = 10000; // 10 Seconds starting time
    private readonly MIN_TIME_MS = 5000;      // 5 Seconds max speed floor
    private readonly TIME_DECREMENT_MS = 500; // Decreases by 0.5s each match
    private currentRoundTimeMs: number = 10000;

    private timerEvent?: Phaser.Time.TimerEvent;
    private timerBarBg!: Phaser.GameObjects.Graphics;
    private timerBarFill!: Phaser.GameObjects.Graphics;
    private readonly TIMER_BAR_HEIGHT = 14;

    // Procedural Particle System for Celebratory Effects
    private particles: ParticleEffect[] = [];
    private particleGfx!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(COLORS.DEEP_INK);

        // Reset state completely on scene start
        this.lives = this.MAX_LIVES;
        this.coinsEarned = 0;
        this.displayedCoins = 0;
        this.currentRoundTimeMs = this.INITIAL_TIME_MS;
        this.particles = [];
        this.selectedTiles = [];
        this.isProcessing = false;

        // Clear out any old heart icon references
        if (this.heartIcons && this.heartIcons.length > 0) {
            this.heartIcons.forEach(h => h.destroy());
        }
        this.heartIcons = [];

        // Dedicated graphics object for particle feedback
        this.particleGfx = this.add.graphics();

        // Background Board Accent Glow
        const centerX = Math.floor(this.scale.width / 2);
        const gridGlow = this.add.graphics();
        gridGlow.fillStyle(COLORS.CARD_BG, 0.45);
        gridGlow.fillCircle(centerX, 380, 185);

        // Score, Title & Lives UI
        this.createScoreUI();

        // Timer Bar UI with Geometry Mask
        this.createTimerBarUI();

        // Status / Prompt Text Box
        const statusY = 185;

        const statusBox = this.add.graphics();
        statusBox.fillStyle(COLORS.CARD_BG, 0.8);
        statusBox.fillRoundedRect(centerX - 140, statusY - 18, 280, 36, 12);
        statusBox.lineStyle(1.5, COLORS.PURPLE, 0.8);
        statusBox.strokeRoundedRect(centerX - 140, statusY - 18, 280, 36, 12);

        this.statusText = this.add.text(
            centerX, 
            statusY, 
            'Select 3 matching tiles!', 
            {
                fontFamily: 'Arial',
                fontSize: '15px',
                color: '#FFF6E8',
                fontStyle: 'bold',
                align: 'center',
                resolution: 2
            }
        ).setOrigin(0.5);

        // Build Initial 3x3 Grid & Start Round
        this.createGrid();
        this.startRoundTimer();
    }

    update(_time: number, delta: number) {
        this.updateTimerBar();
        this.updateParticles(delta / 1000);
    }

    private createScoreUI() {
        const centerX = Math.floor(this.scale.width / 2);

        // Title Header Banner
        this.add.text(centerX, 38, 'SCRAMBLY REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#F58324',
            stroke: '#201338',
            strokeThickness: 5,
            resolution: 2
        }).setOrigin(0.5);

        // --- Coin Score Background Card ---
        const coinCardX = centerX - 135;
        const coinCardWidth = 120;
        const coinCardCenter = coinCardX + (coinCardWidth / 2);

        const coinCard = this.add.graphics();
        coinCard.fillStyle(COLORS.CARD_BG, 0.95);
        coinCard.fillRoundedRect(coinCardX, 75, coinCardWidth, 44, 12);
        coinCard.lineStyle(2, COLORS.ORANGE, 0.8);
        coinCard.strokeRoundedRect(coinCardX, 75, coinCardWidth, 44, 12);

        // Perfectly center coin icon & score text as a group around coinCardCenter
        // Assuming total combined content width is roughly ~50px
        const coinGroupStartX = coinCardCenter - 26;

        this.add.text(coinGroupStartX, 97, '🪙', { 
            fontSize: '18px',
            padding: { top: 6, bottom: 6, left: 2, right: 2 },
            resolution: 2
        }).setOrigin(0, 0.5);

        this.scoreText = this.add.text(coinGroupStartX + 26, 97, '0', {
            fontFamily: 'Arial Black',
            fontSize: '17px',
            color: '#FFD700',
            resolution: 2
        }).setOrigin(0, 0.5);

        // --- Lives Indicator Container Box ---
        const livesCardX = centerX + 15;
        const livesCardWidth = 120;
        const livesCardCenter = livesCardX + (livesCardWidth / 2);

        const livesCard = this.add.graphics();
        livesCard.fillStyle(COLORS.CARD_BG, 0.95);
        livesCard.fillRoundedRect(livesCardX, 75, livesCardWidth, 44, 12);
        livesCard.lineStyle(2, COLORS.RED_ACCENT, 0.8);
        livesCard.strokeRoundedRect(livesCardX, 75, livesCardWidth, 44, 12);

        // Center the 3 hearts evenly around livesCardCenter (spacing them 28px apart)
        const heartSpacing = 28;
        const totalHeartsWidth = (this.MAX_LIVES - 1) * heartSpacing;
        const heartStartX = livesCardCenter - (totalHeartsWidth / 2);

        for (let i = 0; i < this.MAX_LIVES; i++) {
            const heart = this.add.text(heartStartX + (i * heartSpacing), 97, '❤️', {
                fontSize: '18px',
                padding: { top: 6, bottom: 6, left: 2, right: 2 },
                resolution: 2
            }).setOrigin(0.5);
            
            this.heartIcons.push(heart);
        }
    }


    private createTimerBarUI() {
        const barWidth = this.scale.width - 40;
        const x = 20;
        const y = this.scale.height - 35;

        // Timer Background Outer Frame
        this.timerBarBg = this.add.graphics();
        this.timerBarBg.fillStyle(0x140B24, 0.9);
        this.timerBarBg.fillRoundedRect(x - 2, y - 2, barWidth + 4, this.TIMER_BAR_HEIGHT + 4, 8);
        this.timerBarBg.lineStyle(2, COLORS.PURPLE_DARK, 0.9);
        this.timerBarBg.strokeRoundedRect(x - 2, y - 2, barWidth + 4, this.TIMER_BAR_HEIGHT + 4, 8);

        // Dynamic Timer Fill Graphic
        this.timerBarFill = this.add.graphics();
    }

    private updateTimerBar() {
        this.timerBarFill.clear();

        if (!this.timerEvent || this.timerEvent.paused) {
            return;
        }

        const barWidth = this.scale.width - 40;
        const x = 20;
        const y = this.scale.height - 35;

        const rawProgress = 1 - this.timerEvent.getProgress();
        const progress = PhaserMath.Clamp(rawProgress, 0, 1);
        const currentBarWidth = Math.max(0, barWidth * progress);

        let barColor = COLORS.GREEN_ACCENT;
        if (progress < 0.25) {
            barColor = COLORS.RED_ACCENT;
        } else if (progress < 0.5) {
            barColor = COLORS.ACCENT_GOLD;
        }

        if (currentBarWidth > 2) {
            const cornerRadius = Math.min(6, Math.floor(currentBarWidth / 2));
            this.timerBarFill.fillStyle(barColor, 1);
            this.timerBarFill.fillRoundedRect(x, y, currentBarWidth, this.TIMER_BAR_HEIGHT, cornerRadius);
        }
    }

    private startRoundTimer() {
        if (this.timerEvent) {
            this.timerEvent.remove();
        }

        this.timerEvent = this.time.delayedCall(
            this.currentRoundTimeMs,
            this.handleTimeOut,
            [],
            this
        );
    }

    private stopRoundTimer() {
        if (this.timerEvent) {
            this.timerEvent.remove();
            this.timerEvent = undefined;
        }
    }

        private handleTimeOut() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.statusText.setText('Time Out! Lost 1 Life ⏰💔');
        this.showToastNotification('TIME OUT! -1 LIFE 💔', COLORS.RED_ACCENT);
        
        // 1. Add camera flash and shake for visual impact
        this.cameras.main.flash(200, 231, 76, 60);
        this.cameras.main.shake(250, 0.008);

        // 2. If tiles were partially selected when time ran out, turn them red & shake them
        if (this.selectedTiles.length > 0) {
            this.selectedTiles.forEach(tile => {
                const tileConfig = this.TILE_TYPES.find(t => t.id === tile.type)!;
                this.drawTileGraphic(tile.bgGfx, tile.borderGfx, tileConfig, false, true);

                this.tweens.add({
                    targets: tile.gameObject,
                    x: tile.gameObject.x + 12,
                    duration: 45,
                    yoyo: true,
                    repeat: 3
                });
            });
        }

        // 3. Lose life & process continuation or game over
        this.loseLife();

        if (this.lives > 0) {
            this.time.delayedCall(700, () => {
                this.resetFullGrid();
            });
        } else {
            this.time.delayedCall(850, () => {
                this.triggerGameOver();
            });
        }
    }


    private getGridOrigins() {
        const gridWidth = (this.GRID_COLS * this.TILE_SIZE) + ((this.GRID_COLS - 1) * this.TILE_SPACING);
        const gridHeight = (this.GRID_ROWS * this.TILE_SIZE) + ((this.GRID_ROWS - 1) * this.TILE_SPACING);
        
        const startX = Math.floor((this.scale.width - gridWidth) / 2 + (this.TILE_SIZE / 2));
        const startY = Math.floor((this.scale.height - gridHeight) / 2 + (this.TILE_SIZE / 2) + 25);

        return { startX, startY };
    }

    private createGrid() {
        const { startX, startY } = this.getGridOrigins();
        this.grid = [];

        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const x = startX + col * (this.TILE_SIZE + this.TILE_SPACING);
                const y = startY + row * (this.TILE_SIZE + this.TILE_SPACING);

                this.spawnTile(row, col, x, y);
            }
        }
    }

    private spawnTile(row: number, col: number, x: number, y: number, animate: boolean = false) {
        const randomType = PhaserMath.RND.pick(this.TILE_TYPES);

        const container = this.add.container(x, y);
        container.setSize(this.TILE_SIZE, this.TILE_SIZE);

        const borderGfx = this.add.graphics();
        const bgGfx = this.add.graphics();

        this.drawTileGraphic(bgGfx, borderGfx, randomType, false);
        const foxGfx = this.renderFoxFace(0, 2);

        container.add([borderGfx, bgGfx, foxGfx]);
        container.setInteractive({ useHandCursor: true });

        const tileData: TileData = {
            gameObject: container,
            bgGfx: bgGfx,
            borderGfx: borderGfx,
            type: randomType.id,
            row: row,
            col: col
        };

        container.on('pointerdown', () => this.handleTileClick(tileData));

        this.grid[row][col] = tileData;

        if (animate) {
            container.setScale(0);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 220,
                delay: (row * 3 + col) * 35,
                ease: 'Back.easeOut'
            });
        }
    }

    private renderFoxFace(x: number, y: number): Phaser.GameObjects.Graphics {
        const gfx = this.add.graphics();

        const COLOR_ORANGE = 0xF58324;
        const COLOR_ORANGE_DARK = 0xD96E14;
        const COLOR_WHITE = 0xFFFFFF;
        const COLOR_INK = 0x1A1126;

        const drawQuadCurve = (
            startX: number, startY: number,
            controlX: number, controlY: number,
            endX: number, endY: number,
            steps: number = 10
        ) => {
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const px = PhaserMath.Interpolation.QuadraticBezier(t, startX, controlX, endX);
                const py = PhaserMath.Interpolation.QuadraticBezier(t, startY, controlY, endY);
                gfx.lineTo(px, py);
            }
        };

        gfx.fillStyle(COLOR_ORANGE, 1);
        gfx.fillTriangle(x - 22, y - 2, x - 28, y - 30, x - 6, y - 14);
        gfx.lineStyle(2, COLOR_ORANGE_DARK, 1);
        gfx.strokeTriangle(x - 22, y - 2, x - 28, y - 30, x - 6, y - 14);

        gfx.fillStyle(COLOR_WHITE, 1);
        gfx.fillTriangle(x - 21, y - 5, x - 25, y - 24, x - 9, y - 14);

        gfx.fillStyle(COLOR_ORANGE, 1);
        gfx.fillTriangle(x + 22, y - 2, x + 28, y - 30, x + 6, y - 14);
        gfx.lineStyle(2, COLOR_ORANGE_DARK, 1);
        gfx.strokeTriangle(x + 22, y - 2, x + 28, y - 30, x + 6, y - 14);

        gfx.fillStyle(COLOR_WHITE, 1);
        gfx.fillTriangle(x + 21, y - 5, x + 25, y - 24, x + 9, y - 14);

        gfx.fillStyle(COLOR_ORANGE, 1);
        gfx.fillCircle(x, y - 2, 23);
        gfx.fillEllipse(x, y + 2, 52, 34);

        gfx.fillStyle(COLOR_WHITE, 1);
        gfx.beginPath();
        gfx.moveTo(x - 26, y + 2);
        gfx.lineTo(x - 28, y + 8);
        gfx.lineTo(x - 20, y + 8);
        gfx.lineTo(x - 22, y + 15);
        gfx.lineTo(x - 12, y + 14);
        
        drawQuadCurve(x - 12, y + 14, x, y + 21, x + 12, y + 14);

        gfx.lineTo(x + 22, y + 15);
        gfx.lineTo(x + 20, y + 8);
        gfx.lineTo(x + 28, y + 8);
        gfx.lineTo(x + 26, y + 2);

        drawQuadCurve(x + 26, y + 2, x, y + 8, x - 26, y + 2);

        gfx.closePath();
        gfx.fillPath();

        gfx.fillStyle(COLOR_WHITE, 1);
        gfx.fillRoundedRect(x - 13, y - 16, 8, 4, 2);
        gfx.fillRoundedRect(x + 5, y - 16, 8, 4, 2);

        gfx.fillStyle(COLOR_INK, 1);
        gfx.fillEllipse(x - 10, y - 4, 7, 10);
        gfx.fillEllipse(x + 10, y - 4, 7, 10);

        gfx.fillStyle(COLOR_WHITE, 1);
        gfx.fillCircle(x - 11, y - 6, 1.5);
        gfx.fillCircle(x + 9, y - 6, 1.5);

        gfx.fillStyle(COLOR_INK, 1);
        gfx.fillTriangle(x - 3, y + 4, x + 3, y + 4, x, y + 7);

        gfx.lineStyle(1.5, COLOR_INK, 1);
        gfx.beginPath();
        gfx.arc(x - 3, y + 8, 3, Math.PI, 0, true);
        gfx.arc(x + 3, y + 8, 3, Math.PI, 0, true);
        gfx.strokePath();

        return gfx;
    }

    private drawTileGraphic(
        bgGfx: Phaser.GameObjects.Graphics, 
        borderGfx: Phaser.GameObjects.Graphics, 
        tileTypeConfig: typeof this.TILE_TYPES[0], 
        isSelected: boolean,
        isError: boolean = false
    ) {
        bgGfx.clear();
        borderGfx.clear();

        const half = this.TILE_SIZE / 2;

        if (isError) {
            borderGfx.fillStyle(COLORS.RED_ACCENT, 0.5);
            borderGfx.fillRoundedRect(-half - 6, -half - 6, this.TILE_SIZE + 12, this.TILE_SIZE + 12, 18);
            borderGfx.lineStyle(3, COLORS.RED_ACCENT, 1);
            borderGfx.strokeRoundedRect(-half - 6, -half - 6, this.TILE_SIZE + 12, this.TILE_SIZE + 12, 18);
        } else if (isSelected) {
            borderGfx.fillStyle(COLORS.ACCENT_GOLD, 0.4);
            borderGfx.fillRoundedRect(-half - 5, -half - 5, this.TILE_SIZE + 10, this.TILE_SIZE + 10, 18);
            borderGfx.lineStyle(3, COLORS.ACCENT_GOLD, 1);
            borderGfx.strokeRoundedRect(-half - 5, -half - 5, this.TILE_SIZE + 10, this.TILE_SIZE + 10, 18);
        }

        bgGfx.fillStyle(0x000000, 0.35);
        bgGfx.fillRoundedRect(-half + 2, -half + 3, this.TILE_SIZE, this.TILE_SIZE, 14);

        const fillColor = isError ? COLORS.RED_ACCENT : tileTypeConfig.color;
        bgGfx.fillStyle(fillColor, 1);
        bgGfx.fillRoundedRect(-half, -half, this.TILE_SIZE, this.TILE_SIZE, 14);

        bgGfx.fillStyle(0xFFFFFF, 0.22);
        bgGfx.fillRoundedRect(-half + 4, -half + 3, this.TILE_SIZE - 8, (this.TILE_SIZE - 6) / 2, { tl: 11, tr: 11, bl: 3, br: 3 });

        const borderColor = isError ? 0xFF9999 : tileTypeConfig.border;
        bgGfx.lineStyle(2, borderColor, 0.85);
        bgGfx.strokeRoundedRect(-half, -half, this.TILE_SIZE, this.TILE_SIZE, 14);
    }

    private handleTileClick(tile: TileData) {
        if (this.isProcessing || this.selectedTiles.includes(tile)) {
            return;
        }

        this.selectedTiles.push(tile);

        const tileConfig = this.TILE_TYPES.find(t => t.id === tile.type)!;
        this.drawTileGraphic(tile.bgGfx, tile.borderGfx, tileConfig, true);

        this.tweens.add({
            targets: tile.gameObject,
            scaleX: 1.12,
            scaleY: 1.12,
            duration: 90,
            yoyo: true
        });

        this.statusText.setText(`Selected: ${this.selectedTiles.length} / 3`);

        if (this.selectedTiles.length === 3) {
            this.checkMatch();
        }
    }

    private checkMatch() {
        this.isProcessing = true;
        this.stopRoundTimer();

        const [first, second, third] = this.selectedTiles;
        const isMatch = (first.type === second.type) && (second.type === third.type);

        if (isMatch) {
            this.statusText.setText('Match Found! +100 Coins 🎉');
            this.showToastNotification('+100 COINS! 🎉', COLORS.ACCENT_GOLD);
            this.addCoins(100);

            this.selectedTiles.forEach(tile => {
                this.triggerMatchParticles(tile.gameObject.x, tile.gameObject.y);
            });

            this.currentRoundTimeMs = Math.max(
                this.MIN_TIME_MS, 
                this.currentRoundTimeMs - this.TIME_DECREMENT_MS
            );

            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: tile.gameObject,
                    scaleX: 1.25,
                    scaleY: 1.25,
                    duration: 180,
                    yoyo: true
                });
            });

            this.time.delayedCall(500, () => {
                this.resetFullGrid();
            });
        } else {
            this.statusText.setText('No Match! Lost 1 Life 💔');
            this.showToastNotification('NO MATCH! -1 LIFE 💔', COLORS.RED_ACCENT);
            this.loseLife();

            this.cameras.main.flash(200, 231, 76, 60);
            this.cameras.main.shake(250, 0.008);

            this.selectedTiles.forEach(tile => {
                const tileConfig = this.TILE_TYPES.find(t => t.id === tile.type)!;
                this.drawTileGraphic(tile.bgGfx, tile.borderGfx, tileConfig, false, true);

                this.tweens.add({
                    targets: tile.gameObject,
                    x: tile.gameObject.x + 12,
                    duration: 45,
                    yoyo: true,
                    repeat: 3
                });
            });

            if (this.lives > 0) {
                this.time.delayedCall(600, () => {
                    this.resetFullGrid();
                });
            } else {
                this.time.delayedCall(850, () => {
                    this.triggerGameOver();
                });
            }
        }
    }

    private showToastNotification(message: string, textColorHex: number) {
        const centerX = Math.floor(this.scale.width / 2);
        const toast = this.add.text(centerX, 230, message, {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: `#${textColorHex.toString(16)}`,
            stroke: '#201338',
            strokeThickness: 5,
            padding: { top: 4, bottom: 4, left: 8, right: 8 },
            resolution: 2
        }).setOrigin(0.5);

        toast.setScale(0.5);
        this.tweens.add({
            targets: toast,
            scaleX: 1.15,
            scaleY: 1.15,
            y: 205,
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => toast.destroy()
        });
    }

    private triggerMatchParticles(originX: number, originY: number) {
        for (let i = 0; i < 12; i++) {
            const angle = PhaserMath.FloatBetween(-Math.PI * 0.9, -Math.PI * 0.1);
            const speed = PhaserMath.FloatBetween(250, 600);

            this.particles.push({
                x: originX + PhaserMath.Between(-15, 15),
                y: originY + PhaserMath.Between(-15, 15),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: PhaserMath.FloatBetween(600, 950),
                size: PhaserMath.FloatBetween(12, 24),
                rotation: PhaserMath.FloatBetween(0, Math.PI * 2),
                rotationSpeed: PhaserMath.FloatBetween(-10, 10),
                alpha: 1.0,
                life: 0,
                maxLife: PhaserMath.FloatBetween(0.8, 1.4),
                color: PhaserMath.RND.pick([COLORS.ACCENT_GOLD, COLORS.ORANGE, 0xFFE082, 0xFFFFFF])
            });
        }
    }

    private updateParticles(dt: number) {
        this.particleGfx.clear();

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.life += dt;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.rotationSpeed * dt;

            const progress = p.life / p.maxLife;
            if (progress > 0.6) {
                p.alpha = 1 - ((progress - 0.6) / 0.4);
            }

            const spinWidth = Math.max(2, p.size * Math.abs(Math.cos(p.rotation)));

            this.particleGfx.fillStyle(0x000000, p.alpha * 0.3);
            this.particleGfx.fillEllipse(p.x + 2, p.y + 2, spinWidth + 2, p.size + 2);

            this.particleGfx.fillStyle(p.color, p.alpha);
            this.particleGfx.fillEllipse(p.x, p.y, spinWidth, p.size);

            this.particleGfx.fillStyle(0xFFFFFF, p.alpha * 0.85);
            this.particleGfx.fillEllipse(p.x - spinWidth * 0.2, p.y - p.size * 0.2, Math.max(1, spinWidth * 0.35), p.size * 0.35);
        }
    }

    private loseLife() {
        if (this.lives <= 0) return;

        this.lives--;
        const targetHeart = this.heartIcons[this.lives];

        if (targetHeart) {
            this.tweens.add({
                targets: targetHeart,
                scaleX: 1.6,
                scaleY: 1.6,
                duration: 150,
                yoyo: true,
                onYoyo: () => {
                    targetHeart.setText('🩶');
                }
            });
        }
    }

    private triggerGameOver() {
        this.stopRoundTimer();
        this.transitionTo('GameOver', { score: this.coinsEarned }, 350);
    }

    private resetFullGrid() {
        let destroyedCount = 0;
        const totalTiles = this.GRID_ROWS * this.GRID_COLS;

        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                const tile = this.grid[row][col];
                if (tile) {
                    this.tweens.add({
                        targets: tile.gameObject,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 180,
                        onComplete: () => {
                            tile.gameObject.destroy();
                            destroyedCount++;

                            if (destroyedCount === totalTiles) {
                                this.selectedTiles = [];
                                this.createGridAnimated();
                            }
                        }
                    });
                }
            }
        }
    }

    private createGridAnimated() {
        const { startX, startY } = this.getGridOrigins();
        this.grid = [];

        for (let row = 0; row < this.GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_COLS; col++) {
                const x = startX + col * (this.TILE_SIZE + this.TILE_SPACING);
                const y = startY + row * (this.TILE_SIZE + this.TILE_SPACING);

                this.spawnTile(row, col, x, y, true);
            }
        }

        this.time.delayedCall(300, () => {
            this.isProcessing = false;
            this.statusText.setText('Select 3 matching tiles!');
            this.startRoundTimer();
        });
    }

    private addCoins(amount: number) {
        const targetCoins = this.coinsEarned + amount;
        this.coinsEarned = targetCoins;

        this.tweens.add({
            targets: this,
            displayedCoins: targetCoins,
            duration: 500,
            ease: 'Power1',
            onUpdate: () => {
                this.scoreText.setText(`${Math.floor(this.displayedCoins)}`);
            }
        });

        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.35,
            scaleY: 1.35,
            duration: 150,
            yoyo: true
        });
    }
}
