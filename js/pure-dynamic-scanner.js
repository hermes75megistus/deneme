// js/pure-dynamic-scanner.js - DÜZELTILMIŞ VERSİYON

class SmartFileScanner {
    constructor() {
        this.topics = [];
        this.init();
    }

    async init() {
        const container = document.querySelector('.container');
        if (!container) return;

        this.showLoading(container);
        
        // topics.json'u kontrol et
        const hasTopicsJson = await this.checkTopicsJson();
        
        if (hasTopicsJson) {
            await this.loadFromTopicsJson();
        } else {
            await this.scanPagesFolder();
        }
        
        this.renderPage(container);
    }

    async checkTopicsJson() {
        try {
            const response = await fetch('js/topics.json');
            return response.ok;
        } catch {
            return false;
        }
    }

    async loadFromTopicsJson() {
        try {
            const response = await fetch('js/topics.json');
            const data = await response.json();
            
            for (const topic of data.topics) {
                this.topics.push({
                    slug: topic.slug,
                    title: topic.title,
                    icon: topic.icon,
                    description: topic.description,
                    hasContent: topic.has_slides
                });
            }
        } catch (error) {
            console.error('topics.json yüklenemedi:', error);
        }
    }

    async scanPagesFolder() {
        // Bilinen dosya listesi - manuel olarak eklenmiş
        const knownFiles = [
            'fizik-bilimine-giris.html',
            // Buraya yeni dosyalar eklenebilir
        ];

        for (const fileName of knownFiles) {
            try {
                const response = await fetch(`pages/${fileName}`);
                if (response.ok) {
                    const html = await response.text();
                    const title = this.extractTitle(html);
                    
                    if (title) {
                        const slug = fileName.replace('.html', '');
                        const hasContent = await this.checkHasSlides(slug);
                        
                        this.topics.push({
                            slug,
                            title,
                            icon: this.getIcon(title),
                            description: `${title} konusu`,
                            hasContent
                        });
                    }
                }
            } catch (error) {
                console.log(`${fileName} yüklenemedi`);
            }
        }
    }

    extractTitle(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return titleMatch ? titleMatch[1].trim() : null;
    }

    async checkHasSlides(topicSlug) {
        try {
            const response = await fetch(`pages/${topicSlug}/slide-1.txt`);
            return response.ok;
        } catch {
            return false;
        }
    }

    getIcon(title) {
        const icons = ['📚', '🧪', '⚡', '🌊', '💡', '⚛️', '🔬', '📖', '🎯', '🔍'];
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = ((hash << 5) - hash + title.charCodeAt(i)) & 0xffffffff;
        }
        return icons[Math.abs(hash) % icons.length];
    }

    showLoading(container) {
        container.innerHTML = `
            <header>
                <h1>🔬 2025 Eğitim Platformu</h1>
                <p>İnteraktif Eğitim Sistemi</p>
            </header>
            <main style="display: flex; justify-content: center; align-items: center; flex: 1;">
                <div style="text-align: center; color: white; font-size: 1.2em;">
                    <div style="font-size: 3em; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
                    İçerikler yükleniyor...
                </div>
            </main>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }

    renderPage(container) {
        if (this.topics.length === 0) {
            container.innerHTML = `
                <header>
                    <h1>🔬 2025 Eğitim Platformu</h1>
                    <p>İnteraktif Eğitim Sistemi</p>
                </header>
                <main style="display: flex; justify-content: center; align-items: center; flex: 1;">
                    <div style="text-align: center; color: white;">
                        <div style="font-size: 3em; margin-bottom: 20px;">📂</div>
                        <h2>İçerik bulunamadı</h2>
                        <p>pages/ klasöründe HTML dosyası yok</p>
                    </div>
                </main>
                <footer>
                    <p>2025 Eğitim Platformu</p>
                </footer>
            `;
            return;
        }

        container.innerHTML = `
            <header>
                <h1>🔬 2025 Eğitim Platformu</h1>
                <p>İnteraktif Eğitim Sistemi</p>
            </header>
            <main class="menu-grid">
                ${this.topics.map(topic => `
                    <a href="pages/${topic.slug}.html" class="menu-card ${topic.hasContent ? '' : 'disabled'}">
                        <div class="card-icon">${topic.icon}</div>
                        <h3>${topic.title}</h3>
                        <p>${topic.description}</p>
                        ${topic.hasContent ? '' : '<span class="status-badge">Yakında...</span>'}
                    </a>
                `).join('')}
            </main>
            <footer>
                <p>2025 Eğitim Platformu - ${this.topics.length} konu</p>
            </footer>
        `;
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new SmartFileScanner();
});