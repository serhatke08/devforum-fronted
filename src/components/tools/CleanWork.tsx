'use client';

import { Coins } from 'lucide-react';

interface CleanWorkProps {
  onBack: () => void;
}

export function CleanWork({ onBack }: CleanWorkProps) {
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
          <img src="/clean-work.svg" alt="Clean Work" className="w-32 h-32 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Clean Work</h2>
          <p className="text-gray-600">Temiz ve düzenli çalışma ortamı</p>
          
          {/* Yakında Sizlerle */}
          <div className="mt-6 mb-4">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold shadow-lg">
              <span className="animate-pulse mr-2">🚀</span>
              Yakında Sizlerle
            </div>
          </div>
          
          {/* Kredi Bilgisi */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-semibold">
              Kredisiz
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dosya Organizasyonu</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Masaüstü temizleme</span>
                </div>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Başlat
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Dosya sıkıştırma</span>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Başlat
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Gereksiz dosya silme</span>
                </div>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Başlat
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem Optimizasyonu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">RAM Kullanımı</h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
                <p className="text-sm text-gray-600">65% kullanımda</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Disk Alanı</h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '40%'}}></div>
                </div>
                <p className="text-sm text-gray-600">40% kullanımda</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
