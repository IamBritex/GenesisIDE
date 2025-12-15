/**
 * source/funkin/ui/editors/utils/window/DefaultWindowsOpened.js
 */
import { ModularWindow } from "./ModularWindow.js"

export default class DefaultWindowsOpened {
    static hasOpened = false
    static instances = []

    static open(scene) {
        const oldContainers = document.querySelectorAll('.modular-window-container');
        oldContainers.forEach(el => el.remove());
        ModularWindow.openPopups = [];

        console.log("[v0] Default windows sequence initiated (Clean start)")
        DefaultWindowsOpened.hasOpened = true
        DefaultWindowsOpened.instances = []

        scene.time.delayedCall(100, () => {
            console.log("[v0] Spawning windows...")

            const gameWidth = scene.scale.width;
            const gameHeight = scene.scale.height;
            const topBarHeight = 38;
            const bottomBarHeight = 45;
            const availableHeight = gameHeight - topBarHeight - bottomBarHeight;

            // 1. TOOLBAR
            const toolBarContent = scene.cache.text.get("toolBarHtml")
            if (toolBarContent) {
                const win = new ModularWindow(scene, toolBarContent)
                win.windowNode.style.left = "0px"
                win.windowNode.style.top = "0px"
                win.windowNode.style.width = `${gameWidth}px`
                win.windowNode.style.height = `${topBarHeight}px`

                win.windowNode.classList.add("docked")
                // Toolbar no ocupa slots laterales, así que dockSide sigue null
                if (win.interaction) win.interaction.toggleMinimizeButton(false)

                const closeBtn = win.windowNode.querySelector('.win-btn[data-action="close"]');
                if (closeBtn) closeBtn.remove();

                DefaultWindowsOpened.instances.push(win);
            }

            // 2. BOTTOM BAR
            const bottomBarContent = scene.cache.text.get("bottomBarHtml");
            if (bottomBarContent) {
                const win = new ModularWindow(scene, bottomBarContent);
                win.windowNode.style.left = "0px";
                win.windowNode.style.top = `${gameHeight - bottomBarHeight}px`;
                win.windowNode.style.width = `${gameWidth}px`;
                win.windowNode.style.height = `${bottomBarHeight}px`;

                win.windowNode.classList.add("docked");
                if (win.interaction) win.interaction.toggleMinimizeButton(false);

                const closeBtn = win.windowNode.querySelector('.win-btn[data-action="close"]');
                if (closeBtn) closeBtn.remove();

                DefaultWindowsOpened.instances.push(win);
            }

            // 3. EXPLORER (Ocupa Izquierda)
            const explorerContent = scene.cache.text.get("explorerHtml")
            if (explorerContent) {
                const win = new ModularWindow(scene, explorerContent)
                DefaultWindowsOpened.instances.push(win);
                win.windowNode.style.left = "0px"
                win.windowNode.style.top = `${topBarHeight}px`
                win.windowNode.style.height = `${availableHeight}px`
                win.windowNode.classList.add("docked")
                if (win.interaction) {
                    win.interaction._onDockStateChange()
                    win.interaction.toggleMinimizeButton(false)
                    win.interaction.state.originalHeight = availableHeight
                    // [NUEVO] Marcamos el territorio
                    win.interaction.state.dockSide = 'left';
                }
            }

            // 4. PROPERTIES (Ocupa Derecha)
            const propertiesContent = scene.cache.text.get("propertiesHtml");
            if (propertiesContent) {
                const win = new ModularWindow(scene, propertiesContent);
                DefaultWindowsOpened.instances.push(win);
                const propWidth = 300;
                win.windowNode.style.left = `${gameWidth - propWidth}px`;
                win.windowNode.style.top = `${topBarHeight}px`;
                win.windowNode.style.width = `${propWidth}px`;
                win.windowNode.style.height = `${availableHeight}px`;
                win.windowNode.classList.add("docked");
                if (win.interaction) {
                    win.interaction._onDockStateChange();
                    win.interaction.toggleMinimizeButton(false);
                    win.interaction.state.originalHeight = availableHeight;
                    win.interaction.state.originalWidth = propWidth;
                    // [NUEVO] Marcamos el territorio
                    win.interaction.state.dockSide = 'right';
                }
            }
        });
    }
}