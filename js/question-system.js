// js/question-system.js - OVERLAY VERSİYONU - SLİDE POZİSYONU DEĞİŞTİRMEZ - DÜZELTILMIŞ

class QuestionSystem {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.totalCorrect = 0;
        this.totalAnswered = 0;
        this.currentTopicSlug = '';
        this.isActive = false;
        this.lastLoadedSlide = -1;
        this.answeredQuestions = new Map();
        this.basePath = '';
        
        this.init();
    }

    async init() {
        this.createRightPanelHTML();
        this.setupEventListeners();
        this.createRightIndicator();
        
        // 🔥 FİX: currentTopicSlug düzgün hesaplanıyor
        this.getCurrentTopicSlug();
        this.basePath = `${this.currentTopicSlug}/images/`;
        
        // 🔥 DEBUG: Yolları konsola yazdır
        console.log('🔍 DEBUG: currentTopicSlug:', this.currentTopicSlug);
        console.log('🔍 DEBUG: basePath:', this.basePath);
        
        await this.loadQuestionsForCurrentSlide();
        
        console.log('📝 Overlay test sistemi hazır - Q tuşu ile aktif et');
    }

    getCurrentTopicSlug() {
        // 🔥 FİX: Daha güvenilir yol hesaplama
        const pathArray = window.location.pathname.split('/');
        const fileName = pathArray[pathArray.length - 1];
        this.currentTopicSlug = fileName.replace('.html', '');
        
        // Eğer dosya adı boşsa, farklı yöntem dene
        if (!this.currentTopicSlug || this.currentTopicSlug === '') {
            const fullPath = window.location.href;
            const match = fullPath.match(/\/([^\/]+)\.html$/);
            if (match) {
                this.currentTopicSlug = match[1];
            } else {
                this.currentTopicSlug = 'fizik-bilimine-giris'; // Fallback
            }
        }
        
        console.log('🎯 Topic slug belirlendi:', this.currentTopicSlug);
    }

    async loadQuestionsForCurrentSlide() {
        const currentSlide = this.getCurrentSlideNumber();
        
        if (this.lastLoadedSlide === currentSlide) {
            console.log(`📝 Slide ${currentSlide} soruları zaten yüklü`);
            return;
        }
        
        // 🔥 FİX: Doğru dosya yolu oluştur
        const jsonPath = `${this.currentTopicSlug}/slide-${currentSlide}-questions.json`;
        console.log(`📝 JSON yolu: ${jsonPath}`);
        
        try {
            const response = await fetch(jsonPath);
            console.log(`📝 Fetch response status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                this.questions = data.questions || [];
                this.lastLoadedSlide = currentSlide;
                this.currentQuestionIndex = 0;
                this.answeredQuestions.clear();
                this.resetStats();
                console.log(`✅ Slide ${currentSlide}: ${this.questions.length} soru JSON'dan yüklendi`);
                this.updateIndicator();
                this.updatePanelContent();
            } else {
                console.warn(`⚠️ slide-${currentSlide}-questions.json bulunamadı (${response.status})`);
                console.warn(`⚠️ Denenen yol: ${jsonPath}`);
                console.warn(`⚠️ Tam URL: ${window.location.origin}${window.location.pathname.replace(/[^\/]*$/, '')}${jsonPath}`);
                this.questions = [];
                this.updateIndicator();
                this.updatePanelContent();
            }
        } catch (error) {
            console.error(`❌ slide-${currentSlide}-questions.json yüklenemedi:`, error);
            console.error(`❌ Denenen yol: ${jsonPath}`);
            this.questions = [];
            this.updateIndicator();
            this.updatePanelContent();
        }
    }

    getCurrentSlideNumber() {
        // 🔥 FİX: Daha güvenilir slide numarası tespit
        
        // Yöntem 1: slideLoader'dan al
        if (window.slideLoader && window.slideLoader.currentSlide) {
            console.log('🎯 Slide numarası slideLoader\'dan alındı:', window.slideLoader.currentSlide);
            return window.slideLoader.currentSlide;
        }
        
        // Yöntem 2: Global değişken
        if (window.currentSlideNumber) {
            console.log('🎯 Slide numarası global değişkenden alındı:', window.currentSlideNumber);
            return window.currentSlideNumber;
        }
        
        // Yöntem 3: DOM'dan active slide
        const activeSlide = document.querySelector('.slide.active');
        if (activeSlide) {
            const slideAttr = activeSlide.getAttribute('data-slide');
            if (slideAttr) {
                const slideNumber = parseInt(slideAttr);
                if (slideNumber > 0) {
                    console.log('🎯 Slide numarası DOM\'dan alındı:', slideNumber);
                    return slideNumber;
                }
            }
        }
        
        // Yöntem 4: Tüm slide'ları kontrol et
        const allSlides = document.querySelectorAll('.slide');
        for (let i = 0; i < allSlides.length; i++) {
            if (allSlides[i].classList.contains('active')) {
                const slideNumber = parseInt(allSlides[i].getAttribute('data-slide') || (i + 1));
                if (slideNumber > 0) {
                    console.log('🎯 Slide numarası manual DOM taramadan alındı:', slideNumber);
                    return slideNumber;
                }
            }
        }
        
        console.warn('📝 Slide numarası bulunamadı, varsayılan olarak 1 kullanılıyor');
        return 1;
    }

    createRightPanelHTML() {
        const panelHTML = `
            <div class="question-right-panel" id="questionRightPanel">
                <div class="question-panel-header">
                    <div class="question-header-left">
                        <h3 class="question-panel-title">📝 Slide Testi</h3>
                        <p class="question-panel-subtitle" id="panelSubtitle">Bu slide ile ilgili sorular</p>
                    </div>
                    <div class="question-header-right">
                        <div class="question-nav-controls">
                            <div class="nav-buttons">
                                <button class="nav-btn" id="prevQuestionBtn" disabled>◀ Önceki</button>
                                <button class="nav-btn" id="nextQuestionBtn" disabled>Sonraki ▶</button>
                            </div>
                            <div class="question-counter" id="questionCounter">1/1</div>
                        </div>
                    </div>
                </div>
                
                <div class="question-panel-content" id="panelContent">
                    <div style="text-align: center; padding: 20px; color: white;">
                        <div style="font-size: 2em; margin-bottom: 10px;">⏳</div>
                        <p>Sorular yükleniyor...</p>
                    </div>
                </div>
                
                <div class="question-panel-footer">
                    <div class="panel-stats">
                        <span id="panelProgress">0/0</span>
                        <span id="panelScore">0%</span>
                    </div>
                    <div class="panel-controls">
                        <button class="panel-btn btn-reset-panel" id="resetPanel">🔄 Sıfırla</button>
                        <button class="panel-btn btn-close-panel" id="closePanel">✕ Kapat</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
    }

    createRightIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'question-right-indicator';
        indicator.id = 'questionRightIndicator';
        indicator.innerHTML = `📝 Test (Q)`;
        
        indicator.addEventListener('click', () => this.toggleRightPanel());
        document.body.appendChild(indicator);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'q' && !e.ctrlKey) {
                e.preventDefault();
                this.toggleRightPanel();
            }
            
            if (e.key === 'Escape' && this.isActive) {
                e.preventDefault();
                this.hideRightPanel();
            }
            
            if (this.isActive) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.previousQuestion();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.nextQuestion();
                }
            }
        });

        document.getElementById('closePanel').addEventListener('click', () => this.hideRightPanel());
        document.getElementById('resetPanel').addEventListener('click', () => this.resetAllAnswers());
        document.getElementById('prevQuestionBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextQuestionBtn').addEventListener('click', () => this.nextQuestion());
        
        this.setupSlideChangeDetection();
    }

    setupSlideChangeDetection() {
        window.addEventListener('slideChanged', (event) => {
            if (event.detail && event.detail.slideNumber) {
                console.log(`📝 Custom event ile slide değişikliği alındı: ${event.detail.slideNumber}`);
                setTimeout(() => {
                    this.onSlideChange(event.detail.slideNumber);
                }, 100);
            }
        });
        
        let lastKnownSlide = this.getCurrentSlideNumber();
        const slideCheckInterval = setInterval(() => {
            const currentSlide = this.getCurrentSlideNumber();
            if (currentSlide !== lastKnownSlide && currentSlide > 0) {
                console.log(`📝 Periyodik kontrol ile slide değişikliği algılandı: ${lastKnownSlide} → ${currentSlide}`);
                lastKnownSlide = currentSlide;
                this.onSlideChange(currentSlide);
            }
        }, 500);
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('slide') && target.classList.contains('active')) {
                        const slideNumber = parseInt(target.getAttribute('data-slide'));
                        if (slideNumber && slideNumber !== this.lastLoadedSlide) {
                            console.log(`📝 DOM mutation ile slide değişikliği algılandı: ${slideNumber}`);
                            setTimeout(() => {
                                this.onSlideChange(slideNumber);
                            }, 200);
                        }
                    }
                }
            });
        });
        
        const slideContainer = document.getElementById('slideContainer');
        if (slideContainer) {
            observer.observe(slideContainer, {
                attributes: true,
                childList: true,
                subtree: true,
                attributeFilter: ['class']
            });
        }
        
        console.log('📝 Tüm slide değişiklik algılama sistemleri aktif edildi');
    }

    async onSlideChange(slideNumber) {
        console.log(`📝 onSlideChange çağırıldı: ${slideNumber} (Mevcut: ${this.lastLoadedSlide})`);
        
        if (this.lastLoadedSlide === slideNumber) {
            console.log(`📝 Slide ${slideNumber} zaten yüklü, tekrar yükleme yapılmıyor`);
            return;
        }
        
        this.currentSlide = slideNumber;
        await this.loadQuestionsForCurrentSlide();
        
        if (this.isActive) {
            this.updatePanelContent();
        }
        
        console.log(`📝 Slide ${slideNumber} sorularının yüklenmesi tamamlandı`);
    }

    toggleRightPanel() {
        const panel = document.getElementById('questionRightPanel');
        
        if (panel.classList.contains('active')) {
            this.hideRightPanel();
        } else {
            this.showRightPanel();
        }
    }

    showRightPanel() {
        const panel = document.getElementById('questionRightPanel');
        panel.classList.add('active');
        this.isActive = true;
        this.updatePanelContent();
        
        console.log('📝 Overlay test paneli açıldı');
    }

    hideRightPanel() {
        const panel = document.getElementById('questionRightPanel');
        panel.classList.remove('active');
        this.isActive = false;
        
        console.log('📝 Overlay test paneli kapatıldı');
    }

    updatePanelContent() {
        const content = document.getElementById('panelContent');
        const currentSlide = this.getCurrentSlideNumber();
        
        document.getElementById('panelSubtitle').textContent = `Slide ${currentSlide} Soruları`;
        
        if (this.questions.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 20px; color: white;">
                    <div style="font-size: 2em; margin-bottom: 10px;">📝</div>
                    <p>Bu slide için test sorusu yok</p>
                    <p style="font-size: 0.8em; margin-top: 10px; opacity: 0.7;">
                        slide-${currentSlide}-questions.json dosyası bulunamadı
                    </p>
                </div>
            `;
            this.updateNavigationButtons();
            return;
        }

        this.displayCurrentQuestion();
        this.updateNavigationButtons();
        this.updatePanelStats();
    }

    displayCurrentQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = 0;
        }

        const question = this.questions[this.currentQuestionIndex];
        const content = document.getElementById('panelContent');
        const isAnswered = this.answeredQuestions.has(question.id);
        
        const questionContent = this.renderQuestionContent(question);
        const optionsHtml = this.renderOptions(question, isAnswered);
        
        content.innerHTML = `
            <div class="single-question">
                ${questionContent}
                <div class="single-options">
                    ${optionsHtml}
                </div>
                <div class="single-explanation ${isAnswered ? 'show' : ''}" id="explanation-${question.id}">
                    <div class="explanation-title">💡 Açıklama</div>
                    <div>${question.explanation}</div>
                </div>
            </div>
        `;

        if (isAnswered) {
            this.showPreviousAnswer(question.id);
        } else {
            content.querySelectorAll('.single-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const questionId = parseInt(e.currentTarget.dataset.questionId);
                    const optionIndex = parseInt(e.currentTarget.dataset.option);
                    this.selectAnswer(questionId, optionIndex);
                });
            });
        }

        this.updateQuestionCounter();
    }

    renderQuestionContent(question) {
        if (question.questionImage) {
            return `
                <div class="single-question-image">
                    <img src="${this.basePath}${question.questionImage}" 
                         alt="Soru görseli" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                         style="max-width: 100%; max-height: 300px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="display: none; color: #ef4444; font-size: 0.9em; text-align: center; margin-bottom: 15px;">
                        ⚠️ Görsel yüklenemedi: ${question.questionImage}
                    </div>
                </div>
                ${question.question ? `<div class="single-question-text">${question.question}</div>` : ''}
            `;
        } else {
            return `<div class="single-question-text">${question.question}</div>`;
        }
    }

    renderOptions(question, isAnswered) {
        return question.options.map((option, index) => {
            const optionContent = this.renderOptionContent(option, index);
            
            return `
                <div class="single-option ${isAnswered ? 'disabled' : ''}" 
                     data-question-id="${question.id}" 
                     data-option="${index}">
                    <div class="single-option-letter">${String.fromCharCode(65 + index)}</div>
                    <div class="single-option-content">
                        ${optionContent}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderOptionContent(option, index) {
        if (typeof option === 'object' && option.image) {
            return `
                <div class="option-image-container">
                    <img src="${this.basePath}${option.image}" 
                         alt="Seçenek ${index + 1}" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                         style="max-width: 150px; max-height: 100px; border-radius: 8px;">
                    <div style="display: none; color: #ef4444; font-size: 0.8em;">
                        ⚠️ Görsel yüklenemedi
                    </div>
                </div>
                ${option.text ? `<div class="single-option-text">${option.text}</div>` : ''}
            `;
        } else {
            return `<div class="single-option-text">${option}</div>`;
        }
    }

    showPreviousAnswer(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        const answerData = this.answeredQuestions.get(questionId);
        
        if (!question || !answerData) return;

        const options = document.querySelectorAll('.single-option');
        
        options[answerData.selected].classList.add(answerData.correct ? 'correct' : 'incorrect');
        
        if (!answerData.correct) {
            options[question.correct].classList.add('correct');
        }
        
        const explanation = document.getElementById(`explanation-${questionId}`);
        explanation.classList.add('show');
    }

    selectAnswer(questionId, selectedIndex) {
        if (this.answeredQuestions.has(questionId)) {
            return;
        }

        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        const options = document.querySelectorAll('.single-option');
        const isCorrect = selectedIndex === question.correct;
        
        options.forEach(opt => {
            opt.classList.add('disabled');
        });
        
        options[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        if (!isCorrect) {
            options[question.correct].classList.add('correct');
        }
        
        const explanation = document.getElementById(`explanation-${questionId}`);
        explanation.classList.add('show');
        
        this.answeredQuestions.set(questionId, {
            selected: selectedIndex,
            correct: isCorrect
        });
        
        this.totalAnswered++;
        if (isCorrect) {
            this.totalCorrect++;
        }
        
        this.updatePanelStats();
        
        console.log(`📝 Soru ${questionId} cevaplandı: ${isCorrect ? 'Doğru' : 'Yanlış'}`);
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayCurrentQuestion();
            this.updateNavigationButtons();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayCurrentQuestion();
            this.updateNavigationButtons();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        
        if (prevBtn && nextBtn) {
            prevBtn.disabled = (this.currentQuestionIndex === 0) || (this.questions.length === 0);
            nextBtn.disabled = (this.currentQuestionIndex >= this.questions.length - 1) || (this.questions.length === 0);
        }
    }

    updateQuestionCounter() {
        const counter = document.getElementById('questionCounter');
        if (counter && this.questions.length > 0) {
            counter.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;
        } else if (counter) {
            counter.textContent = '0/0';
        }
    }

    resetAllAnswers() {
        this.answeredQuestions.clear();
        this.totalCorrect = 0;
        this.totalAnswered = 0;
        this.currentQuestionIndex = 0;
        this.updatePanelContent();
        console.log('📝 Tüm cevaplar sıfırlandı');
    }

    resetStats() {
        this.totalCorrect = 0;
        this.totalAnswered = 0;
        this.updatePanelStats();
    }

    updatePanelStats() {
        const progressEl = document.getElementById('panelProgress');
        const scoreEl = document.getElementById('panelScore');
        
        if (progressEl) {
            progressEl.textContent = `${this.answeredQuestions.size}/${this.questions.length}`;
        }
        
        if (scoreEl) {
            const rate = this.totalAnswered > 0 ? Math.round((this.totalCorrect / this.totalAnswered) * 100) : 0;
            scoreEl.textContent = `${rate}%`;
        }
    }

    updateIndicator() {
        const indicator = document.getElementById('questionRightIndicator');
        const currentSlide = this.getCurrentSlideNumber();
        
        if (indicator && this.questions.length > 0) {
            indicator.innerHTML = `📝 S${currentSlide}:${this.questions.length}T (Q)`;
        } else if (indicator) {
            indicator.innerHTML = `📝 Test Yok (Q)`;
        }
    }
}

// Global değişken
let questionSystem;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/pages/') && window.location.pathname.includes('.html')) {
        questionSystem = new QuestionSystem();
    }
});

// Global fonksiyonlar
window.showQuestions = function() {
    if (questionSystem) {
        questionSystem.showRightPanel();
    }
};

window.hideQuestions = function() {
    if (questionSystem) {
        questionSystem.hideRightPanel();
    }
};