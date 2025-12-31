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
import TabBar from './components/UI/tabBar/tabbar.js';

// [CRÍTICO] Asegúrate de que esta línea esté presente
import ZoomTool from './components/UI/tools/view/zoom.js';

export class IDE extends Phaser.Scene {
    constructor() {
        super({ key: 'IDE' });
        this.zoomTool = null;
        this.cameraManager = null;
        this.checkboard = null;
        this.toast = null;
        this.editorModes = null;
        this.layoutManager = null;
        this.modalListener = null;
        this.properties = null;
        this.tabBar = null;
    }

    preload() {
        GeneralPreload.preload(this);
    }

    create() {
        this.cameraManager = new CameraManager(this);
        this.checkboard = new Checkboard(this, this.cameraManager);
        new MouseHandler(this);
        this.toast = new ToastManager(this);
        this.editorModes = new EditorModes(this);
        this.layoutManager = new DockLayoutManager(this);

        // [CRÍTICO] Instanciar el ZoomTool aquí
        this.zoomTool = new ZoomTool(this);

        DefaultWindowsOpened.open(this);
        this.time.delayedCall(100, () => {
            this.tabBar = new TabBar(this);
        });
        this.properties = new Properties(this);
        this._setupListeners();

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

        // [NUEVO] Listener para abrir/cerrar ventanas desde el menú
        this.windowToggleListener = (e) => {
            const winId = e.detail.id;
            if (winId) {
                DefaultWindowsOpened.toggleWindow(this, winId);
            }
        };
        window.addEventListener('editor-window-toggle', this.windowToggleListener);
    }

    update(time, delta) {
        if (this.checkboard) this.checkboard.update();
    }

    shutdown() {
        CleanStateManager.clean(this);
        if (this.properties) this.properties = null;
        if (this.tabBar) { this.tabBar.destroy(); this.tabBar = null; }
        if (this.zoomTool) { this.zoomTool.destroy(); this.zoomTool = null; }

        // [IMPORTANTE] Remover listener
        window.removeEventListener('editor-window-toggle', this.windowToggleListener);
    }
}

game.scene.add('IDE', IDE);