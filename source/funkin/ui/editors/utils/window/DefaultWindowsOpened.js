import { ModularWindow } from "./ModularWindow.js"

export default class DefaultWindowsOpened {
    static hasOpened = false
    static instances = []

    static open(scene) {
        const oldContainers = document.querySelectorAll('.modular-window-container');
        oldContainers.forEach(el => el.remove());
        ModularWindow.openPopups = [];

        console.log("[v0] Default windows sequence initiated")
        DefaultWindowsOpened.hasOpened = true
        DefaultWindowsOpened.instances = []

        scene.time.delayedCall(50, () => {
            const gameWidth = scene.scale.width;
            const gameHeight = scene.scale.height;

            const topBarHeight = 38;
            const bottomBarHeight = 45;
            const tabBarHeight = 32;
            const availableHeight = gameHeight - topBarHeight - bottomBarHeight;

            let leftOffset = 0;
            let rightOffset = 0;

            // 1. TOOLBAR
            const toolBarContent = scene.cache.text.get("toolBarHtml")
            if (toolBarContent) {
                const win = new ModularWindow(scene, { content: toolBarContent, id: 'tool-bar' });
                win.windowNode.style.left = "0px"; win.windowNode.style.top = "0px";
                win.windowNode.style.width = `${gameWidth}px`; win.windowNode.style.height = `${topBarHeight}px`;
                win.windowNode.classList.add("docked");
                if (win.interaction) win.interaction.toggleMinimizeButton(false);
                const closeBtn = win.windowNode.querySelector('.win-btn[data-action="close"]');
                if (closeBtn) closeBtn.remove();
                DefaultWindowsOpened.instances.push(win);
            }

            // 2. BOTTOM BAR
            const bottomBarContent = scene.cache.text.get("bottomBarHtml");
            if (bottomBarContent) {
                const win = new ModularWindow(scene, { content: bottomBarContent, id: 'bottom-bar' });
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

            // 3. EXPLORER
            const explorerContent = scene.cache.text.get("explorerHtml")
            const explorerWidth = 260;
            if (explorerContent) {
                const win = new ModularWindow(scene, { content: explorerContent, id: 'explorer' });
                DefaultWindowsOpened.instances.push(win);

                win.windowNode.style.left = "0px";
                win.windowNode.style.top = `${topBarHeight}px`;
                win.windowNode.style.width = `${explorerWidth}px`;
                win.windowNode.style.height = `${availableHeight}px`;
                win.windowNode.classList.add("docked");

                if (win.interaction) {
                    win.interaction._onDockStateChange();
                    win.interaction.toggleMinimizeButton(false);
                    win.interaction.state.originalHeight = availableHeight;
                    win.interaction.state.originalWidth = explorerWidth;
                    win.interaction.state.dockSide = 'left';
                }
                leftOffset = explorerWidth;
            }

            // 4. PROPERTIES
            const propertiesContent = scene.cache.text.get("propertiesHtml");
            const propWidth = 300;
            if (propertiesContent) {
                const win = new ModularWindow(scene, { content: propertiesContent, id: 'properties' });
                DefaultWindowsOpened.instances.push(win);

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
                    win.interaction.state.dockSide = 'right';
                }
                rightOffset = propWidth;
            }

            // 5. TAB BAR (Calculado con GAP de 4px)
            const tabBarContent = scene.cache.text.get("tabBarHtml");
            if (tabBarContent) {
                const win = new ModularWindow(scene, { content: tabBarContent, id: 'tab-bar' });
                DefaultWindowsOpened.instances.push(win);

                const GAP = 43; // Margen de seguridad

                let startX = leftOffset;
                if (leftOffset > 0) startX += GAP;

                let endLimit = gameWidth - rightOffset;
                if (rightOffset > 0) endLimit -= GAP;

                const tabWidth = Math.max(0, endLimit - startX);

                win.windowNode.style.left = `${startX}px`;
                win.windowNode.style.top = `${topBarHeight}px`;
                win.windowNode.style.width = `${tabWidth}px`;
                win.windowNode.style.height = `${tabBarHeight}px`;

                win.windowNode.classList.add("docked");
                if (win.interaction) {
                    win.interaction._onDockStateChange();
                    win.interaction.toggleMinimizeButton(false);
                }
            }
        });
    }
}