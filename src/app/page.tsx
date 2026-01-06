'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function Home() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            DevForum - Türkiye'nin En Büyük Yazılım Forumu
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için platform
          </p>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-700">Site yükleniyor...</p>
            <p className="text-sm text-gray-500 mt-2">
              Component'ler migration sonrası eklenecek
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
