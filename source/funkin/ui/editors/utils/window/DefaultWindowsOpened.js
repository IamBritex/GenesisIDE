/**
 * source/funkin/ui/editors/utils/window/DefaultWindowsOpened.js
 */
import { ModularWindow } from "./ModularWindow.js"

export default class DefaultWindowsOpened {
    static hasOpened = false
    static instances = []

    static get TOP_BAR_H() { return 38; }
    static get BOTTOM_BAR_H() { return 45; }

    static open(scene) {
        // Limpieza total al iniciar la escena (F5)
        const oldContainers = document.querySelectorAll('.modular-window-container');
        oldContainers.forEach(el => el.remove());
        ModularWindow.openPopups = [];

        console.log("[v0] Default windows sequence initiated")
        DefaultWindowsOpened.hasOpened = true
        DefaultWindowsOpened.instances = []

        scene.time.delayedCall(50, () => {
            this._createToolbar(scene);
            this._createBottomBar(scene);
            this._createExplorer(scene);
            this._createProperties(scene);
            this._createTabBar(scene);
        });
    }

    static toggleWindow(scene, id) {
        // [MODIFICADO] Lógica inteligente de Toggle
        const win = ModularWindow.openPopups.find(w => w.config && w.config.id === id);

        if (win) {
            // Si la ventana existe en memoria...
            if (win.windowNode.style.display === 'none') {
                // Caso A: Estaba oculta (cerrada por el usuario). La mostramos.
                console.log(`[DefaultWindows] Restaurando ventana oculta: ${id}`);
                win.windowNode.style.display = 'flex';
                win.focus(); // Traer al frente
                window.dispatchEvent(new CustomEvent('layout-update'));
            } else {
                // Caso B: Ya es visible. Le damos foco.
                win.focus();
                // Opcional: Si quisieras que el botón actúe como toggle real (abrir/cerrar):
                // win.close(); 
            }
        } else {
            // Caso C: No existe (nunca se creó o fue destruida). La creamos.
            console.log(`[DefaultWindows] Creando nueva ventana: ${id}`);
            if (id === 'explorer') this._createExplorer(scene);
            else if (id === 'properties') this._createProperties(scene);

            window.dispatchEvent(new CustomEvent('layout-update'));
        }
    }

    // --- Métodos de Creación ---

    static _createToolbar(scene) {
        if (this._exists('tool-bar')) return;
        const content = scene.cache.text.get("toolBarHtml");
        if (!content) return;

        const win = new ModularWindow(scene, { content: content, id: 'tool-bar' });
        win.windowNode.style.left = "0px"; win.windowNode.style.top = "0px";
        win.windowNode.style.width = `${scene.scale.width}px`;
        win.windowNode.style.height = `${this.TOP_BAR_H}px`;
        win.windowNode.classList.add("docked");
        if (win.interaction) win.interaction.toggleMinimizeButton(false);
        const closeBtn = win.windowNode.querySelector('.win-btn[data-action="close"]');
        if (closeBtn) closeBtn.remove();
        this.instances.push(win);
    }

    static _createBottomBar(scene) {
        if (this._exists('bottom-bar')) return;
        const content = scene.cache.text.get("bottomBarHtml");
        if (!content) return;
        const topY = scene.scale.height - this.BOTTOM_BAR_H;

        const win = new ModularWindow(scene, { content: content, id: 'bottom-bar' });
        win.windowNode.style.left = "0px";
        win.windowNode.style.top = `${topY}px`;
        win.windowNode.style.width = `${scene.scale.width}px`;
        win.windowNode.style.height = `${this.BOTTOM_BAR_H}px`;
        win.windowNode.classList.add("docked");
        if (win.interaction) win.interaction.toggleMinimizeButton(false);
        const closeBtn = win.windowNode.querySelector('.win-btn[data-action="close"]');
        if (closeBtn) closeBtn.remove();
        this.instances.push(win);
    }

    static _createExplorer(scene) {
        if (this._exists('explorer')) return; // Evitar duplicados
        const content = scene.cache.text.get("explorerHtml");
        if (!content) return;

        const width = 260;
        const height = scene.scale.height - this.TOP_BAR_H - this.BOTTOM_BAR_H;

        const win = new ModularWindow(scene, { content: content, id: 'explorer' });
        win.windowNode.style.left = "0px";
        win.windowNode.style.top = `${this.TOP_BAR_H}px`;
        win.windowNode.style.width = `${width}px`;
        win.windowNode.style.height = `${height}px`;
        win.windowNode.classList.add("docked");

        if (win.interaction) {
            win.interaction._onDockStateChange();
            win.interaction.toggleMinimizeButton(false);
            win.interaction.state.dockSide = 'left';
        }
        this.instances.push(win);
    }

    static _createProperties(scene) {
        if (this._exists('properties')) return;
        const content = scene.cache.text.get("propertiesHtml");
        if (!content) return;

        const width = 300;
        const height = scene.scale.height - this.TOP_BAR_H - this.BOTTOM_BAR_H;
        const leftX = scene.scale.width - width;

        const win = new ModularWindow(scene, { content: content, id: 'properties' });
        win.windowNode.style.left = `${leftX}px`;
        win.windowNode.style.top = `${this.TOP_BAR_H}px`;
        win.windowNode.style.width = `${width}px`;
        win.windowNode.style.height = `${height}px`;
        win.windowNode.classList.add("docked");

        if (win.interaction) {
            win.interaction._onDockStateChange();
            win.interaction.toggleMinimizeButton(false);
            win.interaction.state.dockSide = 'right';
        }
        this.instances.push(win);
    }

    static _createTabBar(scene) {
        if (this._exists('tab-bar')) return;
        const content = scene.cache.text.get("tabBarHtml");
        if (!content) return;

        const win = new ModularWindow(scene, { content: content, id: 'tab-bar' });
        win.windowNode.style.top = `${this.TOP_BAR_H}px`;
        win.windowNode.style.height = "32px";
        win.windowNode.classList.add("docked");

        if (win.interaction) {
            win.interaction._onDockStateChange();
            win.interaction.toggleMinimizeButton(false);
        }
        this.instances.push(win);
        window.dispatchEvent(new CustomEvent('layout-update'));
    }

    static _exists(id) {
        return ModularWindow.openPopups.some(w => w.config && w.config.id === id);
    }
}