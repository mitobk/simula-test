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

    constructor() {
        super('Game');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x201338);

        // Score & Title UI
        this.createScoreUI();

        // Status / Prompt Text
        this.statusText = this.add.text(
            this.scale.width / 2, 
            180, 
            'Select 3 matching tiles!', 
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#FFF6E8',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Build Initial 3x3 Grid
        this.createGrid();
    }

    private createScoreUI() {
        const centerX = this.scale.width / 2;

        // Title Header Banner
        this.add.text(centerX, 50, 'SCRAMBLY REWARDS', {
            fontFamily: 'Arial Black',
            fontSize: '22px',
            color: '#F58324'
        }).setOrigin(0.5);

        // Coin Score Background Box
        this.add.rectangle(centerX, 110, 220, 50, 0x2D1B4E, 0.9)
            .setStrokeStyle(2, 0xF58324);

        // Coin Counter Text
        this.scoreText = this.add.text(centerX, 110, 'Coins: 0', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    private getGridOrigins() {
        const gridWidth = (this.GRID_COLS * this.TILE_SIZE) + ((this.GRID_COLS - 1) * this.TILE_SPACING);
        const gridHeight = (this.GRID_ROWS * this.TILE_SIZE) + ((this.GRID_ROWS - 1) * this.TILE_SPACING);
        
        const startX = (this.scale.width - gridWidth) / 2 + (this.TILE_SIZE / 2);
        const startY = (this.scale.height - gridHeight) / 2 + (this.TILE_SIZE / 2) + 40;

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

        // Optional pop-in entrance animation for grid refresh
        if (animate) {
            tileRect.setScale(0);
            this.tweens.add({
                targets: tileRect,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                delay: (row * 3 + col) * 30 // Staggered pop-in
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

        const [first, second, third] = this.selectedTiles;
        const isMatch = (first.type === second.type) && (second.type === third.type);

        if (isMatch) {
            this.statusText.setText('Match Found! +100 Coins');
            this.addCoins(100);

            // Match feedback animation (scale up & bright pop)
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: [tile.gameObject, tile.border],
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 150,
                    yoyo: true
                });
            });

            // Refresh full grid after match sequence
            this.time.delayedCall(450, () => {
                this.resetFullGrid();
            });
        } else {
            this.statusText.setText('No Match! Try again.');

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

            // Refresh full grid after failure sequence
            this.time.delayedCall(450, () => {
                this.resetFullGrid();
            });
        }
    }

    private resetFullGrid() {
        let destroyedCount = 0;
        const totalTiles = this.GRID_ROWS * this.GRID_COLS;

        // Shrink and destroy all existing tiles on the board
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

                            // Once all tiles are destroyed, spawn the new grid
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

        // Reset state & update prompt
        this.time.delayedCall(300, () => {
            this.isProcessing = false;
            this.statusText.setText('Select 3 matching tiles!');
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