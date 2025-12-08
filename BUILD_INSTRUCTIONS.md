# KTM Launcher - تعليمات البناء

## المتطلبات الأساسية

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/

2. **Git** (اختياري لكن مُوصى به)
   - تحميل من: https://git-scm.com/

---

## خطوات البناء

### 1. تحميل المشروع

```bash
# نسخ المشروع من Lovable
# اذهب إلى Settings > Export > Download as ZIP
# أو استخدم Git إذا كان متاحاً
```

### 2. تثبيت المتطلبات الرئيسية

```bash
# افتح Terminal/PowerShell في مجلد المشروع
cd path/to/project

# تثبيت متطلبات الواجهة
npm install
```

### 3. بناء الواجهة للإنتاج

```bash
npm run build
```

### 4. إعداد Electron

```bash
# انتقل لمجلد Electron
cd electron

# تثبيت متطلبات Electron
npm install
```

### 5. إنشاء أيقونة التطبيق (اختياري)

قم بإنشاء مجلد `electron/assets` وضع الأيقونات التالية:
- `icon.png` (256x256 بكسل للمعاينة)
- `icon.ico` (للويندوز)
- `icon.icns` (للماك)

يمكنك تحويل الأيقونات من: https://convertio.co/

### 6. بناء التطبيق

```bash
# للويندوز فقط
npm run build:win

# للماك فقط
npm run build:mac

# للينكس فقط
npm run build:linux

# لجميع المنصات
npm run build
```

### 7. موقع الملفات النهائية

بعد البناء، ستجد الملفات في:
```
electron/release/
├── KTM Launcher Setup 1.0.0.exe  (مُثبّت الويندوز)
├── KTM Launcher-1.0.0.dmg        (مُثبّت الماك)
└── KTM Launcher-1.0.0.AppImage   (لينكس)
```

---

## التشغيل للتطوير

```bash
# من المجلد الرئيسي - تشغيل الواجهة
npm run dev

# من مجلد electron - في terminal آخر
npm run dev
```

---

## ملاحظات مهمة

### بخصوص التحميل المباشر
- اللانشر يدعم تحميل ملفات ZIP مباشرة
- روابط مثل Gofile, Mediafire ستفتح في المتصفح
- للتحميل المباشر، استخدم روابط مباشرة لملفات ZIP

### بخصوص الاستخراج
- الملفات تُستخرج تلقائياً بعد التحميل
- يتم البحث عن ملف EXE تلقائياً
- الملفات التالية يتم تجاهلها: unins*, setup*, install*

### بخصوص المكتبة
- الألعاب المثبتة تظهر في تبويب "المكتبة"
- يمكن تشغيل أو إلغاء تثبيت أي لعبة
- يمكن فتح مجلد اللعبة مباشرة

---

## حل المشاكل الشائعة

### خطأ: "Cannot find module"
```bash
npm install
cd electron && npm install
```

### خطأ: "electron-builder" not found
```bash
cd electron
npm install electron-builder --save-dev
```

### خطأ أثناء البناء للويندوز على ماك/لينكس
تحتاج Wine لبناء تطبيقات ويندوز:
```bash
# macOS
brew install --cask wine-stable

# Linux
sudo apt install wine
```

---

## هيكل الملفات

```
project/
├── src/                    # كود React
├── dist/                   # الواجهة المبنية
├── electron/
│   ├── main.js            # العملية الرئيسية
│   ├── preload.js         # جسر الاتصال
│   ├── package.json       # إعدادات Electron
│   └── assets/            # الأيقونات
└── BUILD_INSTRUCTIONS.md  # هذا الملف
```

---

## الدعم

إذا واجهت أي مشاكل، تواصل معنا عبر صفحة "اتصل بنا" في الموقع.
