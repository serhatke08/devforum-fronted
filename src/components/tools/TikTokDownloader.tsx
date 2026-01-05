'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Coins, AlertCircle } from 'lucide-react';

interface TikTokDownloaderProps {
  onBack: () => void;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

export function TikTokDownloader({ onBack }: TikTokDownloaderProps) {
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
        p_source_id: 'tiktok-downloader',
        p_description: 'TikTok Downloader aracı kullanıldı'
      });

      if (error) throw error;

      // Kredi hesabını yenile
      await fetchCreditAccount();
      
      // Araç kullanım geçmişi kaydet
      await supabase
        .from('tool_usage_history')
        .insert({
          user_id: user.id,
          tool_id: 'tiktok-downloader',
          credits_spent: creditCost,
          usage_data: { tool_slug: 'tiktok-downloader' }
        });

      alert('TikTok Downloader aracı başarıyla kullanıldı!');
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
          <img src="/tiktok-downloader.svg" alt="TikTok Downloader" className="w-32 h-32 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">TikTok Video Downloader</h2>
          <p className="text-gray-600">TikTok videolarını kolayca indirin</p>
          
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok Video URL'si
            </label>
            <input 
              type="url" 
              placeholder="https://www.tiktok.com/@user/video/..." 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kalite Seçimi
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option>En Yüksek Kalite</option>
                <option>720p</option>
                <option>480p</option>
                <option>Sadece Ses (MP3)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option>MP4</option>
                <option>WEBM</option>
                <option>MP3</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleUseTool}
            disabled={!hasEnoughCredits}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              hasEnoughCredits
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {hasEnoughCredits ? 'Video İndir' : 'Yetersiz Kredi'}
          </button>
        </div>
      </div>
    </div>
  );
}
