'use client';
import { X, CreditCard, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// PayTR iframeResizer için global type tanımı
declare global {
  interface Window {
    iFrameResize?: (options: any, selector: string) => void;
  }
}

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credit_amount: number;
  price_cents: number | null;
  is_active: boolean;
  is_featured: boolean;
  bonus_credits: number;
  order_index: number;
}

interface CreditPurchaseProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreditPurchase({ isOpen, onClose }: CreditPurchaseProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showProcessingMessage, setShowProcessingMessage] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  // PayTR iframeResizer script'ini yükle - PayTR V2 dokümantasyonuna göre
  useEffect(() => {
    if (iframeUrl && !window.iFrameResize) {
      const script = document.createElement('script');
      // PayTR iFrame V2 için güncel script
      script.src = 'https://www.paytr.com/js/iframeResizer.min.js?v2';
      script.async = true;
      
      // Script yükleme hatalarını yakala
      script.onerror = (error) => {
        console.log('ℹ️ iframeResizer script yükleme hatası (normal olabilir):', error);
        // Hata olsa bile devam et, iframe çalışabilir
      };
      
      script.onload = () => {
        console.log('✅ iframeResizer script yüklendi');
      };
      
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [iframeUrl]);

  // Global promise rejection handler - PayTR iframe içindeki hataları yakala
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // PayTR iframe içindeki promise rejection'ları filtrele
      if (event.reason) {
        const reason = event.reason?.toString() || '';
        const reasonStr = String(reason);
        
        // PayTR iframe içindeki hataları sessizce yakala
        if (reasonStr.includes('paytr') || 
            reasonStr.includes('iframe') || 
            reasonStr.includes('index-') ||
            reasonStr.includes('Promise.then') ||
            reasonStr.includes('cc91bd4')) {
          // Bu hatalar PayTR iframe içinden geliyor, normal olabilir
          event.preventDefault(); // Console'da görünmesin
          return;
        }
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Iframe yüklendiğinde resize'ı tetikle - PayTR dokümantasyonuna göre
  useEffect(() => {
    if (iframeUrl && window.iFrameResize) {
      // Kısa bir gecikme ile resize'ı tetikle
      const timer = setTimeout(() => {
        try {
          window.iFrameResize!({}, '#paytriframe');
        } catch (error) {
          console.error('PayTR iframeResize hatası:', error);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [iframeUrl]);

  // Ödeme başarılı olduğunda
  const handlePaymentSuccess = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setPaymentStatus('success');
    
    // Kullanıcıyı bilgilendir
    setTimeout(() => {
      alert('Ödemeniz başarıyla tamamlandı! Kredileriniz hesabınıza yüklendi.');
      window.location.reload();
    }, 1000);
  }, []);

  // Ödeme başarısız olduğunda
  const handlePaymentFailed = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setPaymentError('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
    setPaymentStatus('failed');
  }, []);

  // PayTR iframe'den gelen postMessage mesajlarını dinle
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // PayTR'den veya devforum'dan gelen mesajları kabul et
      const isPayTR = event.origin.includes('paytr.com') || event.origin.includes('www.paytr.com');
      const isDevForum = event.origin.includes('devforum') || event.origin.includes('localhost') || event.origin.includes('127.0.0.1');
      
      if (!isPayTR && !isDevForum) {
        return;
      }

      // iframeResizer mesajlarını filtrele (bunlar normal, işlem yapma)
      if (event.data && typeof event.data === 'object') {
        // iframeResizer mesajları: shrink_iframe, setHeight, resize vb.
        if (event.data.type === 'setHeight' || 
            event.data.type === 'shrink_iframe' || 
            event.data.type === 'resize' ||
            event.data.message === 'shrink_iframe' ||
            event.data.message === 'setHeight') {
          // Bu mesajlar iframeResizer'dan geliyor, normal mesajlar - işlem yapma
          return;
        }
      }

      // Önemli mesajları logla (debug için)
      console.log('📨 PayTR/DevForum mesajı alındı:', event.data);

      // Hata mesajlarını kontrol et (kapalı kart, geçersiz kart vb.)
      if (event.data && typeof event.data === 'object') {
        // Kart hataları
        if (event.data.error || event.data.reason) {
          const errorMsg = event.data.error || event.data.reason || '';
          const lowerError = errorMsg.toLowerCase();
          
          // Kapalı kart, geçersiz kart, yetersiz bakiye gibi hatalar
          if (lowerError.includes('kart') || 
              lowerError.includes('card') || 
              lowerError.includes('geçersiz') || 
              lowerError.includes('invalid') ||
              lowerError.includes('kapalı') ||
              lowerError.includes('closed') ||
              lowerError.includes('bakiye') ||
              lowerError.includes('balance') ||
              lowerError.includes('yetersiz') ||
              lowerError.includes('insufficient')) {
            console.log('❌ Kart hatası tespit edildi:', errorMsg);
            setPaymentError(errorMsg || 'Kart bilgileri geçersiz veya kart kullanılamıyor. Lütfen farklı bir kart deneyin.');
            setPaymentStatus('failed');
            setShowProcessingMessage(false);
            return;
          }
        }

        // Başarı mesajları
        if (event.data.type === 'payment_success' || 
            event.data.status === 'success' || 
            event.data.success === true ||
            event.data.message === 'Ödeme başarıyla tamamlandı') {
          console.log('✅ Ödeme başarılı (postMessage - object)');
          setShowProcessingMessage(false);
          handlePaymentSuccess();
          return;
        } 
        
        // Başarısızlık mesajları
        if (event.data.type === 'payment_failed' || 
            event.data.status === 'failed' || 
            event.data.failed === true ||
            event.data.message === 'Ödeme başarısız oldu') {
          console.log('❌ Ödeme başarısız (postMessage - object)');
          setShowProcessingMessage(false);
          handlePaymentFailed();
          return;
        }
      }

      // String mesajları da kontrol et
      if (typeof event.data === 'string') {
        const lowerData = event.data.toLowerCase();
        
        // Hata mesajları
        if (lowerData.includes('kart') || 
            lowerData.includes('card') || 
            lowerData.includes('geçersiz') || 
            lowerData.includes('invalid') ||
            lowerData.includes('kapalı') ||
            lowerData.includes('closed')) {
          setPaymentError('Kart bilgileri geçersiz veya kart kullanılamıyor. Lütfen farklı bir kart deneyin.');
          setPaymentStatus('failed');
          setShowProcessingMessage(false);
          return;
        }
        
        // Başarı mesajları
        if (lowerData.includes('success') || 
            lowerData.includes('başarılı') || 
            lowerData.includes('odeme_basarili') ||
            lowerData.includes('payment_success')) {
          console.log('✅ Ödeme başarılı (postMessage - string)');
          setShowProcessingMessage(false);
          handlePaymentSuccess();
          return;
        } 
        
        // Başarısızlık mesajları
        if (lowerData.includes('fail') || 
            lowerData.includes('başarısız') || 
            lowerData.includes('odeme_hata') ||
            lowerData.includes('payment_failed')) {
          console.log('❌ Ödeme başarısız (postMessage - string)');
          setShowProcessingMessage(false);
          handlePaymentFailed();
          return;
        }
      }
    };

    window.addEventListener('message', handleMessage, false);

    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  }, [handlePaymentSuccess, handlePaymentFailed]);

  // Ödeme durumunu kontrol etmek için polling mekanizması
  useEffect(() => {
    if (showPayment && iframeUrl && selectedPackage && paymentStatus === 'processing') {
      // Merchant OID'yi al
      const merchantOidMatch = iframeUrl.match(/merchant_oid=([^&]+)/);
      const merchantOid = merchantOidMatch 
        ? merchantOidMatch[1] 
        : localStorage.getItem('last_merchant_oid');

      if (merchantOid) {
        // Her 5 saniyede bir ödeme durumunu kontrol et
        const interval = setInterval(async () => {
          try {
            const isDevelopment = typeof window !== "undefined" && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
            const apiBaseUrl = isDevelopment 
              ? `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '192.168.0.6' : window.location.hostname}:3001`
              : 'https://devforum-backend-102j.onrender.com';

            // Backend'den ödeme durumunu kontrol et
            const response = await fetch(`${apiBaseUrl}/api/paytr/check-payment-status?merchant_oid=${merchantOid}`);
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'success') {
                console.log('✅ Ödeme başarılı (polling)');
                handlePaymentSuccess();
              } else if (data.status === 'failed') {
                console.log('❌ Ödeme başarısız (polling)');
                handlePaymentFailed();
              }
            }
          } catch (error) {
            console.error('Ödeme durumu kontrol hatası:', error);
          }
        }, 5000);

        pollingIntervalRef.current = interval;

        return () => {
          if (interval) {
            clearInterval(interval);
          }
        };
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [showPayment, iframeUrl, selectedPackage, paymentStatus, handlePaymentSuccess, handlePaymentFailed]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Kredi paketleri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      alert('Ödeme yapmak için giriş yapmalısınız');
      return;
    }

    setSelectedPackage(pkg);
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      // Benzersiz sipariş numarası oluştur
      const merchant_oid = `CREDIT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // Merchant OID'yi kullanıcı ID'si ile birlikte localStorage'a kaydet
      localStorage.setItem(`merchant_oid_${merchant_oid}`, user.id || '');
      
      // PayTR API'sine istek gönder
      const requestBody = {
        email: user.email || 'team@devforum.xyz',
        user_id: user.id || '',
        payment_amount: Math.max(pkg.price_cents || 100, 100),
        merchant_oid: merchant_oid,
        user_name: user.user_metadata?.full_name || 'Test User',
        user_address: 'Test Address',
        user_phone: '05383833441',
        user_basket: btoa(unescape(encodeURIComponent(JSON.stringify([
          [pkg.name || 'Kredi Paketi', (Math.max(pkg.price_cents || 100, 100) / 100).toString(), 1]
        ])))),
        user_ip: ''
      };
      
      // API base URL
      const isDevelopment = typeof window !== "undefined" && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
      const apiBaseUrl = isDevelopment 
        ? `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '192.168.0.6' : window.location.hostname}:3001`
        : 'https://devforum-backend-102j.onrender.com';
      
      const response = await fetch(`${apiBaseUrl}/api/paytr/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Sunucu hatası' }));
        throw new Error(errorData.error || 'Ödeme başlatılamadı');
      }

      const result = await response.json();

      if (result.success && result.iframe_url) {
        setIframeUrl(result.iframe_url);
        setShowPayment(true);
        setPaymentLoading(false);
        setPaymentStatus('processing');
        setIframeLoaded(false);
        setShowProcessingMessage(true); // Iframe yüklenene kadar göster
        
        // Merchant OID'yi localStorage'a kaydet (polling için)
        localStorage.setItem('last_merchant_oid', merchant_oid);
        
        // 5 saniye sonra iframe hala yüklenmediyse mesajı kaldır
        setTimeout(() => {
          setShowProcessingMessage((prev) => {
            // Eğer hala gösteriliyorsa kaldır (iframe yüklenmemiş demektir)
            return false;
          });
        }, 5000);
      } else {
        setPaymentError(result.error || 'Ödeme başlatılamadı');
        setPaymentLoading(false);
        setPaymentStatus('failed');
        setShowProcessingMessage(false);
      }

    } catch (error) {
      console.error('Ödeme hatası:', error);
      setPaymentError('Ödeme işlemi sırasında bir hata oluştu');
      setPaymentLoading(false);
    }
  };

  const handleClose = () => {
    // Polling'i durdur
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setShowPayment(false);
    setSelectedPackage(null);
    setPaymentLoading(false);
    setPaymentError(null);
    setIframeUrl(null);
    setPaymentStatus('pending');
    setIframeLoaded(false);
    setShowProcessingMessage(false);
    localStorage.removeItem('last_merchant_oid');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${showPayment ? 'max-w-4xl max-h-[95vh]' : 'max-w-3xl max-h-[90vh]'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Kredi Yükleme</span>
            <span className="sm:hidden">Kredi</span>
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5">
            {showPayment ? (
              <div className="py-4 sm:py-6">
                <div className="text-center mb-4 sm:mb-5">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1.5">
                    Güvenli Ödeme
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    <strong className="text-[#9c6cfe]">{selectedPackage?.name}</strong> paketi için ödeme yapın
                  </p>
                </div>
              
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 font-medium text-sm sm:text-base">Hata:</span>
                    </div>
                    <p className="text-red-600 mt-1 text-sm sm:text-base">{paymentError}</p>
                    <button
                      onClick={() => setPaymentError(null)}
                      className="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm sm:text-base"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                )}
                
                {paymentLoading ? (
                  <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto mb-3 sm:mb-4 text-[#9c6cfe]" />
                      <p className="text-gray-600 font-medium text-sm sm:text-base">Ödeme sistemi hazırlanıyor...</p>
                    </div>
                  </div>
                ) : iframeUrl ? (
                  <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-200" style={{ minHeight: '700px' }}>
                    {/* Ödeme durumu göstergesi - Sadece gerçekten bekleme durumunda göster */}
                    {showProcessingMessage && !iframeLoaded && (
                      <div className="bg-blue-50 border-b border-blue-200 p-3 text-center">
                        <p className="text-blue-700 text-sm font-medium">
                          ⏳ Ödeme sistemi hazırlanıyor... Lütfen bekleyin.
                        </p>
                      </div>
                    )}
                    {paymentStatus === 'success' && (
                      <div className="bg-green-50 border-b border-green-200 p-3 text-center">
                        <p className="text-green-700 text-sm font-medium">
                          ✅ Ödeme başarıyla tamamlandı! Yönlendiriliyorsunuz...
                        </p>
                      </div>
                    )}
                    {paymentStatus === 'failed' && paymentError && (
                      <div className="bg-red-50 border-b border-red-200 p-3 text-center">
                        <p className="text-red-700 text-sm font-medium">
                          ❌ {paymentError}
                        </p>
                      </div>
                    )}
                    
                    {/* PayTR dokümantasyonuna göre basit iframe yapısı */}
                    <iframe
                      id="paytriframe"
                      src={iframeUrl}
                      frameBorder="0"
                      scrolling="no"
                      style={{ 
                        width: '100%', 
                        border: 'none', 
                        minHeight: '700px',
                        display: 'block'
                      }}
                      title="PayTR Ödeme Sayfası"
                      allow="payment *; autoplay; camera; microphone; geolocation; encrypted-media; fullscreen; picture-in-picture"
                      allowFullScreen
                      onLoad={() => {
                        console.log('✅ PayTR iframe yüklendi');
                        setIframeLoaded(true);
                        setShowProcessingMessage(false); // Iframe yüklendi, mesajı kaldır
                        setPaymentStatus('processing');
                        
                        // PayTR dokümantasyonuna göre: iframe yüklendiğinde resize çağır
                        if (window.iFrameResize) {
                          setTimeout(() => {
                            try {
                              window.iFrameResize!({}, '#paytriframe');
                              console.log('✅ PayTR iframe resize edildi');
                            } catch (error) {
                              // Hata olsa bile devam et
                              console.log('ℹ️ PayTR iframeResize hatası (normal olabilir):', error);
                            }
                          }, 500);
                        } else {
                          // Script henüz yüklenmediyse tekrar dene
                          setTimeout(() => {
                            if (window.iFrameResize) {
                              try {
                                window.iFrameResize!({}, '#paytriframe');
                                console.log('✅ PayTR iframe resize edildi (geç yükleme)');
                              } catch (error) {
                                // Hata olsa bile devam et
                                console.log('ℹ️ PayTR iframeResize hatası (normal olabilir):', error);
                              }
                            }
                          }, 2000);
                        }
                        
                        // Iframe içindeki URL değişikliklerini yakala
                        const iframe = document.getElementById('paytriframe') as HTMLIFrameElement;
                        if (iframe) {
                          const checkIframeUrl = () => {
                            try {
                              const currentSrc = iframe.src;
                              console.log('🔍 Iframe URL kontrol:', currentSrc);
                              
                              // Success veya fail URL'lerini kontrol et
                              if (currentSrc.includes('/success') || currentSrc.includes('odeme_basarili') || currentSrc.includes('merchant_ok_url')) {
                                console.log('✅ Success sayfası tespit edildi!');
                                setShowProcessingMessage(false);
                                handlePaymentSuccess();
                              } else if (currentSrc.includes('/fail') || currentSrc.includes('odeme_hata') || currentSrc.includes('merchant_fail_url')) {
                                console.log('❌ Fail sayfası tespit edildi!');
                                setShowProcessingMessage(false);
                                handlePaymentFailed();
                              }
                            } catch (error) {
                              // Cross-origin hatası beklenen bir durum
                            }
                          };

                          checkIframeUrl();
                        }
                      }}
                      onError={(e) => {
                        console.error('❌ PayTR iframe yükleme hatası:', e);
                        setPaymentError('Ödeme sayfası yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                        setPaymentStatus('failed');
                        setShowProcessingMessage(false);
                        setIframeLoaded(false);
                      }}
                    />
                  </div>
                ) : null}
                
                <div className="mt-4 sm:mt-5 text-center">
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setIframeUrl(null);
                      setPaymentLoading(false);
                      setPaymentError(null);
                    }}
                    className="px-5 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base font-medium"
                  >
                    Geri Dön
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Bilgi Kartı */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-0.5 text-xs sm:text-sm">Kredi Sistemi</h3>
                      <p className="text-blue-700 text-xs">
                        PayTR ile güvenli ödeme yapabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10 sm:py-12">
                    <div className="animate-spin rounded-full h-7 w-7 sm:h-8 sm:w-8 border-b-2 border-[#9c6cfe]"></div>
                    <span className="ml-3 text-gray-600 text-sm sm:text-base">Kredi paketleri yükleniyor...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`relative border-2 rounded-lg p-3 sm:p-4 transition-all hover:shadow-lg ${
                          pkg.is_featured
                            ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50'
                            : 'border-gray-200 bg-white hover:border-[#9c6cfe]'
                        }`}
                      >
                        {pkg.is_featured && (
                          <div className="absolute -top-1.5 sm:-top-2 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-semibold">
                              Öne Çıkan
                            </span>
                          </div>
                        )}

                        <div className="text-center">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-xs text-gray-600 mb-1.5 sm:mb-2 line-clamp-2">{pkg.description}</p>
                          )}

                          <div className="mb-2 sm:mb-3">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-0.5">
                              {pkg.credit_amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">kredi</div>
                          </div>

                          <button
                            onClick={() => handlePurchase(pkg)}
                            className={`w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                              pkg.is_featured
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg'
                                : 'bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white hover:shadow-lg'
                            }`}
                          >
                            {pkg.price_cents ? `₺${(pkg.price_cents / 100).toFixed(2)}` : 'Ücretsiz'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Alt Bilgi */}
                <div className="mt-3 sm:mt-4 text-center text-xs text-gray-500">
                  <p>
                    PayTR ile güvenli ödeme yapabilirsiniz.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
