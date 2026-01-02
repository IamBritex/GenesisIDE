/**
 * source/funkin/ui/editors/components/UI/layer/StageLayer.js
 */
import { ModularWindow } from '../../../utils/window/ModularWindow.js';

export default class StageLayer {
    constructor(scene) {
        this.scene = scene;
        this.window = null;
        this.listContainer = null;
        this.updatePending = false;
        this.isDragging = false; 

        // Control de carpetas abiertas
        this.expandedGroups = new Set();

        this._onWindowToggle = this._onWindowToggle.bind(this);
        this._updateList = this._updateList.bind(this);

        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('editor-window-toggle', this._onWindowToggle);
        
        this.scene.events.on('element_created', this.requestUpdate, this);
        this.scene.events.on('element_updated', this.requestUpdate, this);
        this.scene.events.on('element_selected', this.requestUpdate, this);
        this.scene.events.on('element_deselected', this.requestUpdate, this);
    }

    _onWindowToggle(e) {
        if (e.detail.id === 'stage-layer') {
            this.toggle();
        }
    }

    toggle() {
        if (this.window) {
            if (this.window.windowNode.style.display === 'none') {
                this.window.focus();
                this.requestUpdate();
            } else {
                this.window.close();
            }
        } else {
            this.open();
        }
    }

    open() {
        const content = this.scene.cache.text.get('stageLayerHtml');
        if (!content) {
            console.error('[StageLayer] HTML not found in cache');
            return;
        }

        this.window = new ModularWindow(this.scene, content);
        this.listContainer = this.window.domElement.node.querySelector('#layer-list-container');
        
        this.requestUpdate();
    }

    requestUpdate() {
        // Bloquear actualizaciones si el usuario está interactuando
        if (this.updatePending || this.isDragging) return;
        this.updatePending = true;
        setTimeout(this._updateList, 50);
    }

    _updateList() {
        this.updatePending = false;
        if (!this.window || !this.listContainer) return;
        if (this.window.windowNode.style.display === 'none') return;

        // Mantener posición del scroll
        const scrollTop = this.listContainer.scrollTop;
        this.listContainer.innerHTML = '';

        // 1. Filtrar elementos válidos
        const elements = this.scene.children.list.filter(child => {
            return child.active && child.getData && (
                child.getData('type') === 'image' || 
                child.getData('type') === 'spritesheet' || 
                child.getData('type') === 'character'
            );
        });

        // 2. Agrupar
        const groups = new Map();
        const orphans = [];

        elements.forEach(el => {
            const config = el.getData('config');
            const groupName = el.getData('group') || (config && config.group);
            
            if (groupName) {
                if (!groups.has(groupName)) groups.set(groupName, []);
                groups.get(groupName).push(el);
            } else {
                orphans.push(el);
            }
        });

        // 3. Preparar lista de renderizado
        const renderList = [];
        orphans.forEach(el => renderList.push({ type: 'item', data: el, depth: el.depth }));
        groups.forEach((children, name) => {
            const maxDepth = Math.max(...children.map(c => c.depth));
            renderList.push({ type: 'group', name: name, children: children, depth: maxDepth });
        });
        
        // Ordenar visualmente (Mayor Depth arriba)
        renderList.sort((a, b) => b.depth - a.depth);

        if (renderList.length === 0) {
            this.listContainer.innerHTML = '<div style="padding:10px; color:#666; font-size:11px; text-align:center;">Lista vacía</div>';
            return;
        }

        // 4. Construir DOM
        renderList.forEach(item => {
            if (item.type === 'item') {
                this.listContainer.appendChild(this._createLayerCard(item.data));
            } else {
                this.listContainer.appendChild(this._createFolder(item.name, item.children));
            }
        });

        // Restaurar scroll e iniciar sistema de arrastre
        this.listContainer.scrollTop = scrollTop;
        this._initSortable();
    }

    _createFolder(name, children) {
        const isOpen = this.expandedGroups.has(name);
        const folderContainer = document.createElement('div');
        folderContainer.className = 'sortable-container';
        folderContainer.style.display = 'flex';
        folderContainer.style.flexDirection = 'column';
        folderContainer.style.gap = '2px';
        folderContainer.style.marginBottom = '2px';

        const header = document.createElement('div');
        header.className = 'layer-card layer-folder-header'; 
        header.style.backgroundColor = '#252526'; 
        header.isFolderHeader = true; 

        const arrow = document.createElement('span');
        arrow.className = 'material-icons';
        arrow.style.fontSize = '16px';
        arrow.style.color = '#888';
        arrow.style.marginRight = '4px';
        arrow.innerText = isOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right';

        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.style.fontSize = '18px';
        icon.style.color = 'var(--text-muted, #aaa)'; 
        icon.style.marginRight = '8px';
        icon.innerText = isOpen ? 'folder_open' : 'folder';

        const title = document.createElement('div');
        title.className = 'layer-name';
        title.style.flex = '1';
        title.innerText = name;

        const meta = document.createElement('div');
        meta.className = 'layer-meta';
        meta.innerText = `(${children.length})`;

        header.appendChild(arrow);
        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(meta);

        header.onmousedown = (e) => {
             if (e.target === arrow) e.stopPropagation();
        };
        header.onclick = (e) => {
             if (header.hasMoved) return; 
            if (this.expandedGroups.has(name)) this.expandedGroups.delete(name);
            else this.expandedGroups.add(name);
            this.requestUpdate(); 
        };

        folderContainer.appendChild(header);

        if (isOpen) {
            const content = document.createElement('div');
            content.className = 'folder-content sortable-list'; 
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.gap = '2px';
            content.style.paddingLeft = '14px'; 
            content.style.minHeight = '10px'; 

            children.sort((a, b) => b.depth - a.depth);
            children.forEach(child => {
                content.appendChild(this._createLayerCard(child));
            });
            folderContainer.appendChild(content);
        }

        return folderContainer;
    }

    _createLayerCard(el) {
        const type = el.getData('type');
        let name = el.getData('namePath') || el.getData('characterName') || `Layer ${el.depth}`;

        const card = document.createElement('div');
        card.className = 'layer-card layer-item';
        card.phaserElement = el; 

        let iconName = 'layers';
        if (type === 'image') iconName = 'image';
        else if (type === 'spritesheet') iconName = 'movie';
        else if (type === 'character') iconName = 'person';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'layer-icon';
        iconDiv.innerHTML = `<span class="material-icons">${iconName}</span>`;

        const info = document.createElement('div');
        info.className = 'layer-info';
        info.style.pointerEvents = 'none'; 

        const title = document.createElement('div');
        title.className = 'layer-name';
        title.innerText = name;

        const meta = document.createElement('div');
        meta.className = 'layer-meta';
        meta.innerText = `Layer: ${el.depth}`;

        info.appendChild(title);
        info.appendChild(meta);

        const eye = document.createElement('div');
        eye.className = 'layer-visibility';
        eye.innerHTML = `<span class="material-icons">${el.visible ? 'visibility' : 'visibility_off'}</span>`;
        eye.onmousedown = (e) => e.stopPropagation(); 
        eye.onclick = (e) => {
            e.stopPropagation();
            el.setVisible(!el.visible);
            eye.innerHTML = `<span class="material-icons">${el.visible ? 'visibility' : 'visibility_off'}</span>`;
        };

        card.appendChild(iconDiv);
        card.appendChild(info);
        card.appendChild(eye);

        card.onclick = () => {
             if (card.hasMoved) return; 
             this.scene.events.emit('ui_element_selected', el);
        };

        return card;
    }

    // --- LÓGICA DE ARRASTRE PROFESIONAL ---
    _initSortable() {
        if (!window.Draggable) return;

        const sortables = [
            this.listContainer, 
            ...this.listContainer.querySelectorAll('.folder-content')
        ];

        const self = this;
        let placeholder = null;

        sortables.forEach(container => {
            Draggable.create(container.children, {
                type: "y", // Solo movimiento vertical
                edgeResistance: 0.65,
                lockAxis: true,
                autoScroll: 1, // Scroll automático al acercarse a los bordes
                
                onPress: function() {
                    self.isDragging = true;
                    this.target.hasMoved = false;
                    // Clase para desactivar transiciones CSS y evitar conflictos
                    this.target.classList.add('dragging');
                },

                onDragStart: function() {
                    const target = this.target;
                    const rect = target.getBoundingClientRect();
                    
                    // 1. Crear el PLACEHOLDER (el hueco visual)
                    placeholder = document.createElement('div');
                    placeholder.className = 'layer-placeholder';
                    placeholder.style.height = rect.height + 'px';
                    
                    // 2. Insertarlo temporalmente donde estaba el ítem
                    target.parentNode.insertBefore(placeholder, target);

                    // 3. Convertir el ítem en "Fixed" para flotar libremente
                    // Usar GSAP Set para máxima precisión
                    gsap.set(target, {
                        position: 'fixed',
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        zIndex: 100000,
                        margin: 0
                    });
                    
                    // Reiniciar el Draggable para que entienda las nuevas coordenadas fixed
                    this.update(true);
                },

                onDrag: function() {
                    this.target.hasMoved = true;
                    
                    // Buscar dónde insertar el placeholder basado en el mouse
                    const siblings = Array.from(container.children).filter(c => c !== this.target && c !== placeholder);
                    const pointerY = this.pointerY;
                    
                    let inserted = false;

                    for (let sibling of siblings) {
                        const box = sibling.getBoundingClientRect();
                        const center = box.top + (box.height / 2);
                        
                        // Si el mouse está ARRIBA del centro de este elemento
                        if (pointerY < center) {
                            if (sibling.previousElementSibling !== placeholder) {
                                container.insertBefore(placeholder, sibling);
                            }
                            inserted = true;
                            break;
                        }
                    }
                    
                    // Si no se insertó antes de nadie, va al final
                    if (!inserted) {
                        container.appendChild(placeholder);
                    }
                },

                onDragEnd: function() {
                    const dragItem = this.target;
                    
                    // Si por alguna razón el placeholder desapareció, restaurar al inicio
                    if (!placeholder || !placeholder.parentNode) {
                        gsap.set(dragItem, { position: 'relative', top: 'auto', left: 'auto', width: 'auto', zIndex: 'auto' });
                        dragItem.classList.remove('dragging');
                        self.isDragging = false;
                        self.requestUpdate();
                        return;
                    }

                    const destRect = placeholder.getBoundingClientRect();
                    
                    // Animación suave de "aterrizaje" hacia el hueco
                    gsap.to(dragItem, {
                        top: destRect.top,
                        left: destRect.left,
                        duration: 0.15,
                        ease: "power2.out",
                        onComplete: () => {
                            // 1. Reemplazar el placeholder con el ítem real
                            if (placeholder && placeholder.parentNode) {
                                placeholder.parentNode.insertBefore(dragItem, placeholder);
                                placeholder.remove();
                                placeholder = null;
                            }
                            
                            // 2. Limpiar estilos fixed y clases
                            gsap.set(dragItem, {
                                position: 'relative',
                                top: 'auto',
                                left: 'auto',
                                width: 'auto',
                                x: 0,
                                y: 0,
                                zIndex: 'auto',
                                margin: ''
                            });
                            dragItem.classList.remove('dragging');

                            // 3. Recalcular depths en Phaser
                            self.recalculateDepths();
                        }
                    });
                }
            });
        });
    }

    recalculateDepths() {
        this.isDragging = false;
        
        const allItems = [];
        
        // Recorrer el DOM tal cual quedó ordenado
        const traverse = (container) => {
            Array.from(container.children).forEach(child => {
                if (child.phaserElement) {
                    allItems.push(child.phaserElement);
                } 
                else if (child.classList.contains('sortable-container')) {
                    const content = child.querySelector('.folder-content');
                    if (content) traverse(content);
                }
            });
        };
        
        if (this.listContainer) traverse(this.listContainer);

        // Asignar depths decrecientes
        // Usamos una base alta pero relativa a la cantidad de items
        let currentDepth = allItems.length + 50; 
        
        allItems.forEach(el => {
            if (el && el.active) {
                el.setDepth(currentDepth);
                currentDepth--;
            }
        });
        
        console.log(`[StageLayer] Orden actualizado. ${allItems.length} elementos reordenados.`);
        
        // Forzar refresco para ver los nuevos números
        this.updatePending = false;
        this._updateList(); 
    }

    destroy() {
        window.removeEventListener('editor-window-toggle', this._onWindowToggle);
        this.scene.events.off('element_created', this.requestUpdate, this);
        this.scene.events.off('element_updated', this.requestUpdate, this);
        this.scene.events.off('element_selected', this.requestUpdate, this);
        this.scene.events.off('element_deselected', this.requestUpdate, this);
        if (this.window) {
            this.window.close();
            this.window = null;
        }
    }
}
