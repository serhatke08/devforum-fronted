'use client';
import { useState, useEffect } from 'react';
import { X, Edit, Trash2, Calendar, ExternalLink, Image, Video, AlertCircle, CheckCircle, Monitor, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface BannerControlProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RentedBanner {
  id: string;
  banner_id: string;
  position: number;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  start_date: string;
  end_date: string;
  daily_cost: number;
  total_cost: number;
  days_left: number;
  is_active: boolean;
}

interface FeaturedForm {
  id: string;
  topic_id: string;
  start_date: string;
  end_date: string;
  daily_cost: number;
  total_cost: number;
  is_active: boolean;
  days_left: number;
  type: 'homepage' | 'subcategory';
  position?: number;
  sub_category?: {
    id: string;
    name: string;
    color: string;
  };
  topic: {
    id: string;
    title: string;
    content: string;
  };
}

export function BannerControl({ isOpen, onClose }: BannerControlProps) {
  const { user } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [banners, setBanners] = useState<RentedBanner[]>([]);
  const [featuredForms, setFeaturedForms] = useState<FeaturedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<RentedBanner | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editBannerImage, setEditBannerImage] = useState<File | null>(null);
  const [editBannerVideo, setEditBannerVideo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadRentedBanners();
      loadFeaturedForms();
    }
  }, [isOpen, user]);

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

  const loadRentedBanners = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Önce RPC fonksiyonunu dene
      const { data, error } = await supabase.rpc<any>('get_user_rented_banners', {
        p_user_id: user.id
      });

      if (error) {
        console.error('RPC fonksiyonu hatası:', error);
        
        // Fallback: Manuel sorgu - Ayrı sorgular kullan
        const { data: rentalData, error: rentalError } = await supabase
          .from('banner_rentals')
          .select(`
            id,
            banner_id,
            start_date,
            end_date,
            daily_cost,
            total_cost
          `)
          .eq('user_id', user.id)
          .eq('is_paid', true)
          .gte('end_date', new Date().toISOString().split('T')[0]);

        if (rentalError) {
          console.error('Rental verileri alınırken hata:', rentalError);
          return;
        }

        if (!rentalData || rentalData.length === 0) {
          setBanners([]);
          return;
        }

        // Banner bilgilerini ayrı olarak al
        const bannerIds = rentalData.map(rental => rental.banner_id);
        const { data: bannerData, error: bannerError } = await supabase
          .from('ad_banners')
          .select(`
            id,
            position,
            title,
            description,
            image_url,
            target_url,
            is_active
          `)
          .in('id', bannerIds);

        if (bannerError) {
          console.error('Banner verileri alınırken hata:', bannerError);
          return;
        }

        // Verileri birleştir
        const manualData = rentalData.map(rental => {
          const banner = bannerData?.find(b => b.id === rental.banner_id);
          return {
            ...rental,
            ad_banners: banner
          };
        }).filter(item => item.ad_banners); // Banner bilgisi olanları filtrele

        // Manuel veriyi formatla
        const formattedBanners = (manualData || []).map((rental: any) => ({
          id: rental.id,
          banner_id: rental.banner_id,
          position: rental.ad_banners.position,
          title: rental.ad_banners.title,
          description: rental.ad_banners.description,
          image_url: rental.ad_banners.image_url,
          target_url: rental.ad_banners.target_url,
          start_date: rental.start_date,
          end_date: rental.end_date,
          daily_cost: rental.daily_cost,
          total_cost: rental.total_cost,
          days_left: Math.max(0, Math.ceil((new Date(rental.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
          is_active: rental.ad_banners.is_active
        }));

        setBanners(formattedBanners);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Kiralanan banner\'lar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedForms = async () => {
    if (!user) return;
    
    try {
      const now = new Date().toISOString();
      const allForms: any[] = [];
      
      // Ana sayfa öne çıkan formları yükle
      const { data: homepageForms, error: homepageError } = await supabase
        .from('featured_forms')
        .select(`
          *,
          topic:topics(
            id,
            title,
            content
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (homepageError) throw homepageError;

      // Alt kategori öne çıkan formları yükle
      const { data: subcategoryForms, error: subcategoryError } = await supabase
        .from('subcategory_featured_forms')
        .select(`
          *,
          topic:topics(
            id,
            title,
            content
          ),
          sub_category:sub_categories(
            id,
            name,
            color
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (subcategoryError) throw subcategoryError;

      // Ana sayfa formlarını ekle
      if (homepageForms) {
        allForms.push(...homepageForms.map((form: any) => ({
          ...form,
          type: 'homepage' as const
        })));
      }

      // Alt kategori formlarını ekle
      if (subcategoryForms) {
        allForms.push(...subcategoryForms.map((form: any) => ({
          ...form,
          type: 'subcategory' as const
        })));
      }

      const formattedForms = allForms.map((form: any) => {
        // 24 saat sistemi - gerçek zaman hesaplaması
        const now = new Date();
        const endDate = new Date(form.end_date);
        const timeDiff = endDate.getTime() - now.getTime();
        const totalHoursLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60)));
        const daysLeft = Math.floor(totalHoursLeft / 24);
        
        return {
          id: form.id,
          topic_id: form.topic_id,
          start_date: form.start_date,
          end_date: form.end_date,
          daily_cost: form.daily_cost,
          total_cost: form.total_cost,
          is_active: form.is_active,
          days_left: daysLeft,
          type: form.type,
          position: form.position,
          sub_category: form.sub_category,
          topic: form.topic
        };
      });

      setFeaturedForms(formattedForms);
    } catch (error) {
      console.error('Öne çıkan formlar yüklenirken hata:', error);
    }
  };

  const handleEditBanner = (banner: RentedBanner) => {
    setEditingBanner(banner);
    setEditTitle(banner.title);
    setEditDescription(banner.description || '');
    setEditImageUrl(banner.image_url);
    setEditTargetUrl(banner.target_url);
    setEditBannerImage(null);
    setEditBannerVideo(null);
  };

  const handleSaveBanner = async () => {
    if (!editingBanner || !user) return;

    setSaving(true);
    try {
      // Banner içeriğini hazırla
      let finalImageUrl = editImageUrl;

      // Dosya yükleme işlemi
      if (editBannerImage) {
        try {
          const fileExt = editBannerImage.name.split('.').pop();
          const fileName = `banner-update-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, editBannerImage);
          
          if (uploadError) {
            console.error('Dosya yükleme hatası:', uploadError);
            finalImageUrl = URL.createObjectURL(editBannerImage);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Dosya yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(editBannerImage);
        }
      } else if (editBannerVideo) {
        try {
          const fileExt = editBannerVideo.name.split('.').pop();
          const fileName = `banner-video-update-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, editBannerVideo);
          
          if (uploadError) {
            console.error('Video yükleme hatası:', uploadError);
            finalImageUrl = URL.createObjectURL(editBannerVideo);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Video yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(editBannerVideo);
        }
      }

      const { error } = await supabase.rpc<any>('update_banner_content', {
        p_banner_id: editingBanner.banner_id,
        p_title: editTitle,
        p_image_url: finalImageUrl,
        p_target_url: editTargetUrl,
        p_description: editDescription
      });

      if (error) {
        console.error('Banner güncelleme hatası:', error);
        addToast({ type: 'error', title: 'Hata', message: 'Banner güncellenirken bir hata oluştu.', duration: 3000 });
        return;
      }

      addToast({ type: 'success', title: 'Başarılı', message: 'Banner başarıyla güncellendi.', duration: 3000 });
      
      // Formu temizle
      setEditingBanner(null);
      setEditTitle('');
      setEditDescription('');
      setEditImageUrl('');
      setEditTargetUrl('');
      setEditBannerImage(null);
      setEditBannerVideo(null);
      
      // Banner listesini yenile
      await loadRentedBanners();
      
      // Banner güncellemesini tüm AdBanner bileşenlerine bildir
      window.dispatchEvent(new CustomEvent('banner-updated'));
    } catch (error) {
      console.error('Banner güncelleme hatası:', error);
      addToast({ type: 'error', title: 'Hata', message: 'Banner güncellenirken bir hata oluştu.', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBanner(null);
    setEditTitle('');
    setEditDescription('');
    setEditImageUrl('');
    setEditTargetUrl('');
    setEditBannerImage(null);
    setEditBannerVideo(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

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

  const getStatusColor = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'text-red-500';
    if (diffMs <= 24 * 60 * 60 * 1000) return 'text-orange-500'; // 1 gün
    return 'text-green-500';
  };

  const getStatusIcon = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return <AlertCircle className="w-4 h-4" />;
    if (diffMs <= 24 * 60 * 60 * 1000) return <AlertCircle className="w-4 h-4" />; // 1 gün
    return <CheckCircle className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <div className="p-4 sm:p-5 md:p-6 pb-6 sm:pb-8 md:pb-10">
          <ToastContainer />
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Banner Kontrol</h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <Monitor className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Kiralanan Banner Yok</h3>
              <p className="text-sm sm:text-base text-gray-500">Henüz hiç banner kiralamamışsınız.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm text-gray-500">Pozisyon {banner.position}</span>
                        <span className="text-xs sm:text-sm text-gray-400">•</span>
                        <span className={`text-xs sm:text-sm ${getStatusColor(banner.end_date)}`}>
                          {formatTimeLeft(banner.end_date)}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{banner.title}</h3>
                    </div>
                    <button
                      onClick={() => handleEditBanner(banner)}
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Düzenle</span>
                    </button>
                  </div>

                  {/* Banner Önizleme */}
                  <div className="mb-3 sm:mb-4">
                    <div className="w-full h-28 sm:h-32 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-2 sm:p-3">
                      {banner.image_url ? (
                        banner.image_url.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                          <video
                            src={banner.image_url}
                            className="max-w-full max-h-full object-contain"
                            controls
                          />
                        ) : (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="max-w-full max-h-full object-contain"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Banner Bilgileri */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs sm:text-sm block mb-1">Hedef URL</span>
                      <a 
                        href={banner.target_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:underline truncate text-xs sm:text-sm"
                      >
                        {banner.target_url}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs sm:text-sm block mb-1">Tarih</span>
                      <p className="text-gray-900 text-xs sm:text-sm">{formatDate(banner.start_date)} - {formatDate(banner.end_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs sm:text-sm block mb-1">Günlük</span>
                      <p className="text-gray-900 text-xs sm:text-sm">{banner.daily_cost.toLocaleString()} kredi</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs sm:text-sm block mb-1">Toplam</span>
                      <p className="text-gray-900 text-xs sm:text-sm font-medium">{banner.total_cost.toLocaleString()} kredi</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Öne Çıkan Formlar Bölümü */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200 px-2 sm:px-4 pb-6 sm:pb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-5 px-2 sm:px-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Öne Çıkan Formlar</h3>
            <span className="text-xs sm:text-sm text-gray-500">{featuredForms.length}/10</span>
          </div>

          {featuredForms.length === 0 ? (
            <div className="text-center py-8 sm:py-10 bg-gray-50 rounded-lg mx-2 sm:mx-0">
              <Star className="w-12 h-12 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-500">Henüz öne çıkan formunuz yok.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
              {featuredForms.map((form) => {
                const now = new Date();
                const endDate = new Date(form.end_date);
                const timeDiff = endDate.getTime() - now.getTime();
                const totalHoursLeft = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60)));
                const daysLeft = Math.floor(totalHoursLeft / 24);
                
                return (
                  <div key={form.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors mx-0">
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 break-words mb-1.5 sm:mb-2">
                          {form.topic.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                          <span>{form.type === 'subcategory' ? 'Alt Kategori' : 'Ana Sayfa'}</span>
                          {form.type === 'subcategory' && form.sub_category && (
                            <>
                              <span>•</span>
                              <span>{form.sub_category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded flex-shrink-0 ${
                        daysLeft > 7 
                          ? 'bg-green-50 text-green-700' 
                          : daysLeft > 3 
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {totalHoursLeft > 0 ? `${daysLeft}g` : 'Bitti'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="break-words">
                        <span className="text-gray-500">Tarih:</span> {formatDate(form.start_date)} - {formatDate(form.end_date)}
                      </div>
                      <div className="text-right break-words">
                        <span className="text-gray-500">Toplam:</span> {form.total_cost.toLocaleString()} kredi
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Banner Düzenleme Modalı */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Banner Düzenle</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Başlığı
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="Banner başlığı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    rows={3}
                    placeholder="Banner açıklaması"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görsel/Video
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
                                setEditBannerImage(file);
                                setEditBannerVideo(null);
                                setEditImageUrl(''); // URL'yi temizle
                              } else if (file.type.startsWith('video/')) {
                                setEditBannerVideo(file);
                                setEditBannerImage(null);
                                setEditImageUrl(''); // URL'yi temizle
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#9c6cfe] transition-colors">
                          <Image className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {editBannerImage ? editBannerImage.name : editBannerVideo ? editBannerVideo.name : 'Dosya Seç'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* URL ile Yükleme */}
                    <div className="text-center text-sm text-gray-500">veya</div>
                    
                    <input
                      type="url"
                      value={editImageUrl}
                      onChange={(e) => {
                        setEditImageUrl(e.target.value);
                        // URL girildiğinde dosya seçimini temizle
                        if (e.target.value) {
                          setEditBannerImage(null);
                          setEditBannerVideo(null);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                      placeholder="Görsel/Video URL'si"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef URL
                  </label>
                  <input
                    type="url"
                    value={editTargetUrl}
                    onChange={(e) => setEditTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Önizleme */}
                {(editBannerImage || editBannerVideo || editImageUrl) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Önizleme
                    </label>
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {editBannerImage ? (
                        <img
                          src={URL.createObjectURL(editBannerImage)}
                          alt="Banner önizleme"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : editBannerVideo ? (
                        <video
                          src={URL.createObjectURL(editBannerVideo)}
                          className="max-w-full max-h-full object-contain"
                          controls
                        />
                      ) : editImageUrl ? (
                        editImageUrl.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                          <video
                            src={editImageUrl}
                            className="max-w-full max-h-full object-contain"
                            controls
                          />
                        ) : (
                          <img
                            src={editImageUrl}
                            alt="Banner önizleme"
                            className="max-w-full max-h-full object-contain"
                          />
                        )
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveBanner}
                  disabled={saving || !editTitle.trim() || (!editImageUrl.trim() && !editBannerImage && !editBannerVideo) || !editTargetUrl.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
