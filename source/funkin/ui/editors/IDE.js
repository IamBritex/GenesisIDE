import { GeneralPreload } from './utils/preload/GeneralPreload.js';
import { ModularWindow } from './utils/window/ModularWindow.js';

export class IDE extends Phaser.Scene {
    constructor() {
        super({ key: 'IDE' });
    }

    preload() {
        GeneralPreload.preload(this);
    }

    create() {
        this.cameras.main.setBackgroundColor('#333333');

        // Ventana testeo modal 
        this.input.keyboard.on('keydown-M', () => {
            this.openModal();
        });

        // Escuchar el evento que dispara la modal al guardar
        window.addEventListener('modal-save', (e) => {
            console.log("Datos recibidos de la modal:", e.detail);
        });
    }

    openModal() {
        const htmlContent = this.cache.text.get('modalHtml');
        const win = new ModularWindow(this, htmlContent);
    }
}

game.scene.add('IDE', IDE, true);