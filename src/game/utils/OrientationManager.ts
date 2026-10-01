import * as Phaser from 'phaser';

export class OrientationManager {
    private scene: Phaser.Scene;
    private overlayContainer!: Phaser.GameObjects.Container;
    private isLandscape: boolean = false;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createOverlay();

        // Escuchar eventos del Scale Manager de Phaser y del navegador
        this.handleResize = this.handleResize.bind(this);
        
        this.scene.scale.on('resize', this.handleResize, this);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);

        // Verificación inicial con un pequeño retardo para asegurar dimensiones
        this.scene.time.delayedCall(100, () => this.checkOrientation());

        // Limpieza de eventos al cambiar o destruir la escena
        this.scene.events.once('shutdown', this.destroy, this);
        this.scene.events.once('destroy', this.destroy, this);
    }

    private createOverlay() {
        const { width, height } = this.scene.scale;

        // Fondo oscuro que bloquea clics/interacción con el juego
        const bg = this.scene.add.rectangle(0, 0, width * 2, height * 2, 0x201338, 0.98)
            .setInteractive();

        // Icono gráfico de rotación de teléfono
        const icon = this.scene.add.graphics();
        icon.lineStyle(4, 0xF58324);
        icon.strokeRoundedRect(-30, -50, 60, 100, 10);
        icon.strokeCircle(0, 30, 5);

        // Texto descriptivo
        const text = this.scene.add.text(0, 80, 'Please rotate your device\nto Portrait mode', {
            fontSize: '22px',
            color: '#FFF6E8',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.overlayContainer = this.scene.add.container(width / 2, height / 2, [bg, icon, text]);
        this.overlayContainer.setDepth(9999);
        this.overlayContainer.setVisible(false);
    }

    private handleResize() {
        // Esperar a que el navegador procese el cambio de layout
        requestAnimationFrame(() => {
            if (this.overlayContainer && this.overlayContainer.active) {
                const { width, height } = this.scene.scale;
                this.overlayContainer.setPosition(width / 2, height / 2);
            }
            this.checkOrientation();
        });
    }

    private checkOrientation() {
        // Comprobación triple: Phaser Scale Manager, Window Dimensions y Screen Orientation API
        const phaserIsLandscape = this.scene.scale.isLandscape;
        const windowIsLandscape = window.innerWidth > window.innerHeight;
        const bodyIsLandscape = document.documentElement.clientWidth > document.documentElement.clientHeight;

        const isLandscapeNow = phaserIsLandscape || windowIsLandscape || bodyIsLandscape;

        if (isLandscapeNow !== this.isLandscape) {
            this.isLandscape = isLandscapeNow;

            if (this.overlayContainer && this.overlayContainer.active) {
                if (this.isLandscape) {
                    this.overlayContainer.setVisible(true);
                    this.scene.scene.pause();
                } else {
                    this.overlayContainer.setVisible(false);
                    this.scene.scene.resume();
                }
            }
        }
    }

    public destroy() {
        if (this.scene && this.scene.scale) {
            this.scene.scale.off('resize', this.handleResize, this);
        }
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);

        if (this.overlayContainer) {
            this.overlayContainer.destroy();
        }
    }
}