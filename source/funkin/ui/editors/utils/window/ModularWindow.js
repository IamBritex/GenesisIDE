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

    static getNextDepth() {
        return ++ModularWindow.currentMaxDepth;
    }

    static getNextTopDepth() {
        return ++ModularWindow.currentTopDepth;
    }

    constructor(scene, contentOrConfig) {
        this.scene = scene;

        const { html, configOverride } = this._resolveContent(contentOrConfig);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        this.config = WindowConfigParser.parse(doc, configOverride);

        this.storageKey = this.config.id || this.config.title;

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

        // [NUEVO] Función para verificar si un lado está ocupado por OTRA ventana
        const occupancyChecker = (side) => {
            return ModularWindow.openPopups.some(win =>
                win !== this && // No soy yo
                win.interaction && // Tiene interacción
                win.interaction.state.dockSide === side // Tiene ese lado ocupado
            );
        };

        this.interaction = new WindowInteraction(
            scene,
            windowNode,
            this.config,
            {
                onClose: () => this.close(),
                onDragEnd: (e) => {
                    this._saveCurrentPosition();
                    if (this.onDragEnd) this.onDragEnd(e);
                },
                onDragMove: (e, x, y) => this.onDragMove && this.onDragMove(e, x, y),
                onDragStart: (e) => this.onDragStart && this.onDragStart(e)
            },
            () => this.focus(),     // Callback de Foco (Profundidad)
            occupancyChecker        // [NUEVO] Callback de Ocupación
        );

        this.interaction.domContainer = this.domElement.node;

        ModularWindow.openPopups.push(this);
        this._playSound('editorOpen');

        this.focus();

        this.domElement.node.style.visibility = 'visible';
    }

    focus() {
        if (!this.domElement) return;
        if (this.config.alwaysOnTop) {
            const topDepth = ModularWindow.getNextTopDepth();
            this.domElement.setDepth(topDepth);
            return;
        }
        const newDepth = ModularWindow.getNextDepth();
        if (newDepth < 1000000) {
            this.domElement.setDepth(newDepth);
        }
    }

    _calculateAndApplyPosition() {
        const gameW = this.scene.scale.width;
        const gameH = this.scene.scale.height;
        let finalX = 0;
        let finalY = 0;
        const saved = ModularWindow.savedPositions.get(this.storageKey);

        if (saved) {
            finalX = saved.x;
            finalY = saved.y;
        } else if (this.config.x !== null && this.config.y !== null) {
            finalX = this.config.x;
            finalY = this.config.y;
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

    get isDocked() { return this.interaction.state.isDocked; }
    set isDocked(val) { this.interaction.state.isDocked = val; }
    onDragStart = null;
    onDragMove = null;
    onDragEnd = null;

    close() {
        this._saveCurrentPosition();
        this.windowNode.classList.add('closing');
        if (this.interaction) this.interaction.destroy();
        ModularWindow.openPopups = ModularWindow.openPopups.filter(p => p !== this);
        setTimeout(() => {
            if (this.domElement) {
                this.domElement.destroy();
                this.domElement = null;
            }
        }, 150);
    }
}