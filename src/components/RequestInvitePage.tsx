'use client';

import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RequestInvitePageProps {
  onBack: () => void;
}

export function RequestInvitePage({ onBack }: RequestInvitePageProps) {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    reason: '',
    source: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // API URL'ini belirle (development/production)
  const getApiUrl = () => {
    const isDevelopment = typeof window !== "undefined" && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
    if (isDevelopment) {
      return `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '192.168.0.6' : window.location.hostname}:3001`;
    }
    return 'https://devforum-backend-102j.onrender.com';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validasyon
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || 
        !formData.email.trim() || !formData.birthDate || !formData.reason.trim() || 
        !formData.source.trim()) {
      setError('Lütfen tüm alanları doldurun');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Lütfen şartları kabul edin');
      setLoading(false);
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Geçerli bir e-posta adresi girin');
      setLoading(false);
      return;
    }

    try {
      // Form verilerini kaydet
      const createResponse = await fetch(`${getApiUrl()}/api/invite-requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.toLowerCase().trim(),
          birth_date: formData.birthDate,
          reason: formData.reason.trim(),
          source: formData.source.trim()
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Form kaydedilemedi');
      }

      // Davet kodu oluştur
      const codeResponse = await fetch(`${getApiUrl()}/api/invite-requests/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim()
        }),
      });

      if (!codeResponse.ok) {
        const errorData = await codeResponse.json();
        throw new Error(errorData.error || 'Davet kodu oluşturulamadı');
      }

      const codeData = await codeResponse.json();
      setInviteCode(codeData.code);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToRegister = () => {
    // Davet kodunu localStorage'a kaydet
    if (inviteCode) {
      localStorage.setItem('pendingInviteCode', inviteCode);
    }
    // Geri dön - App.tsx'te modal açılacak
    onBack();
  };

  if (success && inviteCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 -mt-16 lg:-mt-20">
        <div className="max-w-2xl mx-auto px-4 py-8 pt-24 lg:pt-28">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Davet Kodunuz Hazır!</h2>
              <p className="text-gray-600">Davet kodunuzu kopyalayıp kayıt sayfasında kullanabilirsiniz.</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Davet Kodu
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inviteCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border border-purple-300 rounded-lg text-xl font-mono font-bold text-center text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteCode);
                    alert('Davet kodu kopyalandı!');
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Kopyala
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Önemli:</strong> Bu kod tek kullanımlıktır. Kayıt olurken bu kodu kullanmanız gerekmektedir.
                Verdiğiniz bilgiler doğrulanamazsa hesabınız kapatılacaktır.
              </p>
            </div>

            <button
              onClick={handleContinueToRegister}
              className="w-full py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              Kayıt Sayfasına Git
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 -mt-16 lg:-mt-20">
      <div className="max-w-3xl mx-auto px-4 py-8 pt-24 lg:pt-28">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Geri Dön</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Davet Kodu Talep Et</h1>
            <p className="text-gray-600">DevForum'a katılmak için lütfen aşağıdaki formu doldurun</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="+90 5XX XXX XX XX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doğum Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DevForum'u neden kullanmak istiyorsunuz? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Örn: Google araması, sosyal medya, arkadaş tavsiyesi..."
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  <strong>Şartları Kabul Ediyorum:</strong> Verdiğim bilgilerin doğru olduğunu ve doğrulanamazsa 
                  hesabımın kapatılacağını kabul ediyorum. DevForum'un kullanım şartlarını ve gizlilik politikasını 
                  okudum ve kabul ediyorum.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'İşleniyor...' : 'Davet Kodu Al'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

