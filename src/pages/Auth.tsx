import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  username: z.string()
    .min(3, 'اليوزرنيم يجب أن يكون 3 أحرف على الأقل')
    .max(28, 'اليوزرنيم يجب أن يكون 28 حرف كحد أقصى')
    .regex(/^[a-zA-Z0-9_-]+$/, 'اليوزرنيم يجب أن يكون إنجليزي فقط مع أرقام وشرطات')
    .refine(val => !val.includes('.'), 'لا يمكن استخدام النقاط في اليوزرنيم'),
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  lastName: z.string().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const generateTOTP = async () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'KTM Games',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    const uri = totp.toString();
    const qrCode = await QRCode.toDataURL(uri);
    
    setTotpSecret(secret.base32);
    setQrCodeUrl(qrCode);
    return { secret: secret.base32, totp };
  };

  const verifyTOTP = (code: string, secret: string): boolean => {
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'KTM Games',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
      });

      const delta = totp.validate({ token: code, window: 1 });
      return delta !== null;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          toast.error(result.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('تم تسجيل الدخول بنجاح');
          navigate('/');
        }
      } else {
        const result = signupSchema.safeParse({ email, password, username, firstName, lastName });
        if (!result.success) {
          toast.error(result.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error, userId } = await signUp(email, password, username, firstName, lastName);
        if (error) {
          toast.error(error.message);
        } else if (userId) {
          setPendingUserId(userId);
          await generateTOTP();
          setShow2FA(true);
          toast.info('يرجى إعداد التحقق بخطوتين لإكمال التسجيل');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('يرجى إدخال رمز مكون من 6 أرقام');
      return;
    }

    setLoading(true);
    
    const isValid = verifyTOTP(otpCode, totpSecret);
    
    if (isValid && pendingUserId) {
      // Save TOTP secret to profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          totp_secret: totpSecret,
          totp_enabled: true 
        })
        .eq('user_id', pendingUserId);

      if (error) {
        toast.error('حدث خطأ في حفظ إعدادات التحقق');
        setLoading(false);
        return;
      }

      toast.success('تم إنشاء الحساب بنجاح!');
      setShow2FA(false);
      navigate('/');
    } else {
      toast.error('الرمز غير صحيح، يرجى المحاولة مرة أخرى');
    }
    
    setLoading(false);
  };

  if (show2FA) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-md">
          <div className="glass-morphism p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">التحقق بخطوتين</h1>
              <p className="text-muted-foreground text-sm">
                امسح رمز QR باستخدام تطبيق المصادقة (مثل Google Authenticator)
              </p>
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-xl">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-muted-foreground text-center mb-2">
                أو أدخل هذا الكود يدوياً:
              </p>
              <div className="bg-card/50 p-3 rounded-lg text-center font-mono text-sm break-all">
                {totpSecret}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="otp">أدخل الرمز المؤقت</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest mt-2"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleVerify2FA}
                className="w-full"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : null}
                تأكيد وإنشاء الحساب
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="glass-morphism p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 gradient-text">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? 'أهلاً بعودتك!' : 'انضم إلى مجتمع KTM'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">الاسم الأول *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="أحمد"
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
                      type="text"
                      placeholder="محمد (اختياري)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">اسم المستخدم *</Label>
                  <div className="relative mt-1">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username_123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="pr-10"
                      dir="ltr"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    3-28 حرف إنجليزي، أرقام، شرطات فقط
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  dir="ltr"
                  required
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

            {isLogin && (
              <div className="text-left">
                <a href="/forgot-password" className="text-sm text-primary hover:underline">
                  نسيت كلمة المرور؟
                </a>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline mr-2"
              >
                {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
