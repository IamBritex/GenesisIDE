import { GeneralPreload } from './utils/preload/GeneralPreload.js';
import MouseHandler from './inputs/mouse.js';
import { CameraManager } from '../../play/camera/Camera.js';
import Checkboard from './utils/checkboard.js';
import DefaultWindowsOpened from './utils/window/DefaultWindowsOpened.js';
import { ToastManager } from './utils/Toast.js';
import { ModularWindow } from './utils/window/ModularWindow.js';

export class IDE extends Phaser.Scene {
    constructor() {
        super({ key: 'IDE' });
        this.cameraManager = null;
        this.checkboard = null;
        this.toast = null;
    }

    preload() {
        GeneralPreload.preload(this);
    }

    create() {
        // 1. Inicializar Cámaras
        this.cameraManager = new CameraManager(this);
        this.cameraManager.gameCamera.setBackgroundColor('#333333');

        // 2. Configurar Fondo (Checkboard)
        this.checkboard = new Checkboard(this, this.cameraManager);

        // 3. Inicializar Mouse
        new MouseHandler(this);

        // 4. Inicializar Toast Manager
        this.toast = new ToastManager(this);

        // 5. Abrir ventanas por defecto
        DefaultWindowsOpened.open(this);

        // --- LÓGICA DE NUEVA ENTIDAD (MODAL) ---

        // Listener del evento personalizado 'modal-save'
        window.addEventListener('modal-save', (e) => {
            const { name, type } = e.detail;
            console.log('[IDE] Recibido evento modal-save:', e.detail);

            // Mostrar Feedback Visual
            this.toast.show('Entidad Creada', `${name} (${type})`);

            // TODO: Aquí agregarías la lógica real para crear el objeto en la escena
        });

        // [DEBUG] Tecla 'M' para abrir el modal de prueba rápidamente
        this.input.keyboard.on('keydown-M', () => {
            const content = this.cache.text.get('modalHtml');
            if (content) {
                new ModularWindow(this, content);
            } else {
                console.warn('modalHtml no cargado');
            }
        });
    }

    update(time, delta) {
        if (this.checkboard) {
            this.checkboard.update();
        }
    }

    shutdown() {
        this.checkboard = null;
        if (this.toast) this.toast.destroy();

        // Reiniciar flag para que al volver a entrar se abran las ventanas
        DefaultWindowsOpened.hasOpened = false;

        // Limpieza manual de cualquier ventana flotante del DOM
        const remainingWindows = document.querySelectorAll('.modular-window-container');
        remainingWindows.forEach(el => el.remove());
    }
}

game.scene.add('IDE', IDE, true);