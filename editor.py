#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fizik Eğitim Sistemi - Gelişmiş Soru Editörü
JSON dosyalarındaki soruları ve slide konuşma metinlerini düzenlemek için GUI araç
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json
import os
import re
from pathlib import Path

class EnhancedQuestionEditor:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("🔬 Fizik Eğitim Sistemi - Gelişmiş Editör")
        self.root.geometry("1400x900")
        self.root.configure(bg='#f0f9ff')
        
        # Değişkenler - ÖNCELİKLE TÜM DEĞİŞKENLERİ TANIMLA
        self.current_file = None
        self.current_slide_file = None
        self.questions_data = None
        self.slide_content = None
        self.current_question_index = 0
        self.current_topic_slug = ""
        self.available_slides = []
        
        # *** YENİ: UI değişkenlerini önceden tanımla ***
        self.auto_save_var = tk.BooleanVar(value=True)
        self.topic_var = tk.StringVar()
        self.slide_var = tk.StringVar()
        self.slide_title_var = tk.StringVar()
        self.question_id_var = tk.StringVar()
        self.question_image_var = tk.StringVar()
        self.correct_var = tk.StringVar()
        
        # Widget referansları (None olarak başlat)
        self.global_status = None
        self.speech_text = None
        self.char_count_label = None
        self.question_listbox = None
        self.option_entries = []
        
        # Ana stil
        style = ttk.Style()
        style.theme_use('clam')
        
        # UI kurulumu - değişkenler hazır olduğu için artık güvenli
        self.setup_ui()
        
    def setup_ui(self):
        """Ana arayüzü oluştur"""
        # Ana notebook (tab sistemi)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Tab 1: Soru Editörü
        self.questions_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.questions_tab, text="📝 Sorular")
        
        # Tab 2: Konuşma Metni Editörü
        self.speech_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.speech_tab, text="🎤 Konuşma Metni")
        
        # Tab 3: Konu Genel Bakış
        self.overview_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.overview_tab, text="📊 Genel Bakış")
        
        # Tab kurulumları
        self.setup_questions_tab()
        self.setup_speech_tab()
        self.setup_overview_tab()
        
        # Global kontroller
        self.setup_global_controls()

    def setup_global_controls(self):
        """Tüm tab'larda görünür global kontroller"""
        global_frame = ttk.Frame(self.root)
        global_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        # Konu seçimi
        ttk.Label(global_frame, text="🎯 Konu:").pack(side=tk.LEFT, padx=(0, 5))
        
        self.topic_var = tk.StringVar()
        self.topic_combo = ttk.Combobox(global_frame, textvariable=self.topic_var, width=30)
        self.topic_combo.pack(side=tk.LEFT, padx=(0, 20))
        self.topic_combo.bind('<<ComboboxSelected>>', self.on_topic_change)
        
        # Slide seçimi
        ttk.Label(global_frame, text="📄 Slide:").pack(side=tk.LEFT, padx=(0, 5))
        
        self.slide_var = tk.StringVar()
        self.slide_combo = ttk.Combobox(global_frame, textvariable=self.slide_var, width=15)
        self.slide_combo.pack(side=tk.LEFT, padx=(0, 20))
        self.slide_combo.bind('<<ComboboxSelected>>', self.on_slide_change)
        
        # Otomatik kaydet
        self.auto_save_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(global_frame, text="🔄 Otomatik Kaydet", 
                       variable=self.auto_save_var).pack(side=tk.LEFT, padx=(20, 0))
        
        # Durumu göster
        self.global_status = ttk.Label(global_frame, text="Konu seçin", foreground="gray")
        self.global_status.pack(side=tk.RIGHT, padx=(20, 0))
        
        # Konuları yükle
        self.load_available_topics()

    def setup_speech_tab(self):
        """Konuşma metni tab'ını kur"""
        # Üst kontroller
        top_frame = ttk.LabelFrame(self.speech_tab, text="🎤 Konuşma Metni Kontrolü", padding="10")
        top_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(top_frame, text="📂 Slide Aç", 
                  command=self.open_slide_file).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(top_frame, text="💾 Kaydet", 
                  command=self.save_slide_file).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(top_frame, text="🔄 Yenile", 
                  command=self.reload_slide_file).pack(side=tk.LEFT, padx=(0, 20))
        
        self.slide_file_label = ttk.Label(top_frame, text="Slide dosyası seçilmedi", foreground="gray")
        self.slide_file_label.pack(side=tk.LEFT, padx=(20, 0))
        
        # Ana editör alanı
        editor_frame = ttk.LabelFrame(self.speech_tab, text="✏️ Konuşma Metni Editörü", padding="10")
        editor_frame.pack(fill=tk.BOTH, expand=True)
        
        # Bilgi paneli
        info_frame = ttk.Frame(editor_frame)
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Slide başlık gösterimi
        ttk.Label(info_frame, text="Slide Başlığı:").pack(side=tk.LEFT)
        self.slide_title_var = tk.StringVar()
        self.slide_title_label = ttk.Label(info_frame, textvariable=self.slide_title_var, 
                                          font=('Arial', 10, 'bold'), foreground="blue")
        self.slide_title_label.pack(side=tk.LEFT, padx=(10, 0))
        
        # Konuşma metni durumu
        self.speech_status_label = ttk.Label(info_frame, text="", foreground="green")
        self.speech_status_label.pack(side=tk.RIGHT)
        
        # Ana editör
        ttk.Label(editor_frame, text="Öğretmen Konuşma Metni:", font=('Arial', 11, 'bold')).pack(anchor=tk.W, pady=(10, 5))
        
        # Konuşma metni editörü (büyük alan)
        self.speech_text = scrolledtext.ScrolledText(
            editor_frame, 
            height=25, 
            wrap=tk.WORD,
            font=('Consolas', 11)
        )
        self.speech_text.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Otomatik kaydet bağlantısı
        self.speech_text.bind('<KeyRelease>', self.on_speech_change)
        self.speech_text.bind('<FocusOut>', self.on_speech_change)
        
        # Alt kontroller
        bottom_frame = ttk.Frame(editor_frame)
        bottom_frame.pack(fill=tk.X)
        
        # Karakter sayacı
        self.char_count_label = ttk.Label(bottom_frame, text="0 karakter", foreground="gray")
        self.char_count_label.pack(side=tk.LEFT)
        
        # Kaydet butonu
        ttk.Button(bottom_frame, text="💾 Konuşma Metni Kaydet", 
                  command=self.save_speech_text).pack(side=tk.RIGHT)

    def setup_questions_tab(self):
        """Sorular tab'ını kur"""
        # Üst panel - dosya işlemleri
        top_frame = ttk.LabelFrame(self.questions_tab, text="📁 Soru Dosyası İşlemleri", padding="10")
        top_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(top_frame, text="📂 JSON Aç", 
                  command=self.open_question_file).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(top_frame, text="💾 Kaydet", 
                  command=self.save_question_file).pack(side=tk.LEFT, padx=(0, 10))
        
        self.question_file_label = ttk.Label(top_frame, text="Soru dosyası seçilmedi", foreground="gray")
        self.question_file_label.pack(side=tk.LEFT, padx=(20, 0))
        
        # Ana editör alanı
        main_frame = ttk.Frame(self.questions_tab)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Sol panel - soru listesi
        left_panel = ttk.LabelFrame(main_frame, text="Sorular", padding="10")
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        
        self.question_listbox = tk.Listbox(left_panel, width=25, height=15)
        self.question_listbox.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        self.question_listbox.bind('<<ListboxSelect>>', self.on_question_select)
        
        # Soru işlemleri
        btn_frame = ttk.Frame(left_panel)
        btn_frame.pack(fill=tk.X)
        
        ttk.Button(btn_frame, text="➕ Yeni", 
                  command=self.add_new_question).pack(fill=tk.X, pady=(0, 5))
        ttk.Button(btn_frame, text="🗑️ Sil", 
                  command=self.delete_question).pack(fill=tk.X)
        
        # Sağ panel - soru detayları
        self.setup_question_details(main_frame)

    def setup_question_details(self, parent):
        """Soru detayları paneli"""
        right_panel = ttk.LabelFrame(parent, text="Soru Detayları", padding="10")
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Soru ID
        id_frame = ttk.Frame(right_panel)
        id_frame.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(id_frame, text="ID:").pack(side=tk.LEFT)
        self.question_id_var = tk.StringVar()
        self.question_id_var.trace('w', self.on_content_change)
        ttk.Entry(id_frame, textvariable=self.question_id_var, width=10).pack(side=tk.LEFT, padx=(10, 0))
        
        # Soru metni
        ttk.Label(right_panel, text="Soru Metni:").pack(anchor=tk.W, pady=(10, 5))
        self.question_text = scrolledtext.ScrolledText(right_panel, height=4, wrap=tk.WORD)
        self.question_text.pack(fill=tk.X, pady=(0, 10))
        self.question_text.bind('<KeyRelease>', self.on_content_change)
        
        # Soru görseli
        image_frame = ttk.Frame(right_panel)
        image_frame.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(image_frame, text="Soru Görseli:").pack(side=tk.LEFT)
        self.question_image_var = tk.StringVar()
        self.question_image_var.trace('w', self.on_content_change)
        ttk.Entry(image_frame, textvariable=self.question_image_var).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
        ttk.Button(image_frame, text="📁", width=3, 
                  command=lambda: self.browse_image(self.question_image_var)).pack(side=tk.LEFT, padx=(5, 0))
        
        # Seçenekler
        ttk.Label(right_panel, text="Seçenekler:").pack(anchor=tk.W, pady=(10, 5))
        self.options_frame = ttk.Frame(right_panel)
        self.options_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.option_entries = []
        self.create_option_entries()
        
        # Doğru cevap
        correct_frame = ttk.Frame(right_panel)
        correct_frame.pack(fill=tk.X, pady=(0, 10))
        ttk.Label(correct_frame, text="Doğru Cevap (0-4):").pack(side=tk.LEFT)
        self.correct_var = tk.StringVar()
        self.correct_var.trace('w', self.on_content_change)
        correct_spinbox = tk.Spinbox(correct_frame, from_=0, to=4, textvariable=self.correct_var, width=5)
        correct_spinbox.pack(side=tk.LEFT, padx=(10, 0))
        
        # Açıklama
        ttk.Label(right_panel, text="Açıklama:").pack(anchor=tk.W, pady=(10, 5))
        self.explanation_text = scrolledtext.ScrolledText(right_panel, height=4, wrap=tk.WORD)
        self.explanation_text.pack(fill=tk.X)
        self.explanation_text.bind('<KeyRelease>', self.on_content_change)

    def create_option_entries(self):
        """5 seçenek için giriş alanları oluştur"""
        for i in range(5):
            option_frame = ttk.Frame(self.options_frame)
            option_frame.pack(fill=tk.X, pady=2)
            
            ttk.Label(option_frame, text=f"{chr(65+i)}:", width=3).pack(side=tk.LEFT)
            
            text_frame = ttk.Frame(option_frame)
            text_frame.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(5, 0))
            
            option_text = tk.Text(text_frame, height=2, wrap=tk.WORD)
            option_text.pack(fill=tk.BOTH, expand=True)
            option_text.bind('<KeyRelease>', self.on_content_change)
            
            button_frame = ttk.Frame(option_frame)
            button_frame.pack(side=tk.RIGHT, padx=(5, 0))
            
            ttk.Button(button_frame, text="🖼️", width=3,
                      command=lambda idx=i: self.browse_option_image(idx)).pack()
            
            self.option_entries.append(option_text)

    def setup_overview_tab(self):
        """Genel bakış tab'ını kur"""
        # Konu istatistikleri
        stats_frame = ttk.LabelFrame(self.overview_tab, text="📊 Konu İstatistikleri", padding="15")
        stats_frame.pack(fill=tk.X, pady=(0, 10))
        
        # İstatistik labels
        self.total_slides_label = ttk.Label(stats_frame, text="Toplam Slide: -", font=('Arial', 12))
        self.total_slides_label.pack(anchor=tk.W)
        
        self.total_questions_label = ttk.Label(stats_frame, text="Toplam Soru: -", font=('Arial', 12))
        self.total_questions_label.pack(anchor=tk.W, pady=(5, 0))
        
        self.speech_coverage_label = ttk.Label(stats_frame, text="Konuşma Metni: -", font=('Arial', 12))
        self.speech_coverage_label.pack(anchor=tk.W, pady=(5, 0))
        
        # Slide listesi
        slides_frame = ttk.LabelFrame(self.overview_tab, text="📄 Slide Durumu", padding="10")
        slides_frame.pack(fill=tk.BOTH, expand=True)
        
        # Treeview ile slide listesi
        columns = ('Slide', 'Başlık', 'Soru Sayısı', 'Konuşma Metni')
        self.slides_tree = ttk.Treeview(slides_frame, columns=columns, show='headings', height=15)
        
        # Sütun başlıkları
        for col in columns:
            self.slides_tree.heading(col, text=col)
            self.slides_tree.column(col, width=150)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(slides_frame, orient=tk.VERTICAL, command=self.slides_tree.yview)
        self.slides_tree.configure(yscroll=scrollbar.set)
        
        # Pack
        self.slides_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Double-click ile slide açma
        self.slides_tree.bind('<Double-1>', self.on_slide_tree_double_click)
        
        # Alt kontroller
        overview_bottom = ttk.Frame(self.overview_tab)
        overview_bottom.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(overview_bottom, text="🔄 İstatistikleri Güncelle", 
                  command=self.refresh_overview).pack(side=tk.LEFT)
        ttk.Button(overview_bottom, text="📊 Detaylı Rapor", 
                  command=self.generate_detailed_report).pack(side=tk.LEFT, padx=(10, 0))

    def load_available_topics(self):
            """Mevcut konuları yükle"""
            pages_dir = Path('pages')
            if not pages_dir.exists():
                self.topic_combo['values'] = []
                return
            
            topics = []
            for html_file in pages_dir.glob('*.html'):
                topic_name = html_file.stem
                slide_dir = pages_dir / topic_name
                if slide_dir.exists():
                    topics.append(topic_name)
            
            self.topic_combo['values'] = topics
            if topics:
                self.topic_combo.current(0)
                self.on_topic_change()

    def on_topic_change(self, event=None):
        """Konu değiştiğinde çağrılır"""
        topic = self.topic_var.get()
        if not topic:
            return
        
        self.current_topic_slug = topic
        self.global_status.config(text=f"Konu: {topic}")
        self.load_available_slides()
        self.refresh_overview()

    def load_available_slides(self):
        """Mevcut slide'ları yükle"""
        if not self.current_topic_slug:
            return
        
        pages_dir = Path('pages')
        topic_dir = pages_dir / self.current_topic_slug
        
        if not topic_dir.exists():
            self.slide_combo['values'] = []
            return
        
        slides = []
        self.available_slides = []
        
        for i in range(1, 101):
            slide_file = topic_dir / f'slide-{i}.txt'
            if slide_file.exists():
                slides.append(f'Slide {i}')
                self.available_slides.append(i)
        
        self.slide_combo['values'] = slides
        if slides:
            self.slide_combo.current(0)
            self.on_slide_change()

    def on_slide_change(self, event=None):
        """Slide değiştiğinde çağrılır"""
        slide_text = self.slide_var.get()
        if not slide_text or not self.current_topic_slug:
            return
        
        slide_num = int(slide_text.split()[1])
        self.load_slide_file(slide_num)
        self.load_questions_for_slide(slide_num)

    def extract_slide_title(self, content):
        """HTML içeriğinden başlığı çıkar"""
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', content, re.IGNORECASE)
        if title_match:
            return title_match.group(1).strip()
        
        h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content, re.IGNORECASE)
        if h1_match:
            return h1_match.group(1).strip()
        
        return None

    def extract_speech_text(self, content):
        """HTML içeriğinden konuşma metnini çıkar"""
        pattern = r'<!--\s*ÖĞRETMEN\s+KONUŞMA\s+METNİ\s*-->([\s\S]*?)-->'
        match = re.search(pattern, content, re.IGNORECASE)
        
        if match:
            speech_text = match.group(1).strip()
            speech_text = re.sub(r'<!--[\s\S]*?-->', '', speech_text)
            return speech_text.strip()
        
        return ""

    def load_slide_file(self, slide_num):
        """Belirtilen slide dosyasını yükle"""
        pages_dir = Path('pages')
        topic_dir = pages_dir / self.current_topic_slug
        slide_file = topic_dir / f'slide-{slide_num}.txt'
        
        if not slide_file.exists():
            self.slide_file_label.config(text="Slide dosyası bulunamadı")
            self.slide_content = None
            return
        
        try:
            with open(slide_file, 'r', encoding='utf-8') as f:
                self.slide_content = f.read()
            
            self.current_slide_file = str(slide_file)
            self.slide_file_label.config(text=f"slide-{slide_num}.txt")
            
            title = self.extract_slide_title(self.slide_content)
            self.slide_title_var.set(title or f"Slide {slide_num}")
            
            speech_text = self.extract_speech_text(self.slide_content)
            self.speech_text.delete(1.0, tk.END)
            if speech_text:
                self.speech_text.insert(1.0, speech_text)
                self.speech_status_label.config(text="✅ Konuşma metni var", foreground="green")
            else:
                self.speech_status_label.config(text="⚠️ Konuşma metni yok", foreground="orange")
            
            self.update_char_count()
            
        except Exception as e:
            messagebox.showerror("Hata", f"Slide dosyası okunamadı: {e}")

    def update_speech_in_content(self, content, new_speech_text):
        """HTML içeriğindeki konuşma metnini güncelle"""
        pattern = r'(<!--\s*ÖĞRETMEN\s+KONUŞMA\s+METNİ\s*-->)([\s\S]*?)(-->)'
        
        def replace_speech(match):
            if new_speech_text.strip():
                return f"{match.group(1)}\n<!-- \n{new_speech_text}\n{match.group(3)}"
            else:
                return f"{match.group(1)}\n<!-- \n\n{match.group(3)}"
        
        if re.search(pattern, content, re.IGNORECASE):
            return re.sub(pattern, replace_speech, content, flags=re.IGNORECASE)
        else:
            if new_speech_text.strip():
                speech_block = f'\n\n<!-- ÖĞRETMEN KONUŞMA METNİ -->\n<!-- \n{new_speech_text}\n-->'
                return content + speech_block
            else:
                return content

    def save_slide_file(self):
        """Slide dosyasını kaydet"""
        if not self.current_slide_file or not self.slide_content:
            messagebox.showwarning("Uyarı", "Kaydedilecek slide dosyası yok")
            return
        
        try:
            new_speech_text = self.speech_text.get(1.0, tk.END).strip()
            updated_content = self.update_speech_in_content(self.slide_content, new_speech_text)
            
            with open(self.current_slide_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            self.slide_content = updated_content
            
            if new_speech_text:
                self.speech_status_label.config(text="✅ Konuşma metni kaydedildi", foreground="green")
            else:
                self.speech_status_label.config(text="⚠️ Konuşma metni boş", foreground="orange")
            
            self.global_status.config(text="💾 Slide kaydedildi")
            messagebox.showinfo("Başarılı", "Slide dosyası kaydedildi!")
            
        except Exception as e:
            messagebox.showerror("Hata", f"Slide kaydedilemedi: {e}")

    def on_speech_change(self, event=None):
        """Konuşma metni değiştiğinde çağrılır"""
        self.update_char_count()
        
        # Güvenlik kontrolü
        if not hasattr(self, 'auto_save_var'):
            return
        
        if self.auto_save_var.get() and hasattr(self, 'current_slide_file') and self.current_slide_file:
            if hasattr(self, 'speech_save_timer'):
                self.root.after_cancel(self.speech_save_timer)
            self.speech_save_timer = self.root.after(2000, self.auto_save_speech)

    def auto_save_speech(self):
        """Konuşma metni otomatik kaydet"""
        try:
            if self.current_slide_file and self.slide_content:
                new_speech_text = self.speech_text.get(1.0, tk.END).strip()
                updated_content = self.update_speech_in_content(self.slide_content, new_speech_text)
                
                with open(self.current_slide_file, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                self.slide_content = updated_content
                self.global_status.config(text="💾 Otomatik kaydedildi")
                
        except Exception as e:
            self.global_status.config(text=f"⚠️ Kayıt hatası: {e}")

    def update_char_count(self):
        """Karakter sayısını güncelle"""
        text = self.speech_text.get(1.0, tk.END).strip()
        char_count = len(text)
        word_count = len(text.split()) if text else 0
        
        self.char_count_label.config(text=f"{char_count} karakter, {word_count} kelime")

    def refresh_overview(self):
        """Genel bakış sekmesini güncelle"""
        if not self.current_topic_slug:
            return
        
        pages_dir = Path('pages')
        topic_dir = pages_dir / self.current_topic_slug
        
        if not topic_dir.exists():
            return
        
        slides_info = []
        total_questions = 0
        slides_with_speech = 0
        
        for i in range(1, 101):
            slide_file = topic_dir / f'slide-{i}.txt'
            if not slide_file.exists():
                continue
            
            try:
                with open(slide_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                title = self.extract_slide_title(content)
                speech_text = self.extract_speech_text(content)
                has_speech = "✅" if speech_text.strip() else "❌"
                
                if speech_text.strip():
                    slides_with_speech += 1
                
                questions_file = topic_dir / f'slide-{i}-questions.json'
                question_count = 0
                if questions_file.exists():
                    try:
                        with open(questions_file, 'r', encoding='utf-8') as f:
                            questions_data = json.load(f)
                        question_count = len(questions_data.get('questions', []))
                        total_questions += question_count
                    except:
                        pass
                
                slides_info.append({
                    'slide_num': i,
                    'title': title or f"Slide {i}",
                    'question_count': question_count,
                    'has_speech': has_speech
                })
                
            except Exception as e:
                print(f"Slide {i} okunamadı: {e}")
        
        # İstatistikleri güncelle
        total_slides = len(slides_info)
        self.total_slides_label.config(text=f"Toplam Slide: {total_slides}")
        self.total_questions_label.config(text=f"Toplam Soru: {total_questions}")
        
        speech_percentage = (slides_with_speech / total_slides * 100) if total_slides > 0 else 0
        self.speech_coverage_label.config(
            text=f"Konuşma Metni: {slides_with_speech}/{total_slides} (%{speech_percentage:.1f})"
        )
        
        # Tree'yi güncelle
        for item in self.slides_tree.get_children():
            self.slides_tree.delete(item)
        
        for slide_info in slides_info:
            self.slides_tree.insert('', 'end', values=(
                f"Slide {slide_info['slide_num']}",
                slide_info['title'],
                slide_info['question_count'],
                slide_info['has_speech']
            ))

    def on_slide_tree_double_click(self, event):
        """Tree'de slide'a double-click"""
        selection = self.slides_tree.selection()
        if not selection:
            return
        
        item = self.slides_tree.item(selection[0])
        slide_text = item['values'][0]  # "Slide X"
        
        # Slide combo'yu güncelle ve o slide'ı aç
        self.slide_var.set(slide_text)
        self.on_slide_change()
        
        # Konuşma metni tab'ına geç
        self.notebook.select(self.speech_tab)

    def generate_detailed_report(self):
        """Detaylı rapor oluştur"""
        if not self.current_topic_slug:
            messagebox.showwarning("Uyarı", "Konu seçilmedi")
            return
        
        # Rapor penceresi oluştur
        report_window = tk.Toplevel(self.root)
        report_window.title(f"📊 {self.current_topic_slug} - Detaylı Rapor")
        report_window.geometry("800x600")
        
        # Rapor metni
        report_text = scrolledtext.ScrolledText(report_window, wrap=tk.WORD, font=('Consolas', 10))
        report_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Raporu oluştur
        report_content = self.create_detailed_report()
        report_text.insert(1.0, report_content)
        report_text.config(state='disabled')
        
        # Kaydet butonu
        btn_frame = ttk.Frame(report_window)
        btn_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Button(btn_frame, text="💾 Raporu Kaydet", 
                  command=lambda: self.save_report(report_content)).pack(side=tk.RIGHT)

    def create_detailed_report(self):
        """Detaylı rapor içeriği oluştur"""
        import datetime
        
        report_lines = []
        report_lines.append(f"📊 {self.current_topic_slug.upper()} - DETAYLI RAPOR")
        report_lines.append("=" * 60)
        report_lines.append(f"Oluşturulma Zamanı: {datetime.datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
        report_lines.append("")
        
        pages_dir = Path('pages')
        topic_dir = pages_dir / self.current_topic_slug
        
        if not topic_dir.exists():
            report_lines.append("❌ Konu klasörü bulunamadı!")
            return "\n".join(report_lines)
        
        # Slide'ları analiz et
        slide_details = []
        total_questions = 0
        total_speech_chars = 0
        
        for i in range(1, 101):
            slide_file = topic_dir / f'slide-{i}.txt'
            if not slide_file.exists():
                continue
            
            try:
                with open(slide_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                title = self.extract_slide_title(content)
                speech_text = self.extract_speech_text(content)
                speech_char_count = len(speech_text.strip()) if speech_text else 0
                total_speech_chars += speech_char_count
                
                # Soru sayısı
                questions_file = topic_dir / f'slide-{i}-questions.json'
                question_count = 0
                question_details = []
                
                if questions_file.exists():
                    try:
                        with open(questions_file, 'r', encoding='utf-8') as f:
                            questions_data = json.load(f)
                        questions = questions_data.get('questions', [])
                        question_count = len(questions)
                        total_questions += question_count
                        
                        for q in questions:
                            has_image = "✅" if q.get('questionImage') else "❌"
                            question_details.append(f"    - Soru {q.get('id')}: Görsel {has_image}")
                    except:
                        pass
                
                slide_details.append({
                    'num': i,
                    'title': title or f"Slide {i}",
                    'speech_chars': speech_char_count,
                    'question_count': question_count,
                    'question_details': question_details
                })
                
            except Exception as e:
                slide_details.append({
                    'num': i,
                    'title': f"Slide {i} (HATA: {e})",
                    'speech_chars': 0,
                    'question_count': 0,
                    'question_details': []
                })
        
        # Özet bilgiler
        total_slides = len(slide_details)
        slides_with_speech = sum(1 for s in slide_details if s['speech_chars'] > 0)
        slides_with_questions = sum(1 for s in slide_details if s['question_count'] > 0)
        
        report_lines.append("📋 ÖZET BİLGİLER:")
        report_lines.append(f"   • Toplam Slide: {total_slides}")
        report_lines.append(f"   • Toplam Soru: {total_questions}")
        report_lines.append(f"   • Konuşma Metni Olan Slide: {slides_with_speech}/{total_slides} (%{slides_with_speech/total_slides*100:.1f})")
        report_lines.append(f"   • Soru Olan Slide: {slides_with_questions}/{total_slides} (%{slides_with_questions/total_slides*100:.1f})")
        report_lines.append(f"   • Toplam Konuşma Metni: {total_speech_chars} karakter (~{total_speech_chars//1000} dk konuşma)")
        report_lines.append("")
        
        # Slide detayları
        report_lines.append("📄 SLIDE DETAYLARI:")
        report_lines.append("-" * 60)
        
        for slide in slide_details:
            speech_status = "✅" if slide['speech_chars'] > 0 else "❌"
            question_status = f"✅ {slide['question_count']} soru" if slide['question_count'] > 0 else "❌"
            
            report_lines.append(f"📄 Slide {slide['num']}: {slide['title']}")
            report_lines.append(f"   • Konuşma Metni: {speech_status} ({slide['speech_chars']} karakter)")
            report_lines.append(f"   • Sorular: {question_status}")
            
            for detail in slide['question_details']:
                report_lines.append(detail)
            
            report_lines.append("")
        
        return "\n".join(report_lines)

    def save_report(self, report_content):
        """Raporu dosyaya kaydet"""
        file_path = filedialog.asksaveasfilename(
            title="Raporu Kaydet",
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialname=f"{self.current_topic_slug}_rapor.txt"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(report_content)
                messagebox.showinfo("Başarılı", "Rapor kaydedildi!")
            except Exception as e:
                messagebox.showerror("Hata", f"Rapor kaydedilemedi: {e}")

    # === SORU EDİTÖRÜ FONKSİYONLARI ===

    def open_question_file(self):
        """JSON soru dosyası aç"""
        file_path = filedialog.askopenfilename(
            title="Soru JSON dosyası seçin",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialdir=f"pages/{self.current_topic_slug}" if self.current_topic_slug else "pages/"
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.questions_data = json.load(f)
                
                self.current_file = file_path
                self.question_file_label.config(text=os.path.basename(file_path))
                self.load_questions_to_ui()
                self.global_status.config(text=f"✅ {len(self.questions_data['questions'])} soru yüklendi")
                
            except Exception as e:
                messagebox.showerror("Hata", f"Dosya açılamadı: {e}")

    def load_questions_for_slide(self, slide_num):
        """Belirtilen slide için soruları yükle"""
        pages_dir = Path('pages')
        topic_dir = pages_dir / self.current_topic_slug
        questions_file = topic_dir / f'slide-{slide_num}-questions.json'
        
        if questions_file.exists():
            try:
                with open(questions_file, 'r', encoding='utf-8') as f:
                    self.questions_data = json.load(f)
                
                self.current_file = str(questions_file)
                self.question_file_label.config(text=f"slide-{slide_num}-questions.json")
                self.load_questions_to_ui()
                
            except Exception as e:
                print(f"Soru dosyası yüklenemedi: {e}")
        else:
            self.questions_data = None
            self.current_file = None
            self.question_file_label.config(text="Bu slide için soru dosyası yok")
            self.clear_questions_ui()

    def load_questions_to_ui(self):
        """Soruları arayüze yükle"""
        if not self.questions_data:
            return
        
        self.question_listbox.delete(0, tk.END)
        for i, question in enumerate(self.questions_data['questions']):
            question_preview = question.get('question', '')
            if not question_preview:
                question_preview = f"[Görsel Soru {question.get('id', i+1)}]"
            
            preview = question_preview[:40] + "..." if len(question_preview) > 40 else question_preview
            self.question_listbox.insert(tk.END, f"S{question.get('id', i+1)}: {preview}")
        
        if self.questions_data['questions']:
            self.question_listbox.selection_set(0)
            self.current_question_index = 0
            self.load_current_question()

    def clear_questions_ui(self):
        """Soru arayüzünü temizle"""
        self.question_listbox.delete(0, tk.END)
        self.question_id_var.set("")
        self.question_text.delete(1.0, tk.END)
        self.question_image_var.set("")
        for entry in self.option_entries:
            entry.delete(1.0, tk.END)
        self.correct_var.set("0")
        self.explanation_text.delete(1.0, tk.END)

    def on_question_select(self, event):
        """Listeden soru seçildiğinde"""
        selection = self.question_listbox.curselection()
        if selection:
            self.current_question_index = selection[0]
            self.load_current_question()

    def load_current_question(self):
        """Mevcut soruyu editör alanlarına yükle"""
        if not self.questions_data or self.current_question_index >= len(self.questions_data['questions']):
            return
        
        question = self.questions_data['questions'][self.current_question_index]
        
        self.question_id_var.set(str(question.get('id', '')))
        
        self.question_text.delete(1.0, tk.END)
        if question.get('question'):
            self.question_text.insert(1.0, question['question'])
        
        self.question_image_var.set(question.get('questionImage', ''))
        
        options = question.get('options', [])
        for i in range(5):
            self.option_entries[i].delete(1.0, tk.END)
            if i < len(options):
                option = options[i]
                if isinstance(option, dict):
                    text = f"[GÖRSEL: {option.get('image', '')}]"
                    if option.get('text'):
                        text += f"\n{option['text']}"
                    self.option_entries[i].insert(1.0, text)
                else:
                    self.option_entries[i].insert(1.0, str(option))
        
        self.correct_var.set(str(question.get('correct', 0)))
        
        self.explanation_text.delete(1.0, tk.END)
        if question.get('explanation'):
            self.explanation_text.insert(1.0, question['explanation'])

    def save_current_question(self):
        """Mevcut sorudaki değişiklikleri kaydet"""
        if not self.questions_data or self.current_question_index >= len(self.questions_data['questions']):
            return
        
        question = self.questions_data['questions'][self.current_question_index]
        
        question['id'] = int(self.question_id_var.get() or 1)
        
        question_text = self.question_text.get(1.0, tk.END).strip()
        if question_text:
            question['question'] = question_text
        elif 'question' in question:
            del question['question']
        
        image = self.question_image_var.get().strip()
        if image:
            question['questionImage'] = image
        elif 'questionImage' in question:
            del question['questionImage']
        
        options = []
        for i in range(5):
            option_text = self.option_entries[i].get(1.0, tk.END).strip()
            if option_text:
                if option_text.startswith('[GÖRSEL:'):
                    lines = option_text.split('\n')
                    image_line = lines[0]
                    image = image_line.replace('[GÖRSEL:', '').replace(']', '').strip()
                    
                    option_obj = {"image": image}
                    if len(lines) > 1 and lines[1].strip():
                        option_obj["text"] = lines[1].strip()
                    
                    options.append(option_obj)
                else:
                    options.append(option_text)
        
        question['options'] = options
        question['correct'] = int(self.correct_var.get() or 0)
        question['explanation'] = self.explanation_text.get(1.0, tk.END).strip()
        
        self.questions_data['total_questions'] = len(self.questions_data['questions'])
        
        if self.auto_save_var.get() and self.current_file:
            self.save_question_file()

    def save_question_file(self):
        """Soru dosyasını kaydet"""
        if not self.current_file or not self.questions_data:
            messagebox.showwarning("Uyarı", "Kaydedilecek soru dosyası yok")
            return
        
        try:
            with open(self.current_file, 'w', encoding='utf-8') as f:
                json.dump(self.questions_data, f, ensure_ascii=False, indent=2)
            
            self.global_status.config(text="💾 Sorular kaydedildi")
            
        except Exception as e:
            messagebox.showerror("Hata", f"Dosya kaydedilemedi: {e}")

    def add_new_question(self):
        """Yeni soru ekle"""
        if not self.questions_data:
            slide_num = self.slide_var.get().split()[1] if self.slide_var.get() else "1"
            self.questions_data = {
                "slide": int(slide_num),
                "topic": "Yeni Konu",
                "difficulty": "beginner",
                "total_questions": 0,
                "questions": []
            }
        
        new_id = len(self.questions_data['questions']) + 1
        new_question = {
            "id": new_id,
            "question": "",
            "options": ["", "", "", "", ""],
            "correct": 0,
            "explanation": ""
        }
        
        self.questions_data['questions'].append(new_question)
        self.questions_data['total_questions'] = len(self.questions_data['questions'])
        
        self.load_questions_to_ui()
        self.question_listbox.selection_set(len(self.questions_data['questions']) - 1)
        self.current_question_index = len(self.questions_data['questions']) - 1
        self.load_current_question()
        
        self.global_status.config(text="✅ Yeni soru eklendi")

    def delete_question(self):
        """Seçili soruyu sil"""
        if not self.questions_data or not self.questions_data['questions']:
            return
        
        if messagebox.askyesno("Onay", "Bu soruyu silmek istediğinizden emin misiniz?"):
            del self.questions_data['questions'][self.current_question_index]
            
            for i, question in enumerate(self.questions_data['questions']):
                question['id'] = i + 1
            
            self.questions_data['total_questions'] = len(self.questions_data['questions'])
            
            if self.questions_data['questions']:
                self.load_questions_to_ui()
                if self.current_question_index >= len(self.questions_data['questions']):
                    self.current_question_index = len(self.questions_data['questions']) - 1
                self.question_listbox.selection_set(self.current_question_index)
                self.load_current_question()
            else:
                self.clear_questions_ui()
            
            self.global_status.config(text="✅ Soru silindi")

    def browse_image(self, var_to_update):
        """Soru görseli için dosya seçici"""
        current_dir = f"pages/{self.current_topic_slug}/images" if self.current_topic_slug else "."
        
        file_path = filedialog.askopenfilename(
            title="Soru görseli seçin",
            filetypes=[("Görsel dosyalar", "*.png *.jpg *.jpeg *.gif *.bmp *.tiff"), ("Tüm dosyalar", "*.*")],
            initialdir=current_dir
        )
        
        if file_path:
            filename = os.path.basename(file_path)
            var_to_update.set(filename)
            self.global_status.config(text=f"✅ Görsel seçildi: {filename}")

    def browse_option_image(self, option_index):
        """Seçenek görseli için dosya seçici"""
        current_dir = f"pages/{self.current_topic_slug}/images" if self.current_topic_slug else "."
        
        file_path = filedialog.askopenfilename(
            title=f"Seçenek {chr(65+option_index)} görseli seçin",
            filetypes=[("Görsel dosyalar", "*.png *.jpg *.jpeg *.gif *.bmp *.tiff"), ("Tüm dosyalar", "*.*")],
            initialdir=current_dir
        )
        
        if file_path:
            filename = os.path.basename(file_path)
            current_text = self.option_entries[option_index].get(1.0, tk.END).strip()
            
            if current_text.startswith('[GÖRSEL:'):
                lines = current_text.split('\n')
                new_text = f"[GÖRSEL: {filename}]"
                if len(lines) > 1 and lines[1].strip():
                    new_text += f"\n{lines[1].strip()}"
            else:
                if current_text:
                    new_text = f"[GÖRSEL: {filename}]\n{current_text}"
                else:
                    new_text = f"[GÖRSEL: {filename}]"
            
            self.option_entries[option_index].delete(1.0, tk.END)
            self.option_entries[option_index].insert(1.0, new_text)
            
            self.global_status.config(text=f"✅ Seçenek {chr(65+option_index)} görseli: {filename}")

    def on_content_change(self, *args):
        """İçerik değiştiğinde otomatik kaydet"""
        # Güvenlik kontrolü - auto_save_var henüz oluşturulmadıysa çık
        if not hasattr(self, 'auto_save_var'):
            return
        
        if self.auto_save_var.get() and hasattr(self, 'questions_data') and self.questions_data:
            if hasattr(self, 'save_timer'):
                self.root.after_cancel(self.save_timer)
            self.save_timer = self.root.after(1000, self.save_current_question)

    # === YARDIMCI FONKSİYONLAR ===

    def open_slide_file(self):
        """Manuel slide dosyası aç"""
        file_path = filedialog.askopenfilename(
            title="Slide dosyası seçin",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            initialdir=f"pages/{self.current_topic_slug}" if self.current_topic_slug else "pages/"
        )
        
        if file_path:
            self.current_slide_file = file_path
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.slide_content = f.read()
                
                self.slide_file_label.config(text=os.path.basename(file_path))
                title = self.extract_slide_title(self.slide_content)
                self.slide_title_var.set(title or "Bilinmeyen Slide")
                
                speech_text = self.extract_speech_text(self.slide_content)
                self.speech_text.delete(1.0, tk.END)
                if speech_text:
                    self.speech_text.insert(1.0, speech_text)
                    self.speech_status_label.config(text="✅ Konuşma metni var", foreground="green")
                else:
                    self.speech_status_label.config(text="⚠️ Konuşma metni yok", foreground="orange")
                
                self.update_char_count()
                
            except Exception as e:
                messagebox.showerror("Hata", f"Dosya açılamadı: {e}")

    def reload_slide_file(self):
        """Slide dosyasını yeniden yükle"""
        if self.current_slide_file:
            try:
                with open(self.current_slide_file, 'r', encoding='utf-8') as f:
                    self.slide_content = f.read()
                
                speech_text = self.extract_speech_text(self.slide_content)
                self.speech_text.delete(1.0, tk.END)
                if speech_text:
                    self.speech_text.insert(1.0, speech_text)
                
                self.update_char_count()
                self.global_status.config(text="🔄 Slide yenilendi")
                
            except Exception as e:
                messagebox.showerror("Hata", f"Slide yenilenemedi: {e}")

    def save_speech_text(self):
        """Konuşma metnini manuel kaydet"""
        self.save_slide_file()

    def run(self):
        """Uygulamayı başlat"""
        self.root.mainloop()

def main():
    """Ana fonksiyon"""
    print("🔬 Fizik Eğitim Sistemi - Gelişmiş Editör başlatılıyor...")
    print("📝 Özellikler:")
    print("   • Soru editörü (JSON)")
    print("   • Konuşma metni editörü (HTML)")
    print("   • Konu genel bakış raporu")
    print("   • Otomatik kaydetme")
    print("   • Slide başlık algılama")
    print("   • Karakter/kelime sayacı")
    print("   • Detaylı raporlama sistemi")
    print()
    
    # Klasör kontrolü
    pages_dir = Path('pages')
    if not pages_dir.exists():
        print("⚠️  UYARI: 'pages/' klasörü bulunamadı!")
        print("   Bu klasörü oluşturun ve içine konu klasörlerini ekleyin.")
        print()
    
    try:
        app = EnhancedQuestionEditor()
        print("✅ Editör başlatıldı!")
        print()
        print("📖 KULLANIM KILAVUZU:")
        print("1. Üst menüden konu ve slide seçin")
        print("2. '🎤 Konuşma Metni' sekmesinde metni düzenleyin")
        print("3. '📝 Sorular' sekmesinde soruları editleyeyin") 
        print("4. '📊 Genel Bakış' sekmesinde rapor alın")
        print("5. Otomatik kaydetme aktif - manual kayıt da mevcut")
        print()
        
        app.run()
        
    except Exception as e:
        print(f"❌ Editör başlatılamadı: {e}")
        print("Python ve Tkinter kurulumunu kontrol edin.")
        input("Devam etmek için Enter tuşuna basın...")

if __name__ == "__main__":
    import datetime
    main()
