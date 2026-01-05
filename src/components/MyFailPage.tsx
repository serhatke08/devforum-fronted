'use client';

import { XCircle, RefreshCw, HelpCircle } from 'lucide-react';

export default function MyFailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          {/* Hata İkonu */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center animate-pulse">
              <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Başlık */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Ödeme Başarısız
          </h1>

          {/* Açıklama */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Üzgünüz, ödemeniz işlenirken bir sorun oluştu.
            <br />
            <span className="text-sm">Farklı bir ödeme yöntemi deneyebilirsiniz.</span>
          </p>

          {/* Olası Sebepler */}
          <div className="w-full mb-6 p-4 bg-red-50 rounded-lg text-left">
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <HelpCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-600 mb-1">Muhtemel Sebepler:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Yetersiz bakiye</li>
                  <li>• Kart bilgileri hatalı</li>
                  <li>• Banka onaylamadı</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="w-full space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Tekrar Dene
            </button>

            <button
              onClick={() => window.history.back()}
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              Geri Dön
            </button>
          </div>

          {/* Destek */}
          <p className="text-xs text-gray-500 mt-6">
            Sorun devam ediyor mu?{' '}
            <a href="/" className="text-red-600 hover:underline">
              Bize Ulaşın
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
