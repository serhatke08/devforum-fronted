'use client';

import { useState, useEffect } from 'react';
import { Edit, ExternalLink, Calendar, CreditCard, X, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MyBanner {
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
  is_active: boolean;
}

interface MyBannersProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyBanners({ isOpen, onClose }: MyBannersProps) {
  const { user } = useAuth();
  const [banners, setBanners] = useState<MyBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MyBanner | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Güncelleme formu state'leri
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateImageUrl, setUpdateImageUrl] = useState('');
  const [updateTargetUrl, setUpdateTargetUrl] = useState('');
  const [updateBannerImage, setUpdateBannerImage] = useState<File | null>(null);
  const [updateBannerVideo, setUpdateBannerVideo] = useState<File | null>(null);

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
    if (isOpen && user) {
      loadMyBanners();
    }
  }, [isOpen, user]);

  const loadMyBanners = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc<any>('get_user_rented_banners', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Banner yükleme hatası:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Banner yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBanner = (banner: MyBanner) => {
    setEditingBanner(banner);
    setUpdateTitle(banner.title);
    setUpdateDescription(banner.description || '');
    setUpdateImageUrl(banner.image_url);
    setUpdateTargetUrl(banner.target_url);
    setUpdateBannerImage(null);
    setUpdateBannerVideo(null);
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner || !user) return;

    setUpdateLoading(true);
    try {
      // Banner içeriğini hazırla
      let finalImageUrl = updateImageUrl;
      let finalTitle = updateTitle;

      if (updateBannerImage) {
        // Dosya yükleme işlemi - Supabase Storage kullan
        try {
          const fileExt = updateBannerImage.name.split('.').pop();
          const fileName = `banner-update-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, updateBannerImage);
          
          if (uploadError) {
            console.error('Dosya yükleme hatası:', uploadError);
            finalImageUrl = URL.createObjectURL(updateBannerImage);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Dosya yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(updateBannerImage);
        }
      } else if (updateBannerVideo) {
        // Video dosyası için - Supabase Storage kullan
        try {
          const fileExt = updateBannerVideo.name.split('.').pop();
          const fileName = `banner-video-update-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, updateBannerVideo);
          
          if (uploadError) {
            console.error('Video yükleme hatası:', uploadError);
            finalImageUrl = URL.createObjectURL(updateBannerVideo);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('banners')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Video yükleme hatası:', error);
          finalImageUrl = URL.createObjectURL(updateBannerVideo);
        }
      }

      // Banner güncelleme fonksiyonunu çağır
      const { error } = await supabase.rpc<any>('update_banner_content', {
        p_banner_id: editingBanner.banner_id,
        p_title: finalTitle,
        p_image_url: finalImageUrl,
        p_target_url: updateTargetUrl,
        p_description: updateDescription
      });

      if (error) {
        console.error('Banner güncelleme hatası:', error);
        alert('Banner güncellenirken bir hata oluştu');
        return;
      }

      alert('Banner başarıyla güncellendi!');
      
      // Formu temizle
      setEditingBanner(null);
      setUpdateTitle('');
      setUpdateDescription('');
      setUpdateImageUrl('');
      setUpdateTargetUrl('');
      setUpdateBannerImage(null);
      setUpdateBannerVideo(null);
      
      // Banner listesini yenile
      await loadMyBanners();
    } catch (error) {
      console.error('Banner güncelleme hatası:', error);
      alert('Banner güncellenirken bir hata oluştu');
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Kiraladığım Banner'lar</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
              <span className="ml-3 text-gray-600">Yükleniyor...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz banner kiralanmamış</h3>
              <p className="text-gray-500">Banner kiralayarak reklamınızı yayınlayabilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-[#9c6cfe] text-white text-xs font-medium rounded">
                          Pozisyon {banner.position}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          banner.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {banner.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {formatTimeLeft(banner.end_date)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{banner.title}</h3>
                      
                      {banner.description && (
                        <p className="text-gray-600 text-sm mb-3">{banner.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(banner.start_date)} - {formatDate(banner.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          <span>{banner.total_cost.toLocaleString()} kredi</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <a
                          href={banner.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#9c6cfe] hover:text-[#7c3aed] text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Hedef URL'yi Aç
                        </a>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {banner.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <Video className="w-6 h-6 text-gray-400" />
                        ) : (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditBanner(banner)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#9c6cfe] text-white text-sm font-medium rounded-lg hover:bg-[#7c3aed] transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Banner'ı Güncelle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Banner Güncelleme Modal'ı */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Banner Güncelle</h3>
                <button
                  onClick={() => setEditingBanner(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Banner Başlığı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Başlığı
                  </label>
                  <input
                    type="text"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="Banner başlığı girin"
                  />
                </div>

                {/* Banner Açıklaması */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Açıklaması (Opsiyonel)
                  </label>
                  <textarea
                    value={updateDescription}
                    onChange={(e) => setUpdateDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="Banner açıklaması girin"
                  />
                </div>

                {/* Hedef URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef URL
                  </label>
                  <input
                    type="url"
                    value={updateTargetUrl}
                    onChange={(e) => setUpdateTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Banner Görseli/Video */}
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
                                setUpdateBannerImage(file);
                                setUpdateBannerVideo(null);
                              } else if (file.type.startsWith('video/')) {
                                setUpdateBannerVideo(file);
                                setUpdateBannerImage(null);
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#9c6cfe] transition-colors">
                          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {updateBannerImage ? updateBannerImage.name : updateBannerVideo ? updateBannerVideo.name : 'Dosya Seç'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* URL ile Yükleme */}
                    <div className="text-center text-sm text-gray-500">veya</div>
                    
                    <input
                      type="url"
                      value={updateImageUrl}
                      onChange={(e) => setUpdateImageUrl(e.target.value)}
                      placeholder="Görsel/Video URL'si"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Önizleme */}
                {(updateBannerImage || updateBannerVideo || updateImageUrl) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Önizleme
                    </label>
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {updateBannerImage ? (
                        <img
                          src={URL.createObjectURL(updateBannerImage)}
                          alt="Banner önizleme"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : updateBannerVideo ? (
                        <video
                          src={URL.createObjectURL(updateBannerVideo)}
                          className="max-w-full max-h-full object-contain"
                          controls
                        />
                      ) : updateImageUrl ? (
                        updateImageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={updateImageUrl}
                            alt="Banner önizleme"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <video
                            src={updateImageUrl}
                            className="max-w-full max-h-full object-contain"
                            controls
                          />
                        )
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Butonlar */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingBanner(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleUpdateBanner}
                    disabled={updateLoading || !updateTitle.trim() || !updateTargetUrl.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateLoading ? 'Güncelleniyor...' : 'Banner\'ı Güncelle'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
