'use client';

import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
  isSidebarCollapsed?: boolean;
}

export function TermsOfServicePage({ onBack, isSidebarCollapsed = false }: TermsOfServicePageProps) {
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
            <FileText className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Kullanım Şartları</h1>
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
              DevForum platformunu kullanarak, aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. 
              Lütfen bu şartları dikkatle okuyun. Platformu kullanmaya devam etmeniz, bu şartları 
              kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          {/* Kullanım Koşulları */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              1. Kullanım Koşulları
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1.1. Hesap Gereksinimleri</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>18 yaşında veya daha büyük olmalısınız</li>
                <li>Gerçek ve doğru bilgiler sağlamalısınız</li>
                <li>Hesabınızın güvenliğinden siz sorumlusunuz</li>
                <li>Bir hesaba sahip olabilirsiniz</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">1.2. Kullanıcı Davranışları</h3>
              <p className="text-gray-700 mb-3">Platformu kullanırken aşağıdaki kurallara uymalısınız:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Diğer kullanıcılara saygılı olun</li>
                <li>Spam, trolling veya rahatsız edici içerik paylaşmayın</li>
                <li>Telif hakkı ihlali yapmayın</li>
                <li>Yanlış bilgi paylaşmayın</li>
                <li>Platformu kötüye kullanmayın</li>
              </ul>
            </div>
          </section>

          {/* Yasak İçerikler */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              2. Yasak İçerikler ve Davranışlar
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">Aşağıdaki içerikler ve davranışlar kesinlikle yasaktır:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Nefret söylemi, ayrımcılık veya şiddet içeren içerik</li>
                <li>Yasadışı faaliyetleri teşvik eden içerik</li>
                <li>Kişisel bilgilerin izinsiz paylaşımı</li>
                <li>Spam, reklam veya ticari içerik (izin verilen alanlar hariç)</li>
                <li>Sahte haberler veya yanıltıcı bilgiler</li>
                <li>Pornografik veya uygunsuz içerik</li>
                <li>Hesap çalma veya kimlik taklidi</li>
                <li>Platform güvenliğini tehdit eden faaliyetler</li>
              </ul>
            </div>
          </section>

          {/* İçerik Hakları */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. İçerik Hakları ve Lisanslama</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1. Kullanıcı İçerikleri</h3>
              <p className="text-gray-700 mb-4">
                Paylaştığınız içeriklerin (konular, yorumlar, görseller) telif hakkı size aittir. 
                Ancak, içeriklerinizi platformda paylaşarak, DevForum'a aşağıdaki hakları veriyorsunuz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>İçeriğinizi platformda gösterme ve dağıtma hakkı</li>
                <li>İçeriğinizi platform içinde düzenleme hakkı (formatlama, özetleme vb.)</li>
                <li>İçeriğinizi platform tanıtımlarında kullanma hakkı</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2. Telif Hakkı İhlali</h3>
              <p className="text-gray-700">
                Telif hakkı ihlali şikayetleriniz için <strong>team@devforum.xyz</strong> adresine 
                başvurabilirsiniz. Şikayetleriniz 48 saat içinde değerlendirilecektir.
              </p>
            </div>
          </section>

          {/* Ödeme ve Krediler */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Ödeme ve Kredi Sistemi</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1. Kredi Satın Alma</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Krediler geri iade edilemez</li>
                <li>Krediler sadece platform içinde kullanılabilir</li>
                <li>Kredi fiyatları önceden haber verilmeksizin değiştirilebilir</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2. Ödeme İşlemleri</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Tüm ödemeler güvenli ödeme sistemleri üzerinden yapılır</li>
                <li>Ödeme bilgileriniz saklanmaz</li>
                <li>İade talepleri destek ekibimiz tarafından değerlendirilir</li>
              </ul>
            </div>
          </section>

          {/* Hesap İptali */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Hesap İptali ve Askıya Alma</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1. Hesap İptali</h3>
              <p className="text-gray-700 mb-4">
                Hesabınızı istediğiniz zaman iptal edebilirsiniz. Hesap iptal edildiğinde:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Kullanılmayan kredileriniz iade edilmez</li>
                <li>İçerikleriniz silinebilir (30 gün içinde geri alınabilir)</li>
                <li>Hesap bilgileriniz KVKK uyarınca saklanır</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2. Hesap Askıya Alma</h3>
              <p className="text-gray-700 mb-4">
                Aşağıdaki durumlarda hesabınız askıya alınabilir veya kapatılabilir:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Kullanım şartlarını ihlal etmeniz</li>
                <li>Yasak içerik paylaşmanız</li>
                <li>Diğer kullanıcıları rahatsız etmeniz</li>
                <li>Platform güvenliğini tehdit etmeniz</li>
              </ul>
            </div>
          </section>

          {/* Sorumluluk Reddi */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              6. Sorumluluk Reddi
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                DevForum, kullanıcıların paylaştığı içeriklerden sorumlu değildir. Platform:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Kullanıcı içeriklerinin doğruluğunu garanti etmez</li>
                <li>Üçüncü taraf linklerinden sorumlu değildir</li>
                <li>Platform kesintilerinden kaynaklanan kayıplardan sorumlu değildir</li>
                <li>Kullanıcılar arası anlaşmazlıklardan sorumlu değildir</li>
              </ul>
            </div>
          </section>

          {/* Değişiklikler */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kullanım Şartları Değişiklikleri</h2>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-gray-700">
                Bu Kullanım Şartları zaman zaman güncellenebilir. Önemli değişikliklerde 
                kullanıcılarımızı e-posta veya platform bildirimleri ile bilgilendireceğiz. 
                Değişikliklerin yürürlüğe girmesiyle birlikte platformu kullanmaya devam 
                etmeniz, güncellenmiş şartları kabul ettiğiniz anlamına gelir.
              </p>
            </div>
          </section>

          {/* İletişim */}
          <section className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">İletişim</h2>
            <p className="text-white/90 mb-4">
              Kullanım şartları hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:
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

