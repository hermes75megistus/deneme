@echo off
chcp 65001 >nul
title 🔬 2025 Eğitim Platformu Sunucusu

echo.
echo ╔═══════════════════════════════════════╗
echo ║   🔬 2025 EĞİTİM PLATFORMU SUNUCU    ║
echo ║      İnteraktif Fizik Dersleri       ║
echo ╚═══════════════════════════════════════╝
echo.

REM İndex dosyası kontrolü
if not exist "index.html" (
    echo ❌ HATA: index.html dosyası bulunamadı!
    echo.
    echo 📁 Bu dosyayı eğitim platformu klasöründe çalıştırın.
    echo    Dosya yapısı şöyle olmalı:
    echo    📂 eğitim-platformu/
    echo    ├── 📄 index.html
    echo    ├── 📂 pages/
    echo    ├── 📂 css/
    echo    ├── 📂 js/
    echo    └── 🚀 START_SERVER.bat
    echo.
    pause
    exit /b 1
)

REM Port kontrolü
set PORT=8000
:check_port
netstat -an | find ":%PORT%" >nul
if %errorlevel%==0 (
    echo ⚠️  Port %PORT% kullanımda, %PORT%1 deneniyor...
    set /a PORT+=1
    goto check_port
)

echo ✅ Port %PORT% kullanılacak
echo.

REM Sunucuyu başlat
echo 🚀 HTTP Sunucusu başlatılıyor...
echo 📍 URL: http://localhost:%PORT%
echo.
echo ⭐ Sunucuyu durdurmak için bu pencereyi kapatın veya Ctrl+C basın
echo.

REM 3 saniye bekle, sonra tarayıcıyı aç
echo 🌐 3 saniye içinde tarayıcı açılacak...
timeout /t 3 /nobreak >nul

REM Tarayıcıyı aç
start http://localhost:%PORT%

REM Python sunucusunu başlat
echo.
echo 📊 SUNUCU ÇALIŞIYOR - İstatistikler:
echo.
python -m http.server %PORT%

REM Hata durumunda
if %errorlevel% neq 0 (
    echo.
    echo ❌ HATA: Python bulunamadı veya sunucu başlatılamadı!
    echo.
    echo 🔧 Çözüm önerileri:
    echo 1. Python yükleyin: https://python.org/downloads/
    echo 2. Farklı bir port deneyin
    echo 3. Antivirüs programını kontrol edin
    echo.
    pause
)