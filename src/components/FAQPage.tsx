'use client';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FAQPageProps {
  onBack: () => void;
  isSidebarCollapsed?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export function FAQPage({ onBack, isSidebarCollapsed = false }: FAQPageProps) {
  const sidebarOffsetClass = isSidebarCollapsed ? 'lg:ml-16 sm:lg:ml-20' : 'lg:ml-64';
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      category: 'hesap',
      question: 'Nasıl hesap oluşturabilirim?',
      answer: 'Ana sayfada sağ üst köşedeki "Giriş Yap" butonuna tıklayın, ardından "Kayıt Ol" sekmesine geçin. E-posta adresinizi ve şifrenizi girerek kayıt olabilirsiniz. E-posta adresinize gönderilen onay linkine tıklayarak hesabınızı aktifleştirebilirsiniz.'
    },
    {
      category: 'hesap',
      question: 'Şifremi unuttum, ne yapmalıyım?',
      answer: 'Giriş sayfasında "Şifremi Unuttum" linkine tıklayın. E-posta adresinizi girerek şifre sıfırlama linki alabilirsiniz. E-postanızı kontrol edin ve gelen linke tıklayarak yeni şifrenizi belirleyin.'
    },
    {
      category: 'hesap',
      question: 'Hesabımı nasıl silebilirim?',
      answer: 'Profil sayfanızdan "Hesap Ayarları" bölümüne gidin ve "Hesabı Sil" seçeneğini bulun. Hesabınızı silmeden önce kullanılmayan kredilerinizi kullanmanızı öneririz çünkü krediler iade edilmez.'
    },
    {
      category: 'kredi',
      question: 'Kredi nedir ve nasıl kullanılır?',
      answer: 'Kredi, platformda özel özellikleri kullanmak için gereken sanal para birimidir. Kredilerle banner kiralayabilir, konularınızı öne çıkarabilir ve özel araçları kullanabilirsiniz. Kredi satın almak için profil menüsünden "Kredi Satın Al" seçeneğini kullanabilirsiniz.'
    },
    {
      category: 'kredi',
      question: 'Kredi fiyatları nedir?',
      answer: 'Platformumuzda farklı kredi paketleri bulunmaktadır: Başlangıç Paketi (100 kredi - 50 TL), Popüler Paket (500 kredi - 100 TL), Pro Paket (2500 kredi - 400 TL), Premium Paket (7500 kredi - 1000 TL) ve Elite Paket (15000 kredi - 1500 TL).'
    },
    {
      category: 'kredi',
      question: 'Kredilerim iade edilir mi?',
      answer: 'Hayır, satın aldığınız krediler iade edilmez. Ancak kullanılmayan kredileriniz hesabınızda kalır ve istediğiniz zaman kullanabilirsiniz.'
    },
    {
      category: 'içerik',
      question: 'Nasıl konu açabilirim?',
      answer: 'Ana sayfada veya kategori sayfalarında sağ üst köşedeki "+" butonuna tıklayın. Konu başlığı, içerik ve kategori seçerek yeni bir konu oluşturabilirsiniz. Konu açmak için giriş yapmış olmanız gerekir.'
    },
    {
      category: 'içerik',
      question: 'Konumu nasıl düzenleyebilirim?',
      answer: 'Kendi açtığınız konularda, konu detay sayfasında "Düzenle" butonunu göreceksiniz. Bu butona tıklayarak konu başlığını ve içeriğini düzenleyebilirsiniz. Ancak konu açıldıktan sonra kategori değiştirilemez.'
    },
    {
      category: 'içerik',
      question: 'Konumu nasıl silebilirim?',
      answer: 'Kendi açtığınız konularda, konu detay sayfasında "Sil" butonunu göreceksiniz. Konuyu silmek istediğinizden emin olun çünkü bu işlem geri alınamaz.'
    },
    {
      category: 'banner',
      question: 'Banner nasıl kiralanır?',
      answer: 'Sidebar menüsünden "Banner Kiralama" seçeneğine tıklayın. Kiralanabilir banner pozisyonlarını göreceksiniz. İstediğiniz pozisyonu seçin, süreyi belirleyin ve kredilerinizle ödeme yapın. Bannerınız belirlediğiniz süre boyunca aktif olacaktır.'
    },
    {
      category: 'banner',
      question: 'Banner kiralama fiyatları nedir?',
      answer: 'Banner kiralama fiyatları pozisyon ve süreye göre değişmektedir. Detaylı fiyatlandırmayı "Banner Kiralama" sayfasında görebilirsiniz. Genellikle üst banner pozisyonları daha pahalıdır.'
    },
    {
      category: 'mesajlaşma',
      question: 'Nasıl mesaj gönderebilirim?',
      answer: 'Bir kullanıcının profil sayfasına gidin ve "Mesaj Gönder" butonuna tıklayın. Veya sidebar menüsünden "Mesajlar" bölümüne giderek mevcut konuşmalarınızı görüntüleyebilir ve yeni mesajlar gönderebilirsiniz.'
    },
    {
      category: 'mesajlaşma',
      question: 'Mesajlarım güvende mi?',
      answer: 'Evet, tüm mesajlaşmalar şifrelenmiş olarak saklanır ve sadece gönderen ve alıcı tarafından görüntülenebilir. Platform yöneticileri sadece yasal zorunluluklar durumunda mesajlara erişebilir.'
    },
    {
      category: 'teknik',
      question: 'Site çalışmıyor, ne yapmalıyım?',
      answer: 'Önce tarayıcınızı yenileyin (Ctrl+F5 veya Cmd+Shift+R). Sorun devam ederse, tarayıcı önbelleğinizi temizleyin. Hala çalışmıyorsa, farklı bir tarayıcı deneyin veya team@devforum.xyz adresine e-posta gönderin.'
    },
    {
      category: 'teknik',
      question: 'Mobil uygulama var mı?',
      answer: 'Şu anda web tabanlı bir platformuz ve mobil uygulamamız bulunmamaktadır. Ancak web sitemiz tamamen responsive tasarıma sahiptir ve mobil cihazlarda mükemmel çalışır. Mobil uygulama gelecekte planlarımız arasındadır.'
    },
    {
      category: 'gizlilik',
      question: 'Kişisel bilgilerim güvende mi?',
      answer: 'Evet, kişisel bilgilerinizin güvenliği bizim için çok önemlidir. Tüm veriler SSL/TLS şifreleme ile korunur ve KVKK uyumludur. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.'
    },
    {
      category: 'gizlilik',
      question: 'Profilimi kimler görebilir?',
      answer: 'Profil bilgileriniz platformdaki tüm kullanıcılar tarafından görüntülenebilir. Ancak e-posta adresiniz ve telefon numaranız gibi hassas bilgiler sadece siz tarafından görülebilir.'
    }
  ];

  const categories = [
    { id: 'all', name: 'Tümü' },
    { id: 'hesap', name: 'Hesap' },
    { id: 'kredi', name: 'Kredi' },
    { id: 'içerik', name: 'İçerik' },
    { id: 'banner', name: 'Banner' },
    { id: 'mesajlaşma', name: 'Mesajlaşma' },
    { id: 'teknik', name: 'Teknik' },
    { id: 'gizlilik', name: 'Gizlilik' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

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
            <HelpCircle className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">Sık Sorulan Sorular (SSS)</h1>
          </div>
          <p className="text-lg text-gray-600">
            Merak ettiğiniz soruların cevaplarını burada bulabilirsiniz.
          </p>
        </div>

        {/* Kategori Filtreleri */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setOpenIndex(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Listesi */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Yardım Bölümü */}
        <div className="mt-12 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Sorunuz mu var?</h2>
          <p className="text-lg mb-6 text-white/90">
            Aradığınız cevabı bulamadıysanız, bizimle iletişime geçmekten çekinmeyin!
          </p>
          <div className="space-y-2">
            <p><strong>E-posta:</strong> team@devforum.xyz</p>
            <p><strong>Telefon:</strong> 0538 383 34 41</p>
          </div>
        </div>
      </div>
    </div>
  );
}

