'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface GoogleProfileCompletionData {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  username: string;
  displayName: string;
}

interface GoogleProfileCompletionModalProps {
  isOpen: boolean;
  email: string;
  initialValues?: Partial<GoogleProfileCompletionData>;
  loading?: boolean;
  error?: string;
  onSubmit: (data: GoogleProfileCompletionData) => Promise<void>;
}

export function GoogleProfileCompletionModal({
  isOpen,
  email,
  initialValues,
  loading = false,
  error,
  onSubmit
}: GoogleProfileCompletionModalProps) {
  const [firstName, setFirstName] = useState(initialValues?.firstName || '');
  const [lastName, setLastName] = useState(initialValues?.lastName || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate || '');
  const [username, setUsername] = useState(initialValues?.username || '');
  const [displayName, setDisplayName] = useState(initialValues?.displayName || '');
  const [localError, setLocalError] = useState('');

  const mergedError = useMemo(() => error || localError, [error, localError]);

  useEffect(() => {
    setFirstName(initialValues?.firstName || '');
    setLastName(initialValues?.lastName || '');
    setPhone(initialValues?.phone || '');
    setBirthDate(initialValues?.birthDate || '');
    setUsername(initialValues?.username || '');
    setDisplayName(initialValues?.displayName || '');
  }, [initialValues]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !birthDate || !username.trim() || !displayName.trim()) {
      setLocalError('Lutfen tum zorunlu alanlari doldurun.');
      return;
    }

    if (username.includes(' ')) {
      setLocalError('Kullanici adinda bosluk olamaz.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setLocalError('Kullanici adinda sadece harf, rakam ve alt cizgi kullanabilirsiniz.');
      return;
    }

    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      birthDate,
      username: username.trim().toLowerCase(),
      displayName: displayName.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Eksik Profil Bilgileri</h3>
            <p className="text-sm text-gray-600 mt-1">
              Google ile giris yaptiginiz icin asagidaki alanlari tamamlamaniz gerekiyor.
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 cursor-not-allowed"
            title="Bu form tamamlanmadan devam edilemez"
            disabled
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mergedError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {mergedError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soyad <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dogum Tarihi <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              placeholder="gg.aa.yyyy"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">gg.aa.yyyy</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kullanici Adi <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="Kullanici adi (bosluk olmadan)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Kullanici adinda bosluk kullanilamaz. Sadece harf, rakam ve alt cizgi kullanabilirsiniz.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gorunen Ad <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Kaydediliyor...' : 'Bilgileri Kaydet ve Devam Et'}
          </button>
        </form>
      </div>
    </div>
  );
}
