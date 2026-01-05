'use client';
import { ArrowLeft, Users, Target, Rocket, Heart } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  isSidebarCollapsed?: boolean;
}

export function AboutPage({ onBack, isSidebarCollapsed = false }: AboutPageProps) {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hakkımızda</h1>
          <p className="text-lg text-gray-600">
            DevForum, geliştiricilerin bir araya geldiği, bilgi paylaştığı ve birlikte büyüdüğü bir platformdur.
          </p>
        </div>

        {/* Misyonumuz */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Misyonumuz</h2>
            </div>
            <p className="text-lg leading-relaxed text-white/90">
              Türkiye'nin en büyük geliştirici topluluğunu oluşturmak ve yazılım geliştirme ekosistemine katkıda bulunmak. 
              Her seviyeden geliştiricinin öğrenebileceği, paylaşabileceği ve birlikte büyüyebileceği bir platform sunmak.
            </p>
          </div>
        </section>

        {/* Vizyonumuz */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-purple-50 to-cyan-50 rounded-2xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">Vizyonumuz</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Gelecekte, her geliştiricinin ilk başvurduğu kaynak olmak. Teknoloji dünyasında 
              Türkiye'yi öne çıkaran bir topluluk platformu haline gelmek ve global ölçekte 
              tanınan bir geliştirici ekosistemi yaratmak.
            </p>
          </div>
        </section>

        {/* Değerlerimiz */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Heart className="w-8 h-8 text-purple-600" />
            Değerlerimiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Açıklık ve Şeffaflık</h3>
              <p className="text-gray-600">
                Tüm bilgilerin açık ve erişilebilir olması. Topluluk kurallarının net ve anlaşılır olması.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Topluluk Ruhu</h3>
              <p className="text-gray-600">
                Birlikte öğrenme, birlikte büyüme. Herkesin birbirine yardımcı olduğu pozitif bir ortam.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Kalite ve Güvenilirlik</h3>
              <p className="text-gray-600">
                Paylaşılan içeriklerin kaliteli ve güvenilir olması. Doğru bilginin yayılması.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">İnovasyon</h3>
              <p className="text-gray-600">
                Sürekli gelişim ve yenilik. Platformun sürekli iyileştirilmesi ve yeni özellikler eklenmesi.
              </p>
            </div>
          </div>
        </section>

        {/* Ekibimiz */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Ekibimiz
          </h2>
          <div className="bg-gray-50 rounded-2xl p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              DevForum, tutkulu geliştiricilerden oluşan bir ekip tarafından yönetilmektedir. 
              Amacımız, topluluğumuzun ihtiyaçlarını karşılamak ve platformu sürekli geliştirmektir.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Ekibimiz, farklı teknoloji alanlarında uzmanlaşmış geliştiricilerden oluşmaktadır. 
              Her birimiz, topluluğumuzun başarısı için çalışıyoruz.
            </p>
          </div>
        </section>

        {/* İstatistikler */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Platform İstatistikleri</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">10K+</div>
              <div className="text-sm opacity-90">Aktif Kullanıcı</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">50K+</div>
              <div className="text-sm opacity-90">Toplam Konu</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">100K+</div>
              <div className="text-sm opacity-90">Toplam Yorum</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-sm opacity-90">Günlük Aktif</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Bize Katıl!</h2>
          <p className="text-lg mb-6 text-white/90">
            DevForum topluluğunun bir parçası olmak ister misin? Hemen kayıt ol ve geliştirici 
            topluluğumuzla birlikte büyü!
          </p>
          <button
            onClick={onBack}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Hemen Başla
          </button>
        </section>
      </div>
    </div>
  );
}

