'use client';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerification } from './EmailVerification';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onRegisterSuccess?: () => void;
  onRequestInvite?: () => void;
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode, onRegisterSuccess, onRequestInvite }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [reason, setReason] = useState('');
  const [source, setSource] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // API URL'ini belirle (development/production)
  const getApiUrl = () => {
    const isDevelopment = typeof window !== "undefined" && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
    if (isDevelopment) {
      return `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '192.168.0.6' : window.location.hostname}:3001`;
    }
    return 'https://devforum-backend-102j.onrender.com';
  };

  // Modal açıldığında state'leri sıfırla
  useEffect(() => {
    if (isOpen) {
      setRegisterSuccess(false);
      setNeedsEmailVerification(false);
      setVerificationEmail('');
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
      setDisplayName('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setBirthDate('');
      setReason('');
      setSource('');
      setAgreeToTerms(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          // Hata mesajlarını Türkçe'ye çevir
          let errorMessage = 'Bir hata oluştu';
          
          if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
            errorMessage = 'E-posta veya şifre yanlış';
          } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
            errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-postanızı kontrol edin.';
          } else if (error.message?.includes('Too many requests')) {
            errorMessage = 'Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }
        onClose();
      } else {
        // Form validasyonu
        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || 
            !birthDate || !reason.trim() || !source.trim() || !username.trim() || !displayName.trim()) {
          setError('Lütfen tüm alanları doldurun');
          setLoading(false);
          return;
        }

        if (!agreeToTerms) {
          setError('Lütfen şartları kabul edin');
          setLoading(false);
          return;
        }

        // E-posta formatı kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError('Geçerli bir e-posta adresi girin');
          setLoading(false);
          return;
        }
        
        // Kullanıcı adında boşluk kontrolü
        if (username.includes(' ')) {
          setError('Kullanıcı adında boşluk olamaz');
          setLoading(false);
          return;
        }
        
        // Kullanıcı adı benzersizlik kontrolü (RPC ile - 406 önler)
        const { data: isAvailable, error: rpcError } = await supabase.rpc<any>('is_username_available', {
          p_username: username.toLowerCase().trim()
        });

        if (rpcError) {
          setError('Kullanıcı adı kontrol edilirken bir hata oluştu');
          setLoading(false);
          return;
        }

        if (!isAvailable) {
          setError('Bu kullanıcı adı zaten kullanılıyor. Lütfen farklı bir kullanıcı adı seçin.');
          setLoading(false);
          return;
        }

        // Önce davet kodu talep formunu kaydet ve davet kodu oluştur
        try {
          const inviteResponse = await fetch(`${getApiUrl()}/api/invite-requests/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim(),
              email: email.toLowerCase().trim(),
              birth_date: birthDate,
              reason: reason.trim(),
              source: source.trim()
            }),
          });

          if (!inviteResponse.ok) {
            const errorData = await inviteResponse.json();
            throw new Error(errorData.error || 'Form kaydedilemedi veya davet kodu oluşturulamadı');
          }

          const inviteData = await inviteResponse.json();
          const inviteCode = inviteData.code;

          // Davet kodu ile kayıt yap
          const { error, needsEmailConfirmation, message } = await signUp(email, password, username.trim(), displayName, inviteCode);
          if (error) {
            // Hata mesajlarını Türkçe'ye çevir
            let errorMessage = 'Kayıt sırasında bir hata oluştu';
            
            if (error.message?.includes('User already registered') || error.message?.includes('already_registered')) {
              errorMessage = 'Bu e-posta adresi ile zaten bir hesap mevcut';
            } else if (error.message?.includes('Password should be at least')) {
              errorMessage = 'Şifre en az 6 karakter olmalıdır';
            } else if (error.message?.includes('Invalid email')) {
              errorMessage = 'Geçersiz e-posta adresi';
            } else if (error.message?.includes('duplicate key') || error.message?.includes('username')) {
              errorMessage = 'Bu kullanıcı adı zaten kullanılıyor. Lütfen farklı bir kullanıcı adı seçin.';
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
          }
          
          if (needsEmailConfirmation) {
            // E-posta doğrulama gerekli
            setNeedsEmailVerification(true);
            setVerificationEmail(email);
          } else {
            // Kayıt başarılı, e-posta onay sayfasını göster
            setRegisterSuccess(true);
            if (onRegisterSuccess) {
              onRegisterSuccess();
            }
          }
        } catch (inviteError: any) {
          throw new Error(inviteError.message || 'Davet kodu oluşturulamadı. Lütfen tekrar deneyin.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl ${mode === 'register' ? 'max-w-3xl' : 'max-w-md'} w-full shadow-2xl my-8`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {needsEmailVerification ? (
          <EmailVerification 
            email={verificationEmail}
            onResendSuccess={() => {
              setError('');
            }}
            onResendError={(error) => {
              setError(error);
            }}
          />
        ) : registerSuccess ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kayıt Başarılı!</h3>
            <p className="text-gray-600 mb-6">
              E-posta adresinize doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve doğrulama linkine tıklayın.
            </p>
            <button
              onClick={() => {
                setRegisterSuccess(false);
                onClose();
              }}
              className="w-full py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {mode === 'register' ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">DevForum'a Hoş Geldiniz!</h3>
                  <p className="text-sm text-gray-600">Kayıt olmak için lütfen aşağıdaki bilgileri doldurun</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doğum Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      setUsername(value);
                    }}
                    placeholder="Kullanıcı adı (boşluk olmadan)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                    pattern="[^\s]+"
                    title="Kullanıcı adında boşluk olamaz"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kullanıcı adında boşluk kullanılamaz. Sadece harf, rakam ve alt çizgi kullanabilirsiniz.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görünen Ad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DevForum'u neden kullanmak istiyorsunuz? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all resize-none"
                    placeholder="DevForum'u hangi amaçla kullanmak istediğinizi kısaca açıklayın..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DevForum'u nereden gördünüz/geldiniz? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Örn: Google araması, sosyal medya, arkadaş tavsiyesi..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      required
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                      <strong>Şartları Kabul Ediyorum:</strong> Verdiğim bilgilerin doğru olduğunu ve doğrulanamazsa 
                      hesabımın kapatılacağını kabul ediyorum. DevForum'un kullanım şartlarını ve gizlilik politikasını 
                      okudum ve kabul ediyorum. <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'İşleniyor...' : 'Kayıt Ol'}
                </button>

                <div className="text-center text-sm text-gray-600">
                  Zaten hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => onSwitchMode('login')}
                    className="text-[#9c6cfe] font-medium hover:underline"
                  >
                    Giriş yapın
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'İşleniyor...' : 'Giriş Yap'}
                </button>

                <div className="text-center text-sm text-gray-600">
                  Hesabınız yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => onSwitchMode('register')}
                    className="text-[#9c6cfe] font-medium hover:underline"
                  >
                    Kayıt olun
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
