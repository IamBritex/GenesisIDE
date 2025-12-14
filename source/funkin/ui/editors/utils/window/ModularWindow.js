/**
 * source/funkin/ui/editors/utils/window/ModularWindow.js
 */
import WindowConfigParser from './WindowConfigParser.js';
import WindowDOMBuilder from './WindowDOMBuilder.js';
import WindowInteraction from './WindowInteraction.js';

export class ModularWindow {
    
    static openPopups = [];
    static savedPositions = new Map(); // MEMORIA DE POSICIONES { 'TitleOrID': {x, y} }

    constructor(scene, contentOrConfig) {
        this.scene = scene;
        
        // 1. Configuración
        const { html, configOverride } = this._resolveContent(contentOrConfig);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        this.config = WindowConfigParser.parse(doc, configOverride);

        // Identificador único para guardar posición (ID > Title)
        this.storageKey = this.config.id || this.config.title;

        // 2. Construcción (Invisible al inicio)
        const builder = new WindowDOMBuilder(scene, this.config, doc);
        const { domElement, windowNode } = builder.build();
        this.domElement = domElement;
        this.windowNode = windowNode;

        // 3. Posicionamiento Inteligente
        this._calculateAndApplyPosition();

        // 4. Interacción
        this.interaction = new WindowInteraction(scene, windowNode, this.config, {
            onClose: () => this.close(),
            // Guardar posición al terminar de arrastrar
            onDragEnd: (e) => {
                this._saveCurrentPosition();
                if (this.onDragEnd) this.onDragEnd(e);
            },
            onDragMove: (e, x, y) => this.onDragMove && this.onDragMove(e, x, y),
            onDragStart: (e) => this.onDragStart && this.onDragStart(e)
        });

        ModularWindow.openPopups.push(this);
        this._playSound('editorOpen');

        // Hacer visible la ventana una vez posicionada
        this.domElement.node.style.visibility = 'visible';
    }

    _calculateAndApplyPosition() {
        // Obtenemos dimensiones reales del canvas del juego
        const gameW = this.scene.scale.width;
        const gameH = this.scene.scale.height;

        let finalX = 0;
        let finalY = 0;

        // A) ¿Hay una posición guardada en memoria?
        const saved = ModularWindow.savedPositions.get(this.storageKey);

        if (saved) {
            finalX = saved.x;
            finalY = saved.y;
        } 
        // B) ¿La configuración (HTML) trae posición explícita?
        else if (this.config.x !== null && this.config.y !== null) {
            finalX = this.config.x;
            finalY = this.config.y;
        } 
        // C) Por defecto: CENTRAR en la pantalla
        else {
            // Necesitamos saber el tamaño real de la ventana.
            // Al estar en el DOM (aunque invisible), podemos leer offsetWidth/Height
            const winW = this.windowNode.offsetWidth || (typeof this.config.width === 'number' ? this.config.width : 400);
            const winH = this.windowNode.offsetHeight || 300; // Estimación si es 'auto' y falla lectura

            finalX = (gameW / 2) - (winW / 2);
            finalY = (gameH / 2) - (winH / 2);
            
            // Asegurar que no empiece fuera de pantalla (negativo)
            if (finalX < 0) finalX = 20;
            if (finalY < 0) finalY = 20;
        }

        this.windowNode.style.left = `${finalX}px`;
        this.windowNode.style.top = `${finalY}px`;
    }

    _saveCurrentPosition() {
        if (!this.storageKey) return;

        // Leemos la posición actual parseando el estilo (ya que el drag usa style.left/top)
        const x = parseInt(this.windowNode.style.left || 0);
        const y = parseInt(this.windowNode.style.top || 0);

        ModularWindow.savedPositions.set(this.storageKey, { x, y });
        // console.log(`[ModularWindow] Posición guardada para '${this.storageKey}':`, { x, y });
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
            html = `<head><link rel="stylesheet" href="public/ui/ui.css"></head>${html}`;
        }
        return { html, configOverride };
    }

    _playSound(key) {
        try { if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key); } catch (e) {}
    }

    get isDocked() { return this.interaction.state.isDocked; }
    set isDocked(val) { this.interaction.state.isDocked = val; }
    onDragStart = null;
    onDragMove = null;
    onDragEnd = null;

    close() {
        // Guardamos posición también al cerrar, por si se movió sin soltar el drag (raro pero posible)
        this._saveCurrentPosition();

        this.windowNode.classList.add('closing');
        this.interaction.destroy();
        ModularWindow.openPopups = ModularWindow.openPopups.filter(p => p !== this);
        setTimeout(() => { if (this.domElement) this.domElement.destroy(); }, 150);
    }
}