'use client';

import { AuthProvider } from '@/contexts/AuthContext';

interface ToolDetailPageProps {
  toolSlug: string;
}

export function ToolDetailPage({ toolSlug }: ToolDetailPageProps) {
  const toolName = toolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {toolName}
          </h1>
          <p className="text-gray-600 mb-8">
            DevForum {toolName} aracı - Ücretsiz online araç
          </p>
          
          {/* Placeholder - Gerçek tool component'i sonra eklenecek */}
          <div className="bg-white rounded-lg shadow p-6">
            <p>Tool içeriği yükleniyor...</p>
            <p className="text-sm text-gray-500 mt-2">
              Component migration sonrası eklenecek
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

