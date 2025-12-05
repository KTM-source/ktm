import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Mail, Lock, Camera, Loader2, Save, 
  Eye, EyeOff, ShieldCheck, Shield, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, updatePassword, refreshProfile, enableTOTP, disableTOTP } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  
  // Username change
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);

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
      setUsername(profile.username || '');
      
      // Check if username can be changed (once per week)
      const lastChange = (profile as any).last_username_change;
      if (lastChange) {
        const lastChangeDate = new Date(lastChange);
        const now = new Date();
        const diffTime = now.getTime() - lastChangeDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
          setCanChangeUsername(false);
          setDaysUntilChange(7 - diffDays);
        } else {
          setCanChangeUsername(true);
        }
      }
    }
  }, [profile]);

  // Username availability check with debounce
  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (!value || value === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    // Validate format first
    const isValidFormat = /^[a-zA-Z0-9_-]{3,28}$/.test(value);
    if (!isValidFormat) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc('is_username_available', {
        check_username: value
      });
      
      if (!error) {
        setUsernameAvailable(data);
      }
    } catch (err) {
      console.error('Username check error:', err);
    }
    setCheckingUsername(false);
  }, [profile?.username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username && username !== profile?.username) {
        checkUsernameAvailability(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability, profile?.username]);

  const generateOrLoadTOTPSecret = async () => {
    // If user already has a TOTP secret stored, use it
    if (profile?.totp_secret && !profile?.totp_enabled) {
      const existingSecret = profile.totp_secret;
      setTotpSecret(existingSecret);
      
      const totp = new OTPAuth.TOTP({
        issuer: 'KTM Games',
        label: user?.email || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(existingSecret),
      });

      const uri = totp.toString();
      try {
        const qrUrl = await QRCode.toDataURL(uri, {
          width: 200,
          margin: 2,
          color: {
            dark: '#ffffff',
            light: '#00000000',
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error('QR Code generation error:', err);
      }
      return;
    }

    // Generate new secret and store it
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'KTM Games',
      label: user?.email || 'user',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    const uri = totp.toString();
    const secretBase32 = secret.base32;
    setTotpSecret(secretBase32);

    // Store the secret in the database immediately
    if (user) {
      await supabase
        .from('profiles')
        .update({ totp_secret: secretBase32 })
        .eq('user_id', user.id);
    }

    try {
      const qrUrl = await QRCode.toDataURL(uri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('QR Code generation error:', err);
    }
  };

  const handleOpen2FAModal = () => {
    generateOrLoadTOTPSecret();
    setVerificationCode('');
    setShow2FAModal(true);
  };

  const verifyAndEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('الرجاء إدخال رمز مكون من 6 أرقام');
      return;
    }

    setVerifying2FA(true);

    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'KTM Games',
        label: user?.email || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret),
      });

      const isValid = totp.validate({ token: verificationCode, window: 2 }) !== null;

      if (isValid) {
        const { error } = await enableTOTP(totpSecret);
        if (error) {
          toast.error('حدث خطأ في تفعيل التحقق بخطوتين');
        } else {
          toast.success('تم تفعيل التحقق بخطوتين بنجاح');
          setShow2FAModal(false);
          setVerificationCode('');
        }
      } else {
        toast.error('الرمز غير صحيح، حاول مرة أخرى');
      }
    } catch (err) {
      toast.error('حدث خطأ في التحقق من الرمز');
    }

    setVerifying2FA(false);
  };

  const handleDisable2FA = async () => {
    setDisabling2FA(true);
    const { error } = await disableTOTP();
    if (error) {
      toast.error('حدث خطأ في إلغاء التحقق بخطوتين');
    } else {
      toast.success('تم إلغاء التحقق بخطوتين');
    }
    setDisabling2FA(false);
  };

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

    // Validate username if changed
    const usernameChanged = username !== profile?.username;
    if (usernameChanged) {
      if (!canChangeUsername) {
        toast.error(`يمكنك تغيير اليوزر بعد ${daysUntilChange} أيام`);
        return;
      }
      
      if (!usernameAvailable) {
        toast.error('اسم المستخدم غير متاح');
        return;
      }
      
      const isValidFormat = /^[a-zA-Z0-9_-]{3,28}$/.test(username);
      if (!isValidFormat) {
        toast.error('اسم المستخدم غير صالح');
        return;
      }
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

      const updateData: any = {
        first_name: firstName,
        last_name: lastName || null,
        avatar_url: newAvatarUrl,
      };

      if (usernameChanged) {
        updateData.username = username;
        updateData.last_username_change = new Date().toISOString();
      }

      const { error } = await updateProfile(updateData);

      if (error) {
        toast.error('حدث خطأ في حفظ البيانات');
      } else {
        toast.success('تم حفظ البيانات بنجاح');
        setAvatarFile(null);
        if (usernameChanged) {
          setCanChangeUsername(false);
          setDaysUntilChange(7);
        }
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="font-display text-3xl font-bold mb-6 gradient-text text-center">
          إعدادات الحساب
        </h1>

        {/* Main Grid Layout - Horizontal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="glass-morphism p-5 animate-slide-up h-fit">
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات الملف الشخصي
              </h2>

              <div className="flex items-start gap-4">
                {/* Avatar Upload */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-card border-2 border-border overflow-hidden">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName" className="text-xs">الاسم الأول *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs">الاسم الأخير</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 h-9"
                        placeholder="اختياري"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-xs">اسم المستخدم</Label>
                    <div className="relative mt-1">
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className={`h-9 pl-8 ${!canChangeUsername ? 'bg-muted' : ''}`}
                        dir="ltr"
                        disabled={!canChangeUsername}
                      />
                      {canChangeUsername && username !== profile?.username && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                          {checkingUsername ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : usernameAvailable === true ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : usernameAvailable === false ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
                      )}
                    </div>
                    {!canChangeUsername ? (
                      <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        يمكنك التغيير بعد {daysUntilChange} أيام
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        3-28 حرف إنجليزي، يمكن تغييره مرة كل أسبوع
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full mt-4"
                size="sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                حفظ التغييرات
              </Button>
            </div>

            {/* Email Section */}
            <div className="glass-morphism p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                البريد الإلكتروني
              </h2>

              <div>
                <Label htmlFor="email" className="text-xs">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  className="mt-1 bg-muted h-9"
                  disabled
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">لا يمكن تغيير البريد الإلكتروني</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Password Section */}
            <div className="glass-morphism p-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                تغيير كلمة المرور
              </h2>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="newPassword" className="text-xs">كلمة المرور الجديدة</Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="h-9"
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
                  <Label htmlFor="confirmPassword" className="text-xs">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 h-9"
                    dir="ltr"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={savingPassword || !newPassword}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {savingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : null}
                  تحديث كلمة المرور
                </Button>
              </div>
            </div>

            {/* 2FA Section */}
            <div className="glass-morphism p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                التحقق بخطوتين
              </h2>

              <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${profile?.totp_enabled ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    <Shield className={`w-4 h-4 ${profile?.totp_enabled ? 'text-green-500' : 'text-yellow-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">التحقق بخطوتين</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.totp_enabled ? 'محمي بالتحقق بخطوتين' : 'أضف حماية إضافية'}
                    </p>
                  </div>
                </div>
                {profile?.totp_enabled ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDisable2FA}
                    disabled={disabling2FA}
                  >
                    {disabling2FA ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إلغاء'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleOpen2FAModal}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ShieldCheck className="w-4 h-4 ml-1" />
                    تفعيل
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FAModal} onOpenChange={setShow2FAModal}>
        <DialogContent className="sm:max-w-md glass-morphism border-border/50 animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
              تفعيل التحقق بخطوتين
            </DialogTitle>
            <DialogDescription>
              امسح رمز QR باستخدام تطبيق المصادقة (مثل Google Authenticator)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-4 bg-card rounded-xl border border-border/50 shadow-lg">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 animate-fade-in"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Manual Secret */}
            <div>
              <p className="text-sm text-muted-foreground text-center mb-2">
                أو أدخل هذا الرمز يدوياً في تطبيق المصادقة:
              </p>
              <div className="bg-card/50 p-3 rounded-lg border border-border/30">
                <code className="text-sm font-mono break-all text-center block text-primary">
                  {totpSecret}
                </code>
              </div>
            </div>

            {/* Verification Code Input */}
            <div>
              <Label htmlFor="verificationCode" className="text-sm">أدخل الرمز المؤقت للتأكيد</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-2 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShow2FAModal(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button 
                onClick={verifyAndEnable2FA}
                disabled={verifying2FA || verificationCode.length !== 6}
                className="flex-1"
              >
                {verifying2FA ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                )}
                تأكيد التفعيل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Account;