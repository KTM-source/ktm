import { useState, useEffect } from 'react';
import { 
  Settings, FolderOpen, HardDrive, Info, Palette, Bell, 
  Download, Shield, Zap, Monitor, Volume2, Globe, 
  RefreshCw, Trash2, Database, Cpu, MemoryStick
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useElectron } from '@/hooks/useElectron';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface LauncherSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LauncherSettings = ({ open, onOpenChange }: LauncherSettingsProps) => {
  const { downloadPath, changeDownloadPath, installedGames, downloadHistory } = useElectron();
  const [isChangingPath, setIsChangingPath] = useState(false);
  
  // Settings state
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('ar');
  const [downloadSpeed, setDownloadSpeed] = useState([0]);
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState('1');
  const [autoExtract, setAutoExtract] = useState(true);
  const [deleteZipAfterExtract, setDeleteZipAfterExtract] = useState(true);
  const [verifyIntegrity, setVerifyIntegrity] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

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
    await changeDownloadPath();
    setIsChangingPath(false);
  };

  // Simulated system info
  const systemInfo = {
    os: 'Windows 11',
    cpu: 'Intel Core i7-12700K',
    ram: '32 GB',
    gpu: 'NVIDIA RTX 3080',
    diskFree: '256 GB',
    diskTotal: '1 TB'
  };

  const diskUsagePercent = ((1024 - 256) / 1024) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
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
                  control={<Switch checked={autoUpdate} onCheckedChange={setAutoUpdate} />}
                />
                
                <SettingRow
                  icon={<Zap className="w-4 h-4" />}
                  title="التشغيل مع بدء النظام"
                  description="تشغيل اللانشر تلقائياً عند بدء تشغيل الكمبيوتر"
                  control={<Switch checked={autoLaunch} onCheckedChange={setAutoLaunch} />}
                />
                
                <SettingRow
                  icon={<Monitor className="w-4 h-4" />}
                  title="التصغير إلى شريط المهام"
                  description="عند إغلاق النافذة، يبقى اللانشر في شريط المهام"
                  control={<Switch checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />}
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
                  control={<Switch checked={notifications} onCheckedChange={setNotifications} />}
                />
                
                <SettingRow
                  icon={<Volume2 className="w-4 h-4" />}
                  title="المؤثرات الصوتية"
                  description="تشغيل أصوات عند التنزيل والتثبيت"
                  control={<Switch checked={soundEffects} onCheckedChange={setSoundEffects} />}
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
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">داكن</SelectItem>
                        <SelectItem value="light">فاتح</SelectItem>
                        <SelectItem value="system">تلقائي</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                
                <SettingRow
                  icon={<Globe className="w-4 h-4" />}
                  title="اللغة"
                  description="لغة واجهة اللانشر"
                  control={
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
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
                
                <SettingRow
                  icon={<Download className="w-4 h-4" />}
                  title="التنزيلات المتزامنة"
                  description="عدد التنزيلات في نفس الوقت"
                  control={
                    <Select value={maxConcurrentDownloads} onValueChange={setMaxConcurrentDownloads}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                />
                
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
                    onValueChange={setDownloadSpeed}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <SettingRow
                  icon={<Shield className="w-4 h-4" />}
                  title="فك الضغط التلقائي"
                  description="فك ضغط الملفات تلقائياً بعد التنزيل"
                  control={<Switch checked={autoExtract} onCheckedChange={setAutoExtract} />}
                />
                
                <SettingRow
                  icon={<Trash2 className="w-4 h-4" />}
                  title="حذف ملفات ZIP"
                  description="حذف ملفات ZIP بعد فك الضغط"
                  control={<Switch checked={deleteZipAfterExtract} onCheckedChange={setDeleteZipAfterExtract} />}
                />
                
                <SettingRow
                  icon={<Shield className="w-4 h-4" />}
                  title="التحقق من السلامة"
                  description="التحقق من سلامة الملفات بعد التنزيل"
                  control={<Switch checked={verifyIntegrity} onCheckedChange={setVerifyIntegrity} />}
                />
              </div>
            </TabsContent>

            {/* Performance Settings */}
            <TabsContent value="performance" className="space-y-4 mt-0">
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Cpu className="w-4 h-4 text-primary" />
                  الأداء
                </h3>
                
                <SettingRow
                  icon={<Zap className="w-4 h-4" />}
                  title="تسريع الأجهزة"
                  description="استخدام GPU لتسريع عرض الواجهة"
                  control={<Switch checked={hardwareAcceleration} onCheckedChange={setHardwareAcceleration} />}
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
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoCard icon={<Monitor />} label="نظام التشغيل" value={systemInfo.os} />
                  <InfoCard icon={<Cpu />} label="المعالج" value={systemInfo.cpu} />
                  <InfoCard icon={<MemoryStick />} label="الذاكرة" value={systemInfo.ram} />
                  <InfoCard icon={<Monitor />} label="كرت الشاشة" value={systemInfo.gpu} />
                </div>
              </div>
            </TabsContent>

            {/* Storage Settings */}
            <TabsContent value="storage" className="space-y-4 mt-0">
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <HardDrive className="w-4 h-4 text-primary" />
                  التخزين
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المساحة المستخدمة</span>
                    <span className="text-foreground font-medium">{systemInfo.diskTotal} - {systemInfo.diskFree} متاح</span>
                  </div>
                  <Progress value={diskUsagePercent} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Database className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{installedGames.length}</p>
                    <p className="text-xs text-muted-foreground">لعبة مثبتة</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <HardDrive className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{formatSize(totalSize)}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الحجم</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Download className="w-4 h-4 text-primary" />
                  سجل التنزيلات
                </h3>
                
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{downloadHistory.length}</p>
                  <p className="text-xs text-muted-foreground">تنزيل في السجل</p>
                </div>
                
                <Button variant="outline" className="w-full gap-2" size="sm">
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
                    مكتبة ألعاب متكاملة مع اكتشاف تلقائي
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    تشغيل الألعاب بنقرة واحدة
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    إدارة التنزيلات والتحديثات
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