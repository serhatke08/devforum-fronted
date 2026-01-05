'use client';

import { ArrowLeft, Download, Instagram, Play, ExternalLink, Coins, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface InstagramDownloaderProps {
  onBack: () => void;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export function InstagramDownloader({ onBack }: InstagramDownloaderProps) {
  const { user } = useAuth();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasEnoughCredits, setHasEnoughCredits] = useState(false);
  const creditCost = 50;

  useEffect(() => {
    if (user) {
      fetchCreditAccount();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCreditAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        // 406 hatası veya tablo bulunamadı hatası için varsayılan değer
        if (error.code === 'PGRST116' || error.status === 406) {
          const defaultAccount = { balance: 0, total_earned: 0, total_spent: 0 };
          setCreditAccount(defaultAccount);
          setHasEnoughCredits(false);
          return;
        }
        throw error;
      }
      
      setCreditAccount(data);
      setHasEnoughCredits(data && data.balance >= creditCost);
    } catch (error) {
      console.error('Kredi hesabı yükleme hatası:', error);
      // Hata durumunda varsayılan değerler
      const defaultAccount = { balance: 0, total_earned: 0, total_spent: 0 };
      setCreditAccount(defaultAccount);
      setHasEnoughCredits(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTool = async () => {
    if (!user) {
      alert('Araç kullanmak için giriş yapmanız gerekiyor.');
      return;
    }

    if (!hasEnoughCredits) {
      alert(`Bu araç ${creditCost} kredi gerektiriyor. Mevcut bakiyeniz: ${creditAccount?.balance || 0} kredi.`);
      return;
    }

    // Kredi harcama işlemi
    try {
      const { error } = await supabase.rpc<any>('spend_credits', {
        p_user_id: user.id,
        p_amount: creditCost,
        p_source_type: 'tool_usage',
        p_source_id: 'instagram-downloader',
        p_description: 'Instagram Downloader aracı kullanıldı'
      });

      if (error) throw error;

      // Kredi hesabını yenile
      await fetchCreditAccount();
      
      // Araç kullanım geçmişi kaydet
      await supabase
        .from('tool_usage_history')
        .insert({
          user_id: user.id,
          tool_id: 'instagram-downloader',
          credits_spent: creditCost,
          usage_data: { tool_slug: 'instagram-downloader' }
        });

      alert('Instagram Downloader aracı başarıyla kullanıldı!');
    } catch (error: any) {
      console.error('Kredi harcama hatası:', error);
      alert(error.message || 'Araç kullanılırken bir hata oluştu.');
    }
  };
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');


  const isValidInstagramUrl = (url: string) => {
    return url.includes('instagram.com') && (url.includes('/p/') || url.includes('/reel/') || url.includes('/tv/'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-[#E1306C] to-[#833AB4] rounded-lg flex-shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate">INSTAGRAM DOWNLOADER</h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">Instagram videolarını indirin</p>
                
                {/* Kredi Bilgisi */}
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold text-sm">
                    {creditCost} kredi
                  </span>
                  {user && (
                    <span className="text-gray-500 text-sm">
                      (Mevcut: {creditAccount?.balance || 0} kredi)
                    </span>
                  )}
                </div>
                
                {!hasEnoughCredits && user && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-red-500 text-xs">Yetersiz kredi</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <img 
              src="/instagram-downloader.svg" 
              alt="Instagram Downloader" 
              className="w-32 h-32 mx-auto mb-4"
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Instagram Video İndirici</h2>
            <p className="text-gray-600">
              Instagram'daki videoları, reels'leri ve IGTV'leri kolayca indirin
            </p>
          </div>

          {/* URL Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram Video URL'si
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E1306C] focus:border-transparent"
              />
              <button
                onClick={handleUseTool}
                disabled={!hasEnoughCredits}
                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  hasEnoughCredits
                    ? 'bg-gradient-to-r from-[#E1306C] to-[#833AB4] text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasEnoughCredits ? (
                  <>
                    <Download className="w-4 h-4" />
                    İndir
                  </>
                ) : (
                  'Yetersiz Kredi'
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Play className="w-8 h-8 text-[#E1306C] mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Reels & IGTV</h3>
              <p className="text-sm text-gray-600">Tüm video formatlarını destekler</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Download className="w-8 h-8 text-[#E1306C] mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Hızlı İndirme</h3>
              <p className="text-sm text-gray-600">Yüksek hızda video indirme</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ExternalLink className="w-8 h-8 text-[#E1306C] mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Kolay Kullanım</h3>
              <p className="text-sm text-gray-600">Sadece URL yapıştırın</p>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Video Hazır!</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={result.thumbnail} 
                  alt="Video thumbnail" 
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{result.title}</h4>
                  <div className="flex gap-4 text-sm text-gray-600 mt-1">
                    <span>⏱️ {result.duration}</span>
                    <span>📺 {result.quality}</span>
                    <span>💾 {result.size}</span>
                  </div>
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-[#E1306C] to-[#833AB4] text-white rounded-lg font-medium hover:shadow-lg transition-all">
                  İndir
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Nasıl Kullanılır?</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Instagram'da indirmek istediğiniz videoyu açın</li>
                <li>Video URL'sini kopyalayın (paylaş → kopyala bağlantı)</li>
              <li>URL'yi yukarıdaki kutuya yapıştırın</li>
              <li>"İndir" butonuna tıklayın</li>
              <li>Video hazır olduğunda "İndir" butonuna tıklayarak dosyayı kaydedin</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
