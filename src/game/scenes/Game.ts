import Phaser, { Math as PhaserMath } from 'phaser';
import { CustomScene } from '../utils/CustomScene';

interface TileData {
    gameObject: Phaser.GameObjects.Rectangle;
    border: Phaser.GameObjects.Rectangle;
    type: number; // 0, 1, or 2 to represent item types
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
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        super.create();
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x201338);

        // Status / Prompt Text
        this.statusText = this.add.text(
            this.scale.width / 2, 
            120, 
            'Select 3 matching tiles!', 
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Build 3x3 Grid
        this.createGrid();
    }

    private createGrid() {
        // Calculate offset to center the 3x3 grid horizontally and vertically
        const gridWidth = (this.GRID_COLS * this.TILE_SIZE) + ((this.GRID_COLS - 1) * this.TILE_SPACING);
        const gridHeight = (this.GRID_ROWS * this.TILE_SIZE) + ((this.GRID_ROWS - 1) * this.TILE_SPACING);
        
        const startX = (this.scale.width - gridWidth) / 2 + (this.TILE_SIZE / 2);
        const startY = (this.scale.height - gridHeight) / 2 + (this.TILE_SIZE / 2);

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

    private spawnTile(row: number, col: number, x: number, y: number) {
        // Pick a random tile type using Phaser's Math utility
        const randomType = PhaserMath.RND.pick(this.TILE_TYPES);

        // Selection highlight border (initially hidden)
        const border = this.add.rectangle(x, y, this.TILE_SIZE + 6, this.TILE_SIZE + 6)
            .setStrokeStyle(4, 0xFFFF00)
            .setVisible(false);

        // Tile rectangle
        const tileRect = this.add.rectangle(x, y, this.TILE_SIZE, this.TILE_SIZE, randomType.color)
            .setInteractive({ useHandCursor: true });

        const tileData: TileData = {
            gameObject: tileRect,
            border: border,
            type: randomType.id,
            row: row,
            col: col
        };

        // Pointer event
        tileRect.on('pointerdown', () => this.handleTileClick(tileData));

        this.grid[row][col] = tileData;
    }

    private handleTileClick(tile: TileData) {
        // Prevent interaction during animations or if tile is already selected
        if (this.isProcessing || this.selectedTiles.includes(tile)) {
            return;
        }

        // Select tile
        this.selectedTiles.push(tile);
        tile.border.setVisible(true);

        // Pop scale effect on click
        this.tweens.add({
            targets: [tile.gameObject, tile.border],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true
        });

        // Update status text
        this.statusText.setText(`Selected: ${this.selectedTiles.length} / 3`);

        // Check if 3 tiles are selected
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
            
            // Fade out and spawn new tiles
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: [tile.gameObject, tile.border],
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 250,
                    onComplete: () => {
                        this.replaceTile(tile);
                    }
                });
            });

            this.time.delayedCall(300, () => {
                this.resetSelection();
            });
        } else {
            this.statusText.setText('No Match! Try again.');

            // Shake tiles to indicate failure
            this.selectedTiles.forEach(tile => {
                this.tweens.add({
                    targets: [tile.gameObject, tile.border],
                    x: tile.gameObject.x + 8,
                    duration: 50,
                    yoyo: true,
                    repeat: 2
                });
            });

            this.time.delayedCall(400, () => {
                this.resetSelection();
            });
        }
    }

    private replaceTile(oldTile: TileData) {
        const { row, col } = oldTile;
        const x = oldTile.gameObject.x;
        const y = oldTile.gameObject.y;

        // Clean up old game objects
        oldTile.gameObject.destroy();
        oldTile.border.destroy();

        // Spawn replacement
        this.spawnTile(row, col, x, y);

        // Animate entrance
        const newTile = this.grid[row][col]!;
        newTile.gameObject.setScale(0);
        
        this.tweens.add({
            targets: newTile.gameObject,
            scaleX: 1,
            scaleY: 1,
            duration: 200
        });
    }

    private resetSelection() {
        this.selectedTiles.forEach(tile => {
            if (tile.border && tile.border.active) {
                tile.border.setVisible(false);
            }
        });

        this.selectedTiles = [];
        this.isProcessing = false;
        
        this.time.delayedCall(500, () => {
            if (!this.isProcessing) {
                this.statusText.setText('Select 3 matching tiles!');
            }
        });
    }
}