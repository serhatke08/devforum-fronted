'use client';
import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdBanner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  position: number;
  is_active: boolean;
  rental_end_date?: string;
}

interface BannerPositionStatus {
  is_rented: boolean;
  rental_end_date: string | null;
  renter_username: string | null;
}

interface AdBannerProps {
  position: number;
  className?: string;
}

export function AdBanner({ position, className = '' }: AdBannerProps) {
  const [banner, setBanner] = useState<AdBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPositionAvailable, setIsPositionAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 3;

  // İnternet bağlantısını izle
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
      // Bağlantı geri geldiğinde verileri yenile
      loadBanner();
      checkPositionAvailability();
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Offline olduğunda interval'ı temizle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      loadBanner();
      checkPositionAvailability();
    }
  }, [position, isOnline]);

  // Kiralama sonrası global tetikleme ile yeniden yükle
  useEffect(() => {
    const handleUpdated = () => {
      loadBanner();
      checkPositionAvailability();
    };
    window.addEventListener('banner-updated', handleUpdated);
    return () => window.removeEventListener('banner-updated', handleUpdated);
  }, []);

  // Banner'ları periyodik olarak kontrol et (sadece online olduğunda)
  useEffect(() => {
    if (isOnline) {
      // Önceki interval'ı temizle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Yeni interval başlat (30 saniyede bir - daha makul)
      intervalRef.current = setInterval(() => {
        loadBanner();
        checkPositionAvailability();
      }, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Offline olduğunda interval'ı temizle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [position, isOnline]);

  const checkPositionAvailability = async () => {
    // Offline durumunda işlem yapma
    if (!isOnline) {
      return;
    }

    try {
      // Banner pozisyonunun müsait olup olmadığını kontrol et
      const { data: positionStatus, error } = await supabase.rpc<any>('get_banner_position_status', {
        p_position: position
      } as any);

      if (error) {
        // Sadece kritik hataları logla, network hatalarını sessizce geç
        if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
        }
        setIsPositionAvailable(false);
        return;
      }

      // Pozisyon müsaitse (kiralanmamışsa) true
      const status = positionStatus as BannerPositionStatus[] | null;
      setIsPositionAvailable(!status?.[0]?.is_rented);
    } catch (error: any) {
      // Network hatalarını sessizce geç, diğer hataları logla
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
      }
      setIsPositionAvailable(false);
    }
  };

  const loadBanner = async () => {
    // Offline durumunda işlem yapma
    if (!isOnline) {
      setLoading(false);
      return;
    }

    try {
      // Retry mekanizması - maksimum 3 deneme
      if (retryCount >= maxRetries) {
        setLoading(false);
        return;
      }

      // 1) Önce RPC ile dene (RLS/406 bypass)
      let bannerData: any = null;
      try {
        const { data: rpcData } = await supabase.rpc<any>('get_active_banner_by_position', { p_position: position } as any);
        if (rpcData && Array.isArray(rpcData) && (rpcData as any[]).length > 0) {
          bannerData = (rpcData as any[])[0];
        }
      } catch {}

      // 2) RPC boş dönerse REST denemeyi kapat (406 spam önleme)
      if (!bannerData) {
        setBanner(null);
        setLoading(false);
        return;
      }
      

      // Banner bulundu, şimdi rental bilgisini ayrı olarak al
      let rentalEndDate = null;
      const banner = bannerData as any;
      
      try {
        const { data: rentalData, error: rentalError } = await supabase
          .from('banner_rentals')
          .select('end_date')
          .eq('banner_id', banner.id)
          .eq('is_paid', true)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .order('end_date', { ascending: false })
          .limit(1)
          .single();

        if (!rentalError && rentalData) {
          rentalEndDate = (rentalData as any).end_date;
          
          // Süre kontrolü yap
          const now = new Date();
          const endDate = new Date(rentalEndDate);
          
          if (now > endDate) {
            // Süre dolmuş, banner'ı pasif yap
            try {
              await (supabase as any)
                .from('ad_banners')
                .update({ is_active: false })
                .eq('id', banner.id);
            } catch (updateError) {
            }
            
            setBanner(null);
            return;
          }
        }
      } catch (rentalErr) {
        // Rental bilgisi alınamadı, banner'ı yine de göster
      }

      // Banner'ı işle ve set et
      const processedBanner = {
        ...banner,
        rental_end_date: rentalEndDate
      };
      
      setBanner(processedBanner);

      // Başarılı olursa retry sayacını sıfırla
      setRetryCount(0);
    } catch (error: any) {
      // Network hatalarını sessizce geç, diğer hataları logla
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
      }
      
      // Retry sayacını artır
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = async () => {
    if (!banner) return;

    // Hedef URL'ye yönlendir
    window.open(banner.target_url, '_blank');
  };

  // Banner istatistik kaydetme geçici olarak devre dışı
  // RLS politikası sorunu çözülene kadar kapalı

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Offline durumunda özel mesaj göster
  if (!isOnline) {
    const isHorizontalBanner = className?.includes('flex-1');
    
    if (isHorizontalBanner) {
      return (
        <div className={`bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden ${className}`} style={{ minHeight: '64px' }}>
          <div className="relative h-16 sm:h-20 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <h3 className="text-xs sm:text-sm font-bold">Bağlantı Yok</h3>
              <p className="text-[10px] sm:text-xs opacity-75">İnternet bağlantısı bekleniyor</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg overflow-hidden ${className}`}>
        <div className="relative h-32 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Bağlantı Yok</h3>
            <p className="text-sm opacity-75">İnternet bağlantısı bekleniyor</p>
          </div>
        </div>
      </div>
    );
  }

  if (!banner) {
    // Yatay banner için varsayılan içerik
    const isHorizontalBanner = className?.includes('flex-1');
    
    // Yeni pozisyonlar (7-11) için özel kontrol - sadece reklam etiketi
    if (position >= 7 && position <= 11) {
      return (
        <div className={`bg-gray-100 border border-gray-300 rounded-lg overflow-hidden ${className}`}>
          <div className="relative h-32 sm:h-40 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <h3 className="text-base sm:text-lg font-bold mb-1">Reklam Alanı {position}</h3>
              <p className="text-xs sm:text-sm opacity-75">Kiralayabilirsiniz</p>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          </div>
        </div>
      );
    }
    
    if (isHorizontalBanner) {
      // Pozisyon 1-3 arası ve müsaitse tanıtım göster
      if (position <= 3 && isPositionAvailable) {
        return (
          <div className={`bg-white border-2 border-[#9c6cfe] rounded-lg overflow-hidden ${className}`} style={{ minHeight: '48px' }}>
            <div className="relative h-16 sm:h-20">
              {/* Fallback content - her zaman görünür */}
              <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-xs sm:text-sm font-bold">Reklam Alanı {position}</h3>
                  <p className="text-[10px] sm:text-xs opacity-90">Kiralayabilirsiniz</p>
                </div>
              </div>
              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded text-[10px] z-20">
                Tanıtım
              </div>
            </div>
          </div>
        );
      }
      
      // Pozisyon müsait değilse veya 4+ pozisyon ise normal varsayılan içerik
      return (
        <div className={`bg-white border-2 border-[#9c6cfe] rounded-lg overflow-hidden ${className}`} style={{ minHeight: '48px' }}>
          <div className="relative h-16 sm:h-20">
            <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-xs sm:text-sm font-bold">Reklam Alanı {position}</h3>
                <p className="text-[10px] sm:text-xs opacity-90">Kiralayabilirsiniz</p>
              </div>
            </div>
            <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded text-[10px]">
              {isPositionAvailable ? 'Müsait' : 'Kiralanmış'}
            </div>
          </div>
        </div>
      );
    }
    
    // Dikey banner için varsayılan içerik
    // Pozisyon 6 için özel ortalı yazı
    if (position === 6) {
      return (
        <div className={`bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg overflow-hidden ${className}`}>
          <div className="relative h-32 sm:h-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"></div>
            <div className="relative z-10 text-center text-white">
              <h3 className="text-base sm:text-lg font-bold mb-1">Reklam Alanı 6</h3>
              <p className="text-xs sm:text-sm opacity-90 mb-2">Kiralayabilirsiniz</p>
              <p className="text-[10px] sm:text-xs opacity-80">DevForum - Reklam Sistemi</p>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          </div>
        </div>
      );
    }
    
    // Pozisyon 4-5 için varsayılan içerik
    if (position >= 4 && position <= 5) {
      return (
        <div className={`bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg overflow-hidden ${className}`}>
          <div className="relative h-32 sm:h-40 flex items-center justify-center">
            {/* Varsayılan video/görsel */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"></div>
            <div className="relative z-10 text-center text-white">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-xl sm:text-2xl font-bold">{position}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1">Reklam Alanı {position}</h3>
              <p className="text-xs sm:text-sm opacity-90">Kiralayabilirsiniz</p>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg overflow-hidden ${className}`}>
        <div className="relative h-32 sm:h-40 flex items-center justify-center">
          {/* Varsayılan video/görsel */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"></div>
          <div className="relative z-10 text-center text-white">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <span className="text-xl sm:text-2xl font-bold">{position}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-1">Reklam Alanı {position}</h3>
            <p className="text-xs sm:text-sm opacity-90">Kiralayabilirsiniz</p>
          </div>
          {/* 4-6 pozisyonları için reklam etiketi */}
          {position >= 4 && position <= 6 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          )}
        </div>
      </div>
    );
  }

  // Banner aktif değilse varsayılan içeriği göster
  if (!banner.is_active) {
    const isHorizontalBanner = className?.includes('flex-1');
    
    // Yeni pozisyonlar (7-11) için özel kontrol - sadece reklam etiketi
    if (position >= 7 && position <= 11) {
      return (
        <div className={`bg-gray-100 border border-gray-300 rounded-lg overflow-hidden ${className}`}>
          <div className="relative h-32 sm:h-40 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <h3 className="text-base sm:text-lg font-bold mb-1">Reklam Alanı {position}</h3>
              <p className="text-xs sm:text-sm opacity-75">Kiralayabilirsiniz</p>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          </div>
        </div>
      );
    }
    
    if (isHorizontalBanner) {
      // Pozisyon 1-3 arası ve müsaitse tanıtım göster
      if (position <= 3 && isPositionAvailable) {
        return (
          <div className={`bg-white border-2 border-[#9c6cfe] rounded-lg overflow-hidden ${className}`} style={{ minHeight: '48px' }}>
            <div className="relative h-16 sm:h-20">
              {/* Fallback content - her zaman görünür */}
              <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-xs sm:text-sm font-bold">Reklam Alanı {position}</h3>
                  <p className="text-[10px] sm:text-xs opacity-90">Kiralayabilirsiniz</p>
                </div>
              </div>
              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded text-[10px] z-20">
                Tanıtım
              </div>
            </div>
          </div>
        );
      }
      
      // Pozisyon müsait değilse veya 4+ pozisyon ise normal varsayılan içerik
      return (
        <div className={`bg-white border-2 border-[#9c6cfe] rounded-lg overflow-hidden ${className}`} style={{ minHeight: '48px' }}>
          <div className="relative h-16 sm:h-20">
            <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-xs sm:text-sm font-bold">Reklam Alanı {position}</h3>
                <p className="text-[10px] sm:text-xs opacity-90">Kiralayabilirsiniz</p>
              </div>
            </div>
            <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded text-[10px]">
              {isPositionAvailable ? 'Müsait' : 'Kiralanmış'}
            </div>
          </div>
        </div>
      );
    }
    
    // Dikey banner için varsayılan içerik
    // Pozisyon 6 için özel ortalı yazı
    if (position === 6) {
      return (
        <div className={`bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg overflow-hidden ${className}`}>
          <div className="relative h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"></div>
            <div className="relative z-10 text-center text-white">
              <h3 className="text-lg font-bold mb-1">Reklam Alanı 6</h3>
              <p className="text-sm opacity-90 mb-2">Kiralayabilirsiniz</p>
              <p className="text-xs opacity-80">DevForum - Reklam Sistemi</p>
            </div>
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg overflow-hidden ${className}`}>
        <div className="relative h-32 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-600/20"></div>
          <div className="relative z-10 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold">{position}</span>
            </div>
            <h3 className="text-lg font-bold mb-1">Reklam Alanı {position}</h3>
            <p className="text-sm opacity-90">Kiralayabilirsiniz</p>
          </div>
          {/* 4-6 pozisyonları için reklam etiketi */}
          {position >= 4 && position <= 6 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
              Reklam
            </div>
          )}
        </div>
        
        <div className="p-3 bg-white/10 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-white/80 text-xs">DevForum - Reklam Sistemi</p>
          </div>
        </div>
      </div>
    );
  }

  // Banner içeriğinin video mu görsel mi olduğunu kontrol et
  const isVideo = banner.image_url.match(/\.(mp4|webm|ogg|mov|avi)$/i) || 
                  banner.image_url.includes('youtube.com') || 
                  banner.image_url.includes('youtu.be') ||
                  banner.image_url.includes('vimeo.com');

  // Yatay banner için özel stil (flex-1 class'ı varsa)
  const isHorizontalBanner = className?.includes('flex-1');
  
  if (isHorizontalBanner) {
    return (
      <div 
        className={`bg-white border-2 border-[#9c6cfe] rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${className}`}
        onClick={handleBannerClick}
        style={{ minHeight: '64px' }}
      >
        <div className="relative h-16 sm:h-20">
          {isVideo ? (
            <video
              src={banner.image_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded text-[10px] z-10">
            Reklam
          </div>
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <ExternalLink className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dikey banner için: aktif reklamda mor arkaplanı kaldır
  return (
    <div 
      className={`bg-white border border-[#9c6cfe] rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${className}`}
      onClick={handleBannerClick}
      style={{ minHeight: '128px' }}
    >
      <div className="relative w-full h-32 sm:h-48">
        {isVideo ? (
          <video
            src={banner.image_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded z-10">
          Reklam
        </div>
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <ExternalLink className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
