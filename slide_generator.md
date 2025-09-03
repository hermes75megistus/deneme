# 🎯 GELİŞMİŞ EĞİTİM SİSTEMİ - SLIDE ÜRETİCİ PROMPT v2.0

## 📋 MUTLAK KURALLAR - KESINLIKLE UYMASI GEREKEN

### 🔧 TEKNİK KALIP (DEĞİŞTİRİLEMEZ):

```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>[KONU BAŞLIĞI] - Slide [NUMARA]</title>
</head>
<body class="slide-bg-[blue|green|purple|orange]">
    <div class="slide-content">
        <h1 class="main-title">[EMOJI] [ANA BAŞLIK]</h1>
        <h2 class="subtitle">[ALT BAŞLIK - AÇIKLAYICI]</h2>
        
        <div class="standard-card main-card" data-index="0">
            <h3 class="card-title">[EMOJI] [ANA KONU] [Tanımı/Adımı/Bölümü]</h3>
            <p class="card-content">[KISA VE NET İÇERİK - 1-2 CÜMLE]</p>
        </div>
        
        [KART GRUPLARI - AŞAĞIDA DETAY]
        
    </div>
</body>
</html>
<!--
[KONUŞMA METNİ İLE MARKER'LAR - AŞAĞIDA DETAY]
-->
```

---

## 🎨 CSS SINIFLARI (MEVCUT - YENİ OLUŞTURMA):

### ✅ KULLANILACAK SINIFLAR:
- **Container:** `slide-content`
- **Başlıklar:** `main-title`, `subtitle`
- **Kartlar:** `standard-card`, `main-card`
- **Kart İçeriği:** `card-title`, `card-content`
- **Özel:** `highlight-text`
- **Grid Sistemleri:** `concepts-grid`, `branches-grid`, `examples-grid`
- **Background:** `slide-bg-blue`, `slide-bg-green`, `slide-bg-purple`, `slide-bg-orange`

### ❌ YASAK:
- Yeni CSS class oluşturmak
- Inline style kullanmak
- Mevcut sistemin dışına çıkmak

---

## 🃏 KART SİSTEMİ KALIPLARI:

### 1. **Ana Kart (Her Slide'da Mutlaka İlk):**
```html
<div class="standard-card main-card" data-index="0">
    <h3 class="card-title">[EMOJI] [KONU] [Tanımı/Adımı/Bölümü]</h3>
    <p class="card-content">[SLIDE'A ÖZEL İÇERİK]</p>
</div>
```

### 2. **İkili Grid (2 Kart):**
```html
<div class="concepts-grid">
    <div class="standard-card" data-index="1">
        <h4 class="card-title">[EMOJI] [BAŞLIK]</h4>
        <p class="card-content">[İÇERİK]</p>
    </div>
    <div class="standard-card" data-index="2">
        <h4 class="card-title">[EMOJI] [BAŞLIK]</h4>
        <p class="card-content">[İÇERİK]</p>
    </div>
</div>
```

### 3. **Highlight Kart (Vurgu):**
```html
<div class="standard-card" data-index="X">
    <div class="highlight-text">[EMOJI] [VURGULU MESAJ] [EMOJI]</div>
</div>
```

### 4. **Çoklu Grid (4+ Kart):**
```html
<div class="branches-grid">
    <div class="standard-card" data-index="X">
        <h4 class="card-title">[EMOJI] [BAŞLIK]</h4>
        <p class="card-content">[İÇERİK]</p>
    </div>
    <!-- 4-6 kart arası -->
</div>
```

---

## 📖 KONUŞMA METNİ KURALLARI:

### ✅ TEK SLİDE FORMAT:
```
<!--
Merhaba! Bugün sizlerle [KONU]yı öğreneceğiz. [KART-0] [ANA AÇIKLAMA]

[İLK GRUP AÇIKLAMA] [KART-1] [BİRİNCİ DETAY] [KART-2] [İKİNCİ DETAY]

[İKİNCİ GRUP AÇIKLAMA] [KART-3] [ÜÇÜNCÜ DETAY] [KART-4] [DÖRDÜNCÜ DETAY]

[KART-5] [VURGU VE AÇIKLAMA]

[SONUÇ] [KART-6] [ÖZETLEMe] [KART-7] [KAPANIŞ]

Bu konuyu anladığınızı düşünüyorum!
-->
```

### ✅ ARDIŞIK SLİDE FORMAT:
```
<!--
[İLK SLIDE İÇİN:]
Merhaba! Bugün sizlerle [GENEL KONU]yu öğrenmeye başlayacağız. İlk olarak [BU SLIDE KONUSU]nu inceleyelim. [KART-0] [ANA AÇIKLAMA]

[DEVAM EDEN AÇIKLAMA VE MARKER'LAR]

Bu bölümü tamamladık. Şimdi bir sonraki adıma geçmeye hazırsınız!

[SONRAKI SLIDE'LAR İÇİN:]
Önceki derste [ÖNCEKİ SLIDE KONUSU]nu öğrenmiştik. Şimdi [BU SLIDE KONUSU]na geçelim. [KART-0] [BAĞLANTI KURAN AÇIKLAMA]

[DEVAM EDEN AÇIKLAMA VE MARKER'LAR]

[SON SLIDE İÇİN:]
Önceki derslerde [ÖZET] öğrendik. Son olarak [SON KONU]yu tamamlayalım. [KART-0] [BAĞLANTI KURAN AÇIKLAMA]

[DEVAM EDEN AÇIKLAMA VE MARKER'LAR]

Tebrikler! [GENEL KONU] konusunu başarıyla tamamladınız!
-->
```

### 🎯 MARKER KURALLARI:
- **Format:** `[KART-0]`, `[KART-1]`, `[KART-2]` ... `[KART-7]`
- **Sıra:** DOM'daki kart sırasına göre (0'dan başlar)
- **Timing:** Kartın konuşulmadan HEMEN ÖNCE yerleştir
- **Limit:** Maksimum 8 kart (0-7 arası) her slide'da

---

## 🚀 YENİ ÖZELLİK: ARDIŞIK SLİDE SİSTEMİ

### 📑 METIN BÖLME STRATEJİLERİ:

#### **1. Konsept Bazlı Bölme:**
- **Kullanım:** Karmaşık konular için
- **Örnek:** "Atom Teorisi" → Slide 1: Atom Tanımı, Slide 2: Parçacıklar, Slide 3: Bağlar

#### **2. Adım Bazlı Bölme:**
- **Kullanım:** Süreç ve yöntemler için
- **Örnek:** "Fotosentez" → Slide 1: Işık Reaksiyonu, Slide 2: Calvin Döngüsü, Slide 3: Ürünler

#### **3. Zorluk Bazlı Bölme:**
- **Kullanım:** Temeldan ileri seviyeye
- **Örnek:** "İntegral" → Slide 1: Tanım, Slide 2: Temel Kurallar, Slide 3: Uygulamalar

#### **4. Kategori Bazlı Bölme:**
- **Kullanım:** Geniş konular için
- **Örnek:** "Dünya Tarihi" → Slide 1: Antik Çağ, Slide 2: Orta Çağ, Slide 3: Modern Çağ

### 🔗 SLİDE BAĞLANTISI KURALLARI:

#### **Giriş Slide (1. Slide):**
- "Merhaba! Bugün sizlerle [GENEL KONU]yu öğrenmeye başlayacağız."
- "İlk olarak [BU SLIDE KONUSU]nu inceleyelim."
- Ana tanım ve temel kavramlar

#### **Orta Slide'lar (2-N arası):**
- "Önceki derste [ÖNCEKİ ÖZET] öğrenmiştik."
- "Şimdi [BU SLIDE KONUSU]na geçelim."
- Bağlantı kuran açıklamalar

#### **Son Slide:**
- "Önceki derslerde [GENEL ÖZET] öğrendik."
- "Son olarak [SON KONU]yu tamamlayalım."
- "Tebrikler! [GENEL KONU] konusunu başarıyla tamamladınız!"

---

## 📏 İÇERİK STANDARTLARI:

### 📝 BAŞLIKLAR:
- **Ana Başlık:** Emoji + 2-4 kelime + [Slide numarası opsiyonel]
- **Alt Başlık:** Açıklayıcı 3-6 kelime 
- **Kart Başlık:** Emoji + 1-3 kelime

### 📄 İÇERİK UZUNLUKLARI:
- **Ana Tanım:** 1-2 cümle, net ve bilimsel
- **Kart İçeriği:** 1 cümle, örnek veya açıklama
- **Highlight:** Vurgulu anahtar mesaj
- **Konuşma Metni:** 250-600 kelime (ardışık slide'larda kısaltılabilir)

### 🎨 EMOJİ KURALLARI:
- Her kart başlığında ilgili emoji
- Ana başlıkta konu emoji
- Highlight'ta çift emoji
- Her disiplin için uygun emoji seçimi (🧪🧬⚗️🔬📊🎨📚🏛️🌍🎵🏃‍♂️etc.)

---

## 🔄 SLİDE TÜRÜ ŞABLONLARI:

### **Tek Slide Şablonları:**
- **8 Kartlı:** Ana kart + 6 kategori + sonuç (branches-grid)
- **6 Kartlı:** Ana kart + 4 örnek + highlight (concepts-grid)  
- **4 Kartlı:** Ana kart + 2 örnek + sonuç (concepts-grid)

### **Ardışık Slide Şablonları:**
- **3-4 Slide:** Karmaşık konular için optimal
- **2-3 Slide:** Orta karmaşıklık konular için
- **5+ Slide:** Çok detaylı konular için (nadir)

---

## 🎯 PROMPT KULLANIMI:

### **Tek Slide Modu:**
**Girdi:** 
> "Konu: [KONU ADI], Tür: [dallar/örnekler/temel], Seviye: [başlangıç/orta/ileri]"

### **Ardışık Slide Modu:**
**Girdi:** 
> "Metin: [UZUN METİN VEYA KONU], Ardışık: [slide sayısı opsiyonel], Seviye: [başlangıç/orta/ileri]"

**Çıktı (Her iki mod için):**
1. **HTML Slide(lar)** (yukarıdaki kalıba uygun)
2. **Konuşma Metni** (marker'lı, `<!---->` içinde)
3. **Dosya Adı:** `slide-X.txt` veya `slide-seri-X-Y.txt` formatında

---

## 🧩 DİSİPLİN ÖZEL ADAPTASYONLAR:

### 🔬 **Fen Bilimleri (Fizik, Kimya, Biyoloji):**
- Emoji: ⚡🧪🧬🔬📊
- Vurgu: Deneyler, formüller, süreçler
- Örnekler: Günlük yaşam uygulamaları

### 📚 **Sosyal Bilimler (Tarih, Coğrafya, Edebiyat):**
- Emoji: 🏛️🌍📖🎭📜
- Vurgu: Olaylar, kişiler, eserler
- Örnekler: Tarihsel bağlam, coğrafi özellikler

### 🔢 **Matematik:**
- Emoji: 🔢📐📊⚖️🎯
- Vurgu: Formüller, işlemler, çözümler
- Örnekler: Pratik problemler, görsel açıklamalar

### 🎨 **Sanat ve Tasarım:**
- Emoji: 🎨🖌️🎭🏗️📐
- Vurgu: Teknikler, stiller, tarihsel dönemler
- Örnekler: Sanat eserleri, tasarım ilkeleri

### 🗣️ **Dil ve Edebiyat:**
- Emoji: 📝🗣️📖🎭📚
- Vurgu: Gramer, edebi türler, yazarlar
- Örnekler: Metinler, cümleler, edebi eserler

### 🏃‍♂️ **Beden Eğitimi ve Spor:**
- Emoji: ⚽🏃‍♂️🏋️‍♀️🏊‍♂️🧘‍♀️
- Vurgu: Teknikler, kurallar, sağlık
- Örnekler: Hareket analizi, taktikler

---

## 🔄 ARDIŞIK SLİDE ÜRETİM KURALLARI:

### 📊 METIN ANALİZİ VE BÖLME:

#### **1. İçerik Analizi:**
- Metni mantıklı bölümlere ayır
- Her bölüm 1 slide = 6-8 kart
- Bağlantı noktalarını belirle
- Zorluk seviyesi gradasyonu

#### **2. Slide Planlama:**
```
Slide 1: [GİRİŞ VE TEMEL KAVRAMLAR]
Slide 2: [DETAYLAR VE ÖRNEKLER]
Slide 3: [UYGULAMALAR VE İLERİ KAVRAMLAR]
Slide N: [SONUÇ VE ÖZETLEMe]
```

#### **3. İçerik Dağılımı:**
- **İlk Slide:** Ana tanım + temel kavramlar
- **Orta Slide'lar:** Detaylar + örnekler + uygulamalar
- **Son Slide:** Özet + sonuç + değerlendirme

### 🔗 SLİDE GEÇİŞ ŞABLONLARI:

#### **Slide 1 (Başlangıç):**
```
Merhaba! Bugün sizlerle [GENEL KONU]yu öğrenmeye başlayacağız. 
Bu konuyu [X] slide'da inceleyeceğiz. 
İlk olarak [BU SLIDE KONUSU]nu öğrenelim.
```

#### **Slide 2-N (Orta):**
```
Önceki slide'da [ÖNCEKİ ÖZET] öğrenmiştik. 
Şimdi [BU SLIDE KONUSU]na geçelim ve konumuzu derinleştirelim.
```

#### **Son Slide:**
```
Önceki slide'larda [GENEL ÖZET] öğrendik. 
Son olarak [SON KONU]yu tamamlayalım ve konumuzu bitirелim.
Tebrikler! [GENEL KONU] konusunu başarıyla tamamladınız!
```

---

## 🎯 KULLANIM MODLARI:

### **MOD 1: Tek Slide Üretimi**
**Girdi:** 
> "Konu: [KONU ADI], Tür: [dallar/örnekler/temel], Seviye: [başlangıç/orta/ileri]"

**Çıktı:** 1 adet slide + konuşma metni

### **MOD 2: Ardışık Slide Üretimi**
**Girdi:** 
> "Metin: [UZUN METİN/KONU], Ardışık: [slide sayısı], Seviye: [seviye], Disiplin: [alan]"

**Çıktı:** N adet slide + bağlantılı konuşma metinleri

### **MOD 3: Metin İşleme Modu**
**Girdi:** 
> "Dönüştür: [MEVCUT METİN], Format: slide, Bölüm: [kaç slide]"

**Çıktı:** Metinden çıkarılmış ardışık slide'lar

---

## 📋 ARDİŞIK SLİDE ÖRNEĞİ:

### **İstek:** "Metin: [Fotosentez hakkında 1000 kelimelik metin], Ardışık: 3, Seviye: orta"

### **Beklenen Çıktı:**
- **Slide 1:** Fotosentez Tanımı ve Önemi (6 kart)
- **Slide 2:** Işık ve Karanlık Reaksiyonları (7 kart)  
- **Slide 3:** Sonuçlar ve Çevre Etkileri (6 kart)
- **Konuşma:** Bağlantılı 3 ayrı metin (birbirinin devamı)

---

## ⚠️ UYARI VE YASAK ALANLAR:

### ❌ YAPILMAYACAKLAR:
- Yeni CSS class yaratmak
- Kalıbın dışına çıkmak
- Marker formatını değiştirmek
- 8'den fazla kart oluşturmak (her slide için)
- Slide'lar arası bağlantıyı koparmak
- İçeriği 1000 kelimeyi aşırmak (toplam konuşma metni)

### ✅ YAPILACAKLAR:
- Sadece mevcut CSS class'ları kullan
- DOM sırasını marker sırasıyla eşleştir
- Slide'lar arası akıcı geçiş sağla
- Her disiplin için uygun emoji ve terminoloji kullan
- Eğitim seviyesine uygun dil kullan
- Konuyu mantıklı parçalara böl

---

## 🎮 KULLANIM ÖRNEKLERİ:

### **Örnek 1 - Tek Slide:**
**İstek:** "Konu: Güneş Sistemi, Tür: dallar, Seviye: başlangıç"
**Çıktı:** 8 kartlı slide (Ana tanım + 6 gezegen grubu + sonuç)

### **Örnek 2 - Ardışık Slide:**
**İstek:** "Metin: [Osmanlı İmparatorluğu detaylı metni], Ardışık: 4, Seviye: orta"
**Çıktı:** 4 ayrı slide (Kuruluş, Yükseliş, Duraklama, Dağılma)

### **Örnek 3 - Metin Dönüştürme:**
**İstek:** "Dönüştür: [DNA replikasyonu uzun açıklama], Format: slide, Bölüm: 3"
**Çıktı:** 3 slide (DNA Yapısı, Replikasyon Süreci, Hatalar ve Onarım)

---

## 🔧 TEKNİK NOTLAR:

### **Dosya Adlandırma:**
- **Tek Slide:** `slide-[konu].txt`
- **Ardışık:** `slide-seri-[konu]-[1-N].txt`

### **Background Renk Seçimi:**
- **Fen:** blue (mavi)
- **Sosyal:** green (yeşil)  
- **Matematik:** purple (mor)
- **Sanat/Diğer:** orange (turuncu)

### **Optimizasyon:**
- Her slide kendi başına anlaşılır olmalı
- Marker timing optimizasyonu
- Görsel-işitsel denge
- Öğrenci dikkat süresi dikkate alınmalı

---

**Bu gelişmiş prompt ile herhangi bir konuda tek slide veya ardışık slide serisi üret. Sistem tamamen otomatik sync çalışacak! 🚀**

**YENİ: Artık uzun metinleri mantıklı şekilde bölerek ardışık slide'lar oluşturabilir!** 📑➡️📊