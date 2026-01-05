'use client';

import { ArrowLeft, FileText, Download, Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';

interface CVCreatorProps {
  onBack: () => void;
}

export function CVCreator({ onBack }: CVCreatorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [cvData, setCvData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    summary: '',
    experience: '',
    education: '',
    skills: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // CV kaydetme işlemi
    console.log('CV kaydediliyor:', cvData);
    setIsEditing(false);
  };

  const handleDownload = () => {
    // CV indirme işlemi
    console.log('CV indiriliyor:', cvData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 truncate">CV CREATOR</h1>
                <p className="text-xs sm:text-base text-gray-600 truncate">Profesyonel CV oluşturun</p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Kaydet
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    İndir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CV Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CV Bilgileri</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={cvData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="Adınızı ve soyadınızı girin"
                  />
                ) : (
                  <p className="text-gray-900">{cvData.name || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={cvData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="E-posta adresinizi girin"
                  />
                ) : (
                  <p className="text-gray-900">{cvData.email || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={cvData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="Telefon numaranızı girin"
                  />
                ) : (
                  <p className="text-gray-900">{cvData.phone || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adres
                </label>
                {isEditing ? (
                  <textarea
                    value={cvData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                    placeholder="Adresinizi girin"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{cvData.address || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özet
                </label>
                {isEditing ? (
                  <textarea
                    value={cvData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                    placeholder="Kendinizi kısaca tanıtın"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{cvData.summary || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deneyim
                </label>
                {isEditing ? (
                  <textarea
                    value={cvData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                    placeholder="İş deneyimlerinizi yazın"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{cvData.experience || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eğitim
                </label>
                {isEditing ? (
                  <textarea
                    value={cvData.education}
                    onChange={(e) => handleInputChange('education', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                    placeholder="Eğitim bilgilerinizi yazın"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{cvData.education || 'Belirtilmemiş'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetenekler
                </label>
                {isEditing ? (
                  <textarea
                    value={cvData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                    placeholder="Yeteneklerinizi yazın"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-line">{cvData.skills || 'Belirtilmemiş'}</p>
                )}
              </div>
            </div>
          </div>

          {/* CV Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CV Önizleme</h2>
            
            <div className="bg-gray-50 rounded-lg p-6 min-h-[600px]">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {cvData.name || 'Ad Soyad'}
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  {cvData.email && <p>{cvData.email}</p>}
                  {cvData.phone && <p>{cvData.phone}</p>}
                  {cvData.address && <p className="whitespace-pre-line">{cvData.address}</p>}
                </div>
              </div>

              {cvData.summary && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Özet</h2>
                  <p className="text-gray-700 whitespace-pre-line">{cvData.summary}</p>
                </div>
              )}

              {cvData.experience && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Deneyim</h2>
                  <p className="text-gray-700 whitespace-pre-line">{cvData.experience}</p>
                </div>
              )}

              {cvData.education && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Eğitim</h2>
                  <p className="text-gray-700 whitespace-pre-line">{cvData.education}</p>
                </div>
              )}

              {cvData.skills && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Yetenekler</h2>
                  <p className="text-gray-700 whitespace-pre-line">{cvData.skills}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}