import Phaser, { Math as PhaserMath } from 'phaser';
import { CustomScene } from '../utils/CustomScene';

interface TileData {
    gameObject: Phaser.GameObjects.Rectangle;
    border: Phaser.GameObjects.Rectangle;
    type: number;
    row: number;
    col: number;
}

export class Game extends CustomScene {
    private camera!: Phaser.Cameras.Scene2D.Camera;
    
    // Grid configuration
    private readonly GRID_ROWS = 3;
    private readonly GRID_COLS = 3;
    private readonly TILE_SIZE = 90;
    private readonly TILE_SPACING = 15;

    // Available placeholder tile types (colors)
    private readonly TILE_TYPES = [
        { id: 0, color: 0xFF5733, name: 'Red' },
        { id: 1, color: 0x33FF57, name: 'Green' },
        { id: 2, color: 0x3357FF, name: 'Blue' }
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
    private readonly TIMER_BAR_HEIGHT = 16;

    constructor() {
        super('Game');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x201338);

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

        // Status / Prompt Text
        this.statusText = this.add.text(
            this.scale.width / 2, 
            185, 
            'Select 3 matching tiles!', 
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#FFF6E8',
                align: 'center'
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
        const centerX = this.scale.width / 2;

        // Title Header Banner
        this.add.text(centerX, 40, 'SCRAMBLY REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#F58324'
        }).setOrigin(0.5);

        // Coin Score Background Box
        this.add.rectangle(centerX - 60, 100, 150, 45, 0x2D1B4E, 0.9)
            .setStrokeStyle(2, 0xF58324);

        // Coin Counter Text
        this.scoreText = this.add.text(centerX - 60, 100, 'Coins: 0', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Lives Indicator Container Box
        this.add.rectangle(centerX + 85, 100, 110, 45, 0x2D1B4E, 0.9)
            .setStrokeStyle(2, 0xE74C3C);

        // Render Lives Hearts
        const heartStartX = centerX + 55;
        for (let i = 0; i < this.MAX_LIVES; i++) {
            const heart = this.add.text(heartStartX + (i * 30), 100, '❤️', {
                fontSize: '20px'
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
        this.timerBarBg.fillStyle(0x1A0F2E, 0.9);
        this.timerBarBg.fillRect(x - 2, y - 2, barWidth + 4, this.TIMER_BAR_HEIGHT + 4);
        this.timerBarBg.lineStyle(2, 0x5C3B8B, 1);
        this.timerBarBg.strokeRect(x - 2, y - 2, barWidth + 4, this.TIMER_BAR_HEIGHT + 4);

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
        const currentBarWidth = barWidth * progress;

        this.timerBarFill.clear();

        // Color shifts from Green -> Yellow -> Red as time decreases
        let barColor = 0x2ECC71; // Green
        if (progress < 0.25) {
            barColor = 0xE74C3C; // Red
        } else if (progress < 0.5) {
            barColor = 0xF1C40F; // Yellow
        }

        this.timerBarFill.fillStyle(barColor, 1);
        this.timerBarFill.fillRect(x, y, currentBarWidth, this.TIMER_BAR_HEIGHT);
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
        
        const startX = (this.scale.width - gridWidth) / 2 + (this.TILE_SIZE / 2);
        const startY = (this.scale.height - gridHeight) / 2 + (this.TILE_SIZE / 2) + 20;

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

        const border = this.add.rectangle(x, y, this.TILE_SIZE + 6, this.TILE_SIZE + 6)
            .setStrokeStyle(4, 0xFFFF00)
            .setVisible(false);

        const tileRect = this.add.rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, randomType.color)
            .setInteractive({ useHandCursor: true });

        const tileData: TileData = {
            gameObject: tileRect,
            border: border,
            type: randomType.id,
            row: row,
            col: col
        };

        tileRect.on('pointerdown', () => this.handleTileClick(tileData));

        this.grid[row][col] = tileData;

        if (animate) {
            tileRect.setScale(0);
            this.tweens.add({
                targets: tileRect,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                delay: (row * 3 + col) * 30
            });
        }
    }

    private handleTileClick(tile: TileData) {
        if (this.isProcessing || this.selectedTiles.includes(tile)) {
            return;
        }

        this.selectedTiles.push(tile);
        tile.border.setVisible(true);

        this.tweens.add({
            targets: [tile.gameObject, tile.border],
            scaleX: 1.1,
            scaleY: 1.1,
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

            // Speed up round duration for the next round (down to min limit of 5s)
            this.currentRoundTimeMs = Math.max(
                this.MIN_TIME_MS, 
                this.currentRoundTimeMs - this.TIME_DECREMENT_MS
            );

            // Match feedback animation
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: [tile.gameObject, tile.border],
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
                    targets: [tile.gameObject, tile.border],
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
            // Animate heart losing effect & switch to empty heart icon
            this.tweens.add({
                targets: targetHeart,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 150,
                yoyo: true,
                onYoyo: () => {
                    targetHeart.setText('🖤');
                }
            });

            // Camera shake effect on life loss
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
                        targets: [tile.gameObject, tile.border],
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            tile.gameObject.destroy();
                            tile.border.destroy();
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
                this.scoreText.setText(`Coins: ${Math.floor(this.displayedCoins)}`);
            }
        });

        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true
        });
    }
}