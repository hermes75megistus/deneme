#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fizik Eğitim Sistemi - Otomatik Konu Üretici
Pages klasöründeki HTML dosyalarını tarar ve topics.json oluşturur
"""

import os
import json
import re
from datetime import datetime

def scan_pages_directory():
    """Pages klasöründeki HTML dosyalarını tarar"""
    pages_dir = 'pages'
    topics = []
    
    print("🔍 Pages klasörü taranıyor...")
    
    if not os.path.exists(pages_dir):
        print(f"❌ {pages_dir} klasörü bulunamadı!")
        return []
    
    # Klasördeki dosyaları listele
    files = [f for f in os.listdir(pages_dir) if f.endswith('.html')]
    print(f"📁 {len(files)} HTML dosyası bulundu")
    
    for file in files:
        try:
            file_path = os.path.join(pages_dir, file)
            
            # Dosyayı oku
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Title etiketini bul
            title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
            
            if title_match:
                title = title_match.group(1).strip()
                slug = os.path.splitext(file)[0]
                
                # Slide klasörü var mı kontrol et
                slide_dir = os.path.join(pages_dir, slug)
                has_slides = os.path.exists(slide_dir) and os.path.exists(os.path.join(slide_dir, 'slide-1.txt'))
                
                # İkon ve açıklama oluştur
                icon = generate_icon(title)
                description = generate_description(title)
                
                topic = {
                    'file': file,
                    'title': title,
                    'slug': slug,
                    'icon': icon,
                    'description': description,
                    'has_slides': has_slides,
                    'last_updated': datetime.now().isoformat()
                }
                
                topics.append(topic)
                print(f"✅ {file} -> {title}")
                
            else:
                print(f"⚠️  {file} dosyasında title etiketi bulunamadı")
                
        except Exception as e:
            print(f"❌ {file} okunurken hata: {e}")
    
    # Alfabetik sırala
    topics.sort(key=lambda x: x['title'])
    return topics

def generate_icon(title):
    """Title'dan ikon tahmin et"""
    title_lower = title.lower()
    
    icon_map = {
        'fizik': '⚛️',
        'elektrik': '⚡', 
        'manyetik': '🧲',
        'dalga': '🌊',
        'ses': '🌊',
        'ışık': '💡',
        'optik': '💡',
        'atom': '⚛️',
        'hareket': '🏃‍♂️',
        'kuvvet': '💪',
        'enerji': '⚡',
        'sıcaklık': '🌡️',
        'ısı': '🌡️',
        'madde': '🧪',
        'malzeme': '🧪',
        'sıvı': '💧',
        'akışkan': '💧',
        'basınç': '🌡️',
        'giriş': '📚',
        'temel': '📚',
        'matematik': '📐',
        'geometri': '📐',
        'deney': '🔬',
        'laboratuvar': '🔬'
    }
    
    for keyword, icon in icon_map.items():
        if keyword in title_lower:
            return icon
    
    return '📖'  # Varsayılan ikon

def generate_description(title):
    """Title'dan açıklama oluştur"""
    return f"{title} konusu"

def create_topics_json(topics):
    """topics.json dosyası oluştur"""
    os.makedirs('js', exist_ok=True)
    
    json_data = {
        'generated_at': datetime.now().isoformat(),
        'total_topics': len(topics),
        'topics': topics
    }
    
    with open('js/topics.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"📄 js/topics.json dosyası oluşturuldu")

def create_topic_loader_js():
    """topics.json'u okuyan JavaScript dosyası oluştur"""
    js_content = '''// ===== OTOMATİK KONU YÜKLEYİCİ =====
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
document.head.appendChild(styleSheet);'''

    with open('js/topic-loader.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"📄 js/topic-loader.js dosyası oluşturuldu")

def main():
    """Ana fonksiyon"""
    print("🚀 Fizik Eğitim Sistemi - Konu Üretici")
    print("=" * 50)
    
    # Pages klasörünü tara
    topics = scan_pages_directory()
    
    if topics:
        # JSON dosyası oluştur
        create_topics_json(topics)
        
        # JavaScript loader oluştur
        create_topic_loader_js()
        
        print("=" * 50)
        print(f"✅ {len(topics)} konu başarıyla işlendi!")
        print("📋 Bulunan konular:")
        for topic in topics:
            status = "✅" if topic['has_slides'] else "⏳"
            print(f"   {status} {topic['icon']} {topic['title']}")
        
        print("\n🎯 Yapılacaklar:")
        print("1. index.html'de script'i değiştir:")
        print("   <script src='js/topic-loader.js'></script>")
        print("2. Sayfayı yenile!")
        
    else:
        print("❌ Hiç konu bulunamadı!")
        print("💡 pages/ klasörüne HTML dosyaları ekleyin")

if __name__ == "__main__":
    main()
