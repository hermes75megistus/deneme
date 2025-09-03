// js/drawing.js - DÜZELTİLMİŞ VERSİYON - CURSOR VE POINTER EVENTS FİX

// ===== TEMEL ÇİZİM SİSTEMİ =====
class DrawingProgram {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.currentThickness = 3;
        this.startX = 0;
        this.startY = 0;
        
        // History for undo/redo
        this.history = [];
        this.historyStep = -1;
        this.maxHistorySteps = 50;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.updateCanvasCursor();
        this.saveState();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    updateCanvasCursor() {
        this.canvas.className = this.canvas.className.replace(/\b\w+-cursor\b/g, '');
        this.canvas.classList.add(`${this.currentTool}-cursor`);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;

        if (['pen', 'brush', 'eraser'].includes(this.currentTool)) {
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else {
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);
        this.ctx.lineWidth = this.currentThickness;
        this.ctx.strokeStyle = this.currentColor;

        if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }

        switch (this.currentTool) {
            case 'pen':
            case 'brush':
            case 'eraser':
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;

            case 'line':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                break;

            case 'dashed-line':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.ctx.setLineDash([10, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                break;

            case 'rectangle':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.ctx.beginPath();
                this.ctx.rect(this.startX, this.startY, pos.x - this.startX, pos.y - this.startY);
                this.ctx.stroke();
                break;

            case 'circle':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                const dx = pos.x - this.startX;
                const dy = pos.y - this.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const radius = distance / 2;
                
                const centerX = (this.startX + pos.x) / 2;
                const centerY = (this.startY + pos.y) / 2;
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;

            case 'vector':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.drawVector(this.startX, this.startY, pos.x, pos.y);
                break;

            case 'force':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.drawForce(this.startX, this.startY, pos.x, pos.y);
                break;

            case 'double-arrow':
                this.ctx.putImageData(this.imageData, 0, 0);
                this.redrawHelpers();
                this.drawDoubleArrow(this.startX, this.startY, pos.x, pos.y);
                break;
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
            this.saveState();
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        this.updateToolButtons();
        this.updateCanvasCursor();
    }

    updateToolButtons() {
        document.querySelectorAll('.tool-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeTool = document.querySelector(`.tool-item[data-tool="${this.currentTool}"]`);
        if (activeTool) {
            activeTool.classList.add('active');
        }
    }

    changeColor(color) {
        this.currentColor = color;
        this.updateColorPicker();
    }

    setQuickColor(color) {
        this.currentColor = color;
        this.updateColorPicker();
    }

    updateColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.value = this.currentColor;
        }
    }

    changeThickness(thickness) {
        this.currentThickness = thickness;
        const thicknessValue = document.getElementById('thicknessValue');
        if (thicknessValue) {
            thicknessValue.textContent = thickness + 'px';
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.redrawHelpers();
        this.saveState();
    }

    // History Management
    saveState() {
        this.historyStep++;
        if (this.historyStep < this.history.length) {
            this.history.length = this.historyStep;
        }
        
        this.history.push(this.canvas.toDataURL());
        
        if (this.history.length > this.maxHistorySteps) {
            this.history.shift();
            this.historyStep--;
        }
        
        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyStep > 0) {
            this.historyStep--;
            this.restoreState();
        }
    }

    redo() {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            this.restoreState();
        }
    }

    restoreState() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
            this.redrawHelpers();
        };
        img.src = this.history[this.historyStep];
        this.updateHistoryButtons();
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = this.historyStep <= 0;
        }
        
        if (redoBtn) {
            redoBtn.disabled = this.historyStep >= this.history.length - 1;
        }
    }

    redrawHelpers() {
        // Grid ve koordinat sistemi için
    }
}

// ===== GELİŞMİŞ ÇİZİM SİSTEMİ =====
class EnhancedDrawingProgram extends DrawingProgram {
    constructor(canvas) {
        super(canvas);
        this.gridVisible = false;
        this.coordsVisible = false;
        this.gridSize = 20;
        this.createLeftPanel();
        this.setupAdvancedFeatures();
    }

    createLeftPanel() {
        const overlay = document.querySelector('.drawing-overlay');
        if (!overlay) return;

        const leftPanel = document.createElement('div');
        leftPanel.className = 'left-panel';
        leftPanel.innerHTML = `
            <div class="panel-header">
                <h2>🎨 Çizim Araçları</h2>
                <p>Fizik Eğitimi</p>
            </div>

            <div class="tools-container">
                <div class="tool-section">
                    <div class="section-title">📝 Temel Araçlar</div>
                    
                    <div class="tool-item active" data-tool="pen" data-number="1">
                        <div class="tool-number">1</div>
                        <div class="tool-icon">✏️</div>
                        <div class="tool-name">Kalem</div>
                    </div>
                    
                    <div class="tool-item" data-tool="brush" data-number="2">
                        <div class="tool-number">2</div>
                        <div class="tool-icon">🖌️</div>
                        <div class="tool-name">Fırça</div>
                    </div>
                    
                    <div class="tool-item" data-tool="eraser" data-number="3">
                        <div class="tool-number">3</div>
                        <div class="tool-icon">🧽</div>
                        <div class="tool-name">Silgi</div>
                    </div>
                </div>

                <div class="tool-section">
                    <div class="section-title">📐 Şekiller</div>
                    
                    <div class="tool-item" data-tool="line" data-number="4">
                        <div class="tool-number">4</div>
                        <div class="tool-icon">📏</div>
                        <div class="tool-name">Düz Çizgi</div>
                    </div>
                    
                    <div class="tool-item" data-tool="dashed-line" data-number="5">
                        <div class="tool-number">5</div>
                        <div class="tool-icon">┅</div>
                        <div class="tool-name">Kesikli Çizgi</div>
                    </div>
                    
                    <div class="tool-item" data-tool="rectangle" data-number="6">
                        <div class="tool-number">6</div>
                        <div class="tool-icon">▭</div>
                        <div class="tool-name">Dikdörtgen</div>
                    </div>
                    
                    <div class="tool-item" data-tool="circle" data-number="7">
                        <div class="tool-number">7</div>
                        <div class="tool-icon">⭕</div>
                        <div class="tool-name">Daire</div>
                    </div>
                </div>

                <div class="tool-section">
                    <div class="section-title">⚡ Fizik</div>
                    
                    <div class="tool-item" data-tool="vector" data-number="8">
                        <div class="tool-number">8</div>
                        <div class="tool-icon">🎯</div>
                        <div class="tool-name">Vektör</div>
                    </div>
                    
                    <div class="tool-item" data-tool="force" data-number="9">
                        <div class="tool-number">9</div>
                        <div class="tool-icon">⚡</div>
                        <div class="tool-name">Kuvvet</div>
                    </div>
                    
                    <div class="tool-item" data-tool="double-arrow" data-number="0">
                        <div class="tool-number">0</div>
                        <div class="tool-icon">↔️</div>
                        <div class="tool-name">Ölçü Oku</div>
                    </div>
                </div>

                <div class="tool-section">
                    <div class="section-title">🔧 Yardımcı</div>
                    
                    <div class="tool-item" data-tool="grid" data-number="g">
                        <div class="tool-number">G</div>
                        <div class="tool-icon">📊</div>
                        <div class="tool-name">Grid</div>
                    </div>
                    
                    <div class="tool-item" data-tool="coords" data-number="c">
                        <div class="tool-number">C</div>
                        <div class="tool-icon">⊞</div>
                        <div class="tool-name">Koordinat</div>
                    </div>
                </div>
            </div>

            <div class="controls-section">
                <div class="control-group">
                    <div class="control-label">🖼️ Çizim Modu</div>
                    <div class="canvas-mode-toggle">
                        <div class="mode-checkbox" data-mode="overlay">
                            <input type="checkbox" id="overlayMode">
                            <label for="overlayMode">Slide Üzerinde Çiz</label>
                            <span class="mode-shortcut">Space</span>
                        </div>
                    </div>
                </div>

                <div class="control-group">
                    <div class="control-label">🎨 Renk</div>
                    <input type="color" class="color-picker" id="colorPicker" value="#000000">
                    <div class="color-shortcuts">
                        <div class="color-shortcut-info">Hızlı Renkler: Q-Siyah, W-Kırmızı, E-Mavi, R-Yeşil, T-Sarı, Y-Turuncu, U-Mor</div>
                    </div>
                </div>

                <div class="control-group">
                    <div class="control-label">📏 Kalınlık</div>
                    <input type="range" class="thickness-slider" id="thicknessSlider" min="1" max="20" value="3">
                    <div class="thickness-value" id="thicknessValue">3px</div>
                </div>

                <div class="control-group">
                    <div class="control-label">↶ Geri Al / İleri Al</div>
                    <div class="history-controls">
                        <button class="history-btn" id="undoBtn" disabled>
                            ↶ Geri (Ctrl+Z)
                        </button>
                        <button class="history-btn" id="redoBtn" disabled>
                            ↷ İleri (Ctrl+Y)
                        </button>
                    </div>
                </div>

                <button class="clear-button" id="clearButton">
                    🗑️ Temizle (Ctrl+Shift+C)
                </button>
            </div>
        `;

        overlay.insertBefore(leftPanel, overlay.firstChild);
    }

    setupAdvancedFeatures() {
        this.setupToolSelection();
        this.setupControls();
        this.setupOverlayMode();
        this.setupKeyboardShortcuts();
    }

    setupOverlayMode() {
        const overlayCheckbox = document.getElementById('overlayMode');
        if (overlayCheckbox) {
            overlayCheckbox.addEventListener('change', (e) => {
                this.toggleOverlayMode(e.target.checked);
            });
        }
    }

    toggleOverlayMode(enabled = null) {
        const overlayCheckbox = document.getElementById('overlayMode');
        const overlay = document.querySelector('.drawing-overlay');
        
        if (enabled === null) {
            enabled = !overlayCheckbox.checked;
            overlayCheckbox.checked = enabled;
        }
        
        if (enabled) {
            overlay.classList.add('overlay-mode');
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.zIndex = '199';
            this.canvas.style.background = 'transparent';
            this.resizeCanvas();
        } else {
            overlay.classList.remove('overlay-mode');
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = 'auto';
            this.canvas.style.background = 'white';
            this.resizeCanvas();
        }
        
        const checkboxContainer = overlayCheckbox.closest('.mode-checkbox');
        if (checkboxContainer) {
            checkboxContainer.classList.toggle('active', enabled);
        }
    }

    setupToolSelection() {
        document.querySelectorAll('.tool-item').forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.dataset.tool;
                if (tool === 'grid') {
                    this.toggleGrid();
                } else if (tool === 'coords') {
                    this.toggleCoords();
                } else {
                    this.setTool(tool);
                }
            });
        });
    }

    setupControls() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                this.changeColor(e.target.value);
            });
        }

        const thicknessSlider = document.getElementById('thicknessSlider');
        if (thicknessSlider) {
            thicknessSlider.addEventListener('input', (e) => {
                this.changeThickness(parseInt(e.target.value));
            });
        }

        const clearButton = document.getElementById('clearButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clear();
            });
        }

        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }

        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const toolItems = document.querySelectorAll('.tool-item[data-number]');
                const targetTool = Array.from(toolItems).find(item => 
                    item.dataset.number === e.key
                );
                if (targetTool) {
                    const tool = targetTool.dataset.tool;
                    this.setTool(tool);
                }
            }
            else if (e.key === '0') {
                e.preventDefault();
                const targetTool = document.querySelector('.tool-item[data-number="0"]');
                if (targetTool) {
                    this.setTool(targetTool.dataset.tool);
                }
            }
            else if (e.key.toLowerCase() === 'g' && !e.ctrlKey) {
                e.preventDefault();
                this.toggleGrid();
            }
            else if (e.key.toLowerCase() === 'c' && !e.ctrlKey) {
                e.preventDefault();
                this.toggleCoords();
            }
            else if (e.key === 'Tab') {
                e.preventDefault();
                drawingManager.togglePanel();
            }
           else if (e.ctrlKey && e.key === ' ' && drawingManager.isActive) {
                    e.preventDefault();
                      this.toggleOverlayMode();
        }
            else if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            else if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
                e.preventDefault();
                this.redo();
            }
            else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                this.clear();
            }
            else if (e.key.toLowerCase() === 'q' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#000000');
            }
            else if (e.key.toLowerCase() === 'w' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#FF0000');
            }
            else if (e.key.toLowerCase() === 'e' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#0000FF');
            }
            else if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#00FF00');
            }
            else if (e.key.toLowerCase() === 't' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#FFFF00');
            }
            else if (e.key.toLowerCase() === 'y' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#FF8000');
            }
            else if (e.key.toLowerCase() === 'u' && !e.ctrlKey) {
                e.preventDefault();
                this.setQuickColor('#800080');
            }
            else if (e.key === 'Delete') {
                e.preventDefault();
                this.clear();
            }
            else if (e.key === 'Escape') {
                e.preventDefault();
                drawingManager.toggle();
            }
        });
    }

    // Fizik araçları çizim fonksiyonları
    drawVector(x1, y1, x2, y2) {
        const headLength = Math.max(this.currentThickness * 4, 20);
        
        this.ctx.lineWidth = this.currentThickness + 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI/6), y2 - headLength * Math.sin(angle - Math.PI/6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI/6), y2 - headLength * Math.sin(angle + Math.PI/6));
        this.ctx.stroke();
    }

    drawForce(x1, y1, x2, y2) {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = this.currentThickness + 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        const headLength = Math.max(this.currentThickness * 5, 25);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI/5), y2 - headLength * Math.sin(angle - Math.PI/5));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI/5), y2 - headLength * Math.sin(angle + Math.PI/5));
        this.ctx.stroke();
    }

    drawDoubleArrow(x1, y1, x2, y2) {
        const headLength = Math.max(this.currentThickness * 4, 20);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x1 + headLength * Math.cos(angle + Math.PI/6), 
                       y1 + headLength * Math.sin(angle + Math.PI/6));
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x1 + headLength * Math.cos(angle - Math.PI/6), 
                       y1 + headLength * Math.sin(angle - Math.PI/6));
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI/6), 
                       y2 - headLength * Math.sin(angle - Math.PI/6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI/6), 
                       y2 - headLength * Math.sin(angle + Math.PI/6));
        this.ctx.stroke();
    }

    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        this.redrawCanvas();
        
        const gridTool = document.querySelector('.tool-item[data-tool="grid"]');
        if (gridTool) {
            gridTool.classList.toggle('active', this.gridVisible);
        }
    }

    toggleCoords() {
        this.coordsVisible = !this.coordsVisible;
        this.redrawCanvas();
        
        const coordTool = document.querySelector('.tool-item[data-tool="coords"]');
        if (coordTool) {
            coordTool.classList.toggle('active', this.coordsVisible);
        }
    }

    drawGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);

        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawCoordinateSystem() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(52, 73, 94, 0.8)';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.canvas.width, centerY);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.canvas.height);
        this.ctx.stroke();

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('x', this.canvas.width - 20, centerY + 20);
        this.ctx.fillText('y', centerX + 10, 20);
        this.ctx.fillText('O', centerX + 10, centerY + 20);

        this.ctx.restore();
    }

    redrawHelpers() {
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        if (this.coordsVisible) {
            this.drawCoordinateSystem();
        }
    }

    redrawCanvas() {
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        if (this.coordsVisible) {
            this.drawCoordinateSystem();
        }
    }

    clear() {
        super.clear();
        
        if (this.gridVisible) {
            this.drawGrid();
        }
        
        if (this.coordsVisible) {
            this.drawCoordinateSystem();
        }
    }
}

// ===== DÜZELTİLMİŞ DRAWING MANAGER =====
class DrawingManager {
    constructor() {
        this.drawingProgram = null;
        this.isActive = false;
        this.panelOpen = true;
    }

    initializeDrawingProgram() {
        const canvas = document.getElementById('drawingCanvas');
        if (canvas) {
            this.drawingProgram = new EnhancedDrawingProgram(canvas);
        }
    }

    toggle() {
        const overlay = document.getElementById('drawingOverlay');
        const canvas = document.getElementById('drawingCanvas');
        
        if (!overlay || !canvas) {
            console.error('Drawing overlay or canvas not found!');
            return;
        }
        
        if (overlay.classList.contains('active')) {
            // KAPAMA İŞLEMİ
            overlay.classList.remove('active');
            this.isActive = false;
            this.panelOpen = false;
            
            canvas.style.pointerEvents = 'none';
            canvas.style.cursor = 'default';
            canvas.className = canvas.className.replace(/\b\w+-cursor\b/g, '');
            
            console.log('❌ Çizim programı kapatıldı');
        } else {
            // AÇMA İŞLEMİ
            overlay.classList.add('active');
            this.isActive = true;
            this.panelOpen = true;
            
            if (!this.drawingProgram) {
                this.initializeDrawingProgram();
                
                setTimeout(() => {
                    if (this.drawingProgram && typeof this.drawingProgram.toggleOverlayMode === 'function') {
                        this.drawingProgram.toggleOverlayMode(true);
                        
                        canvas.style.pointerEvents = 'auto';
                        canvas.style.cursor = 'crosshair';
                        
                        console.log('🎨 Çizim programı açıldı - Overlay mode aktif');
                    }
                }, 100);
            } else {
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'crosshair';
            }
            
            console.log('🎨 Çizim programı açıldı');
        }

        this.updateSlidePosition();
        this.updateToggleButton();
    }

    updateSlidePosition() {
        const slideContainer = document.querySelector('.slide-container');
        if (!slideContainer) return;

        const isDrawingActive = this.isActive && this.panelOpen;

        slideContainer.classList.remove('drawing-active');

        if (isDrawingActive) {
            slideContainer.classList.add('drawing-active');
        }

        console.log(`📊 Slide pozisyonu güncellendi - Çizim: ${isDrawingActive}`);
    }

    togglePanel() {
        if (!this.isActive) {
            this.toggle();
            return;
        }

        const panel = document.querySelector('.left-panel');
        const canvas = document.getElementById('drawingCanvas');
        
        if (panel && canvas) {
            this.panelOpen = !this.panelOpen;
            if (this.panelOpen) {
                panel.style.transform = 'translateX(0)';
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'crosshair';
            } else {
                panel.style.transform = 'translateX(-100%)';
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'crosshair';
            }
        }

        this.updateSlidePosition();
        this.updateToggleButton();
    }

    updateToggleButton() {
        // Toggle butonu kaldırıldı ama method uyumluluk için bırakıldı
    }
}

// Global değişken
let drawingManager;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    drawingManager = new DrawingManager();
});

// Keyboard shortcuts (global)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        drawingManager.toggle();
    }
});