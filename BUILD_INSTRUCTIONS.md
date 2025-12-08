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

### 2. حذف مجلد electron/dist القديم (مهم!)
```bash
# Windows (CMD)
rmdir /s /q electron\dist

# PowerShell
Remove-Item -Recurse -Force electron\dist -ErrorAction SilentlyContinue
```

### 3. نسخ ملفات dist إلى مجلد electron ⚠️ خطوة إلزامية
```bash
# Windows (CMD)
xcopy dist electron\dist /E /I /Y

# Windows (PowerShell)
Copy-Item -Path "dist\*" -Destination "electron\dist" -Recurse -Force

# Mac/Linux
cp -r dist electron/dist
```

### 4. تثبيت وبناء Electron
```bash
cd electron
npm install
npm run build:win
```

### 5. تشغيل البرنامج
```
electron\release\win-unpacked\KTM Launcher.exe
```

---

## ⚠️ ملاحظات مهمة جداً

- **يجب** حذف مجلد `electron/dist` القديم قبل نسخ الملفات الجديدة
- **يجب** نسخ مجلد `dist` إلى `electron/dist` قبل البناء
- إذا ظهرت **شاشة سوداء** = لم يتم نسخ ملفات dist بشكل صحيح
- البرنامج يُبنى في: `electron/release/win-unpacked/`

---

## حل المشاكل

### شاشة سوداء؟
1. احذف مجلد `electron/dist` بالكامل
2. أعد نسخ dist الجديد: `xcopy dist electron\dist /E /I /Y`
3. أعد البناء: `cd electron && npm run build:win`

### خطأ symbolic link؟
شغّل البرنامج مباشرة من: `electron\release\win-unpacked\KTM Launcher.exe`

### خطأ module not found؟
```bash
npm install
cd electron && npm install
```
