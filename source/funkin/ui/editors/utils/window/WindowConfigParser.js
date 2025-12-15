/**
 * source/funkin/ui/editors/utils/window/WindowConfigParser.js
 */
export default class WindowConfigParser {
    static parse(doc, configOverride = {}) {
        const defaults = {
            width: 400, height: 'auto',
            minWidth: 150, minHeight: 100,
            x: null, y: null,
            draggable: true, overlay: false,
            resizable: true,
            minimize: true, close: true,
            showTitle: true,
            borderRad: true,
            alwaysOnTop: false, // [IMPORTANTE] Por defecto falso
            title: 'Ventana',
            id: null
        };

        let extracted = {};
        const winConfig = doc.querySelector('window-config');

        if (winConfig) {
            if (winConfig.hasAttribute('id')) extracted.id = winConfig.getAttribute('id');

            // --- Layout ---
            const layout = winConfig.querySelector('layout');
            if (layout) {
                const w = layout.getAttribute('width');
                const h = layout.getAttribute('height');
                const x = layout.getAttribute('x');
                const y = layout.getAttribute('y');
                const br = layout.getAttribute('borderRad');

                if (w) extracted.width = (w.includes('%') || w === 'auto') ? w : parseInt(w);
                if (h) extracted.height = (h.includes('%') || h === 'auto') ? h : parseInt(h);

                if (w && !isNaN(parseInt(w))) extracted.minWidth = parseInt(w);
                if (h && !isNaN(parseInt(h))) extracted.minHeight = parseInt(h);

                if (x) extracted.x = parseInt(x);
                if (y) extracted.y = parseInt(y);

                if (br) extracted.borderRad = br !== 'false';
            }

            // --- Behavior ---
            const behavior = winConfig.querySelector('behavior');
            if (behavior) {
                if (behavior.hasAttribute('draggable')) extracted.draggable = behavior.getAttribute('draggable') === 'true';
                if (behavior.hasAttribute('overlay')) extracted.overlay = behavior.getAttribute('overlay') === 'true';
                if (behavior.hasAttribute('resizable')) extracted.resizable = behavior.getAttribute('resizable') === 'true';

                // [IMPORTANTE] Lectura explícita del atributo always-on-top
                if (behavior.hasAttribute('always-on-top')) {
                    extracted.alwaysOnTop = behavior.getAttribute('always-on-top') === 'true';
                }
            }

            // --- Controls ---
            const controls = winConfig.querySelector('controls');
            if (controls) {
                if (controls.hasAttribute('minimize')) extracted.minimize = controls.getAttribute('minimize') === 'true';
                if (controls.hasAttribute('close')) extracted.close = controls.getAttribute('close') === 'true';
                if (controls.hasAttribute('title')) extracted.showTitle = controls.getAttribute('title') !== 'false';
            }

            const title = winConfig.querySelector('title');
            if (title) extracted.title = title.textContent;

            winConfig.remove();
        } else {
            const t = doc.querySelector('title');
            if (t) extracted.title = t.textContent;
        }

        return { ...defaults, ...extracted, ...configOverride };
    }
}