import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Mail, Lock, Camera, Loader2, Save, 
  Eye, EyeOff, ShieldCheck, Image
} from 'lucide-react';

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, updatePassword, refreshProfile } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('game-images')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('game-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      toast.error('الاسم الأول مطلوب');
      return;
    }

    setSaving(true);

    try {
      let newAvatarUrl = avatarUrl;
      
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        } else {
          toast.error('حدث خطأ في رفع الصورة');
          setSaving(false);
          return;
        }
      }

      const { error } = await updateProfile({
        first_name: firstName,
        last_name: lastName || null,
        avatar_url: newAvatarUrl,
      });

      if (error) {
        toast.error('حدث خطأ في حفظ البيانات');
      } else {
        toast.success('تم حفظ البيانات بنجاح');
        setAvatarFile(null);
        await refreshProfile();
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    }

    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast.error(error.message || 'حدث خطأ في تحديث كلمة المرور');
    } else {
      toast.success('تم تحديث كلمة المرور بنجاح');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setSavingPassword(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8 gradient-text text-center">
          إعدادات الحساب
        </h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="glass-morphism p-6 animate-slide-up">
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              معلومات الملف الشخصي
            </h2>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-card border-2 border-border overflow-hidden">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">اضغط لتغيير الصورة</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">الاسم الأول *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">الاسم الأخير</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1"
                    placeholder="اختياري"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={profile?.username || ''}
                  className="mt-1 bg-muted"
                  disabled
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير اسم المستخدم</p>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ التغييرات
              </Button>
            </div>
          </div>

          {/* Email Section */}
          <div className="glass-morphism p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              البريد الإلكتروني
            </h2>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                value={user?.email || ''}
                className="mt-1 bg-muted"
                disabled
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني</p>
            </div>
          </div>

          {/* Password Section */}
          <div className="glass-morphism p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              تغيير كلمة المرور
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                  dir="ltr"
                />
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={savingPassword || !newPassword}
                variant="outline"
                className="w-full"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : null}
                تحديث كلمة المرور
              </Button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="glass-morphism p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              التحقق بخطوتين
            </h2>

            <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
              <div>
                <p className="font-medium">التحقق بخطوتين</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.totp_enabled ? 'مفعّل' : 'غير مفعّل'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm ${
                profile?.totp_enabled 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {profile?.totp_enabled ? 'مفعّل' : 'غير مفعّل'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
