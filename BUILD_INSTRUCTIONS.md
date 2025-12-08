# KTM Launcher - تعليمات البناء

## المتطلبات الأساسية

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/

---

## البناء السريع (الطريقة الجديدة)

اللانشر الآن يفتح الموقع الرسمي مباشرة، فلا حاجة لبناء الواجهة محلياً:

```bash
cd electron
npm install
npm run build:win    # لـ Windows
npm run build:mac    # لـ macOS  
npm run build:linux  # لـ Linux
npm run build:all    # لجميع الأنظمة
```

---

## ملفات الأيقونات المطلوبة

قم بإنشاء مجلد `electron/assets` وأضف الملفات التالية:

### Windows
- `icon.ico` - أيقونة التطبيق (256x256 متعددة الأحجام)
- `icon.png` - للـ splash screen

### macOS
- `icon.icns` - أيقونة macOS
- `dmg-background.png` - خلفية DMG (600x400)

### Linux
- مجلد `icons/` يحتوي على:
  - `16x16.png`
  - `32x32.png`
  - `48x48.png`
  - `64x64.png`
  - `128x128.png`
  - `256x256.png`
  - `512x512.png`

### الأصول الإضافية (اختياري)
- `installer-sidebar.bmp` - صورة جانبية للتثبيت (164x314)

---

## إنشاء الأيقونات من ملف PNG واحد

```bash
# تثبيت الأداة
npm install -g electron-icon-builder

# إنشاء الأيقونات
electron-icon-builder --input=icon.png --output=./assets
```

---

## ملفات الإخراج

بعد البناء ستجد في `electron/release/`:

### Windows
- `KTM Launcher-1.0.0-x64.exe` - التثبيت (64-bit)
- `KTM Launcher-1.0.0-ia32.exe` - التثبيت (32-bit)
- `KTM Launcher-1.0.0-x64.exe` (portable) - نسخة محمولة

### macOS
- `KTM Launcher-1.0.0-x64.dmg` - Intel
- `KTM Launcher-1.0.0-arm64.dmg` - Apple Silicon

### Linux
- `KTM Launcher-1.0.0.AppImage`
- `KTM Launcher-1.0.0-x64.deb`
- `KTM Launcher-1.0.0-x64.rpm`
- `KTM Launcher-1.0.0-x64.snap`

---

## ميزات التثبيت

### Windows (NSIS Installer)
- ✅ اختيار مجلد التثبيت
- ✅ إنشاء اختصار سطح المكتب
- ✅ إنشاء اختصار قائمة ابدأ
- ✅ دعم 32-bit و 64-bit
- ✅ إلغاء التثبيت النظيف
- ✅ رسائل عربية وإنجليزية
- ✅ نسخة محمولة (Portable)

### macOS (DMG)
- ✅ دعم Intel و Apple Silicon
- ✅ خلفية مخصصة
- ✅ Dark Mode
- ✅ Hardened Runtime

### Linux
- ✅ AppImage (تشغيل مباشر)
- ✅ DEB (Debian/Ubuntu)
- ✅ RPM (Fedora/RHEL)
- ✅ Snap (Ubuntu Store)

---

## Splash Screen

التطبيق يعرض شاشة تحميل احترافية عند الفتح:
- ✅ تصميم متحرك مع Particles
- ✅ شعار متوهج
- ✅ شريط تحميل متحرك
- ✅ تأثيرات Glow و Gradient

---

## التشغيل للتطوير

```bash
cd electron
npm install
npm start
```

---

## ⚠️ ملاحظات مهمة

1. **الموقع الرسمي**: اللانشر يفتح `https://ktm.lovable.app/` مباشرة
2. **التحديثات تلقائية**: أي تحديث على الموقع ينعكس مباشرة على اللانشر
3. **لا حاجة لنسخ dist**: لم تعد تحتاج لنسخ ملفات الواجهة
4. **Preload Script**: يوفر واجهة برمجية للميزات الخاصة (تحميل، تشغيل exe، المكتبة)
5. **حفظ البيانات**: يستخدم electron-store لحفظ الإعدادات محلياً

---

## حل المشاكل

### شاشة سوداء أو بيضاء؟
تأكد من وجود اتصال بالإنترنت - اللانشر يحتاج لفتح الموقع الرسمي.

### لم تظهر ميزات اللانشر؟
الموقع يكتشف Electron تلقائياً - تأكد من تحديث الموقع أولاً.

### خطأ عند البناء؟
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules
npm install
```

### أيقونة افتراضية؟
تأكد من وجود ملفات الأيقونات في `electron/assets/`