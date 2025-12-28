import { GeneralPreload } from './utils/preload/GeneralPreload.js';
import MouseHandler from './inputs/mouse.js';
import { CameraManager } from './camera/camera.js';
import Checkboard from './utils/checkboard.js';
import DefaultWindowsOpened from './utils/window/DefaultWindowsOpened.js';
import { ModularWindow } from './utils/window/ModularWindow.js';
import { ToastManager } from './utils/Toast.js';
import CleanStateManager from './managers/cleanStateManager.js';
import EditorModes from './modes/editorModes.js';
import DockLayoutManager from './managers/DockLayoutManager.js';
import Properties from './components/UI/properties/Properties.js';

// [NUEVO] Importamos el gestor de pestañas
import TabBar from './components/UI/tabBar/tabbar.js';

export class IDE extends Phaser.Scene {
    constructor() {
        super({ key: 'IDE' });

        this.cameraManager = null;
        this.checkboard = null;
        this.toast = null;
        this.editorModes = null;
        this.layoutManager = null;
        this.modalListener = null;
        this.properties = null;

        // [NUEVO] Referencia al TabBar
        this.tabBar = null;
    }

    preload() {
        GeneralPreload.preload(this);
    }

    create() {
        // 1. Sistemas Core
        this.cameraManager = new CameraManager(this);
        this.checkboard = new Checkboard(this, this.cameraManager);
        new MouseHandler(this);

        // 2. Sistemas UI
        this.toast = new ToastManager(this);
        this.editorModes = new EditorModes(this);
        this.layoutManager = new DockLayoutManager(this);

        // 3. Ventanas
        DefaultWindowsOpened.open(this);

        // [NUEVO] Inicializar TabBar
        // Usamos un pequeño delay para asegurar que DefaultWindowsOpened haya creado el HTML
        this.time.delayedCall(100, () => {
            this.tabBar = new TabBar(this);
        });

        // Inicializar Properties para que escuche los eventos
        this.properties = new Properties(this);

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
        if (this.properties) {
            this.properties = null;
        }
        // [NUEVO] Limpiar TabBar al salir
        if (this.tabBar) {
            this.tabBar.destroy();
            this.tabBar = null;
        }
    }
}

game.scene.add('IDE', IDE);