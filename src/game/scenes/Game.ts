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

export class Game extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;
    
    // Grid configuration
    private readonly GRID_ROWS = 3;
    private readonly GRID_COLS = 3;
    private readonly TILE_SIZE = 86;
    private readonly TILE_SPACING = 16;

    // Styled Tile Palette
    private readonly TILE_TYPES = [
        { id: 0, color: 0xF58324, border: 0xFFD700, icon: '⚡' }, // Scrambly Orange / Gold
        { id: 1, color: 0x7845D8, border: 0xB58BFF, icon: '💎' }, // Deep Purple / Soft Lavender
        { id: 2, color: 0x2ECC71, border: 0xA3E4D7, icon: '🌟' }  // Vibrant Emerald / Mint
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

    constructor() {
        super('Game');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(COLORS.DEEP_INK);

        // Reset state on scene start
        this.lives = this.MAX_LIVES;
        this.coinsEarned = 0;
        this.displayedCoins = 0;
        this.heartIcons = [];
        this.currentRoundTimeMs = this.INITIAL_TIME_MS;

        // Score, Title & Lives UI
        this.createScoreUI();

        // Timer Bar UI
        this.createTimerBarUI();

        // Status / Prompt Text Box
        const statusY = 185;
        const centerX = Math.floor(this.scale.width / 2);

        const statusBox = this.add.graphics();
        statusBox.fillStyle(COLORS.CARD_BG, 0.7);
        statusBox.fillRoundedRect(centerX - 140, statusY - 18, 280, 36, 12);
        statusBox.lineStyle(1, COLORS.PURPLE, 0.6);
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

    update() {
        this.updateTimerBar();
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

        // Coin Score Background Card
        const coinCard = this.add.graphics();
        coinCard.fillStyle(COLORS.CARD_BG, 0.95);
        coinCard.fillRoundedRect(centerX - 135, 75, 120, 44, 12);
        coinCard.lineStyle(2, COLORS.ORANGE, 0.8);
        coinCard.strokeRoundedRect(centerX - 135, 75, 120, 44, 12);

        // Coin Emoji Text
        this.add.text(centerX - 120, 97, '🪙', { 
            fontSize: '18px',
            padding: { top: 6, bottom: 6, left: 2, right: 2 },
            resolution: 2
        }).setOrigin(0.5);

        // Coin Counter Text
        this.scoreText = this.add.text(centerX - 100, 97, '0', {
            fontFamily: 'Arial Black',
            fontSize: '17px',
            color: '#FFD700',
            resolution: 2
        }).setOrigin(0, 0.5);

        // Lives Indicator Container Box
        const livesCard = this.add.graphics();
        livesCard.fillStyle(COLORS.CARD_BG, 0.95);
        livesCard.fillRoundedRect(centerX + 15, 75, 120, 44, 12);
        livesCard.lineStyle(2, COLORS.RED_ACCENT, 0.8);
        livesCard.strokeRoundedRect(centerX + 15, 75, 120, 44, 12);

        // Render Lives Hearts
        const heartStartX = centerX + 38;
        for (let i = 0; i < this.MAX_LIVES; i++) {
            const heart = this.add.text(heartStartX + (i * 28), 97, '❤️', {
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

    private updateTimerBar() {
        if (!this.timerEvent || this.timerEvent.paused) {
            return;
        }

        const barWidth = this.scale.width - 40;
        const x = 20;
        const y = this.scale.height - 35;

        // Calculate progress (1.0 -> full, 0.0 -> empty)
        const progress = Math.max(0, 1 - this.timerEvent.getProgress());
        const currentBarWidth = Math.max(0, barWidth * progress);

        this.timerBarFill.clear();

        // Dynamic Color Shift: Green -> Yellow -> Red
        let barColor = COLORS.GREEN_ACCENT;
        if (progress < 0.25) {
            barColor = COLORS.RED_ACCENT;
        } else if (progress < 0.5) {
            barColor = COLORS.ACCENT_GOLD;
        }

        if (currentBarWidth > 0) {
            this.timerBarFill.fillStyle(barColor, 1);
            this.timerBarFill.fillRoundedRect(x, y, currentBarWidth, this.TIMER_BAR_HEIGHT, 6);
        }
    }

    private handleTimeOut() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.statusText.setText('Time Out! Lost 1 Life ⏰💔');
        this.loseLife();

        if (this.lives > 0) {
            this.time.delayedCall(500, () => {
                this.resetFullGrid();
            });
        } else {
            this.time.delayedCall(800, () => {
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

        // Container holding tile components
        const container = this.add.container(x, y);
        container.setSize(this.TILE_SIZE, this.TILE_SIZE);

        const borderGfx = this.add.graphics();
        const bgGfx = this.add.graphics();

        // Draw tile initial state
        this.drawTileGraphic(bgGfx, borderGfx, randomType, false);

        // Tile Center Icon
        const iconText = this.add.text(0, 0, randomType.icon, {
            fontSize: '32px',
            resolution: 2
        }).setOrigin(0.5);

        container.add([borderGfx, bgGfx, iconText]);

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
                duration: 200,
                delay: (row * 3 + col) * 30
            });
        }
    }

    private drawTileGraphic(bgGfx: Phaser.GameObjects.Graphics, borderGfx: Phaser.GameObjects.Graphics, tileTypeConfig: typeof this.TILE_TYPES[0], isSelected: boolean) {
        bgGfx.clear();
        borderGfx.clear();

        const half = this.TILE_SIZE / 2;

        if (isSelected) {
            // Glowing Highlight Selection Border
            borderGfx.fillStyle(COLORS.ACCENT_GOLD, 0.4);
            borderGfx.fillRoundedRect(-half - 5, -half - 5, this.TILE_SIZE + 10, this.TILE_SIZE + 10, 18);
            borderGfx.lineStyle(3, COLORS.ACCENT_GOLD, 1);
            borderGfx.strokeRoundedRect(-half - 5, -half - 5, this.TILE_SIZE + 10, this.TILE_SIZE + 10, 18);
        }

        // Tile Drop Shadow
        bgGfx.fillStyle(0x000000, 0.35);
        bgGfx.fillRoundedRect(-half + 2, -half + 3, this.TILE_SIZE, this.TILE_SIZE, 14);

        // Tile Base Fill
        bgGfx.fillStyle(tileTypeConfig.color, 1);
        bgGfx.fillRoundedRect(-half, -half, this.TILE_SIZE, this.TILE_SIZE, 14);

        // Tile Top Gloss Highlight
        bgGfx.fillStyle(0xFFFFFF, 0.22);
        bgGfx.fillRoundedRect(-half + 4, -half + 3, this.TILE_SIZE - 8, (this.TILE_SIZE - 6) / 2, { tl: 11, tr: 11, bl: 3, br: 3 });

        // Outer Tile Rim
        bgGfx.lineStyle(2, tileTypeConfig.border, 0.85);
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
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 100,
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
            this.statusText.setText('Match Found! +100 Coins');
            this.addCoins(100);

            // Speed up round duration for next round (down to min limit of 5s)
            this.currentRoundTimeMs = Math.max(
                this.MIN_TIME_MS, 
                this.currentRoundTimeMs - this.TIME_DECREMENT_MS
            );

            // Match feedback animation
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: tile.gameObject,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 150,
                    yoyo: true
                });
            });

            // Refresh grid after match sequence
            this.time.delayedCall(450, () => {
                this.resetFullGrid();
            });
        } else {
            this.statusText.setText('No Match! Lost 1 Life 💔');
            this.loseLife();

            // Shake tiles feedback
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: tile.gameObject,
                    x: tile.gameObject.x + 8,
                    duration: 50,
                    yoyo: true,
                    repeat: 2
                });
            });

            // Check if game over or refresh grid
            if (this.lives > 0) {
                this.time.delayedCall(500, () => {
                    this.resetFullGrid();
                });
            } else {
                this.time.delayedCall(800, () => {
                    this.triggerGameOver();
                });
            }
        }
    }

    private loseLife() {
        if (this.lives <= 0) return;

        this.lives--;
        const lostHeartIndex = this.lives;
        const targetHeart = this.heartIcons[lostHeartIndex];

        if (targetHeart) {
            this.tweens.add({
                targets: targetHeart,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 150,
                yoyo: true,
                onYoyo: () => {
                    targetHeart.setText('🩶');
                }
            });

            this.cameras.main.shake(200, 0.005);
        }
    }

    private triggerGameOver() {
        this.stopRoundTimer();
        this.scene.start('GameOver', { score: this.coinsEarned });
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
                        duration: 200,
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
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 150,
            yoyo: true
        });
    }
}