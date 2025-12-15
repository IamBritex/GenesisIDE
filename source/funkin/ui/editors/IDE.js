import { GeneralPreload } from './utils/preload/GeneralPreload.js';
import MouseHandler from './inputs/mouse.js';
// [MODIFICADO] Nueva ruta de importación
import { CameraManager } from './camera/camera.js';
import Checkboard from './utils/checkboard.js';
import DefaultWindowsOpened from './utils/window/DefaultWindowsOpened.js';
import { ModularWindow } from './utils/window/ModularWindow.js';
import { ToastManager } from './utils/Toast.js';
import CleanStateManager from './managers/cleanStateManager.js';
import EditorModes from './modes/editorModes.js';
import DockLayoutManager from './managers/DockLayoutManager.js';

export class IDE extends Phaser.Scene {
    constructor() {
        super({ key: 'IDE' });

        this.cameraManager = null;
        this.checkboard = null;
        this.toast = null;
        this.editorModes = null;
        this.layoutManager = null;
        this.modalListener = null;
    }

    preload() {
        GeneralPreload.preload(this);
    }

    create() {
        // 1. Sistemas Core
        this.cameraManager = new CameraManager(this);
        // Nota: el color de fondo ya se maneja dentro de CameraManager, 
        // pero si quieres asegurarlo aquí, está bien.

        // Fondo (Checkboard configura los límites de la cámara al crearse)
        this.checkboard = new Checkboard(this, this.cameraManager);

        // Input
        new MouseHandler(this);

        // 2. Sistemas UI
        this.toast = new ToastManager(this);
        this.editorModes = new EditorModes(this);
        this.layoutManager = new DockLayoutManager(this);

        // 3. Ventanas
        DefaultWindowsOpened.open(this);

        // 4. Eventos
        this._setupListeners();

        // [DEBUG]
        this.input.keyboard.on('keydown-M', () => {
            const content = this.cache.text.get('modalHtml');
            if (content) new ModularWindow(this, content);
        });
    }

    _setupListeners() {
        this.modalListener = (e) => {
            const { name, type } = e.detail;
            console.log('[IDE] Entidad guardada:', e.detail);
            this.toast.show('Entidad Creada', `${name} (${type})`, 'success');
        };
        window.addEventListener('modal-save', this.modalListener);
    }

    update(time, delta) {
        if (this.checkboard) this.checkboard.update();
    }

    shutdown() {
        CleanStateManager.clean(this);
    }
}

game.scene.add('IDE', IDE);