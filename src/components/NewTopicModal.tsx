'use client';

import { X, Upload, Trash2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { AITopicHelper } from './AITopicHelper';

type MainCategory = Database['public']['Tables']['main_categories']['Row'];
type SubCategory = Database['public']['Tables']['sub_categories']['Row'];

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: () => void;
}

export function NewTopicModal({ isOpen, onClose, onTopicCreated }: NewTopicModalProps) {
  const { user } = useAuth();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMainCategories();
      loadAllSubCategories();
      // Sadece modal ilk açıldığında formu sıfırla
      if (title === '' && content === '') {
        resetForm();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    }
  }, [selectedMainCategory]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setImageUrls([]);
    setSelectedMainCategory('');
    setSelectedSubCategory('');
    setError('');
    setIsUrgent(false);
  };

  const loadMainCategories = async () => {
    const { data } = await supabase
      .from('main_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (data) {
      setMainCategories(data);
    }
  };

  const loadAllSubCategories = async () => {
    const { data } = await supabase
      .from('sub_categories')
      .select('*')
      .order('order_index', { ascending: true });
    if (data) {
      setAllSubCategories(data as SubCategory[]);
    }
  };

  const loadSubCategories = async (mainCategoryId: string) => {
    const { data } = await supabase
      .from('sub_categories')
      .select('*')
      .eq('main_category_id', mainCategoryId)
      .order('order_index', { ascending: true });

    if (data) {
      setSubCategories(data as SubCategory[]);
      if (data.length > 0) {
        setSelectedSubCategory((data[0] as SubCategory).id);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 2) {
      setError('En fazla 2 görsel yükleyebilirsiniz');
      return;
    }
    setImages([...images, ...files]);
    
    // Preview için URL oluştur
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setImageUrls(prev => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImageUrls(newUrls);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('topic-images')
        .upload(filePath, image);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('topic-images')
        .getPublicUrl(filePath);
      
      uploadedUrls.push(data.publicUrl);
    }
    
    return uploadedUrls;
  };

  const ensureProfileExists = async () => {
    if (!user) return;

    // Profil var mı kontrol et
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // Eğer profil yoksa oluştur
    if (!existingProfile) {
      const username = user.user_metadata?.username || user.user_metadata?.display_name || `user_${user.id.substring(0, 8)}`;
      const displayName = user.user_metadata?.display_name || user.user_metadata?.username || username;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username.toLowerCase().trim(),
          display_name: displayName,
          reputation: 0,
          total_posts: 0,
          total_comments: 0,
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profil oluşturma hatası:', profileError);
        // Hata olsa bile devam et, belki başka bir yerde oluşturulmuştur
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSubCategory) return;

    setError('');
    setLoading(true);

    try {
      // Önce profil kontrolü yap ve yoksa oluştur
      await ensureProfileExists();

      const urgentPrefix = isUrgent && !title.trim().startsWith('🚨') ? '🚨 ' : '';
      const finalTitle = `${urgentPrefix}${title}`.trim();

      const slug = finalTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Görselleri yükle
      const uploadedImageUrls = await uploadImages();

      const topicData = {
        title: finalTitle,
        content,
        sub_category_id: selectedSubCategory,
        author_id: user.id,
        slug: `${slug}-${Date.now()}`,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      };

      const { error: insertError } = await (supabase as any)
        .from('topics')
        .insert(topicData);

      if (insertError) throw insertError;


      onTopicCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAIApply = (_aiTitle: string, _aiContent: string, categoryId: string) => {
    // IA artık sadece sınıflandırma yapıyor: başlık/içerik dokunma, sadece kategori ata
    setSelectedSubCategory(categoryId);
    
    // Ana kategoriyi bul
    const subCat = subCategories.find(sub => sub.id === categoryId);
    if (subCat) {
      setSelectedMainCategory(subCat.main_category_id);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AITopicHelper
        isOpen={showAIHelper}
        onClose={() => {
          setShowAIHelper(false);
        }}
        onApply={handleAIApply}
        categories={mainCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          sub_categories: (allSubCategories.length > 0 ? allSubCategories : subCategories).filter(sub => sub.main_category_id === cat.id)
        }))}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Yeni Konu Oluştur</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAIHelper(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Yardım</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Yatay Tasarım: Kategori seçimi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ana Kategori</label>
                <select
                  value={selectedMainCategory}
                  onChange={(e) => setSelectedMainCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent text-sm"
                  required
                >
                  <option value="">Seçiniz</option>
                  {mainCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Kategori</label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent text-sm"
                  required
                  disabled={!selectedMainCategory}
                >
                  <option value="">Seçiniz</option>
                  {subCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Konunuzun başlığını yazın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent text-sm"
                required
              />
            </div>

            {/* İçerik ve Acil Cevap */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İçerik <span className="text-gray-400 text-xs">(İsteğe bağlı)</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Konunuzun detaylarını yazın..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none text-sm"
                />
              </div>
              
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="h-4 w-4 text-[#9c6cfe] border-gray-300 rounded focus:ring-[#9c6cfe]"
                />
                <span>🚨 Acil Cevap olarak işaretle</span>
              </label>
            </div>

            {/* Görseller - Kompakt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görseller <span className="text-gray-400 text-xs">(Maks. 2)</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-[#9c6cfe] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={images.length >= 2}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-600">
                      {images.length >= 2 ? 'Maks. 2 görsel' : 'Yükle'}
                    </span>
                  </label>
                </div>

                {imageUrls.length > 0 && imageUrls.map((url, index) => (
                  <div key={index} className="relative group w-20 h-20">
                    <img src={url} alt={`${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !selectedSubCategory}
                className="flex-1 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Oluşturuluyor...' : 'Konu Oluştur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

