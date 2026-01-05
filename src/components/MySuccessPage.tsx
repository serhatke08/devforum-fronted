'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function MySuccessPage() {
  useEffect(() => {
    // Sayfa yüklendiğinde kredi bakiyesini yenile
    window.dispatchEvent(new Event('refreshCredits'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          {/* Başarı İkonu */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-bounce-slow">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Başlık */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Ödeme Başarılı!
          </h1>

          {/* Açıklama */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Teşekkür ederiz! Ödemeniz başarıyla işlenmiştir.
            <br />
            <span className="font-semibold text-emerald-600">Kredileriniz hesabınıza yüklenmiştir.</span>
          </p>

          {/* İkonlar */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span>✓</span>
              </div>
              <span>Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span>⚡</span>
              </div>
              <span>Anında Yükleme</span>
            </div>
          </div>

          {/* Buton */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            DevForum'a Dön
          </button>

          {/* Destek */}
          <p className="text-xs text-gray-500 mt-6">
            Sorunuz mu var?{' '}
            <a href="/" className="text-emerald-600 hover:underline">
              Destek
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
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
