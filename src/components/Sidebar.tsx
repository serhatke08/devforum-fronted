'use client';

import { useState, useEffect } from 'react';
import { 
  Home, 
  Bookmark, 
  User, 
  X, 
  ChevronLeft,
  ChevronRight,
  Coins,
  Megaphone,
  Monitor,
  Star,
  CreditCard as CreditCardIcon,
  MessageCircle,
  LifeBuoy,
  Wrench
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  creditBalance?: number;
  onBannerRental: () => void;
  onBannerControl: () => void;
  onFeaturedClick?: () => void;
  onCreditPurchase?: () => void;
  user?: any;
  unreadMessageCount?: number;
  onShowAuth?: () => void;
}

export function Sidebar({ isOpen, onClose, selectedCategory, onSelectCategory, isCollapsed, onToggleCollapse, creditBalance = 0, onBannerRental, onBannerControl, onFeaturedClick, onCreditPurchase, user, unreadMessageCount = 0, onShowAuth }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  const menuItems = [
    { id: 'home', icon: Home, label: 'Ana Sayfa', value: null },
    { id: 'saved', icon: Bookmark, label: 'Kaydedilenler', value: 'saved' },
    { id: 'tools', icon: Wrench, label: 'Araçlar', value: 'tools' },
    { id: 'messages', icon: MessageCircle, label: 'Mesajlar', value: 'messages' },
    { id: 'profile', icon: User, label: 'Profilim', value: 'profile' },
    { id: 'support', icon: LifeBuoy, label: 'Destek', value: 'support' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sabit çizgi - sadece desktop'ta */}
      <div className="hidden lg:block fixed top-20 left-0 w-64 h-px bg-gray-200 z-50"></div>
      
      <aside
        className={`
          fixed lg:fixed top-14 sm:top-16 lg:top-20 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-5rem)] bg-white border-r border-gray-300 z-40
          transition-all duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isOpen ? 'w-64 sm:w-64' : 'w-0'} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
          flex flex-col overflow-hidden
        `}
      >
        {/* Daraltma/Genişletme Tuşu - Sadece Desktop'ta görünür */}
        <div className="hidden lg:flex justify-end p-2">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="font-semibold text-gray-900">Menü</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0 flex flex-col">
          <nav className={`${isCollapsed ? 'lg:space-y-2' : 'space-y-1'} flex-shrink-0`}>
            {menuItems.map((item) => {
              const isHome = item.id === 'home';
              const Component = isHome ? 'a' : 'button';
              const props = isHome ? { href: '/' } : {};
              
              return (
                <Component
                  key={item.id}
                  {...props}
                  onClick={(e: any) => {
                    if (isHome) {
                      e.preventDefault();
                    }
                    // Mesaj butonu için giriş kontrolü
                    if (item.id === 'messages' && !user) {
                      onShowAuth?.();
                      onClose();
                      return;
                    }
                    
                    onSelectCategory(item.value);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center transition-all duration-500 ease-in-out relative
                    gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg
                    ${isCollapsed 
                      ? (selectedCategory === item.value 
                          ? 'lg:justify-center lg:px-2 lg:py-2 lg:rounded-full lg:w-10 lg:h-10 lg:mx-auto' 
                          : 'lg:justify-center lg:px-2 lg:py-3 lg:rounded-lg')
                      : ''
                    }
                    ${selectedCategory === item.value
                      ? 'bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                <div className="relative">
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {item.id === 'messages' && unreadMessageCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  {item.id === 'messages' && unreadMessageCount > 0 && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </Component>
            );
            })}
          </nav>
          
          {/* Kredi Butonları - Destek'in hemen altında, scroll alanının en altında */}
          {user && (
            <>
              {/* Menü açıkken - Tam butonlar (Mobilde isOpen, Desktop'ta !isCollapsed) */}
              {((isOpen && isMobile) || (!isCollapsed && !isMobile)) && (
                <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200 flex-shrink-0 pb-12 sm:pb-0">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 sm:p-2.5 border border-emerald-200">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                        <span className="text-xs sm:text-sm font-semibold text-emerald-700">Kredi</span>
                      </div>
                      <span className="text-sm sm:text-base md:text-lg font-bold text-emerald-600">{creditBalance}</span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <button 
                        onClick={onCreditPurchase}
                        className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg text-white py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
                      >
                        <CreditCardIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Kredi Yükle</span>
                      </button>
                      <button 
                        onClick={onBannerRental}
                        className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] hover:shadow-lg text-white py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
                      >
                        <Megaphone className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Banner Kirala</span>
                      </button>
                      <button 
                        onClick={onBannerControl}
                        className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg text-white py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
                      >
                        <Monitor className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Banner Kontrol</span>
                      </button>
                      {onFeaturedClick && (
                        <button 
                          onClick={onFeaturedClick}
                          className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg text-white py-1.5 sm:py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
                        >
                          <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Form Öne Çıkar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Menü kapalıyken - Sadece icon butonlar */}
              {isCollapsed && !isMobile && (
                <div className="hidden lg:block mt-auto pt-3 border-t border-gray-200 flex-shrink-0">
                  <div className="space-y-2">
                    {/* Kredi Göstergesi */}
                    <div className="w-full flex items-center justify-center p-1.5 sm:p-2 bg-emerald-50 rounded-lg mb-2"
                      title={`${creditBalance} kredi`}
                    >
                      <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    
                    {/* Kredi Yükle */}
                    <button 
                      onClick={onCreditPurchase}
                      className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg text-white rounded-lg transition-all"
                      title="Kredi Yükle"
                    >
                      <CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Banner Kirala */}
                    <button 
                      onClick={onBannerRental}
                      className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] hover:shadow-lg text-white rounded-lg transition-all"
                      title="Banner Kirala"
                    >
                      <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Banner Kontrol */}
                    <button 
                      onClick={onBannerControl}
                      className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg text-white rounded-lg transition-all"
                      title="Banner Kontrol"
                    >
                      <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {/* Form Öne Çıkar */}
                    {onFeaturedClick && (
                      <button 
                        onClick={onFeaturedClick}
                        className="w-full flex items-center justify-center p-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg text-white rounded-lg transition-all"
                        title="Form Öne Çıkar"
                      >
                        <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>


      </aside>
    </>
  );
}
