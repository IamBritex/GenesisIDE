/**
 * source/funkin/ui/editors/utils/window/WindowConfigParser.js
 */
export default class WindowConfigParser {
    static parse(doc, configOverride = {}) {
        const defaults = { 
            width: 400, height: 'auto', 
            x: null, y: null, // Nuevos campos de posición
            draggable: true, overlay: false, 
            minimize: true, close: true, 
            title: 'Ventana',
            id: null // Para guardar preferencias
        };

        let extracted = {};
        const winConfig = doc.querySelector('window-config');

        if (winConfig) {
            // ID único para recordar posición (opcional, fallback al title)
            if (winConfig.hasAttribute('id')) extracted.id = winConfig.getAttribute('id');

            // --- Layout ---
            const layout = winConfig.querySelector('layout');
            if (layout) {
                const w = layout.getAttribute('width');
                const h = layout.getAttribute('height');
                const x = layout.getAttribute('x');
                const y = layout.getAttribute('y');

                if (w) extracted.width = w === 'auto' ? 'auto' : parseInt(w);
                if (h) extracted.height = h === 'auto' ? 'auto' : parseInt(h);
                if (x) extracted.x = parseInt(x);
                if (y) extracted.y = parseInt(y);
            }

            // --- Behavior ---
            const behavior = winConfig.querySelector('behavior');
            if (behavior) {
                if (behavior.hasAttribute('draggable')) extracted.draggable = behavior.getAttribute('draggable') === 'true';
                if (behavior.hasAttribute('overlay')) extracted.overlay = behavior.getAttribute('overlay') === 'true';
            }

            // --- Controls ---
            const controls = winConfig.querySelector('controls');
            if (controls) {
                if (controls.hasAttribute('minimize')) extracted.minimize = controls.getAttribute('minimize') === 'true';
                if (controls.hasAttribute('close')) extracted.close = controls.getAttribute('close') === 'true';
            }

            // --- Title ---
            const title = winConfig.querySelector('title');
            if (title) extracted.title = title.textContent;

            winConfig.remove(); 
        } else {
            // --- Legacy Meta Tags ---
            const getMeta = (n) => doc.querySelector(`meta[name="${n}"]`)?.getAttribute('content');
            const metaWin = getMeta('window');
            
            if (metaWin) {
                metaWin.split(',').forEach(p => {
                    const [k, v] = p.split('=').map(s => s.trim());
                    if (['draggable','overlay','minimize','close'].includes(k)) extracted[k] = (v === 'true');
                    if (['x', 'y'].includes(k)) extracted[k] = parseInt(v); // Soporte legacy pos
                    if (k === 'title') extracted.title = v;
                });
            }
            const t = doc.querySelector('title');
            if (t && !extracted.title) extracted.title = t.textContent;
        }

        return { ...defaults, ...extracted, ...configOverride };
    }
}