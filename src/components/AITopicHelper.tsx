'use client';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AITopicHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (title: string, content: string, categoryId: string) => void;
  categories: Array<{
    id: string;
    name: string;
    sub_categories: Array<{
      id: string;
      name: string;
    }>;
  }>;
}

interface AISuggestion {
  suggestedCategory: string;
  suggestedSubCategory: string;
}

interface ConversationMessage {
  role: 'user' | 'ai';
  text: string;
}

export function AITopicHelper({ isOpen, onClose, onApply, categories }: AITopicHelperProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isInConversation, setIsInConversation] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Lütfen bir açıklama girin');
      return;
    }

    // Çok kısa girdi kontrolü (sadece ilk mesaj için katı)
    if (!isInConversation && userPrompt.trim().length < 10) {
      setError('Lütfen daha detaylı bir açıklama yapın. En az 10 karakter gerekli.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Kullanıcı mesajını konuşmaya ekle
      const newConversation = [...conversation, { role: 'user' as const, text: userPrompt }];
      setConversation(newConversation);
      
      // AI ile içerik oluştur veya soru sor
      const response = await generateTopicWithAI(userPrompt, categories, newConversation);
      
      if (response.needsClarification) {
        // AI soru soruyor
        setConversation([...newConversation, { role: 'ai' as const, text: response.question }]);
        setCurrentOptions(response.options || []);
        setIsInConversation(true);
        setUserPrompt('');
      } else {
        // Konu oluşturuldu
        setSuggestion(response);
        setIsInConversation(false);
        setCurrentOptions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (option: string) => {
    try {
      setLoading(true);
      setError('');
      // Seçeneği kullanıcı mesajı olarak ekle ve devam et
      const newConversation = [...conversation, { role: 'user' as const, text: option }];
      setConversation(newConversation);
      const response = await generateTopicWithAI(option, categories, newConversation);
      if (response.needsClarification) {
        setConversation([...newConversation, { role: 'ai' as const, text: response.question }]);
        setCurrentOptions(response.options || []);
        setIsInConversation(true);
      } else {
        setSuggestion(response);
        setIsInConversation(false);
        setCurrentOptions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;

    // Alt kategori ID'sini bul
    const subCategory = categories
      .flatMap(cat => cat.sub_categories)
      .find(sub => sub.name.toLowerCase() === suggestion.suggestedSubCategory.toLowerCase());

    if (subCategory) {
      onApply('', '', subCategory.id);
      onClose();
    } else {
      setError('Kategori bulunamadı');
    }
  };

  const handleReset = () => {
    setSuggestion(null);
    setUserPrompt('');
    setError('');
    setConversation([]);
    setIsInConversation(false);
    setCurrentOptions([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Sınıflandırıcı</h2>
                <p className="text-sm text-gray-500">Metni doğru kategoriye yerleştir</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isInConversation ? (
            <div className="space-y-4">
              {/* Sohbet Geçmişi */}
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                {conversation.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seçenekler (varsa) */}
              {currentOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleOptionSelect(opt)}
                      disabled={loading}
                      className="px-3 py-2 text-sm bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Cevap Girişi */}
              <div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Cevabınızı yazın..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Baştan Başla
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !userPrompt.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          ) : !suggestion ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">💡 Nasıl Kullanılır?</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Metni yazın, IA en uygun alt kategoriyi önersin</li>
                  <li>• Gerekirse IA yalnızca 1 netleştirici soru sorar</li>
                  <li>• Onaylayınca kategori formda seçilir</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metin
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Örnek: E-ticaret sitesi yapıyorum, ödeme entegrasyonu konusunda yardım istiyorum..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={5}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || !userPrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    IA Çalışıyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Kategoriyi Öner
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Önerilen Kategori
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    {suggestion.suggestedCategory}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="px-3 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium">
                    {suggestion.suggestedSubCategory}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Yeniden Dene
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Kategoriyi Uygula
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// IA sınıflandırma fonksiyonu - tek netleştirme sorusu ile
async function generateTopicWithAI(prompt: string, categories: any[], conversationHistory: ConversationMessage[]): Promise<any> {
  try {
    // Tüm konuşma geçmişini analiz et
    const fullContext = conversationHistory.map(msg => msg.text).join(' ');
    const lowerContext = fullContext.toLowerCase();
    const lowerPrompt = prompt.toLowerCase();
    
    // Saçma/anlamsız girdi kontrolü (ilk mesajda katı, sonraki mesajlarda esnek)
    const wordCount = prompt.trim().split(/\s+/).length;
    const hasOnlyNumbers = /^\d+$/.test(prompt.trim());
    const hasOnlySpecialChars = /^[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+$/.test(prompt.trim());
    const isFirstMessage = conversationHistory.length === 1;
    if (isFirstMessage) {
      if (hasOnlyNumbers || hasOnlySpecialChars || wordCount < 3) {
        return {
          needsClarification: true,
          question: 'Biraz daha detay verebilir misiniz? (1 cümle yeterli)',
          options: []
        };
      }
    }
    
    // İlk mesaj mı yoksa devam mı? (yukarıda hesaplandı)
    
    // Netleştirme soruları - sadece ilk mesajda ve 1 kez
    if (isFirstMessage) {
      // "Özel ders / eğitim" ikilemi: ilan mı, bilgi paylaşımı mı?
      const lessonKeywords = ['özel ders', 'ozel ders', 'ders veriyorum', 'eğitmen', 'egitmen', 'kurs', 'eğitim veriyorum', 'egitim veriyorum'];
      const hasLesson = lessonKeywords.some(k => lowerPrompt.includes(k));
      if (hasLesson) {
        return {
          needsClarification: true,
          question: 'Bu içerik bir ilan mı, yoksa bilgi/teknik paylaşımı mı?\n\n• İlan: Freelancer → Hizmet Verme\n• Bilgi/teknik paylaşımı: Yazılım Dünyası → Oyun Geliştirme'
        };
      }
      // E-ticaret tespiti - sat/al ayrımı
      if ((lowerPrompt.includes('e-ticaret') || lowerPrompt.includes('e ticaret') || lowerPrompt.includes('ticaret')) && 
          !lowerPrompt.includes('satmak') && !lowerPrompt.includes('almak') && 
          !lowerPrompt.includes('yardım') && !lowerPrompt.includes('öğrenmek')) {
        return {
          needsClarification: true,
          question: 'E-ticaret sitesiyle ilgili ne yapmak istiyorsunuz?\n\n💼 Site satmak istiyorum\n🛠️ Site geliştirme konusunda yardım istiyorum\n📚 E-ticaret hakkında bilgi/öğrenmek istiyorum'
        };
      }
      
      // Genel "uygulama" belirsizliği
      if ((lowerPrompt.includes('uygulama') || lowerPrompt.includes('app')) && 
          !lowerPrompt.includes('web') && !lowerPrompt.includes('mobil') && !lowerPrompt.includes('desktop')) {
        return {
          needsClarification: true,
          question: 'Hangi tür uygulama hakkında konuşuyoruz?\n\n🌐 Web uygulaması\n📱 Mobil uygulama (iOS/Android)\n💻 Masaüstü uygulaması'
        };
      }
      
      // "Site" belirsizliği
      if (lowerPrompt.includes('site') && lowerPrompt.includes('yap') && 
          !lowerPrompt.includes('ticaret') && !lowerPrompt.includes('blog') && 
          !lowerPrompt.includes('portfolyo') && !lowerPrompt.includes('kurumsal')) {
        return {
          needsClarification: true,
          question: 'Hangi tür site yapmak istiyorsunuz?\n\n🛒 E-ticaret sitesi\n📝 Blog/Haber sitesi\n🎨 Portfolyo sitesi\n🏢 Kurumsal/Tanıtım sitesi'
        };
      }
      
      // "Yardım" belirsizliği
      if ((lowerPrompt.includes('yardım') || lowerPrompt.includes('lazım')) && wordCount < 8) {
        return {
          needsClarification: true,
          question: 'Tam olarak ne konuda yardıma ihtiyacınız var?\n\n🐛 Kod hatası/bug çözümü\n📚 Bir şey öğrenmek istiyorum\n🤝 Proje danışmanlığı\n💼 Freelance hizmet almak istiyorum'
        };
      }
      
      // Genel belirsiz girdi
      if (wordCount < 5 && !lowerPrompt.includes('react') && !lowerPrompt.includes('vue')) {
        return {
          needsClarification: true,
          question: 'Biraz daha detay verebilir misiniz? (1 cümle yeterli)'
        };
      }
    }
    
    // Skorlamalı eşleştirme: kategori ve alt kategori adlarına göre en iyi eşleşmeyi bul
    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ş/g, 's')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedPrompt = normalize(fullContext || prompt);
    const promptTokens = new Set(normalizedPrompt.split(' '));

    const synonymMap: Record<string, string[]> = {
      'frontend gelistirme': ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'next', 'nuxt'],
      'backend gelistirme': ['backend', 'api', 'node', 'python', 'java', 'php', 'sql', 'prisma', 'nestjs', 'express'],
      'mobil gelistirme': ['mobil', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
      'e ticaret': ['e-ticaret', 'eticaret', 'odeme', 'sepet', 'iyzico', 'shopify', 'woocommerce', 'magaza'],
      'ui ux tasarim': ['tasarim', 'ui', 'ux', 'figma', 'sketch', 'wireframe', 'arayuz', 'grafik', 'logo'],
      'genel tartisma': ['genel', 'sohbet', 'tartisma'],
      'hizmet alma': ['is ariyorum', 'hizmet almak', 'yardim lazim', 'freelancer ariyorum', 'teklif verin'],
      'hizmet verme': ['hizmet veriyorum', 'portfolyo', 'referanslar', 'ucretli']
    };

    type Scored = { mainId: string; mainName: string; subId: string; subName: string; score: number };
    const scoredSubs: Scored[] = [];

    for (const main of categories || []) {
      for (const sub of (main.sub_categories || [])) {
        let score = 0;
        const nMain = normalize(main.name);
        const nSub = normalize(sub.name);

        if (normalizedPrompt.includes(nSub)) score += 8;
        if (normalizedPrompt.includes(nMain)) score += 4;

        for (const t of nSub.split(' ')) {
          if (t.length > 2 && promptTokens.has(t)) score += 2;
        }

        const syns = (synonymMap[nSub] || synonymMap[nMain] || []);
        for (const s of syns) {
          const ns = normalize(s);
          if (normalizedPrompt.includes(ns)) score += 3;
        }

        const firstWords = normalizedPrompt.split(' ').slice(0, 6).join(' ');
        if (firstWords.includes(nSub)) score += 2;

        if (score > 0) {
          scoredSubs.push({ mainId: main.id, mainName: main.name, subId: sub.id, subName: sub.name, score });
        }
      }
    }

    scoredSubs.sort((a, b) => b.score - a.score || b.subName.length - a.subName.length);

    // Kategori tespiti - Tüm konuşma geçmişine göre (gerçek listeden güvenli varsayılan)
    const firstMain = (categories && categories.length > 0) ? categories[0] : null;
    const firstSub = (firstMain && firstMain.sub_categories && firstMain.sub_categories.length > 0) ? firstMain.sub_categories[0] : null;
    let suggestedCategory = firstMain ? firstMain.name : 'Genel';
    let suggestedSubCategory = firstSub ? firstSub.name : 'Genel';
    
    // Freelancer tespiti - Sat/Al ayrımı
    if (lowerContext.includes('freelancer') || lowerContext.includes('proje') || 
        lowerContext.includes('hizmet') || lowerContext.includes('satmak') ||
        lowerContext.includes('satıyorum') || lowerContext.includes('iş arıyorum')) {
      suggestedCategory = 'Freelancer';
      
      // Site/Proje SATMA
      if (lowerContext.includes('satmak') || lowerContext.includes('satıyorum') || 
          lowerContext.includes('satılık') || lowerContext.includes('site satmak')) {
        suggestedSubCategory = 'Hizmet Verme';
      }
      // Hizmet/Yardım ALMA
      else if (lowerContext.includes('arıyorum') || lowerContext.includes('ihtiyacım var') || 
               lowerContext.includes('yardım') || lowerContext.includes('almak')) {
        suggestedSubCategory = 'Hizmet Alma';
      }
      // Hizmet VERME
      else {
        suggestedSubCategory = 'Hizmet Verme';
      }
    }
    // Tasarım tespiti
    else if (lowerPrompt.includes('tasarım') || lowerPrompt.includes('ui') || 
             lowerPrompt.includes('ux') || lowerPrompt.includes('grafik') || 
             lowerPrompt.includes('logo') || lowerPrompt.includes('arayüz')) {
      suggestedCategory = 'Tasarım & UI/UX';
      suggestedSubCategory = 'UI/UX Tasarım';
    }
    // Frontend tespiti
    else if (lowerPrompt.includes('react') || lowerPrompt.includes('vue') || 
             lowerPrompt.includes('angular') || lowerPrompt.includes('frontend') ||
             lowerPrompt.includes('javascript') || lowerPrompt.includes('typescript') ||
             lowerPrompt.includes('html') || lowerPrompt.includes('css')) {
      suggestedCategory = 'Yazılım Dünyası';
      suggestedSubCategory = 'Frontend Geliştirme';
    }
    // Backend tespiti
    else if (lowerPrompt.includes('backend') || lowerPrompt.includes('api') || 
             lowerPrompt.includes('database') || lowerPrompt.includes('node') ||
             lowerPrompt.includes('python') || lowerPrompt.includes('java') ||
             lowerPrompt.includes('php') || lowerPrompt.includes('sql')) {
      suggestedCategory = 'Yazılım Dünyası';
      suggestedSubCategory = 'Backend Geliştirme';
    }
    // Mobil tespiti
    else if (lowerPrompt.includes('mobil') || lowerPrompt.includes('ios') || 
             lowerPrompt.includes('android') || lowerPrompt.includes('flutter') ||
             lowerPrompt.includes('react native') || lowerPrompt.includes('swift')) {
      suggestedCategory = 'Yazılım Dünyası';
      suggestedSubCategory = 'Mobil Geliştirme';
    }
    // E-ticaret tespiti
    else if (lowerPrompt.includes('e-ticaret') || lowerPrompt.includes('ödeme') || 
             lowerPrompt.includes('sepet') || lowerPrompt.includes('online satış')) {
      suggestedCategory = 'Yazılım Dünyası';
      suggestedSubCategory = 'E-Ticaret';
    }

    // Ders/İlan cevabı ikinci mesajda netleştirildi ise onu uygula
    if (!isFirstMessage) {
      const lastUserMsg = conversationHistory.filter(m => m.role === 'user').slice(-1)[0]?.text?.toLowerCase() || '';
      const isAd = lastUserMsg.includes('ilan') || lastUserMsg.includes('hizmet') || lastUserMsg.includes('veriyorum') || lastUserMsg.includes('özel ders') || lastUserMsg.includes('ozel ders');
      const isInfo = lastUserMsg.includes('bilgi') || lastUserMsg.includes('paylaş') || lastUserMsg.includes('teknik');
      if (isAd) {
        suggestedCategory = 'Freelancer';
        suggestedSubCategory = 'Hizmet Verme';
      } else if (isInfo) {
        suggestedCategory = 'Yazılım Dünyası';
        suggestedSubCategory = 'Oyun Geliştirme';
      }
    }

    // Skor yeterince yüksekse skorlanan eşleşmeyi kullan
    const best = scoredSubs[0];
    if (best && best.score >= 5) {
      suggestedCategory = best.mainName;
      suggestedSubCategory = best.subName;
    }

    // Güvenlik: Önerilen kategori/alt kategori gerçekten mevcut mu? Değilse ilk mevcut olanı kullan
    const exists = (catName: string, subName: string) => {
      for (const m of categories || []) {
        if (m.name === catName) {
          for (const s of (m.sub_categories || [])) {
            if (s.name === subName) return true;
          }
        }
      }
      return false;
    };
    if (!exists(suggestedCategory, suggestedSubCategory)) {
      if (best) {
        // Eğer best var ama isimler uyuşmadıysa, best'i baz alıp mevcut olanla eşleştir
        const main = (categories || []).find(c => c.name === best.mainName) || firstMain;
        const sub = main && (main.sub_categories || []).find((s: any) => s.name === best.subName) || firstSub;
        suggestedCategory = main ? main.name : suggestedCategory;
        suggestedSubCategory = sub ? sub.name : suggestedSubCategory;
      }
      // Hâlâ yoksa tamamen güvenli ilk seçenekleri kullan
      if (!exists(suggestedCategory, suggestedSubCategory) && firstMain && firstSub) {
        suggestedCategory = firstMain.name;
        suggestedSubCategory = firstSub.name;
      }
    }

    return {
      suggestedCategory,
      suggestedSubCategory,
      needsClarification: false
    };

  } catch (error) {
    console.error('AI Error:', error);
    throw error;
  }
}

