import StageMode from './stageMode.js';
import CharacterMode from './characterMode.js';
import ChartMode from './chartMode.js';

export default class EditorModes {
    constructor(scene) {
        this.scene = scene;
        this.currentMode = null;

        // Registro de modos disponibles
        this.modes = {
            'stage': new StageMode(scene),
            'character': new CharacterMode(scene),
            'chart': new ChartMode(scene)
        };

        this._bindEvents();

        // [IMPORTANTE] Activar modo 'stage' por defecto al iniciar
        this.setMode('stage');
    }

    _bindEvents() {
        this.onModeChange = (e) => {
            if (e.detail && e.detail.mode) {
                this.setMode(e.detail.mode);
            }
        };
        window.addEventListener('editor-mode-change', this.onModeChange);
    }

    setMode(modeKey) {
        const newMode = this.modes[modeKey];
        if (!newMode) {
            console.warn(`[EditorModes] El modo '${modeKey}' no existe.`);
            return;
        }

        if (this.currentMode === newMode) return;

        // 1. Desactivar anterior
        if (this.currentMode) {
            this.currentMode.disable();
        }

        // 2. Activar nuevo
        this.currentMode = newMode;
        this.currentMode.enable();
    }

    destroy() {
        window.removeEventListener('editor-mode-change', this.onModeChange);
        if (this.currentMode) {
            this.currentMode.disable();
        }
        this.modes = {};
    }
}