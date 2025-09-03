// js/prompter.js - Enhanced Prompter Modülü + OTOMATİK KART SYNC DESTEĞI

class PrompterSystem {
    constructor() {
        this.isScrolling = false;
        this.scrollSpeed = 1;
        this.animationId = null;
        this.currentPosition = window.innerWidth - 600;
        this.defaultText = "Prompter metni yükleniyor... Slide geçişi yaparak konuşma metnini görün.";
        
        // 🆕 YENİ: Sync sistemi için
        this.syncEnabled = true;
        this.lastSyncPosition = -1;
        this.syncEventThrottle = 100; // ms
        this.lastSyncEvent = 0;
        this.currentTextLength = 0;
        
        this.init();
    }

    init() {
        this.createPrompterHTML();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupSlideChangeListener();
        console.log('📖 Enhanced Prompter sistemi yüklendi (Sync desteği ile)');
    }

    createPrompterHTML() {
        // CSS Styles - İNCE STİL VERSİYONU + SYNC İNDİKATÖRÜ
        const styles = `
            .prompter-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 30px;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                z-index: 9999;
                box-shadow: 0 1px 8px rgba(0,0,0,0.3);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .prompter-overlay.active {
                display: block;
            }

            .prompter-overlay.active ~ body,
            .prompter-overlay.active ~ .container,
            .prompter-overlay.active ~ .slide-container {
                margin-top: 30px !important;
            }

            .prompter-text-area {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 30px;
                overflow: hidden;
                display: flex;
                align-items: center;
                background: transparent;
            }

            .prompter-scrolling-text {
                position: absolute;
                white-space: nowrap;
                font-size: 22px;
                font-weight: 500;
                color: white;
                line-height: 1;
                top: 50%;
                transform: translateY(-50%);
                padding-top: 1px;
                padding-bottom: 1px;
                width: auto;
                max-width: none;
                left: 0;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }

            /* 🆕 YENİ: Marker highlighting */
            .prompter-marker {
                background: rgba(34, 197, 94, 0.3);
                padding: 2px 4px;
                border-radius: 3px;
                font-weight: bold;
                color: #22c55e;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }

            .prompter-marker.passed {
                background: rgba(107, 114, 128, 0.3);
                color: #9ca3af;
            }

            .prompter-controls-left {
                position: absolute;
                top: 0;
                left: 0;
                width: 500px;
                height: 30px;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                padding: 0;
                gap: 6px;
                opacity: 0.7;
                transition: opacity 0.3s ease;
                border-right: 1px solid rgba(255, 255, 255, 0.08);
            }

            .prompter-controls-left:hover {
                opacity: 1;
            }

            .prompter-controls-right {
                position: absolute;
                top: 0;
                right: 0;
                width: 750px;
                height: 30px;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                align-items: center;
                padding: 0;
                gap: 6px;
                opacity: 1;
                transition: opacity 0.3s ease;
                border-left: 1px solid rgba(255, 255, 255, 0.08);
            }

            .prompter-controls-right:hover {
                opacity: 0.95;
            }

            .prompter-btn {
                padding: 0 10px;
                border: none;
                border-radius: 3px;
                font-size: 11px;
                cursor: pointer;
                color: white;
                font-weight: 500;
                transition: all 0.2s ease;
                white-space: nowrap;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .prompter-start { background: rgba(34, 197, 94, 0.8); }
            .prompter-stop { background: rgba(239, 68, 68, 0.8); }
            .prompter-reset { background: rgba(59, 130, 246, 0.8); }
            .prompter-edit { background: rgba(139, 92, 246, 0.8); }
            .prompter-close { 
                background: rgba(220, 38, 38, 0.8); 
                padding: 0 10px;
                font-size: 11px;
            }
            .prompter-btn:hover { 
                opacity: 0.9;
                transform: scale(1.02);
                border-color: rgba(255,255,255,0.2);
            }

            .prompter-speed-control {
                display: flex;
                align-items: center;
                gap: 3px;
                font-size: 10px;
                color: white;
                opacity: 0.8;
            }

            .prompter-speed-control input {
                width: 60px;
                height: 16px;
            }

            /* 🆕 YENİ: Sync indicator */
            .sync-indicator {
                display: flex;
                align-items: center;
                gap: 3px;
                font-size: 10px;
                color: white;
                background: rgba(255, 255, 255, 0.08);
                padding: 2px 6px;
                border-radius: 3px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .sync-indicator.active {
                background: rgba(34, 197, 94, 0.2);
                color: #22c55e;
                border-color: rgba(34, 197, 94, 0.3);
            }
            
            .prompter-toggle {
                position: fixed;
                top: 5px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border: 1px solid rgba(255,255,255,0.2);
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: normal;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                transition: all 0.2s ease;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }

            .prompter-toggle:hover { 
                background: rgba(51, 51, 51, 0.9);
                border-color: rgba(255,255,255,0.3);
            }
            .prompter-toggle.active { 
                background: rgba(220, 38, 38, 0.8);
                border-color: rgba(255,255,255,0.4);
            }

            .prompter-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
            }

            .prompter-modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #222;
                padding: 20px;
                border-radius: 8px;
                width: 600px;
                max-width: 90vw;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .prompter-modal textarea {
                width: 100%;
                height: 300px;
                background: #333;
                color: white;
                border: 1px solid #555;
                padding: 10px;
                font-size: 14px;
                resize: vertical;
                border-radius: 4px;
            }

            .prompter-modal-buttons {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }

            .prompter-save { background: rgba(34, 197, 94, 0.8); }
            .prompter-cancel { background: rgba(107, 114, 128, 0.8); }

            .slide-info {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
                color: white;
                background: rgba(255, 255, 255, 0.08);
                padding: 2px 5px;
                border-radius: 3px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            /* 🆕 YENİ: Progress bar */
            .prompter-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(34, 197, 94, 0.8);
                transition: width 0.1s linear;
                z-index: 1;
            }
        `;

        // Add styles to head
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);

        // Add HTML to body
        const prompterHTML = `
            <button class="prompter-toggle" id="prompterToggle">Prompter</button>

            <div class="prompter-overlay" id="prompterOverlay">
                <div class="prompter-progress" id="prompterProgress"></div>
                <div class="prompter-text-area">
                    <div class="prompter-scrolling-text" id="prompterScrollingText">
                        ${this.defaultText}
                    </div>
                </div>
                
                <div class="prompter-controls-left">
                    <button class="prompter-btn prompter-start" id="prompterStart">Başlat</button>
                    <button class="prompter-btn prompter-stop" id="prompterStop">Durdur</button>
                    <button class="prompter-btn prompter-reset" id="prompterReset">Sıfırla</button>
                    <button class="prompter-btn prompter-edit" id="prompterEdit">Düzenle</button>
                    <div class="prompter-speed-control">
                        <label>Hız:</label>
                        <input type="range" min="1" max="10" value="3" id="prompterSpeedControl">
                        <span id="prompterSpeedValue">3</span>
                    </div>
                    <div class="slide-info" id="slideInfo">
                        <span>📄</span>
                        <span id="slideNumber">-/-</span>
                    </div>
                    <button class="prompter-btn" id="toggleSyncBtn" style="background: rgba(34, 197, 94, 0.8);">
                        🔄 Auto-Sync
                    </button>
                </div>
                
                <div class="prompter-controls-right">
                </div>
            </div>

            <div class="prompter-modal" id="prompterModal">
                <div class="prompter-modal-content">
                    <h3 style="margin-bottom: 15px; color: white;">Prompter Metnini Düzenle</h3>
                    <textarea id="prompterEditor" placeholder="Ders notlarınızı buraya yazın...

🎯 Otomatik Kart Sync için marker kullanın:
[KART-0] → İlk kartı göster
[KART-1] → İkinci kartı göster
[SHOW-2] → Üçüncü kartı göster
"></textarea>
                    <div class="prompter-modal-buttons">
                        <button class="prompter-btn prompter-save" id="prompterSave">Kaydet</button>
                        <button class="prompter-btn prompter-cancel" id="prompterCancel">İptal</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', prompterHTML);
    }

    setupEventListeners() {
        // Elements
        this.textElement = document.getElementById('prompterScrollingText');
        this.overlay = document.getElementById('prompterOverlay');
        this.toggle = document.getElementById('prompterToggle');
        this.modal = document.getElementById('prompterModal');
        this.editor = document.getElementById('prompterEditor');
        this.slideInfo = document.getElementById('slideNumber');
        this.progressBar = document.getElementById('prompterProgress'); // 🆕

        // Güvenlik kontrolü
        if (!this.textElement) {
            console.error('❌ prompterScrollingText elementi bulunamadı!');
            return;
        }

        // Toggle button
        this.toggle.addEventListener('click', () => this.togglePrompter());

        // Control buttons
        document.getElementById('prompterStart').addEventListener('click', () => this.startScrolling());
        document.getElementById('prompterStop').addEventListener('click', () => this.stopScrolling());
        document.getElementById('prompterReset').addEventListener('click', () => this.resetPosition());
        document.getElementById('prompterEdit').addEventListener('click', () => this.openEditModal());
        
        // 🆕 YENİ: Sync toggle button
        document.getElementById('toggleSyncBtn').addEventListener('click', () => this.toggleSync());
        
        // Speed control
        document.getElementById('prompterSpeedControl').addEventListener('change', (e) => {
            this.changeSpeed(e.target.value);
        });

        // Modal buttons
        document.getElementById('prompterSave').addEventListener('click', () => this.saveText());
        document.getElementById('prompterCancel').addEventListener('click', () => this.closeEditModal());

        // Click outside modal to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeEditModal();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.resetPosition();
        });
    }

    setupSlideChangeListener() {
        // Global slideLoader'ı dinle
        window.addEventListener('slideChanged', (event) => {
            if (event.detail && event.detail.teacherText) {
                console.log('🔥 DEBUG: slideChanged event alındı');
                this.updatePrompterText(event.detail.teacherText);
                this.updateSlideInfo(event.detail.slideNumber);
            }
        });

        // Alternatif: slideLoader global değişkenini periyodik olarak kontrol et
        this.checkSlideLoader();
    }

    checkSlideLoader() {
        let lastSlideNumber = -1;
        
        const checkInterval = setInterval(() => {
            if (window.slideLoader && window.slideLoader.currentSlide !== lastSlideNumber) {
                lastSlideNumber = window.slideLoader.currentSlide;
                this.updateSlideInfo(window.slideLoader.currentSlide, window.slideLoader.totalSlides);
                
                // Manuel olarak prompter güncellemeyi tetikle
                if (window.slideLoader.updatePrompterText) {
                    window.slideLoader.updatePrompterText();
                }
                
                // 🆕 YENİ: Sync durumunu güncelle
                this.updateSyncIndicator();
            }
        }, 500);

        // Memory leak önlemi
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 300000);
    }

    updateSlideInfo(currentSlide, totalSlides = null) {
        if (this.slideInfo) {
            if (totalSlides) {
                this.slideInfo.textContent = `${currentSlide}/${totalSlides}`;
            } else {
                this.slideInfo.textContent = `${currentSlide}/-`;
            }
        }
    }

    // 🆕 YENİ: SYNC İNDİKATÖR GÜNCELLE
    updateSyncIndicator() {
        // Sync indicator kaldırıldı, sadece buton rengini güncelle
        const syncBtn = document.getElementById('toggleSyncBtn');
        if (!syncBtn) return;
        
        const slideLoader = window.slideLoader;
        
        if (slideLoader && slideLoader.autoSyncEnabled && slideLoader.cardAnimationEnabled) {
            syncBtn.style.background = 'rgba(34, 197, 94, 0.8)'; // Yeşil - Aktif
            syncBtn.textContent = '🔄 Auto-Sync';
        } else {
            syncBtn.style.background = 'rgba(107, 114, 128, 0.8)'; // Gri - Pasif
            syncBtn.textContent = '🔄 Auto-Sync';
        }
    }

    // 🆕 YENİ: SYNC TOGGLE
    toggleSync() {
        if (window.slideLoader && typeof window.slideLoader.toggleAutoSync === 'function') {
            window.slideLoader.toggleAutoSync();
            setTimeout(() => this.updateSyncIndicator(), 100);
        } else {
            console.warn('⚠️ SlideLoader sync sistemi bulunamadı');
        }
    }

    // 🆕 YENİ: MARKER'LAR İLE TEXT HIGHLIGHT
    highlightMarkers(text) {
        if (!text || !this.syncEnabled) return text;
        
        return text.replace(/\[(?:KART|CARD|SHOW)-(\d+)\]/gi, (match) => {
            return `<span class="prompter-marker">${match}</span>`;
        });
    }

    updatePrompterText(newText) {
        console.log('🔥 DEBUG: updatePrompterText çağırıldı');
        
        if (!newText || newText.trim() === '') {
            console.warn('🔥 DEBUG: Boş text, varsayılan kullanılıyor');
            newText = this.defaultText;
        }
        
        // HTML taglerini ve fazla boşlukları temizle
        let cleanText = newText
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/<!--.*?-->/g, '')
            .trim();
        
        // 🆕 YENİ: Marker'ları highlight et
        const highlightedText = this.highlightMarkers(cleanText);
        
        // TextElement'i yeniden bul
        this.textElement = document.getElementById('prompterScrollingText');
        
        if (!this.textElement) {
            console.error('🔥 DEBUG: prompterScrollingText elementi bulunamadı!');
            return;
        }
        
        // 🆕 YENİ: HTML içerik olarak set et (marker highlighting için)
        this.textElement.innerHTML = highlightedText;
        this.currentTextLength = cleanText.length;
        
        // Position'ı sıfırla
        this.resetPosition();
        
        console.log('✅ Prompter metni başarıyla güncellendi:', cleanText.substring(0, 50) + '...');
        
        // 🆕 YENİ: Sync indicatorü güncelle
        this.updateSyncIndicator();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + P = Prompter toggle
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.togglePrompter();
            }
            
            // Space = play/pause (when prompter active)
            if (this.overlay.classList.contains('active') && e.key === ' ') {
                e.preventDefault();
                if (this.isScrolling) {
                    this.stopScrolling();
                } else {
                    this.startScrolling();
                }
            }

            // Escape = Close prompter
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closePrompter();
            }
            
            // 🆕 YENİ: Shift+S = Sync toggle
            if (e.shiftKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.toggleSync();
            }
        });
    }

    // Prompter Methods
    togglePrompter() {
        const isActive = this.overlay.classList.contains('active');
        
        if (isActive) {
            this.overlay.classList.remove('active');
            this.toggle.classList.remove('active');
            this.toggle.textContent = 'Prompter';
            this.stopScrolling();
            document.body.style.marginTop = '0';
        } else {
            this.overlay.classList.add('active');
            this.toggle.classList.add('active');
            this.toggle.textContent = 'Kapat';
            this.resetPosition();
            document.body.style.marginTop = '30px';
            
            // Prompter açıldığında metni yeniden yükle
            setTimeout(() => {
                if (window.slideLoader && typeof window.slideLoader.updatePrompterText === 'function') {
                    console.log('🔥 DEBUG: Prompter açılırken metin yeniden yükleniyor');
                    window.slideLoader.updatePrompterText();
                }
                this.updateSyncIndicator();
            }, 100);
        }
    }

    startScrolling() {
        if (!this.isScrolling) {
            this.isScrolling = true;
            this.animate();
        }
    }

    stopScrolling() {
        this.isScrolling = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isScrolling) return;
        
        this.currentPosition -= this.scrollSpeed;
        
        const textWidth = this.textElement.offsetWidth;
        const containerWidth = window.innerWidth;
        const leftControlWidth = 500;
        const rightControlWidth = 500;
        const availableWidth = containerWidth - leftControlWidth - rightControlWidth;
        
        const resetThreshold = leftControlWidth - textWidth;
        
        if (this.currentPosition < resetThreshold) {
            this.currentPosition = containerWidth - rightControlWidth;
        }
        
        this.textElement.style.transform = `translateX(${this.currentPosition}px) translateY(-50%)`;
        
        // 🆕 YENİ: Sync event'i gönder
        this.sendSyncEvent();
        
        // 🆕 YENİ: Progress bar güncelle
        this.updateProgressBar();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 🆕 YENİ: SYNC EVENT GÖNDER
    sendSyncEvent() {
        if (!this.syncEnabled || !window.slideLoader) return;
        
        const now = Date.now();
        if (now - this.lastSyncEvent < this.syncEventThrottle) return;
        
        const containerWidth = window.innerWidth;
        const textWidth = this.textElement.offsetWidth || this.currentTextLength * 12;
        const leftControlWidth = 500;
        const rightControlWidth = 500;
        
        // Scroll progress hesapla (0-1 arası)
        const scrollProgress = Math.max(0, Math.min(1, 
            (containerWidth - rightControlWidth - this.currentPosition) / (textWidth + containerWidth - leftControlWidth - rightControlWidth)
        ));
        
        // Karakter pozisyonunu hesapla
        const characterPosition = Math.floor(scrollProgress * this.currentTextLength);
        
        // Sadece önemli değişikliklerde event gönder
        if (Math.abs(characterPosition - this.lastSyncPosition) > 5) {
            window.dispatchEvent(new CustomEvent('prompterSync', {
                detail: {
                    characterPosition: characterPosition,
                    scrollProgress: scrollProgress,
                    textLength: this.currentTextLength,
                    isScrolling: this.isScrolling
                }
            }));
            
            this.lastSyncPosition = characterPosition;
            this.lastSyncEvent = now;
        }
    }

    // 🆕 YENİ: PROGRESS BAR GÜNCELLE
    updateProgressBar() {
        if (!this.progressBar || !this.isScrolling) return;
        
        const containerWidth = window.innerWidth;
        const textWidth = this.textElement.offsetWidth || this.currentTextLength * 12;
        const leftControlWidth = 500;
        const rightControlWidth = 500;
        
        const scrollProgress = Math.max(0, Math.min(1, 
            (containerWidth - rightControlWidth - this.currentPosition) / (textWidth + containerWidth - leftControlWidth - rightControlWidth)
        ));
        
        this.progressBar.style.width = `${scrollProgress * 100}%`;
    }

    resetPosition() {
        const containerWidth = window.innerWidth;
        const rightControlWidth = 500;
        
        this.currentPosition = containerWidth - rightControlWidth;
        this.textElement.style.transform = `translateX(${this.currentPosition}px) translateY(-50%)`;
        
        // 🆕 YENİ: Progress bar'ı da sıfırla
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
        }
        
        this.lastSyncPosition = -1;
        
        console.log('📖 Prompter pozisyonu sıfırlandı:', this.currentPosition);
    }

    changeSpeed(value) {
        this.scrollSpeed = parseInt(value);
        document.getElementById('prompterSpeedValue').textContent = value;
    }

    openEditModal() {
        // 🆕 YENİ: Marker'ları da göster
        let currentText = this.textElement.textContent || this.textElement.innerHTML;
        
        // HTML marker'larını normal marker'lara çevir
        currentText = currentText.replace(/<span class="prompter-marker">(.*?)<\/span>/g, '$1');
        
        this.editor.value = currentText;
        this.modal.style.display = 'block';
    }

    closeEditModal() {
        this.modal.style.display = 'none';
    }

    saveText() {
        const newText = this.editor.value;
        this.updatePrompterText(newText);
        this.closeEditModal();
        
        // 🆕 YENİ: Sync sistemini yeniden başlat
        if (window.slideLoader && this.syncEnabled) {
            setTimeout(() => {
                if (typeof window.slideLoader.detectCardsInCurrentSlide === 'function') {
                    window.slideLoader.speechText = newText;
                    window.slideLoader.speechMarkers = window.slideLoader.parseSpeechMarkers(newText);
                    window.slideLoader.lastTriggeredMarker = -1;
                    
                    if (window.slideLoader.autoSyncEnabled) {
                        window.slideLoader.startSyncTracking();
                    }
                    
                    this.updateSyncIndicator();
                    console.log('🎯 Manual metin değişikliği sonrası sync sistemi güncellendi');
                }
            }, 100);
        }
    }

    closePrompter() {
        this.togglePrompter();
    }
    
    // 🆕 YENİ: Public API metodları
    getCurrentPosition() {
        return this.lastSyncPosition;
    }
    
    getCurrentProgress() {
        const containerWidth = window.innerWidth;
        const textWidth = this.textElement.offsetWidth || this.currentTextLength * 12;
        const leftControlWidth = 500;
        const rightControlWidth = 500;
        
        return Math.max(0, Math.min(1, 
            (containerWidth - rightControlWidth - this.currentPosition) / (textWidth + containerWidth - leftControlWidth - rightControlWidth)
        ));
    }
    
    getSyncStatus() {
        return {
            syncEnabled: this.syncEnabled,
            isScrolling: this.isScrolling,
            currentPosition: this.lastSyncPosition,
            textLength: this.currentTextLength,
            progress: this.getCurrentProgress()
        };
    }
    
    enableSync() {
        this.syncEnabled = true;
        this.updateSyncIndicator();
        console.log('🎯 Prompter sync etkinleştirildi');
    }
    
    disableSync() {
        this.syncEnabled = false;
        this.updateSyncIndicator();
        console.log('⏸️ Prompter sync devre dışı bırakıldı');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.prompterSystem = new PrompterSystem();
    
    // SlideLoader hazır olduğunda prompter'ı güncelle
    setTimeout(() => {
        if (window.slideLoader && typeof window.slideLoader.updatePrompterText === 'function') {
            console.log('🔥 DEBUG: DOM ready - slideLoader ile prompter güncelleniyor');
            window.slideLoader.updatePrompterText();
        }
    }, 1000);
});

// Global access for backwards compatibility
window.togglePrompter = function() {
    if (window.prompterSystem) {
        window.prompterSystem.togglePrompter();
    }
};

// 🆕 YENİ: Global sync fonksiyonları
window.togglePrompterSync = function() {
    if (window.prompterSystem) {
        window.prompterSystem.toggleSync();
    }
};

window.getPrompterStatus = function() {
    if (window.prompterSystem) {
        return window.prompterSystem.getSyncStatus();
    }
    return null;
};