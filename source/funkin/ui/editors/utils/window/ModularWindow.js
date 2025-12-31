/**
 * source/funkin/ui/editors/utils/window/ModularWindow.js
 */
import WindowConfigParser from './WindowConfigParser.js';
import WindowDOMBuilder from './WindowDOMBuilder.js';
import WindowInteraction from './WindowInteraction.js';

export class ModularWindow {

    static openPopups = [];
    static savedPositions = new Map();
    static currentMaxDepth = 10000;
    static currentTopDepth = 1000000;

    static getNextDepth() { return ++ModularWindow.currentMaxDepth; }
    static getNextTopDepth() { return ++ModularWindow.currentTopDepth; }

    constructor(scene, contentOrConfig) {
        this.scene = scene;

        const { html, configOverride } = this._resolveContent(contentOrConfig);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        this.config = WindowConfigParser.parse(doc, configOverride);

        this.storageKey = this.config.id || this.config.title;

        // [NUEVO] Identificar ventanas que no deben destruirse al cerrar
        this.isPersistent = (this.config.id === 'explorer' || this.config.id === 'properties' || this.config.id === 'timeline');

        const builder = new WindowDOMBuilder(scene, this.config, doc);
        const { domElement, windowNode } = builder.build();
        this.domElement = domElement;
        this.windowNode = windowNode;

        if (this.scene.cameraManager) {
            this.scene.cameraManager.assignToHUD(this.domElement);
        } else {
            if (this.domElement) this.domElement.setScrollFactor(0);
        }

        this._calculateAndApplyPosition();

        const occupancyChecker = (side) => {
            return ModularWindow.openPopups.some(win =>
                win !== this &&
                win.windowNode.style.display !== 'none' && // Ignorar ventanas ocultas
                win.interaction &&
                win.interaction.state.dockSide === side
            );
        };

        this.interaction = new WindowInteraction(
            scene, windowNode, this.config,
            {
                onClose: () => this.close(),
                onDragEnd: (e) => {
                    this._saveCurrentPosition();
                    if (this.onDragEnd) this.onDragEnd(e);
                },
                onDragMove: (e, x, y) => this.onDragMove && this.onDragMove(e, x, y),
                onDragStart: (e) => this.onDragStart && this.onDragStart(e)
            },
            () => this.focus(),
            occupancyChecker
        );

        this.interaction.domContainer = this.domElement.node;

        ModularWindow.openPopups.push(this);

        const defaultWindows = ['tool-bar', 'bottom-bar', 'explorer', 'properties', 'tab-bar'];
        if (!this.config.id || !defaultWindows.includes(this.config.id)) {
            this._playSound('openWindow');
        }

        this.focus();
        this.windowNode.style.visibility = 'visible';

        // Asegurar que sea visible (por si fue re-creada o algo)
        this.windowNode.style.display = 'flex';

        window.dispatchEvent(new CustomEvent('layout-update'));
    }

    focus() {
        if (!this.domElement) return;

        // Si estaba oculta, mostrarla
        if (this.windowNode.style.display === 'none') {
            this.windowNode.style.display = 'flex';
            window.dispatchEvent(new CustomEvent('layout-update'));
        }

        if (this.config.alwaysOnTop) {
            this.domElement.setDepth(ModularWindow.getNextTopDepth());
            return;
        }
        const newDepth = ModularWindow.getNextDepth();
        if (newDepth < 1000000) this.domElement.setDepth(newDepth);
    }

    _calculateAndApplyPosition() {
        const gameW = this.scene.scale.width;
        const gameH = this.scene.scale.height;
        let finalX = 0, finalY = 0;
        const saved = ModularWindow.savedPositions.get(this.storageKey);

        if (saved) {
            finalX = saved.x; finalY = saved.y;
        } else if (this.config.x !== null && this.config.y !== null) {
            finalX = this.config.x; finalY = this.config.y;
        } else {
            const winW = this.windowNode.offsetWidth || (typeof this.config.width === 'number' ? this.config.width : 400);
            const winH = this.windowNode.offsetHeight || 300;
            finalX = (gameW / 2) - (winW / 2);
            finalY = (gameH / 2) - (winH / 2);
            if (finalX < 0) finalX = 20;
            if (finalY < 0) finalY = 20;
        }
        this.windowNode.style.left = `${finalX}px`;
        this.windowNode.style.top = `${finalY}px`;
    }

    _saveCurrentPosition() {
        if (!this.storageKey) return;
        const x = parseInt(this.windowNode.style.left || 0);
        const y = parseInt(this.windowNode.style.top || 0);
        ModularWindow.savedPositions.set(this.storageKey, { x, y });
    }

    _resolveContent(input) {
        let html = '';
        let configOverride = {};
        if (typeof input === 'string') {
            html = input;
        } else if (typeof input === 'object') {
            configOverride = input;
            html = typeof input.content === 'function' ? input.content() : (input.content || '');
        }
        if (!html.includes('ui.css')) {
            html = `<head><link rel="stylesheet" href="../../../../../public/ui/ui.css"></head>${html}`;
        }
        return { html, configOverride };
    }

    _playSound(key) {
        try { if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key); } catch (e) { }
    }

    get isDocked() { return this.interaction ? this.interaction.state.isDocked : false; }
    set isDocked(val) { if (this.interaction) this.interaction.state.isDocked = val; }
    onDragStart = null;
    onDragMove = null;
    onDragEnd = null;

    close() {
        this._playSound('exitWindow');
        this._saveCurrentPosition();

        // [MODIFICADO] Si es persistente, SOLO OCULTAR
        if (this.isPersistent) {
            this.windowNode.style.display = 'none';
            // Notificar al layout manager para que ocupe el espacio vacío
            window.dispatchEvent(new CustomEvent('layout-update'));
            return;
        }

        // --- Lógica normal de destrucción para ventanas temporales ---
        this.windowNode.classList.add('closing');
        if (this.interaction) this.interaction.destroy();

        ModularWindow.openPopups = ModularWindow.openPopups.filter(p => p !== this);
        window.dispatchEvent(new CustomEvent('layout-update'));

        setTimeout(() => {
            if (this.domElement) {
                this.domElement.destroy();
                this.domElement = null;
            }
        }, 150);
    }
}