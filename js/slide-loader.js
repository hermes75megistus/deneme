// ===== ENHANCED SLİDE YÜKLEME SİSTEMİ - DÜZELTILMIŞ PROMPTER TEXT EXTRACTION =====
class EnhancedSlideLoader {
    constructor(topicSlug) {
        this.topicSlug = topicSlug;
        this.currentSlide = 1;
        this.totalSlides = 0;
        this.maxSlides = 15;
        this.slides = [];
        this.isDrawingActive = false;
        
        // *** KART ANİMASYON SİSTEMİ ***
        this.cardAnimationEnabled = false;
        this.cardIndex = 0;
        this.allCards = [];
        
        // *** 🆕 YENİ: OTOMATİK SYNC SİSTEMİ ***
        this.autoSyncEnabled = false;
        this.speechMarkers = []; // [{position: 150, cardIndex: 0, marker: '[KART-0]'}]
        this.currentSpeechPosition = 0;
        this.speechText = '';
        this.lastTriggeredMarker = -1;
        this.syncInterval = null;
        
        this.init();
    }

    async init() {
        await this.loadSlides();
        this.setupKeyboard();
        this.setupDrawingDetection();
        this.setupCardAnimation();
        this.setupAutoSync();
        this.updateUI();
        
        await this.updatePrompterText();
        this.notifyQuestionSystem();
    }

    // *** 🆕 YENİ: OTOMATİK SYNC SİSTEMİ KURULUMU ***
    setupAutoSync() {
        console.log('🎯 Otomatik Kart-Prompter sync sistemi kuruluyor...');
        
        // Prompter sistem event listener'ı
        window.addEventListener('prompterSync', (event) => {
            if (event.detail) {
                this.handlePrompterSync(event.detail);
            }
        });
        
        // Keyboard shortcut: Alt+S = Auto sync toggle
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.toggleAutoSync();
            }
        });
    }
    
    // *** 🆕 YENİ: KONUŞMA METNİNDEKİ MARKER'LARI PARSE ET ***
    parseSpeechMarkers(speechText) {
        if (!speechText || speechText.length < 10) {
            console.log('⚠️ Konuşma metni çok kısa, marker aranmıyor');
            return [];
        }
        
        const markers = [];
        const markerRegex = /\[(?:KART|CARD|SHOW)-(\d+)\]/gi;
        let match;
        
        console.log('🔍 Konuşma metninde marker aranıyor...');
        console.log('📝 İlk 100 karakter:', speechText.substring(0, 100));
        
        while ((match = markerRegex.exec(speechText)) !== null) {
            const cardIndex = parseInt(match[1]);
            const position = match.index;
            
            markers.push({
                position: position,
                cardIndex: cardIndex,
                marker: match[0],
                text: speechText.substring(Math.max(0, position - 20), position + 30)
            });
            
            console.log(`✅ Marker bulundu: ${match[0]} → Kart ${cardIndex} (Pozisyon: ${position})`);
        }
        
        // Pozisyona göre sırala
        markers.sort((a, b) => a.position - b.position);
        
        console.log(`🎯 Toplam ${markers.length} marker bulundu:`, markers.map(m => m.marker));
        return markers;
    }
    
    // *** 🆕 YENİ: OTOMATİK SYNC TOGGLE ***
    toggleAutoSync() {
        this.autoSyncEnabled = !this.autoSyncEnabled;
        
        if (this.autoSyncEnabled) {
            console.log('🚀 Otomatik kart sync AÇILDI');
            
            // Mevcut slide için marker'ları yeniden parse et
            if (this.speechText && this.cardAnimationEnabled) {
                this.speechMarkers = this.parseSpeechMarkers(this.speechText);
                this.lastTriggeredMarker = -1;
                this.startSyncTracking();
            }
            
            this.showSyncNotification('🚀 Otomatik Sync: AÇIK', 'green');
        } else {
            console.log('⏸️ Otomatik kart sync KAPALI');
            this.stopSyncTracking();
            this.showSyncNotification('⏸️ Otomatik Sync: KAPALI', 'orange');
        }
    }
    
    // *** 🆕 YENİ: SYNC TAKİP BAŞLAT ***
    startSyncTracking() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Prompter'dan pozisyon bilgisi al
        this.syncInterval = setInterval(() => {
            if (window.prompterSystem && this.autoSyncEnabled) {
                const prompterData = this.getPrompterStatus();
                if (prompterData.isScrolling && prompterData.currentPosition !== undefined) {
                    this.updateSyncPosition(prompterData);
                }
            }
        }, 100); // 100ms intervals
        
        console.log('📡 Sync tracking başlatıldı');
    }
    
    // *** 🆕 YENİ: SYNC TAKİP DURDUR ***
    stopSyncTracking() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('📡 Sync tracking durduruldu');
    }
    
    // *** 🆕 YENİ: PROMPTER DURUM BİLGİSİ AL ***
    getPrompterStatus() {
        if (!window.prompterSystem) {
            return { isScrolling: false };
        }
        
        try {
            const textElement = window.prompterSystem.textElement;
            const isScrolling = window.prompterSystem.isScrolling;
            
            if (!textElement || !isScrolling) {
                return { isScrolling: false };
            }
            
            // Transform değerinden X pozisyonunu çıkar
            const transform = textElement.style.transform || '';
            const translateMatch = transform.match(/translateX\(([^)]+)px\)/);
            const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
            
            // Metin uzunluğu ve karakterlere göre pozisyon hesapla
            const textLength = textElement.textContent.length;
            const containerWidth = window.innerWidth;
            const textWidth = textElement.offsetWidth || textLength * 12; // Yaklaşık
            
            // Scroll pozisyonunu 0-1 arasında normalize et
            const scrollProgress = Math.max(0, Math.min(1, 
                (containerWidth - currentX) / (textWidth + containerWidth)
            ));
            
            // Metin içindeki karakter pozisyonunu hesapla
            const characterPosition = Math.floor(scrollProgress * textLength);
            
            return {
                isScrolling: true,
                currentPosition: characterPosition,
                scrollProgress: scrollProgress,
                textLength: textLength
            };
            
        } catch (error) {
            console.error('❌ Prompter status alınamadı:', error);
            return { isScrolling: false };
        }
    }
    
    // *** 🆕 YENİ: PROMPTER SYNC HANDLE ***
    handlePrompterSync(prompterData) {
        if (!this.autoSyncEnabled || !this.cardAnimationEnabled) return;
        this.updateSyncPosition(prompterData);
    }
    
    // *** 🆕 YENİ: SYNC POZİSYON GÜNCELLE ***
    updateSyncPosition(prompterData) {
        const { currentPosition } = prompterData;
        this.currentSpeechPosition = currentPosition;
        
        // Geçilmesi gereken marker'ları kontrol et
        for (let i = 0; i < this.speechMarkers.length; i++) {
            const marker = this.speechMarkers[i];
            
            // Bu marker henüz tetiklenmedi ve şu anki pozisyonu geçtik
            if (i > this.lastTriggeredMarker && currentPosition >= marker.position) {
                this.triggerAutoCard(marker, i);
            }
        }
    }
    
    // *** 🆕 YENİ: OTOMATİK KART TETİKLE ***
    triggerAutoCard(marker, markerIndex) {
        console.log(`🎯 Otomatik tetikleme: ${marker.marker} → Kart ${marker.cardIndex}`);
        
        // Kart index'ini kontrol et
        if (marker.cardIndex >= 0 && marker.cardIndex < this.allCards.length) {
            // Sadece o karta kadar olan kartları göster
            for (let i = this.cardIndex; i <= marker.cardIndex; i++) {
                this.revealSpecificCard(i);
            }
            
            this.lastTriggeredMarker = markerIndex;
            
        } else {
            console.warn(`⚠️ Geçersiz kart index: ${marker.cardIndex} (Toplam: ${this.allCards.length})`);
        }
    }
    
    // *** 🆕 YENİ: BELİRLİ KARTI GÖSTER ***
    revealSpecificCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.allCards.length) {
            return;
        }
        
        const card = this.allCards[cardIndex];
        if (!card.classList.contains('visible')) {
            console.log(`🃏 Kart ${cardIndex + 1} gösteriliyor (otomatik)`);
            
            card.style.setProperty('opacity', '1', 'important');
            card.style.setProperty('transform', 'translateY(0) scale(1)', 'important');
            card.style.setProperty('pointer-events', 'auto', 'important');
            
            card.classList.add('visible', 'show', 'card-visible', 'animate-in');
            
            // Card index'ini güncelle
            if (cardIndex >= this.cardIndex) {
                this.cardIndex = cardIndex + 1;
            }
        }
    }
    
    // *** 🆕 YENİ: SYNC BİLDİRİM GÖSTER ***
    showSyncNotification(message, color = 'blue') {
        // Eğer varsa eski notification'ı kaldır
        const existingNotif = document.getElementById('syncNotification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'syncNotification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${this.getNotificationColor(color)};
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            z-index: 10001;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    getNotificationColor(color) {
        const colors = {
            'green': 'rgba(34, 197, 94, 0.9)',
            'blue': 'rgba(59, 130, 246, 0.9)',
            'orange': 'rgba(251, 146, 60, 0.9)',
            'red': 'rgba(239, 68, 68, 0.9)'
        };
        return colors[color] || colors.blue;
    }
    
    // *** GÜNCELLENEN: KART DETECTION - MARKER PARSING İLE ***
    detectCardsInCurrentSlide() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) {
            console.log('❌ Aktif slide bulunamadı');
            return;
        }

        let cardSelectors = [
            '.standard-card',
            '.card',
            '.concept-card',
            '[data-card]',
            '.branch-card'
        ];
        
        this.allCards = [];
        for (let selector of cardSelectors) {
            const found = activeSlide.querySelectorAll(selector);
            if (found.length > 0) {
                this.allCards = Array.from(found);
                console.log(`🃏 ${selector} ile ${this.allCards.length} kart bulundu`);
                break;
            }
        }

        if (this.allCards.length === 0) {
            console.log('⚠️ Bu slide\'da animasyon kartı yok');
            this.cardAnimationEnabled = false;
            this.autoSyncEnabled = false;
            return;
        }

        setTimeout(() => {
            this.hideAllCards();
            this.cardAnimationEnabled = true;
            this.cardIndex = 0;
            
            // 🆕 Otomatik sync için konuşma metnini parse et
            if (this.speechText) {
                this.speechMarkers = this.parseSpeechMarkers(this.speechText);
                this.lastTriggeredMarker = -1;
                
                if (this.speechMarkers.length > 0 && this.autoSyncEnabled) {
                    this.startSyncTracking();
                    console.log(`✅ ${this.allCards.length} kart hazırlandı, ${this.speechMarkers.length} sync marker'ı bulundu`);
                } else {
                    console.log(`✅ ${this.allCards.length} kart hazırlandı (marker yok veya sync kapalı)`);
                }
            }
        }, 300);
    }
    
    // *** 🔥 DÜZELTILMIŞ: PROMPTER TEXT UPDATE - GELIŞMIŞ EXTRACTION ***
    async updatePrompterText() {
        console.group(`📖 Slide ${this.currentSlide} için konuşma metni yükleniyor...`);
        
        try {
            const slideFile = `${this.topicSlug}/slide-${this.currentSlide}.txt`;
            console.log(`📁 Dosya: ${slideFile}`);
            
            const response = await fetch(slideFile);
            console.log(`📡 Response status: ${response.status}`);
            
            if (!response.ok) {
                console.warn(`📖 Slide ${this.currentSlide} TXT dosyası bulunamadı (${response.status})`);
                this.speechText = '';
                this.speechMarkers = [];
                
                if (window.prompterSystem) {
                    window.prompterSystem.updatePrompterText(`Slide ${this.currentSlide} - ${this.topicSlug} konusu devam ediyor...`);
                }
                return;
            }
            
            const slideContent = await response.text();
            console.log(`📄 Dosya boyutu: ${slideContent.length} karakter`);
            console.log(`📄 İçerik başlangıcı: ${slideContent.substring(0, 100)}...`);
            console.log(`📄 İçerik sonu: ...${slideContent.substring(slideContent.length - 200)}`);
            
            const teacherText = this.extractTeacherText(slideContent);
            
            if (teacherText && teacherText.length > 20) {
                console.log(`✅ Konuşma metni başarıyla çıkarıldı (${teacherText.length} karakter)`);
                console.log(`📝 İlk 150 karakter: ${teacherText.substring(0, 150)}...`);
                
                // 🆕 Speech text'i sakla
                this.speechText = teacherText;
                
                if (window.prompterSystem && typeof window.prompterSystem.updatePrompterText === 'function') {
                    window.prompterSystem.updatePrompterText(teacherText);
                    console.log(`✅ Prompter sistemi güncellendi`);
                }
                
                window.dispatchEvent(new CustomEvent('slideChanged', {
                    detail: { 
                        slideNumber: this.currentSlide,
                        teacherText: teacherText
                    }
                }));
                
                // 🆕 Marker'ları tekrar parse et
                if (this.cardAnimationEnabled) {
                    this.speechMarkers = this.parseSpeechMarkers(teacherText);
                    this.lastTriggeredMarker = -1;
                    
                    if (this.autoSyncEnabled && this.speechMarkers.length > 0) {
                        this.startSyncTracking();
                    }
                }
                
            } else {
                console.error(`❌ Slide ${this.currentSlide}'da konuşma metni extraction BAŞARISIZ`);
                console.warn(`⚠️ Extraction debug bilgileri kontrol edildi`);
                
                this.speechText = '';
                this.speechMarkers = [];
                
                if (window.prompterSystem) {
                    window.prompterSystem.updatePrompterText(`Slide ${this.currentSlide} - ${this.topicSlug} konusu devam ediyor...`);
                }
            }
            
        } catch (error) {
            console.error('❌ Prompter metni güncellenirken hata:', error);
            this.speechText = '';
            this.speechMarkers = [];
        }
        
        console.groupEnd();
    }

    // *** 🔥 TAMAMEN YENİDEN YAZILMIŞ: TEACHER TEXT EXTRACTION ***
    extractTeacherText(htmlContent) {
        console.group('🔍 Gelişmiş konuşma metni extraction başlıyor...');
        
        try {
            // Debugging için dosya yapısını analiz et
            console.log(`📊 Toplam content uzunluğu: ${htmlContent.length} karakter`);
            
            // YÖNTEM 1: </html> sonrasındaki content (EN YAYGINI)
            const htmlEndIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
            console.log(`📍 </html> pozisyonu: ${htmlEndIndex}`);
            
            if (htmlEndIndex !== -1) {
                const afterHtmlContent = htmlContent.substring(htmlEndIndex + 7).trim();
                console.log(`📦 </html> sonrası content uzunluğu: ${afterHtmlContent.length} karakter`);
                
                if (afterHtmlContent.length > 50) {
                    console.log(`📝 </html> sonrası ilk 200 karakter: ${afterHtmlContent.substring(0, 200)}`);
                    
                    // Comment wrapper kontrol et (<!-- ... -->)
                    const commentMatch = afterHtmlContent.match(/^<!--\s*([\s\S]*?)\s*-->$/);
                    
                    if (commentMatch) {
                        console.log('✅ Comment wrapper bulundu');
                        const commentContent = commentMatch[1].trim();
                        
                        if (commentContent.length > 100) {
                            const cleanText = this.cleanSpeechText(commentContent);
                            if (cleanText && this.isValidTeacherText(cleanText)) {
                                console.log('🎯 BAŞARILI: Comment içinde teacher text bulundu');
                                console.groupEnd();
                                return cleanText;
                            }
                        }
                    } else {
                        console.log('📝 Comment wrapper yok, direkt content olarak deneniyor');
                        
                        // Comment olmayan direkt content
                        const cleanText = this.cleanSpeechText(afterHtmlContent);
                        if (cleanText && this.isValidTeacherText(cleanText)) {
                            console.log('🎯 BAŞARILI: Direkt content olarak teacher text bulundu');
                            console.groupEnd();
                            return cleanText;
                        }
                    }
                }
            }
            
            // YÖNTEM 2: HTML içindeki comment'ları tara
            console.log('🔄 HTML içindeki comment\'leri tarıyorum...');
            const commentRegex = /<!--([\s\S]*?)-->/g;
            const allComments = [...htmlContent.matchAll(commentRegex)];
            
            console.log(`📊 Bulunan comment sayısı: ${allComments.length}`);
            
            if (allComments.length > 0) {
                // Comment'leri analiz et ve en iyi adayı bul
                const candidateComments = allComments
                    .map((match, index) => {
                        const content = match[1].trim();
                        const score = this.scoreTeacherText(content);
                        
                        console.log(`📝 Comment ${index + 1}: ${content.length} karakter, skor: ${score}`);
                        
                        return {
                            content: content,
                            score: score,
                            index: index
                        };
                    })
                    .filter(item => item.score > 5) // Minimum eşik
                    .sort((a, b) => b.score - a.score); // En yüksek skordan düşüğe
                
                if (candidateComments.length > 0) {
                    const bestCandidate = candidateComments[0];
                    console.log(`🏆 En iyi aday: Comment ${bestCandidate.index + 1} (skor: ${bestCandidate.score})`);
                    
                    const cleanText = this.cleanSpeechText(bestCandidate.content);
                    if (cleanText) {
                        console.log('🎯 BAŞARILI: HTML comment içinde teacher text bulundu');
                        console.groupEnd();
                        return cleanText;
                    }
                }
            }
            
            // YÖNTEM 3: Son çare - büyük text blokları ara
            console.log('🔄 Son çare: Büyük text bloklarını arıyorum...');
            
            const lines = htmlContent.split('\n');
            let potentialTexts = [];
            let currentBlock = '';
            let inTextBlock = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // HTML tag'i değilse ve yeterince uzunsa
                if (line.length > 20 && !line.match(/^<[^>]*>/) && !line.includes('<!DOCTYPE')) {
                    currentBlock += line + ' ';
                    inTextBlock = true;
                } else if (inTextBlock && currentBlock.length > 200) {
                    potentialTexts.push(currentBlock.trim());
                    currentBlock = '';
                    inTextBlock = false;
                } else {
                    currentBlock = '';
                    inTextBlock = false;
                }
            }
            
            // Son blok
            if (currentBlock.length > 200) {
                potentialTexts.push(currentBlock.trim());
            }
            
            console.log(`📊 Bulunan text blok sayısı: ${potentialTexts.length}`);
            
            if (potentialTexts.length > 0) {
                // En iyi text bloğunu bul
                const scoredTexts = potentialTexts
                    .map((text, index) => ({
                        text: text,
                        score: this.scoreTeacherText(text),
                        index: index
                    }))
                    .filter(item => item.score > 3)
                    .sort((a, b) => b.score - a.score);
                
                if (scoredTexts.length > 0) {
                    const bestText = scoredTexts[0];
                    console.log(`🏆 En iyi text blok: ${bestText.index + 1} (skor: ${bestText.score})`);
                    
                    const cleanText = this.cleanSpeechText(bestText.text);
                    if (cleanText) {
                        console.log('🎯 BAŞARILI: Text blok içinde teacher text bulundu');
                        console.groupEnd();
                        return cleanText;
                    }
                }
            }
            
            console.error('❌ HİÇBİR YÖNTEMLE TEACHER TEXT BULUNAMADI');
            console.warn('🔍 Debug için detaylar:');
            console.warn(`- Toplam content: ${htmlContent.length} karakter`);
            console.warn(`- HTML end index: ${htmlEndIndex}`);
            console.warn(`- Comment sayısı: ${allComments.length}`);
            console.warn(`- Text blok sayısı: ${potentialTexts.length}`);
            
            console.groupEnd();
            return null;
            
        } catch (error) {
            console.error('❌ Teacher text extraction hatası:', error);
            console.groupEnd();
            return null;
        }
    }

    // *** YENİ: TEACHER TEXT SKORLAMA SİSTEMİ ***
    scoreTeacherText(text) {
        if (!text || text.length < 50) return 0;
        
        let score = 0;
        
        // Uzunluk skoru (100-1000 karakter ideal)
        if (text.length >= 100 && text.length <= 1000) {
            score += 3;
        } else if (text.length > 1000 && text.length <= 2000) {
            score += 2;
        } else if (text.length > 2000) {
            score += 1;
        }
        
        // Anahtar kelime skoru
        const teacherKeywords = [
            'Merhaba', 'gençler', 'Bugün', 'sizlerle', 'öğreneceğiz',
            'bakalım', 'örneğin', 'Fizik', 'dersimiz', 'konuşacağız',
            'anlayalım', 'inceleyelim', 'görelim', 'öğrenelim'
        ];
        
        teacherKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 2;
            }
        });
        
        // Marker skoru ([KART-0] vs)
        const markerCount = (text.match(/\[(?:KART|CARD|SHOW)-\d+\]/g) || []).length;
        score += markerCount * 3; // Her marker için 3 puan
        
        // Cümle yapısı skoru
        const sentenceCount = text.split('.').length - 1;
        if (sentenceCount > 3 && sentenceCount < 20) {
            score += 2;
        }
        
        // HTML content negatif skoru
        if (text.includes('<') && text.includes('>')) {
            score -= 5; // HTML içeriği teacher text değil
        }
        
        return score;
    }

    // *** YENİ: TEACHER TEXT VALİDASYON ***
    isValidTeacherText(text) {
        if (!text || text.length < 100) return false;
        
        // Çok HTML'li içerik olmasın
        const htmlTagCount = (text.match(/<[^>]*>/g) || []).length;
        if (htmlTagCount > 5) return false;
        
        // En az bir teacher-like kelime olsun
        const teacherWords = ['Merhaba', 'gençler', 'Bugün', 'sizlerle', 'öğren', 'bakalım', 'örneğin', 'KART'];
        const hasTeacherWord = teacherWords.some(word => text.includes(word));
        
        return hasTeacherWord;
    }

    // *** GÜNCELLENEN: CLEAN SPEECH TEXT ***
    cleanSpeechText(rawText) {
        if (!rawText) return null;
        
        let cleanText = rawText
            // HTML comment işaretlerini kaldır
            .replace(/<!--[\s\S]*?-->/g, '')
            // HTML taglerini kaldır
            .replace(/<[^>]*>/g, '')
            // Fazla boşlukları tek boşluğa çevir
            .replace(/\s+/g, ' ')
            // Fazla satır atlamalarını temizle
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Başlangıç ve bitişteki boşlukları temizle
            .trim();
        
        if (cleanText.length < 50) {
            console.warn('⚠️ Çok kısa metin:', cleanText.length, 'karakter');
            return null;
        }
        
        // Çok uzunsa kırp
        if (cleanText.length > 5000) {
            cleanText = cleanText.substring(0, 5000) + '...';
            console.log('📏 Metin kırpıldı: 5000 karakter');
        }
        
        return cleanText;
    }

    // *** DİğER MEVCUT METODLAR DEğİŞMEDİ ***
    hideAllCards() {
        this.allCards.forEach((card, index) => {
            card.style.opacity = '0 !important';
            card.style.transform = 'translateY(30px) scale(0.9) !important';
            card.style.pointerEvents = 'none !important';
            card.style.visibility = 'visible';
            card.classList.remove('visible', 'show', 'card-visible', 'animate-in');
            
            card.style.setProperty('opacity', '0', 'important');
            card.style.setProperty('transform', 'translateY(30px) scale(0.9)', 'important');
        });
    }

    setupCardEvents() {
        document.addEventListener('click', (e) => {
            if (!this.cardAnimationEnabled) return;
            
            if (e.ctrlKey && !this.isDrawingActive) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.revealNextCard();
                return false;
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            if (!this.cardAnimationEnabled) return;
            
            if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                this.revealNextCard();
            }
            else if (e.key === 'v' && e.ctrlKey) {
                e.preventDefault();
                this.resetCards();
            }
            else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                this.revealNextCard();
            }
            // 🆕 YENİ: Alt+S için auto sync toggle
            else if (e.key.toLowerCase() === 's' && e.altKey) {
                e.preventDefault();
                this.toggleAutoSync();
            }
        });
    }

    setupCardAnimation() {
        this.setupCardEvents();
    }

    revealNextCard() {
        if (!this.cardAnimationEnabled || this.cardIndex >= this.allCards.length) {
            return;
        }

        const card = this.allCards[this.cardIndex];
        console.log(`🎯 Kart ${this.cardIndex + 1}/${this.allCards.length} gösteriliyor (manuel)`);

        card.style.setProperty('opacity', '1', 'important');
        card.style.setProperty('transform', 'translateY(0) scale(1)', 'important');
        card.style.setProperty('pointer-events', 'auto', 'important');
        
        card.classList.add('visible', 'show', 'card-visible', 'animate-in');

        this.cardIndex++;
    }

    resetCards() {
        if (!this.cardAnimationEnabled) return;
        
        this.allCards.forEach((card, index) => {
            card.style.setProperty('opacity', '0', 'important');
            card.style.setProperty('transform', 'translateY(30px) scale(0.9)', 'important');
            card.style.setProperty('pointer-events', 'none', 'important');
            card.classList.remove('visible', 'show', 'card-visible', 'animate-in');
        });
        
        this.cardIndex = 0;
        this.lastTriggeredMarker = -1; // 🆕 Sync durumunu da sıfırla
        
        if (this.autoSyncEnabled) {
            this.stopSyncTracking();
            setTimeout(() => this.startSyncTracking(), 500);
        }
        
        console.log('✅ Tüm kartlar sıfırlandı (sync dahil)');
    }

    goToSlide(slideNumber) {
        if (this.isDrawingActive) return;
        if (slideNumber < 1 || slideNumber > this.totalSlides) return;
        if (this.currentSlide === slideNumber) return;

        // 🆕 Sync tracking'i durdur
        this.stopSyncTracking();

        this.slides.forEach(slide => slide.classList.remove('active'));

        const targetSlide = this.slides[slideNumber - 1];
        if (targetSlide) {
            targetSlide.classList.add('active');
        }

        const previousSlide = this.currentSlide;
        this.currentSlide = slideNumber;
        
        console.log(`🎯 Slide değişti: ${previousSlide} → ${this.currentSlide}`);
        
        setTimeout(() => {
            this.detectCardsInCurrentSlide();
        }, 200);
        
        this.updateUI();
        this.updatePrompterText();
        this.notifyQuestionSystem();
    }

    async loadSlides() {
        const container = document.getElementById('slideContainer');
        const slideElements = [];

        container.innerHTML = '<div class="loading">Slide\'lar yükleniyor...</div>';

        for (let i = 1; i <= this.maxSlides; i++) {
            try {
                const response = await fetch(`${this.topicSlug}/slide-${i}.txt`);
                
                if (response.ok) {
                    const content = await response.text();
                    
                    const slide = document.createElement('div');
                    slide.className = 'slide';
                    slide.setAttribute('data-slide', i);
                    slide.innerHTML = content;
                    
                    if (i === 1) slide.classList.add('active');
                    
                    slideElements.push(slide);
                    this.totalSlides = i;
                    console.log(`📄 Slide ${i} yüklendi`);
                } else {
                    console.log(`⚠️ Slide ${i} bulunamadı (${response.status}), yükleme durduruluyor`);
                    break;
                }
            } catch (error) {
                console.warn(`❌ Slide ${i} yüklenirken hata:`, error);
                break;
            }
        }

        container.innerHTML = '';
        
        if (slideElements.length === 0) {
            container.innerHTML = '<div class="loading">❌ Hiç slide bulunamadı!</div>';
            return;
        }

        slideElements.forEach(slide => {
            container.appendChild(slide);
        });

        this.slides = slideElements;
        console.log(`✅ Toplam ${this.totalSlides} slide yüklendi`);
        
        setTimeout(() => {
            this.detectCardsInCurrentSlide();
        }, 500);
    }

    setupDrawingDetection() {
        const checkDrawingStatus = () => {
            const drawingOverlay = document.getElementById('drawingOverlay');
            this.isDrawingActive = drawingOverlay && drawingOverlay.classList.contains('active');
        };

        const observer = new MutationObserver(checkDrawingStatus);
        const drawingOverlay = document.getElementById('drawingOverlay');
        
        if (drawingOverlay) {
            observer.observe(drawingOverlay, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        checkDrawingStatus();
    }

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Kart kontrolleri için sadece reset kaldı (Ctrl+V)
            if (this.cardAnimationEnabled && !this.isDrawingActive) {
                // Ctrl+C kaldırıldı - manuel kart açma artık yok
                if (e.key === 'v' && e.ctrlKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.resetCards();
                    return false;
                }
            }

            if (this.isDrawingActive) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousSlide();
            } 
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextSlide();
            }
            else if (e.key === 'Home') {
                e.preventDefault();
                this.goToSlide(1);
            }
            else if (e.key === 'End') {
                e.preventDefault();
                this.goToSlide(this.totalSlides);
            }
            else if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                window.location.href = '../index.html';
            }
        });
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    previousSlide() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    updateUI() {
        if (this.totalSlides > 0) {
            const progress = (this.currentSlide / this.totalSlides) * 100;
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }

        document.title = `Slide ${this.currentSlide}/${this.totalSlides}${this.autoSyncEnabled ? ' (AUTO-SYNC)' : ''}`;
    }

    notifyQuestionSystem() {
        if (window.questionSystem) {
            console.log(`📝 Question System'e slide değişikliği bildiriliyor: ${this.currentSlide}`);
            window.questionSystem.onSlideChange(this.currentSlide);
        }
        
        window.dispatchEvent(new CustomEvent('slideChanged', {
            detail: { 
                slideNumber: this.currentSlide,
                totalSlides: this.totalSlides,
                topicSlug: this.topicSlug
            }
        }));
        
        window.currentSlideNumber = this.currentSlide;
    }

    // Global erişim fonksiyonları
    manualRevealCard() {
        this.revealNextCard();
    }

    manualResetCards() {
        this.resetCards();
    }
    
    // 🆕 YENİ: Global sync kontrol fonksiyonları
    enableAutoSync() {
        if (!this.autoSyncEnabled) {
            this.toggleAutoSync();
        }
    }
    
    disableAutoSync() {
        if (this.autoSyncEnabled) {
            this.toggleAutoSync();
        }
    }
    
    getSyncStatus() {
        return {
            autoSyncEnabled: this.autoSyncEnabled,
            cardAnimationEnabled: this.cardAnimationEnabled,
            markersFound: this.speechMarkers.length,
            currentPosition: this.currentSpeechPosition,
            lastTriggered: this.lastTriggeredMarker,
            totalCards: this.allCards.length,
            revealedCards: this.cardIndex
        };
    }
}

// Uyumluluk fonksiyonları
let slideLoader;

document.addEventListener('DOMContentLoaded', () => {
    const pathArray = window.location.pathname.split('/');
    const fileName = pathArray[pathArray.length - 1];
    const topicSlug = fileName.replace('.html', '');
    
    slideLoader = new EnhancedSlideLoader(topicSlug);
    window.slideLoader = slideLoader;
    
    // 🆕 YENİ: Global sync fonksiyonları  
    window.resetCards = () => slideLoader.manualResetCards();
    window.toggleAutoSync = () => slideLoader.toggleAutoSync();
    window.enableAutoSync = () => slideLoader.enableAutoSync();
    window.disableAutoSync = () => slideLoader.disableAutoSync();
    window.getSyncStatus = () => slideLoader.getSyncStatus();
    
    console.log('🎯 Enhanced SlideLoader SYNC sistemi hazır');
    console.log('🎮 Kontroller:');
    console.log('   • Ctrl+C: Sonraki kart göster');
    console.log('   • Ctrl+V: Kartları sıfırla');  
    console.log('   • Alt+S: Auto-sync aç/kapat');
    console.log('   • Shift+Enter: Manuel kart göster (backup)');
    console.log('   • 🔇 Ses efektleri kapatıldı');
    console.log('   • Auto-Sync: Prompter ile otomatik senkronizasyon');
});

// Touch/Swipe desteği (değişmedi)
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let isTouchActive = false;

document.addEventListener('touchstart', (e) => {
    if (slideLoader && slideLoader.isDrawingActive) return;

    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    isTouchActive = true;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    if (slideLoader && slideLoader.isDrawingActive) {
        isTouchActive = false;
        return;
    }

    if (!isTouchActive) return;

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    handleSwipe();
    isTouchActive = false;
}, { passive: true });

function handleSwipe() {
    if (!slideLoader || slideLoader.isDrawingActive) return;
    
    const swipeThreshold = 100;
    const verticalThreshold = 150;
    
    const horizontalDiff = touchStartX - touchEndX;
    const verticalDiff = Math.abs(touchStartY - touchEndY);
    
    if (verticalDiff > verticalThreshold) return;
    
    if (Math.abs(horizontalDiff) > swipeThreshold) {
        if (horizontalDiff > 0) {
            slideLoader.nextSlide();
        } else {
            slideLoader.previousSlide();
        }
    }
}

// Notification animasyonları için CSS
const syncStyles = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

if (!document.getElementById('syncAnimationStyles')) {
    const syncStyleSheet = document.createElement('style');
    syncStyleSheet.id = 'syncAnimationStyles';
    syncStyleSheet.textContent = syncStyles;
    document.head.appendChild(syncStyleSheet);
}