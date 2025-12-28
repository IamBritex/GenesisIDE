/**
 * source/funkin/ui/editors/components/UI/tabBar/tabbar.js
 */
export default class TabBar {
    constructor(scene) {
        this.scene = scene;
        this.tabs = [];
        this.activeTabId = null;

        this.container = document.getElementById('tabContainer');
        if (this.container) this.container.innerHTML = '';

        this._bindEvents();
        this._createDefaultTab();
    }

    _bindEvents() {
        this.onStageSelectedHandler = (e) => this._handleExplorerSelection(e);
        window.addEventListener('editor-stage-selected', this.onStageSelectedHandler);

        // [PERSISTENCIA] Escuchar datos actualizados
        this.onUpdateTabDataHandler = (e) => {
            const { id, data } = e.detail;
            const tab = this.tabs.find(t => t.id === id);
            if (tab) {
                // Actualizamos la referencia en memoria
                tab.data = data;
                console.log(`[TabBar] Datos guardados en memoria para: ${tab.title}`);
            }
        };
        window.addEventListener('editor-update-tab-data', this.onUpdateTabDataHandler);
    }

    _createDefaultTab() {
        this._createTab('stage_untitled', 'Stage Editor', null, 'Untitled');
    }

    _handleExplorerSelection(event) {
        const { stageData, path } = event.detail;
        if (!path) return;
        const tabId = path;

        const untitledTab = this.tabs.find(t => t.id === 'stage_untitled');
        if (untitledTab) this.closeTab('stage_untitled');

        const existingTab = this.tabs.find(t => t.id === tabId);
        if (existingTab) this.setActiveTab(tabId);
        else this._createTab(tabId, path, stageData);
    }

    _createTab(id, path, data, customTitle = null) {
        let fileName = customTitle || path.split('/').pop().replace('.json', '');

        // Aseguramos clonación profunda inicial para evitar referencias cruzadas
        const safeData = data ? JSON.parse(JSON.stringify(data)) : null;

        const tabData = { id, path, title: fileName, data: safeData };
        this.tabs.push(tabData);

        const tabEl = document.createElement('div');
        tabEl.className = 'tab-item';
        tabEl.dataset.id = id;
        tabEl.title = path || 'New Stage';
        tabEl.onclick = () => this.setActiveTab(id);

        tabEl.innerHTML = `
            <span class="material-icons tab-icon">grid_on</span>
            <span class="tab-label">${fileName}</span>
            <span class="tab-close material-icons">close</span>
        `;

        tabEl.querySelector('.tab-close').onclick = (e) => {
            e.stopPropagation();
            this.closeTab(id);
        };

        this.container.appendChild(tabEl);
        this.setActiveTab(id);
    }

    setActiveTab(id) {
        if (this.activeTabId === id) return;

        // [PASO 1] Antes de cambiar, forzar guardado de la pestaña actual
        if (this.activeTabId) {
            window.dispatchEvent(new CustomEvent('editor-save-request', {
                detail: { tabId: this.activeTabId }
            }));
            // Como dispatchEvent es síncrono para listeners en el mismo hilo,
            // 'tab.data' se actualizará AQUÍ MISMO antes de continuar.
        }

        // [PASO 2] Cambiar ID activo
        this.activeTabId = id;

        // [PASO 3] Actualizar UI
        this.container.querySelectorAll('.tab-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === id);
        });

        // [PASO 4] Cargar datos frescos de la nueva pestaña
        const tabInfo = this.tabs.find(t => t.id === id);
        if (tabInfo) {
            window.dispatchEvent(new CustomEvent('editor-tab-switched', {
                detail: {
                    stageData: tabInfo.data, // Enviamos data (que debería estar actualizada si volvemos)
                    path: tabInfo.path,
                    fileName: tabInfo.title,
                    tabId: tabInfo.id // IMPORTANTE: Enviamos el ID
                }
            }));
        }
    }

    closeTab(id) {
        const tabIndex = this.tabs.findIndex(t => t.id === id);
        if (tabIndex === -1) return;

        const domTab = this.container.querySelector(`.tab-item[data-id="${id}"]`);
        if (domTab) domTab.remove();

        this.tabs.splice(tabIndex, 1);

        if (this.activeTabId === id) {
            this.activeTabId = null;
            if (this.tabs.length > 0) {
                const nextTab = this.tabs[Math.min(tabIndex, this.tabs.length - 1)];
                this.setActiveTab(nextTab.id);
            } else {
                window.dispatchEvent(new CustomEvent('editor-all-tabs-closed'));
                if (id !== 'stage_untitled') this._createDefaultTab();
            }
        }
    }

    destroy() {
        window.removeEventListener('editor-stage-selected', this.onStageSelectedHandler);
        window.removeEventListener('editor-update-tab-data', this.onUpdateTabDataHandler);
        this.tabs = [];
        if (this.container) this.container.innerHTML = '';
    }
}