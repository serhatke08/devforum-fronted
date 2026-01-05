'use client';

import { Coins } from 'lucide-react';

interface FenomenGPTProps {
  onBack: () => void;
}

export function FenomenGPT({ onBack }: FenomenGPTProps) {
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
          <img src="/fenomen-gpt.svg" alt="Fenomen GPT" className="w-32 h-32 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Fenomen GPT</h2>
          <p className="text-gray-600">Yapay zeka destekli GPT aracı</p>
          
          {/* Kredi Bilgisi */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">
              Kredisiz
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sohbet</h3>
            <div className="bg-white rounded-lg p-4 mb-4 min-h-[300px] border">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs">
                    Merhaba! Size nasıl yardımcı olabilirim?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-xs">
                    React ile bir todo uygulaması nasıl yapılır?
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Mesajınızı yazın..." 
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                Gönder
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Özellikler</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Kod yazma yardımı
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Hata düzeltme
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Dokümantasyon oluşturma
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Test yazma
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanım İstatistikleri</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bugünkü Sohbet</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toplam Sohbet</span>
                  <span className="font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aktif Kullanıcı</span>
                  <span className="font-medium text-green-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
