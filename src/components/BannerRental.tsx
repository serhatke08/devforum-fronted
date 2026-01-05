'use client';
import { useState, useEffect } from 'react';
import { Calendar, CreditCard, Image, ExternalLink, X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface BannerRentalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreditPurchase?: () => void;
  userCredits?: number;
}

interface AdBanner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  position: number;
  is_active: boolean;
  is_rented?: boolean;
  rental_end_date?: string;
}

export function BannerRental({ isOpen, onClose, onSuccess, onCreditPurchase, userCredits: propCredits }: BannerRentalProps) {
  const { user } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<AdBanner | null>(null);
  const [rentalDays, setRentalDays] = useState(1);
  const [totalCost, setTotalCost] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerVideo, setBannerVideo] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const DAILY_COST = 1500;

  const formatTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Süresi Doldu';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 1) {
      return `${days} gün kaldı`;
    } else if (days === 1) {
      return `${hours + 24} saat kaldı`;
    } else if (hours > 0) {
      return `${hours} saat ${minutes} dakika kaldı`;
    } else {
      return `${minutes} dakika kaldı`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBanners();
      if (propCredits !== undefined) {
        setUserCredits(propCredits);
        setCreditsLoading(false);
      } else {
        loadUserCredits();
      }
    }
  }, [isOpen, propCredits]);

  useEffect(() => {
    setTotalCost(rentalDays * DAILY_COST);
  }, [rentalDays]);

  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function - component unmount olduğunda scroll'u geri aç
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadBanners = async () => {
    try {
      // Yeni fonksiyon ile banner pozisyon durumlarını al
      const { data: positionStatuses, error: statusError } = await supabase.rpc<any>('get_all_banner_positions_status');

      if (statusError) {
        console.error('Banner pozisyon durumu kontrol hatası:', statusError);
        // Fallback: Sabit banner pozisyonları
        const fixedBanners = [
          { id: 'pos1', title: 'Banner Pozisyon 1', position: 1, is_active: false, is_rented: false },
          { id: 'pos2', title: 'Banner Pozisyon 2', position: 2, is_active: false, is_rented: false },
          { id: 'pos3', title: 'Banner Pozisyon 3', position: 3, is_active: false, is_rented: false },
          { id: 'pos4', title: 'Banner Pozisyon 4', position: 4, is_active: false, is_rented: false },
          { id: 'pos5', title: 'Banner Pozisyon 5', position: 5, is_active: false, is_rented: false },
          { id: 'pos6', title: 'Banner Pozisyon 6', position: 6, is_active: false, is_rented: false }
        ];
        setBanners(fixedBanners);
        return;
      }

      // Banner pozisyonlarını oluştur
      const fixedBanners = [
        { 
          id: 'pos1', 
          title: 'Banner Pozisyon 1', 
          position: 1, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 1)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 1)?.rental_end_date
        },
        { 
          id: 'pos2', 
          title: 'Banner Pozisyon 2', 
          position: 2, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 2)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 2)?.rental_end_date
        },
        { 
          id: 'pos3', 
          title: 'Banner Pozisyon 3', 
          position: 3, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 3)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 3)?.rental_end_date
        },
        { 
          id: 'pos4', 
          title: 'Banner Pozisyon 4', 
          position: 4, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 4)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 4)?.rental_end_date
        },
        { 
          id: 'pos5', 
          title: 'Banner Pozisyon 5', 
          position: 5, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 5)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 5)?.rental_end_date
        },
        { 
          id: 'pos6', 
          title: 'Banner Pozisyon 6', 
          position: 6, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 6)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 6)?.rental_end_date
        },
        { 
          id: 'pos7', 
          title: 'Banner Pozisyon 7', 
          position: 7, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 7)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 7)?.rental_end_date
        },
        { 
          id: 'pos8', 
          title: 'Banner Pozisyon 8', 
          position: 8, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 8)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 8)?.rental_end_date
        },
        { 
          id: 'pos9', 
          title: 'Banner Pozisyon 9', 
          position: 9, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 9)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 9)?.rental_end_date
        },
        { 
          id: 'pos10', 
          title: 'Banner Pozisyon 10', 
          position: 10, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 10)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 10)?.rental_end_date
        },
        { 
          id: 'pos11', 
          title: 'Banner Pozisyon 11', 
          position: 11, 
          is_active: false,
          is_rented: positionStatuses?.find(p => p["position"] === 11)?.is_rented || false,
          rental_end_date: positionStatuses?.find(p => p["position"] === 11)?.rental_end_date
        }
      ];
      setBanners(fixedBanners);
    } catch (error) {
      console.error('Banner yüklenirken hata:', error);
    }
  };

  const loadUserCredits = async () => {
    if (!user) {
      console.log('Kullanıcı yok, kredi yüklenmiyor');
      setCreditsLoading(false);
      return;
    }
    
    console.log('Kredi yükleniyor, kullanıcı ID:', user.id);
    setCreditsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      console.log('Kredi sorgu sonucu:', { data, error });

      if (error) {
        console.error('Kredi yükleme hatası:', error);
        setUserCredits(0);
      } else {
        const credits = data?.balance || 0;
        console.log('Yüklenen kredi:', credits);
        setUserCredits(credits);
      }
    } catch (error) {
      console.error('Kredi yüklenirken hata:', error);
      setUserCredits(0);
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleRentBanner = async () => {
    if (!selectedBanner || !user) return;

    if (!acceptTerms) {
      addToast({ type: 'warning', title: 'Sözleşme Onayı Gerekli', message: 'Kiralama sözleşmesini kabul etmeden devam edemezsiniz.', duration: 3000 });
      return;
    }

    if (userCredits < totalCost) {
      addToast({ type: 'error', title: 'Yetersiz kredi', message: 'Lütfen kredi yükleyin.', duration: 3000 });
      return;
    }

    // Kiralama süresi kontrolü
    if (selectedBanner.is_rented) {
      alert('Bu pozisyon şu anda kiralanmış durumda!');
      return;
    }

    // Ek güvenlik kontrolü - veritabanından tekrar kontrol et
    const { data: isRented, error: rentalCheckError } = await supabase.rpc<any>('is_banner_position_rented', {
      p_position: selectedBanner.position
    });

    if (rentalCheckError) {
      console.error('Kiralama durumu kontrol hatası:', rentalCheckError);
      addToast({ type: 'error', title: 'Kiralama kontrolü başarısız', message: 'Lütfen tekrar deneyin.', duration: 3000 });
      return;
    }

    if (isRented) {
      addToast({ type: 'warning', title: 'Pozisyon kiralanmış', message: 'Lütfen sayfayı yenileyin.', duration: 3000 });
      await loadBanners(); // Banner listesini yenile
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Banner kiralama başlıyor...', { selectedBanner, userCredits, totalCost });
      
      // Önce o pozisyondaki mevcut banner'ı kontrol et
      const { data: existingBanner, error: checkError } = await supabase
        .from('ad_banners')
        .select('id')
        .eq('position', selectedBanner.position)
        .single();

      console.log('📋 Mevcut banner kontrolü:', { existingBanner, checkError });
      let bannerId = existingBanner?.id;

      // Banner içeriğini hazırla
      let finalImageUrl = 'https://via.placeholder.com/400x200/9c6cfe/ffffff?text=Banner+Alanı';
      let finalTargetUrl = 'https://example.com';

      if (bannerImage) {
        console.log('📸 Görsel dosyası yükleniyor...', bannerImage.name);
        // Dosya yükleme işlemi - Supabase Storage kullan
        try {
          const fileExt = bannerImage.name.split('.').pop();
          const fileName = `banner-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          console.log('📁 Dosya yolu:', filePath);
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, bannerImage);
          
          if (uploadError) {
            console.error('❌ Dosya yükleme hatası:', uploadError);
            // Fallback: URL.createObjectURL kullan
            finalImageUrl = URL.createObjectURL(bannerImage);
            console.log('🔄 Fallback URL kullanılıyor:', finalImageUrl);
          } else {
            // Yüklenen dosyanın public URL'sini al
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
            console.log('✅ Dosya başarıyla yüklendi:', finalImageUrl);
          }
        } catch (error) {
          console.error('❌ Dosya yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(bannerImage);
          console.log('🔄 Fallback URL kullanılıyor:', finalImageUrl);
        }
      } else if (bannerVideo) {
        console.log('🎥 Video dosyası yükleniyor...', bannerVideo.name);
        // Video dosyası için - Supabase Storage kullan
        try {
          const fileExt = bannerVideo.name.split('.').pop();
          const fileName = `banner-video-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          console.log('📁 Video yolu:', filePath);
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, bannerVideo);
          
          if (uploadError) {
            console.error('❌ Video yükleme hatası:', uploadError);
            // Fallback: URL.createObjectURL kullan
            finalImageUrl = URL.createObjectURL(bannerVideo);
            console.log('🔄 Fallback URL kullanılıyor:', finalImageUrl);
          } else {
            // Yüklenen dosyanın public URL'sini al
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
            console.log('✅ Video başarıyla yüklendi:', finalImageUrl);
          }
        } catch (error) {
          console.error('❌ Video yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(bannerVideo);
          console.log('🔄 Fallback URL kullanılıyor:', finalImageUrl);
        }
      } else if (bannerUrl) {
        finalImageUrl = bannerUrl;
        console.log('🔗 URL kullanılıyor:', finalImageUrl);
      }

      if (targetUrl) {
        finalTargetUrl = targetUrl;
      }

      console.log('🎯 Final URL\'ler:', { finalImageUrl, finalTargetUrl });

      // Eğer o pozisyonda banner yoksa yeni oluştur
      if (!existingBanner || checkError?.code === 'PGRST116') {
        console.log('🆕 Yeni banner oluşturuluyor...');
        const { data: newBanner, error: createError } = await supabase
          .from('ad_banners')
          .insert({
            title: `Banner Pozisyon ${selectedBanner.position}`,
            description: 'Kiralanan banner',
            image_url: finalImageUrl,
            target_url: finalTargetUrl,
            position: selectedBanner.position,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Banner oluşturma hatası:', createError);
          throw createError;
        }
        bannerId = newBanner.id;
        console.log('✅ Yeni banner oluşturuldu:', bannerId);
      } else {
        console.log('🔄 Mevcut banner güncelleniyor...', bannerId);
        // Mevcut banner'ı güncelle ve aktif et
        const { error: updateError } = await supabase
          .from('ad_banners')
          .update({ 
            image_url: finalImageUrl,
            target_url: finalTargetUrl,
            is_active: true 
          })
          .eq('id', bannerId);

        if (updateError) {
          console.error('❌ Banner güncelleme hatası:', updateError);
          throw updateError;
        }
        console.log('✅ Banner güncellendi');
      }

      // 24 saat tam kiralama sistemi - başlangıç saatinden 24 saat sonra bitsin
      const now = new Date();
      const endDate = new Date(now.getTime() + (rentalDays * 24 * 60 * 60 * 1000)); // Tam 24 saat
      
      console.log('🕐 24 saat tam kiralama hesaplama:', { 
        rentalDays, 
        now: now.toISOString(),
        endDate: endDate.toISOString(),
        diffHours: (endDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      });
      
      // Timestamp olarak tam saat bilgisiyle kaydet
      const startDateStr = now.toISOString();
      const endDateStr = endDate.toISOString();
      
      console.log('📊 Final tarihler (tam timestamp):', { startDateStr, endDateStr });

      // Banner kiralama kaydı oluştur - start_date ve end_date'i timestamp olarak kaydet
      const { error: rentalError } = await supabase
        .from('banner_rentals')
        .insert({
          banner_id: bannerId,
          user_id: user.id,
          start_date: startDateStr, // Timestamp olarak kaydet
          end_date: endDateStr, // Timestamp olarak kaydet
          daily_cost: DAILY_COST,
          total_cost: totalCost,
          is_paid: true
        });

      if (rentalError) throw rentalError;

      // Kullanıcının kredisini düş
      const { error: creditError } = await supabase.rpc<any>('spend_credits', {
        p_user_id: user.id,
        p_amount: totalCost,
        p_source_type: 'banner_rental',
        p_source_id: bannerId,
        p_description: `Banner kiralama - Pozisyon ${selectedBanner.position}`
      });

      if (creditError) throw creditError;

      addToast({ type: 'success', title: 'Başarılı', message: `Banner pozisyon ${selectedBanner.position} kiralandı.`, duration: 3000 });
      
      // Formu temizle
      setBannerImage(null);
      setBannerVideo(null);
      setBannerUrl('');
      setTargetUrl('');
      setSelectedBanner(null);
      
      // Banner listesini yenile
      await loadBanners();
      
      // Banner senkronizasyonunu zorla çalıştır
      try {
        await supabase.rpc<any>('force_sync_banners');
        console.log('✅ Banner senkronizasyonu tamamlandı');
      } catch (error) {
        console.error('❌ Banner senkronizasyon hatası:', error);
      }
      
      // Tüm AdBanner bileşenlerine güncelleme tetikle
      try {
        window.dispatchEvent(new CustomEvent('banner-updated'));
      } catch {}
      
      onSuccess?.();
      // Toast görünürken modalı açık tut (3 sn), sonra kapat
      setTimeout(() => {
        onClose();
      }, 3200);
    } catch (error) {
      console.error('Banner kiralama hatası:', error);
      addToast({ type: 'error', title: 'Hata', message: 'Banner kiralanırken bir hata oluştu.', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <ToastContainer />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Banner Kiralama</h2>
            <p className="text-sm text-gray-600">Toplam 11 banner pozisyonu mevcut</p>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Kredi Durumu */}
            <div className="bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] p-6 rounded-lg text-white">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-lg font-semibold">Mevcut Krediniz</span>
                </div>
                
                {creditsLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="text-lg">Yükleniyor...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{userCredits.toLocaleString()}</div>
                    <div className="text-sm opacity-90 mt-1">Günlük kiralama: 1.500 kredi</div>
                  </>
                )}
              </div>
            </div>

            {/* Banner Seçimi */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Banner Pozisyonu Seçin</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📐 Banner Boyutları</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div><strong>Pozisyon 1-3:</strong> 48px yükseklik (mobil) / 56px yükseklik (desktop) - Yatay menü üstü</div>
                  <div className="ml-4">• Genişlik: ~33% (3 eşit parça) - Mobil: ~120px, Desktop: ~200px</div>
                  <div><strong>Pozisyon 4-6:</strong> 128px yükseklik - Sayfa içi dikey banner'lar</div>
                  <div className="ml-4">• Genişlik: 100% (tam genişlik) - Mobil: ~350px, Desktop: ~800px</div>
                  <div className="text-blue-600 mt-2">💡 Video ve görseller otomatik olarak bu boyutlara uyarlanır</div>
                </div>
              </div>
              <div className="space-y-4">
                {/* Pozisyon 1-3 (Yatay menü üstü) */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Yatay Menü Üstü</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {banners.filter(b => b.position <= 3).map((banner) => {
                      const isRented = banner.is_rented;
                      const endDate = banner.rental_end_date;
                      
                      return (
                        <button
                          key={banner.id}
                          onClick={() => !isRented && setSelectedBanner(banner)}
                          disabled={isRented}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            isRented
                              ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                              : selectedBanner?.id === banner.id
                              ? 'border-[#9c6cfe] bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                              isRented ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              <span className={`text-2xl font-bold ${
                                isRented ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {banner.position}
                              </span>
                            </div>
                            <p className={`text-sm font-medium ${
                              isRented ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              Pozisyon {banner.position}
                            </p>
                            <p className={`text-xs ${
                              isRented ? 'text-red-500' : 'text-gray-500'
                            }`}>
                              {banner.position === 1 && 'Yatay menü üstü (sol)'}
                              {banner.position === 2 && 'Yatay menü üstü (orta)'}
                              {banner.position === 3 && 'Yatay menü üstü (sağ)'}
                            </p>
                            <p className={`text-xs ${
                              isRented ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {banner.position === 1 && 'Boyut: 48x120px (mobil) / 56x200px (desktop)'}
                              {banner.position === 2 && 'Boyut: 48x120px (mobil) / 56x200px (desktop)'}
                              {banner.position === 3 && 'Boyut: 48x120px (mobil) / 56x200px (desktop)'}
                            </p>
                            {isRented ? (
                              <div className="text-xs text-red-500">
                                <div>Kiralanmış</div>
                                <div>{endDate ? formatTimeLeft(endDate) : 'Süresi Doldu'}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-green-600 font-medium">
                                Müsait
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pozisyon 4-6 (Diğer pozisyonlar) */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Diğer Pozisyonlar</h4>
                  <div className="space-y-3">
                    {banners.filter(b => b.position >= 4).map((banner) => {
                      const isRented = banner.is_rented;
                      const endDate = banner.rental_end_date;
                      
                      return (
                        <button
                          key={banner.id}
                          onClick={() => !isRented && setSelectedBanner(banner)}
                          disabled={isRented}
                          className={`p-4 border-2 rounded-lg transition-all w-full ${
                            isRented
                              ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                              : selectedBanner?.id === banner.id
                              ? 'border-[#9c6cfe] bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isRented ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              <span className={`text-2xl font-bold ${
                                isRented ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {banner.position}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <p className={`text-sm font-medium ${
                                isRented ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                Pozisyon {banner.position}
                              </p>
                              <p className={`text-xs ${
                                isRented ? 'text-red-500' : 'text-gray-500'
                              }`}>
                                {banner.position === 4 && 'Yatay menü ile yazılım dünyası arası'}
                                {banner.position === 5 && 'Google ve Arama Motorları kategorisi altı'}
                                {banner.position === 6 && 'Sosyal Medya kategorisi altı'}
                                {banner.position === 7 && 'İçerik & Makale Hizmetleri kategorisi altı'}
                                {banner.position === 8 && 'Grafik & Tasarım kategorisi altı'}
                                {banner.position === 9 && 'Mobil Dünyası kategorisi altı'}
                                {banner.position === 10 && 'Dijital Ürün Pazarı kategorisi altı'}
                                {banner.position === 11 && 'Dijital Pazarlama kategorisi altı'}
                              </p>
                              <p className={`text-xs ${
                                isRented ? 'text-red-400' : 'text-gray-400'
                              }`}>
                                {banner.position === 4 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 5 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 6 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 7 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 8 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 9 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 10 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                                {banner.position === 11 && 'Boyut: 128x350px (mobil) / 128x800px (desktop)'}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {isRented ? (
                                <div className="text-xs text-red-500 text-right">
                                  <div>Kiralanmış</div>
                                  <div>{endDate ? formatTimeLeft(endDate) : 'Süresi Doldu'}</div>
                                </div>
                              ) : (
                                <div className="text-xs text-green-600 font-medium">
                                  Müsait
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Kiralama Süresi Seçimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Kiralama Süresi
                </div>
              </label>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-[#9c6cfe]">{rentalDays}</div>
                  <div className="text-sm text-gray-600">
                    {rentalDays === 1 ? 'Gün' : 'Gün'}
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={rentalDays}
                    onChange={(e) => setRentalDays(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #9c6cfe 0%, #0ad2dd ${((rentalDays - 1) / 29) * 100}%, #e5e7eb ${((rentalDays - 1) / 29) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 gün</span>
                    <span>30 gün</span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {[1, 7, 14, 21, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setRentalDays(days)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all ${
                        rentalDays === days
                          ? 'bg-[#9c6cfe] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {days}g
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Banner İçerik Yükleme */}
            {selectedBanner && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Banner İçeriği</h3>
                <div className="space-y-4">
                  {/* Hedef URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef URL (Tıklanacak link)
                    </label>
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    />
                  </div>

                  {/* Görsel/Video Yükleme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Banner Görseli/Video
                    </label>
                    <div className="space-y-3">
                      {/* Dosya Yükleme */}
                      <div className="flex gap-3">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.type.startsWith('image/')) {
                                  setBannerImage(file);
                                  setBannerVideo(null);
                                } else if (file.type.startsWith('video/')) {
                                  setBannerVideo(file);
                                  setBannerImage(null);
                                }
                              }
                            }}
                            className="hidden"
                          />
                          <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#9c6cfe] transition-colors">
                            <Image className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {bannerImage ? bannerImage.name : bannerVideo ? bannerVideo.name : 'Dosya Seç'}
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* URL ile Yükleme */}
                      <div className="text-center text-sm text-gray-500">veya</div>
                      
                      <input
                        type="url"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="Görsel/Video URL'si"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Önizleme */}
                  {(bannerImage || bannerVideo || bannerUrl) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Önizleme
                      </label>
                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {bannerImage ? (
                          <img
                            src={URL.createObjectURL(bannerImage)}
                            alt="Banner önizleme"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : bannerVideo ? (
                          <video
                            src={URL.createObjectURL(bannerVideo)}
                            className="max-w-full max-h-full object-contain"
                            controls
                          />
                        ) : bannerUrl ? (
                          bannerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img
                              src={bannerUrl}
                              alt="Banner önizleme"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <video
                              src={bannerUrl}
                              className="max-w-full max-h-full object-contain"
                              controls
                            />
                          )
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maliyet Özeti */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-4 text-center">Kiralama Özeti</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kiralama Süresi:</span>
                  <span className="font-medium">{rentalDays} gün</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Günlük Ücret:</span>
                  <span className="font-medium">{DAILY_COST.toLocaleString()} kredi</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Toplam:</span>
                    <span className={`text-2xl font-bold ${totalCost > userCredits ? 'text-red-600' : 'text-green-600'}`}>
                      {totalCost.toLocaleString()} kredi
                    </span>
                  </div>
                  {totalCost > userCredits && (
                    <div className="text-center mt-2">
                      <span className="text-red-500 text-xs">
                        Yetersiz kredi! {totalCost - userCredits} kredi daha gerekli.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kiralama Sözleşmesi Onayı */}
            <div className="bg-white border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  <span>Kiralama Sözleşmesi ve Reklam Politikası'nı okudum ve kabul ediyorum. </span>
                  <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#9c6cfe] hover:underline">
                    Sözleşmeyi oku
                  </button>
                </span>
              </label>
              {!acceptTerms && (
                <p className="text-xs text-gray-500 mt-2">
                  Kumar, yasa dışı faaliyetler, dolandırıcılık, zararlı yazılım, telif ihlali ve yanıltıcı içerik reklamları kesinlikle yasaktır. İhlal halinde reklam derhal kaldırılır ve hesap kapatılır; ücret iadesi yapılmaz.
                </p>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleRentBanner}
              disabled={!selectedBanner || totalCost > userCredits || loading || !acceptTerms}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kiralanıyor...' : 'Banner Kirala'}
              </button>
            </div>
          </div>
        </div>
      </div>

    {/* Sözleşme Modalı */}
    {showTermsModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Kiralama Sözleşmesi ve Reklam Politikası</h3>
            <button onClick={() => setShowTermsModal(false)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700" style={{ maxHeight: '70vh' }}>
            <p>
              Bu platformda yayınlanan tüm reklam içerikleri yerel ve uluslararası mevzuata uygun olmalıdır. Aşağıdaki içerikler kesinlikle yasaktır: kumar ve bahis, yasa dışı madde/ürün/hizmet, dolandırıcılık ve phishing, zararlı yazılım (malware), telif ve marka ihlali, +18/çocuk istismarı, nefret söylemi ve şiddet çağrısı, yanıltıcı/aldatıcı iddialar.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>İhlal tespiti halinde reklam derhal kaldırılır ve reklamverenin hesabı süresiz olarak kapatılır.</li>
              <li>İhlal durumlarında ücret iadesi yapılmaz; doğabilecek idari/cezai yaptırımlardan reklamveren sorumludur.</li>
              <li>Hedef URL güvenli (HTTPS) olmalı, kullanıcıyı yanıltmamalı ve kötü amaçlı içerik barındırmamalıdır.</li>
              <li>Görsel/video ve metinler telif haklarına uygun olmalıdır.</li>
              <li>Teknik gerekçelerle uyumsuz bulunan içerikler, düzenleme talebiyle geri çevrilebilir.</li>
            </ul>
            <p>
              Sözleşmeyi kabul ederek bu kurallara uyacağınızı taahhüt eder, ihlal halinde uygulanacak yaptırımları peşinen kabul etmiş olursunuz.
            </p>
          </div>
          <div className="p-4 border-t flex items-center justify-end gap-2">
            <button onClick={() => setShowTermsModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Kapat</button>
            <button onClick={() => { setAcceptTerms(true); setShowTermsModal(false); }} className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg">Kabul Ediyorum</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
