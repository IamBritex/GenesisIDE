export class touchHere extends Phaser.Scene {
    constructor() {
        super({ key: 'touchHere' });
    }

    preload() {
        this.load.image('startImage', 'public/assets/images/UI/touchHereToPlay.png');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        let startButton = this.add.image(centerX, centerY, 'startImage')
            .setScale(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.tweens.add({
                targets: startButton,
                scale: 0,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    startButton.destroy();

                    if (this.scene.get('IDE')) {
                        this.scene.start('IDE');
                    } 
                }
            });
        });

        // --- Animaciones ---
        startButton.on('pointerover', () => {
            this.tweens.add({
                targets: startButton,
                scale: 0.55,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
        });

        startButton.on('pointerout', () => {
            this.tweens.add({
                targets: startButton,
                scale: 0.5,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
        });
    }
}