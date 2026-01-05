'use client';

import { MapPin, Mail, Phone } from 'lucide-react';

interface FooterProps {
  isSidebarCollapsed?: boolean;
  onNavigate?: (page: string) => void;
}

export function Footer({ isSidebarCollapsed = false, onNavigate }: FooterProps) {
  const sidebarOffsetClass = isSidebarCollapsed ? 'lg:ml-16 sm:lg:ml-20' : 'lg:ml-64';

  return (
    <footer className={`bg-black border-t border-gray-800 ${sidebarOffsetClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* İletişim Bilgileri ve Adres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Adres */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white mb-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">Adres</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              DevForum A.Ş.<br />
              Levent Mahallesi,<br />
              Büyükdere Caddesi No: 185<br />
              34394 Şişli/İstanbul, Türkiye
            </p>
          </div>

          {/* İletişim */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white mb-2">
              <Phone className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">İletişim</h3>
            </div>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <a 
                href="tel:+905383833441" 
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                0538 383 34 41
              </a>
              <a 
                href="mailto:team@devforum.xyz" 
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                team@devforum.xyz
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg text-white mb-2">Hızlı Linkler</h3>
            <div className="flex flex-col gap-2 text-sm">
              <button 
                onClick={() => onNavigate?.('about')}
                className="text-left text-gray-400 hover:text-white transition-colors"
              >
                Hakkımızda
              </button>
              <button 
                onClick={() => onNavigate?.('contact')}
                className="text-left text-gray-400 hover:text-white transition-colors"
              >
                İletişim
              </button>
              <button 
                onClick={() => onNavigate?.('privacy')}
                className="text-left text-gray-400 hover:text-white transition-colors"
              >
                Gizlilik Politikası
              </button>
              <button 
                onClick={() => onNavigate?.('terms')}
                className="text-left text-gray-400 hover:text-white transition-colors"
              >
                Kullanım Şartları
              </button>
              <button 
                onClick={() => onNavigate?.('faq')}
                className="text-left text-gray-400 hover:text-white transition-colors"
              >
                SSS
              </button>
            </div>
          </div>
        </div>

        {/* Alt Kısım - Telif Hakkı */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} DevForum. Tüm hakları saklıdır.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>KVKK Uyumlu</span>
              <span>•</span>
              <span>Güvenli Ödeme</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


