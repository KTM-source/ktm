# KTM Launcher - تعليمات البناء

## المتطلبات الأساسية

1. **Node.js** (الإصدار 18 أو أحدث)
   - تحميل من: https://nodejs.org/

---

## خطوات البناء (مهمة جداً!)

### 1. بناء الواجهة
```bash
npm run build
```

### 2. نسخ ملفات dist إلى مجلد electron ⚠️ خطوة إلزامية
```bash
# Windows (PowerShell)
Copy-Item -Path "dist" -Destination "electron/dist" -Recurse -Force

# Windows (CMD)
xcopy dist electron\dist /E /I /Y

# Mac/Linux
cp -r dist electron/dist
```

### 3. تثبيت وبناء Electron
```bash
cd electron
npm install
npm run build:win
```

### 4. تشغيل البرنامج
```
electron/release/win-unpacked/KTM Launcher.exe
```

---

## ⚠️ ملاحظات مهمة جداً

- **يجب** نسخ مجلد `dist` إلى `electron/dist` قبل البناء
- إذا ظهرت **شاشة سوداء** = لم يتم نسخ ملفات dist بشكل صحيح
- شغّل PowerShell/CMD كـ Administrator إذا ظهر خطأ symbolic link

---

## حل المشاكل

### شاشة سوداء؟
تأكد من تنفيذ الخطوة 2 (نسخ dist إلى electron/dist)

### خطأ symbolic link؟
شغّل البرنامج مباشرة من: `electron/release/win-unpacked/KTM Launcher.exe`

### خطأ module not found؟
```bash
npm install
cd electron && npm install
```
