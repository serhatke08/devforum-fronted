'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Coins, AlertCircle } from 'lucide-react';

interface ImageDPIConverterProProps {
  onBack: () => void;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export function ImageDPIConverterPro({ onBack }: ImageDPIConverterProProps) {
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
        p_source_id: 'image-dpi-converter-pro',
        p_description: 'Image DPI Converter Pro aracı kullanıldı'
      });

      if (error) throw error;

      // Kredi hesabını yenile
      await fetchCreditAccount();
      
      // Araç kullanım geçmişi kaydet
      await supabase
        .from('tool_usage_history')
        .insert({
          user_id: user.id,
          tool_id: 'image-dpi-converter-pro',
          credits_spent: creditCost,
          usage_data: { tool_slug: 'image-dpi-converter-pro' }
        });

      alert('Image DPI Converter Pro aracı başarıyla kullanıldı!');
    } catch (error: any) {
      console.error('Kredi harcama hatası:', error);
      alert(error.message || 'Araç kullanılırken bir hata oluştu.');
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Ana Sayfaya Dön
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-lg border p-8">
        <div className="text-center mb-8">
          <img src="/image-dpi-converter-pro.svg" alt="Image DPI Converter Pro" className="w-32 h-32 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Image DPI Converter Pro</h2>
          <p className="text-gray-600">Gelişmiş DPI dönüştürme aracı</p>
          
          {/* Kredi Bilgisi */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">
              {creditCost} kredi
            </span>
            {user && (
              <span className="text-gray-500">
                (Mevcut: {creditAccount?.balance || 0} kredi)
              </span>
            )}
          </div>
          
          {!hasEnoughCredits && user && (
            <div className="mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-500 text-sm">Yetersiz kredi</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pro Özellikler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Toplu İşlem</h4>
                <p className="text-sm text-gray-600">Birden fazla dosyayı aynı anda işleyin</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Gelişmiş Kalite</h4>
                <p className="text-sm text-gray-600">AI destekli görüntü iyileştirme</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Batch Processing</h4>
                <p className="text-sm text-gray-600">Otomatik toplu işlem</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">API Desteği</h4>
                <p className="text-sm text-gray-600">Programatik erişim</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görsel Dosyaları Seçin
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-gray-600 mb-2">Dosyaları buraya sürükleyin veya tıklayın</p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG, TIFF desteklenir</p>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hedef DPI Değeri
                </label>
                <input 
                  type="number" 
                  placeholder="300" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kalite Ayarları
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option>Yüksek Kalite (Yavaş)</option>
                  <option>Orta Kalite (Hızlı)</option>
                  <option>Düşük Kalite (Çok Hızlı)</option>
                </select>
              </div>
              
              <button 
                onClick={handleUseTool}
                disabled={!hasEnoughCredits}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  hasEnoughCredits
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasEnoughCredits ? 'Toplu DPI Dönüştür' : 'Yetersiz Kredi'}
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Önizleme
                </label>
                <div className="border border-gray-300 rounded-lg p-8 text-center bg-gray-50 min-h-[200px] flex items-center justify-center">
                  <div className="text-gray-400">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p>Görsel önizlemesi burada görünecek</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">İşlem Durumu</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>İşlenen Dosyalar</span>
                    <span>0/0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
