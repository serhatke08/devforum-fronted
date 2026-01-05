'use client';

import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  isSidebarCollapsed?: boolean;
}

export function PrivacyPolicyPage({ onBack, isSidebarCollapsed = false }: PrivacyPolicyPageProps) {
  const sidebarOffsetClass = isSidebarCollapsed ? 'lg:ml-16 sm:lg:ml-20' : 'lg:ml-64';

  return (
    <div className={`min-h-screen bg-white ${sidebarOffsetClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri Dön</span>
          </button>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Gizlilik Politikası</h1>
          </div>
          <p className="text-sm text-gray-500">
            Son Güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* İçerik */}
        <div className="prose prose-lg max-w-none space-y-8">
          {/* Giriş */}
          <section className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-xl p-6 border border-purple-100">
            <p className="text-gray-700 leading-relaxed">
              DevForum olarak, kullanıcılarımızın gizliliğini korumak bizim için çok önemlidir. 
              Bu Gizlilik Politikası, kişisel bilgilerinizin nasıl toplandığını, kullanıldığını, 
              saklandığını ve korunduğunu açıklamaktadır.
            </p>
          </section>

          {/* Toplanan Bilgiler */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Toplanan Bilgiler</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1. Hesap Bilgileri</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>E-posta adresi</li>
                <li>Kullanıcı adı</li>
                <li>Şifre (şifrelenmiş olarak saklanır)</li>
                <li>Profil bilgileri (isteğe bağlı)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.2. Kullanım Bilgileri</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Yazdığınız konular ve yorumlar</li>
                <li>Beğendiğiniz ve kaydettiğiniz içerikler</li>
                <li>Platform üzerindeki aktiviteleriniz</li>
                <li>Mesajlaşma geçmişi</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.3. Teknik Bilgiler</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>IP adresi</li>
                <li>Tarayıcı türü ve versiyonu</li>
                <li>Cihaz bilgileri</li>
                <li>Çerezler (Cookies)</li>
              </ul>
            </div>
          </section>

          {/* Bilgilerin Kullanımı */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Bilgilerinizin Kullanımı</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Hesabınızı yönetmek ve hizmetlerimizi sunmak</li>
                <li>Platformu iyileştirmek ve yeni özellikler eklemek</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
                <li>Size özel içerik ve öneriler sunmak</li>
                <li>İletişim ve destek hizmetleri sağlamak</li>
              </ul>
            </div>
          </section>

          {/* Bilgi Paylaşımı */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Bilgi Paylaşımı</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Kişisel bilgilerinizi üçüncü taraflarla paylaşmıyoruz, ancak aşağıdaki durumlar hariç:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Yasal zorunluluklar (mahkeme kararı, yasal süreçler)</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Hizmet sağlayıcılarımız (hosting, ödeme işlemcileri - sadece gerekli bilgiler)</li>
                <li>Kullanıcının açık rızası ile</li>
              </ul>
            </div>
          </section>

          {/* Veri Güvenliği */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Veri Güvenliği</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri alıyoruz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>SSL/TLS şifreleme</li>
                <li>Şifrelerin hash'lenerek saklanması</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Erişim kontrolleri ve yetkilendirme</li>
                <li>Güvenli veri saklama altyapısı</li>
              </ul>
            </div>
          </section>

          {/* Çerezler */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Çerezler (Cookies)</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                Platformumuz, deneyiminizi iyileştirmek için çerezler kullanmaktadır:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Zorunlu Çerezler:</strong> Platformun çalışması için gerekli</li>
                <li><strong>Performans Çerezleri:</strong> Site performansını analiz etmek için</li>
                <li><strong>Fonksiyonel Çerezler:</strong> Tercihlerinizi hatırlamak için</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz, ancak bu bazı özelliklerin 
                çalışmamasına neden olabilir.
              </p>
            </div>
          </section>

          {/* Haklarınız */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. KVKK Kapsamında Haklarınız</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenen verileriniz hakkında bilgi talep etme</li>
                <li>Verilerinizin düzeltilmesini isteme</li>
                <li>Verilerinizin silinmesini isteme</li>
                <li>Verilerinizin üçüncü kişilere aktarılmasına itiraz etme</li>
                <li>Verilerinizin işlenmesine itiraz etme</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Bu haklarınızı kullanmak için <strong>team@devforum.xyz</strong> adresine e-posta gönderebilirsiniz.
              </p>
            </div>
          </section>

          {/* Değişiklikler */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Gizlilik Politikası Değişiklikleri</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700">
                Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişikliklerde 
                kullanıcılarımızı e-posta veya platform bildirimleri ile bilgilendireceğiz. 
                Değişikliklerin yürürlüğe girmesiyle birlikte platformu kullanmaya devam 
                etmeniz, güncellenmiş politikayı kabul ettiğiniz anlamına gelir.
              </p>
            </div>
          </section>

          {/* İletişim */}
          <section className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">İletişim</h2>
            <p className="text-white/90 mb-4">
              Gizlilik politikamız hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:
            </p>
            <div className="space-y-2">
              <p><strong>E-posta:</strong> team@devforum.xyz</p>
              <p><strong>Telefon:</strong> 0538 383 34 41</p>
              <p><strong>Adres:</strong> Levent Mahallesi, Büyükdere Caddesi No: 185, 34394 Şişli/İstanbul, Türkiye</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

