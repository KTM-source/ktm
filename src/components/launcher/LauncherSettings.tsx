import { useState, useEffect } from 'react';
import { 
  Settings, FolderOpen, HardDrive, Info, Palette, Bell, 
  Download, Shield, Zap, Monitor, Volume2, Globe, 
  RefreshCw, Trash2, Database, Cpu, MemoryStick, Power,
  Lock, AlertTriangle, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useElectron } from '@/hooks/useElectron';
import { useLiteMode } from '@/hooks/useLiteMode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface LauncherSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SystemInfo {
  os: string;
  cpu: string;
  ram: string;
  freeMem: string;
  platform: string;
  arch: string;
}

const LauncherSettings = ({ open, onOpenChange }: LauncherSettingsProps) => {
  const { downloadPath, changeDownloadPath, installedGames, downloadHistory, isElectron, settings: electronSettings, saveSettings, getSystemInfo, uninstallLauncher, clearDownloadHistory } = useElectron();
  const { isLiteMode, toggleLiteMode } = useLiteMode();
  const [isChangingPath, setIsChangingPath] = useState(false);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  
  // Settings state
  const [autoUpdate, setAutoUpdate] = useState(electronSettings?.autoUpdate ?? true);
  const [notifications, setNotifications] = useState(electronSettings?.notifications ?? true);
  const [autoLaunch, setAutoLaunch] = useState(electronSettings?.autoLaunch ?? false);
  const [minimizeToTray, setMinimizeToTray] = useState(electronSettings?.minimizeToTray ?? true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(electronSettings?.hardwareAcceleration ?? true);
  const [theme, setTheme] = useState(electronSettings?.theme ?? 'dark');
  const [language, setLanguage] = useState('ar'); // Locked to Arabic
  const [downloadSpeed, setDownloadSpeed] = useState([electronSettings?.downloadSpeed ?? 0]);
  const [autoExtract, setAutoExtract] = useState(electronSettings?.autoExtract ?? true);
  const [deleteArchiveAfterExtract, setDeleteArchiveAfterExtract] = useState(electronSettings?.deleteArchiveAfterExtract ?? true);
  const [verifyIntegrity, setVerifyIntegrity] = useState(electronSettings?.verifyIntegrity ?? true);
  const [soundEffects, setSoundEffects] = useState(electronSettings?.soundEffects ?? true);

  // Load system info
  useEffect(() => {
    if (open && isElectron && getSystemInfo) {
      getSystemInfo().then(setSystemInfo);
    }
  }, [open, isElectron, getSystemInfo]);

  // Save settings when changed
  const handleSettingChange = async (key: string, value: any) => {
    if (saveSettings) {
      await saveSettings({ [key]: value });
      toast.success('تم حفظ الإعداد');
    }
  };

  const totalSize = installedGames.reduce((acc, game) => acc + game.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleChangePath = async () => {
    setIsChangingPath(true);
    const result = await changeDownloadPath();
    if (result) {
      toast.success('تم تغيير مسار التنزيلات');
    }
    setIsChangingPath(false);
  };

  const handleUninstall = async () => {
    if (uninstallLauncher) {
      const result = await uninstallLauncher();
      if (result.success) {
        toast.success('جاري إلغاء تثبيت اللانشر...');
      } else {
        toast.error('فشل في إلغاء التثبيت');
      }
    }
    setShowUninstallDialog(false);
  };

  const handleClearHistory = async () => {
    if (clearDownloadHistory) {
      await clearDownloadHistory();
      toast.success('تم مسح سجل التنزيلات');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px] max-h-[80vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] fixed">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-5 h-5 text-primary animate-spin-slow" />
              إعدادات اللانشر
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="general" className="text-xs">عام</TabsTrigger>
              <TabsTrigger value="downloads" className="text-xs">التنزيلات</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">الأداء</TabsTrigger>
              <TabsTrigger value="storage" className="text-xs">التخزين</TabsTrigger>
              <TabsTrigger value="about" className="text-xs">حول</TabsTrigger>
            </TabsList>

            <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4">
              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Monitor className="w-4 h-4 text-primary" />
                    السلوك العام
                  </h3>
                  
                  <SettingRow
                    icon={<RefreshCw className="w-4 h-4" />}
                    title="التحديث التلقائي"
                    description="تحديث اللانشر تلقائياً عند توفر إصدار جديد"
                    control={
                      <Switch 
                        checked={autoUpdate} 
                        onCheckedChange={(v) => {
                          setAutoUpdate(v);
                          handleSettingChange('autoUpdate', v);
                        }} 
                      />
                    }
                  />
                  
                  <SettingRow
                    icon={<Zap className="w-4 h-4" />}
                    title="التشغيل مع بدء النظام"
                    description="تشغيل اللانشر تلقائياً عند بدء تشغيل الكمبيوتر"
                    control={
                      <Switch 
                        checked={autoLaunch} 
                        onCheckedChange={(v) => {
                          setAutoLaunch(v);
                          handleSettingChange('autoLaunch', v);
                        }} 
                      />
                    }
                  />
                  
                  <SettingRow
                    icon={<Monitor className="w-4 h-4" />}
                    title="التصغير إلى شريط المهام"
                    description="عند إغلاق النافذة، يبقى اللانشر في شريط المهام"
                    control={
                      <Switch 
                        checked={minimizeToTray} 
                        onCheckedChange={(v) => {
                          setMinimizeToTray(v);
                          handleSettingChange('minimizeToTray', v);
                        }} 
                      />
                    }
                  />
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Bell className="w-4 h-4 text-primary" />
                    الإشعارات والصوت
                  </h3>
                  
                  <SettingRow
                    icon={<Bell className="w-4 h-4" />}
                    title="الإشعارات"
                    description="إظهار إشعارات عند اكتمال التنزيلات والتحديثات"
                    control={
                      <Switch 
                        checked={notifications} 
                        onCheckedChange={(v) => {
                          setNotifications(v);
                          handleSettingChange('notifications', v);
                        }} 
                      />
                    }
                  />
                  
                  <SettingRow
                    icon={<Volume2 className="w-4 h-4" />}
                    title="المؤثرات الصوتية"
                    description="تشغيل أصوات عند التنزيل والتثبيت"
                    control={
                      <Switch 
                        checked={soundEffects} 
                        onCheckedChange={(v) => {
                          setSoundEffects(v);
                          handleSettingChange('soundEffects', v);
                        }} 
                      />
                    }
                  />
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Palette className="w-4 h-4 text-primary" />
                    المظهر واللغة
                  </h3>
                  
                  <SettingRow
                    icon={<Palette className="w-4 h-4" />}
                    title="المظهر"
                    description="اختر مظهر الواجهة"
                    control={
                      <Select 
                        value={theme} 
                        onValueChange={(v) => {
                          setTheme(v);
                          handleSettingChange('theme', v);
                          // Apply theme immediately
                          const root = document.documentElement;
                          if (v === 'light') {
                            root.classList.remove('dark');
                            root.classList.add('light');
                            localStorage.setItem('theme', 'light');
                          } else {
                            root.classList.remove('light');
                            root.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                          }
                          toast.success(v === 'light' ? 'تم التغيير إلى الوضع الفاتح' : 'تم التغيير إلى الوضع الداكن');
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">داكن</SelectItem>
                          <SelectItem value="light">فاتح</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  />
                  
                  <SettingRow
                    icon={<Globe className="w-4 h-4" />}
                    title="اللغة"
                    description="لغة واجهة اللانشر"
                    control={
                      <div className="flex flex-col items-end">
                        <Select value={language} disabled>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="en" disabled>
                              <span className="flex items-center gap-2">
                                English
                                <Lock className="w-3 h-3" />
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-[10px] text-muted-foreground mt-1">English - Soon</span>
                      </div>
                    }
                  />
                </div>

                {/* Uninstall Section */}
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    منطقة الخطر
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">إلغاء تثبيت اللانشر</p>
                      <p className="text-xs text-muted-foreground">سيتم إزالة اللانشر من جهازك بالكامل</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowUninstallDialog(true)}
                      className="gap-2"
                    >
                      <Power className="w-4 h-4" />
                      إلغاء التثبيت
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Download Settings */}
              <TabsContent value="downloads" className="space-y-4 mt-0">
                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    مجلد التنزيلات
                  </h3>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-4 py-3 text-sm text-muted-foreground truncate" dir="ltr">
                      {downloadPath || 'لم يتم تحديد مسار'}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleChangePath}
                      disabled={isChangingPath}
                      className="shrink-0 gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      {isChangingPath ? 'جاري...' : 'تغيير'}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Download className="w-4 h-4 text-primary" />
                    إعدادات التنزيل
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span>حد سرعة التنزيل</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {downloadSpeed[0] === 0 ? 'بلا حدود' : `${downloadSpeed[0]} MB/s`}
                      </span>
                    </div>
                    <Slider
                      value={downloadSpeed}
                      onValueChange={(v) => {
                        setDownloadSpeed(v);
                        handleSettingChange('downloadSpeed', v[0]);
                      }}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <SettingRow
                    icon={<Shield className="w-4 h-4" />}
                    title="فك الضغط التلقائي"
                    description="فك ضغط الملفات (ZIP/RAR) تلقائياً بعد التنزيل"
                    control={
                      <Switch 
                        checked={autoExtract} 
                        onCheckedChange={(v) => {
                          setAutoExtract(v);
                          handleSettingChange('autoExtract', v);
                        }} 
                      />
                    }
                  />
                  
                  <SettingRow
                    icon={<Trash2 className="w-4 h-4" />}
                    title="حذف ملفات الأرشيف"
                    description="حذف ملفات ZIP/RAR بعد فك الضغط"
                    control={
                      <Switch 
                        checked={deleteArchiveAfterExtract} 
                        onCheckedChange={(v) => {
                          setDeleteArchiveAfterExtract(v);
                          handleSettingChange('deleteArchiveAfterExtract', v);
                        }} 
                      />
                    }
                  />
                  
                  <SettingRow
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    title="التحقق من السلامة"
                    description="التحقق من سلامة الملفات بعد التنزيل"
                    control={
                      <Switch 
                        checked={verifyIntegrity} 
                        onCheckedChange={(v) => {
                          setVerifyIntegrity(v);
                          handleSettingChange('verifyIntegrity', v);
                        }} 
                      />
                    }
                  />

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1 text-blue-200">💡 ملاحظة</p>
                    <p className="text-xs opacity-80 text-blue-200/80">
                      يدعم اللانشر تحميل ملفات ZIP و RAR مباشرة. لفك ضغط RAR يجب تثبيت WinRAR أو 7-Zip.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Performance Settings */}
              <TabsContent value="performance" className="space-y-4 mt-0">
                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    التأثيرات البصرية
                  </h3>
                  
                  <SettingRow
                    icon={<Sparkles className="w-4 h-4" />}
                    title="Light Mode"
                    description="إزالة التأثيرات والأنيميشنات لتحسين الأداء (Glow, Blur, Particles)"
                    control={
                      <Switch 
                        checked={isLiteMode} 
                        onCheckedChange={(v) => {
                          toggleLiteMode(v);
                          toast.success(v ? 'تم تفعيل الوضع الخفيف' : 'تم إلغاء الوضع الخفيف');
                        }} 
                      />
                    }
                  />
                  
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1 text-primary">✨ Light Mode</p>
                    <p className="text-xs opacity-80 text-foreground/70">
                      يزيل الأنيميشنات، تأثيرات Glow و Blur، والجزيئات المتحركة لتحسين أداء اللانشر. مُفعّل افتراضياً.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Cpu className="w-4 h-4 text-primary" />
                    الأداء
                  </h3>
                  
                  <SettingRow
                    icon={<Zap className="w-4 h-4" />}
                    title="تسريع الأجهزة"
                    description="استخدام GPU لتسريع عرض الواجهة (يتطلب إعادة التشغيل)"
                    control={
                      <Switch 
                        checked={hardwareAcceleration} 
                        onCheckedChange={(v) => {
                          setHardwareAcceleration(v);
                          handleSettingChange('hardwareAcceleration', v);
                          toast.info('يتطلب إعادة تشغيل اللانشر لتطبيق التغيير');
                        }} 
                      />
                    }
                  />
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200/80">
                    <p className="font-medium mb-1">💡 نصيحة للأداء</p>
                    <p className="text-xs opacity-80">
                      إذا واجهت بطء في الواجهة، جرب تعطيل تسريع الأجهزة وإعادة تشغيل اللانشر
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Monitor className="w-4 h-4 text-primary" />
                    معلومات النظام
                  </h3>
                  
                  {systemInfo ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoCard icon={<Monitor />} label="نظام التشغيل" value={systemInfo.os} />
                      <InfoCard icon={<Cpu />} label="المعالج" value={systemInfo.cpu} />
                      <InfoCard icon={<MemoryStick />} label="الذاكرة" value={systemInfo.ram} />
                      <InfoCard icon={<HardDrive />} label="المتاح" value={systemInfo.freeMem} />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      جاري تحميل معلومات النظام...
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Storage Settings */}
              <TabsContent value="storage" className="space-y-4 mt-0">
                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <HardDrive className="w-4 h-4 text-primary" />
                    التخزين
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <Database className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-3xl font-bold text-foreground">{installedGames.length}</p>
                      <p className="text-xs text-muted-foreground">لعبة مثبتة</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <HardDrive className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-3xl font-bold text-foreground">{formatSize(totalSize)}</p>
                      <p className="text-xs text-muted-foreground">إجمالي الحجم</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Download className="w-4 h-4 text-primary" />
                    سجل التنزيلات
                  </h3>
                  
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{downloadHistory.length}</p>
                    <p className="text-xs text-muted-foreground">تنزيل في السجل</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    size="sm"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح سجل التنزيلات
                  </Button>
                </div>
              </TabsContent>

              {/* About */}
              <TabsContent value="about" className="space-y-4 mt-0">
                <div className="bg-muted/30 rounded-xl p-6 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-primary/30">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      KTM
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground">KTM Launcher</h3>
                    <p className="text-sm text-muted-foreground">الإصدار 1.0.0</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    لانشر ألعاب متكامل يوفر تجربة سهلة وسريعة لتحميل وتثبيت وتشغيل الألعاب
                  </p>
                  
                  <div className="flex justify-center gap-4 pt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Globe className="w-4 h-4" />
                      الموقع
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      التحديثات
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">الميزات</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      تحميل وتثبيت الألعاب تلقائياً
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      دعم Gofile مع استخراج الروابط المباشرة
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      فك ضغط ZIP و RAR تلقائياً
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      مكتبة ألعاب متكاملة مع اكتشاف تلقائي
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      تشغيل الألعاب بنقرة واحدة
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      واجهة عربية حديثة وسلسة
                    </li>
                  </ul>
                </div>
                
                <p className="text-center text-xs text-muted-foreground/50">
                  © 2024 KTM Games. جميع الحقوق محفوظة.
                </p>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Uninstall Confirmation Dialog */}
      <AlertDialog open={showUninstallDialog} onOpenChange={setShowUninstallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              تأكيد إلغاء التثبيت
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء تثبيت KTM Launcher؟
              <br />
              سيتم إغلاق اللانشر وتشغيل برنامج إلغاء التثبيت.
              <br />
              <span className="text-muted-foreground text-xs">ملاحظة: لن يتم حذف الألعاب المثبتة.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleUninstall} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              نعم، إلغاء التثبيت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Helper Components
const SettingRow = ({ 
  icon, 
  title, 
  description, 
  control 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  control: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {control}
  </div>
);

const InfoCard = ({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
}) => (
  <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
    <div className="text-primary">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  </div>
);

export default LauncherSettings;
