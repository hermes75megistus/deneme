// ===== OTOMATİK KONU YÜKLEYİCİ =====
class TopicLoader {
    constructor() {
        this.topics = [];
        this.init();
    }

    async init() {
        const container = document.querySelector('.container');
        if (!container) return;

        this.showLoading(container);
        await this.loadTopics();
        this.renderPage(container);
    }

    showLoading(container) {
        container.innerHTML = `
            <header>
                <h1>🔬 2025 Eğitim Platformu</h1>
                <p>Interaktif Fizik Dersleri</p>
            </header>
            <main style="display: flex; justify-content: center; align-items: center; flex: 1;">
                <div style="text-align: center; color: white; font-size: 1.2em;">
                    <div style="font-size: 3em; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
                    Konular yükleniyor...
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

    async loadTopics() {
        try {
            const response = await fetch('js/topics.json');
            const data = await response.json();
            this.topics = data.topics || [];
            console.log(`✅ ${this.topics.length} konu yüklendi`);
        } catch (error) {
            console.error('❌ topics.json yüklenemedi:', error);
            this.topics = [];
        }
    }

    renderPage(container) {
        if (this.topics.length === 0) {
            container.innerHTML = `
                <header>
                    <h1>🔬 2025 Eğitim Platformu</h1>
                    <p>Interaktif Fizik Dersleri</p>
                </header>
                <main style="display: flex; justify-content: center; align-items: center; flex: 1;">
                    <div style="text-align: center; color: white;">
                        <div style="font-size: 3em; margin-bottom: 20px;">😊</div>
                        <h2>Henüz konu yok</h2>
                        <p>pages/ klasörüne HTML dosyaları ekleyin</p>
                        <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.8;">
                            Yeni konu ekledikten sonra:<br>
                            <code>python generate_topics.py</code> çalıştırın
                        </p>
                    </div>
                </main>
                <footer>
                    <p>🎯 2025 Eğitim Platformu</p>
                </footer>
            `;
            return;
        }

        container.innerHTML = `
            <header>
                <h1>🔬 2025 Eğitim Platformu</h1>
                <p>Interaktif Fizik Dersleri</p>
            </header>
            <main class="menu-grid">
                ${this.topics.map(topic => this.createTopicCard(topic)).join('')}
                ${this.createAddTopicCard()}
            </main>
            <footer>
                <p>🎯 2025 Eğitim Platformu - ${this.topics.length} konu</p>
            </footer>
        `;
    }

    createTopicCard(topic) {
        const status = topic.has_slides ? '' : 'disabled';
        const statusBadge = topic.has_slides ? '' : '<span class="status-badge">Yakında...</span>';
        
        return `
            <a href="pages/${topic.slug}.html" class="menu-card ${status}">
                <div class="card-icon">${topic.icon}</div>
                <h3>${topic.title}</h3>
                <p>${topic.description}</p>
                ${statusBadge}
            </a>
        `;
    }

    createAddTopicCard() {
        return `
            <div class="menu-card add-topic-card" onclick="showAddInstructions()" style="border: 2px dashed rgba(255,255,255,0.3); cursor: pointer;">
                <div class="card-icon">➕</div>
                <h3>Yeni Konu Ekle</h3>
                <p>Python script ile otomatik</p>
            </div>
        `;
    }
}

// Global fonksiyon
window.showAddInstructions = function() {
    alert(`📝 Yeni Konu Ekleme:

1. pages/konuadı.html oluştur
2. <title>Konu Başlığı</title> ekle
3. Terminal'de: python generate_topics.py
4. Sayfayı yenile

✅ Tamamen otomatik sistem!`);
};

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new TopicLoader();
});

// CSS stilleri
const styles = `
.status-badge {
    background: rgba(231, 76, 60, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    margin-top: 10px;
    display: inline-block;
}

.menu-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.menu-card.disabled:hover {
    transform: none !important;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
}

.add-topic-card:hover {
    border-color: rgba(255,255,255,0.6) !important;
    background: rgba(255,255,255,0.1) !important;
    transform: translateY(-5px) !important;
}

code {
    background: rgba(0,0,0,0.3);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);