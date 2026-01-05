'use client';

import { useState, useEffect } from 'react';
import { X, Star, Calendar, CreditCard, AlertCircle, Target, Home, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeaturedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userCredits: number;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  author: {
    display_name: string;
    username: string;
  };
  sub_category: {
    id: string;
    name: string;
    color: string;
    main_category: {
      name: string;
    };
  };
  created_at: string;
}

interface SubCategory {
  id: string;
  name: string;
  color: string;
  main_category: {
    id: string;
    name: string;
  };
}

interface MainCategory {
  id: string;
  name: string;
  color: string;
}

interface PositionStatus {
  is_rented: boolean;
  rental_end_date: string;
  renter_username: string;
  topic_title: string;
}

export function FeaturedModal({ isOpen, onClose, onSuccess, userCredits }: FeaturedModalProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [rentalDays, setRentalDays] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [featuredType, setFeaturedType] = useState<'homepage' | 'subcategory'>('homepage');
  const [positionStatuses, setPositionStatuses] = useState<PositionStatus[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUserTopics();
      loadMainCategories();
    }
  }, [isOpen]);

  // Ana kategori değiştiğinde alt kategorileri yükle
  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories();
      setSelectedSubCategory(null); // Alt kategori seçimini sıfırla
      setSelectedTopic(null); // Form seçimini sıfırla
    }
  }, [selectedMainCategory]);

  // Alt kategori değiştiğinde pozisyon durumlarını yükle
  useEffect(() => {
    if (selectedSubCategory) {
      loadPositionStatuses();
    }
  }, [selectedSubCategory]);

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

  const loadUserTopics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Kullanıcı:', user);
      
      if (!user) {
        console.log('❌ Kullanıcı bulunamadı');
        return;
      }

      console.log('📝 Konular yükleniyor...', user.id);

      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          author:profiles!topics_author_id_fkey(display_name, username, avatar_url, reputation),
          sub_category:sub_categories(
            id,
            name,
            color,
            main_category:main_categories(name)
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📊 Sorgu sonucu:', { data, error });

      if (error) {
        console.error('❌ Veritabanı hatası:', error);
        throw error;
      }
      
      console.log('✅ Yüklenen konular:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.log('ℹ️ Kullanıcının hiç konusu yok');
        // Alternatif sorgu - basit versiyon
        const { data: simpleData, error: simpleError } = await supabase
          .from('topics')
          .select('id, title, content, created_at')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
        
        console.log('🔄 Basit sorgu sonucu:', { simpleData, simpleError });
        setTopics(simpleData || []);
      } else {
        setTopics(data);
      }
    } catch (error) {
      console.error('❌ Konular yüklenirken hata:', error);
      alert('Formlar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Seçilen alt kategoriye göre formları filtrele
  const getFilteredTopics = () => {
    if (!selectedSubCategory) return topics;
    return topics.filter(topic => topic.sub_category.id === selectedSubCategory);
  };

  const loadMainCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('main_categories')
        .select(`
          id,
          name,
          color
        `)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('❌ Ana kategoriler yüklenirken hata:', error);
        return;
      }

      setMainCategories(data || []);
    } catch (error) {
      console.error('❌ Ana kategoriler yüklenirken hata:', error);
    }
  };

  const loadSubCategories = async () => {
    if (!selectedMainCategory) return;

    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select(`
          id,
          name,
          color,
          main_category:main_categories(id, name)
        `)
        .eq('main_category_id', selectedMainCategory)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Alt kategoriler yüklenirken hata:', error);
        return;
      }

      setSubCategories(data || []);
    } catch (error) {
      console.error('❌ Alt kategoriler yüklenirken hata:', error);
    }
  };

  const loadPositionStatuses = async () => {
    if (!selectedSubCategory) return;

    setLoadingPositions(true);
    try {
      const positions = [1, 2, 3, 4, 5];
      const statusPromises = positions.map(position => 
        supabase.rpc<any>('get_subcategory_featured_position_status', {
          p_sub_category_id: selectedSubCategory,
          p_position: position
        })
      );

      const results = await Promise.all(statusPromises);
      const statuses: PositionStatus[] = [];

      results.forEach((result, index) => {
        if (result.data && result.data.length > 0) {
          statuses.push({
            is_rented: result.data[0].is_rented,
            rental_end_date: result.data[0].rental_end_date,
            renter_username: result.data[0].renter_username,
            topic_title: result.data[0].topic_title
          });
        } else {
          statuses.push({
            is_rented: false,
            rental_end_date: '',
            renter_username: '',
            topic_title: ''
          });
        }
      });

      setPositionStatuses(statuses);
    } catch (error) {
      console.error('❌ Pozisyon durumları yüklenirken hata:', error);
    } finally {
      setLoadingPositions(false);
    }
  };

  const calculateCost = (days: number) => {
    if (featuredType === 'subcategory') {
      // Alt kategori öne çıkarma
      if (days <= 3) {
        return days * 250; // İlk 3 gün günlük 250 kredi
      } else {
        return (3 * 250) + ((days - 3) * 200); // 4-30 gün arası günlük 200 kredi
      }
    } else {
      // Ana sayfa öne çıkarma
      if (days <= 3) {
        return days * 250; // İlk 3 gün günlük 250 kredi
      } else {
        return (3 * 250) + ((days - 3) * 200); // 4-10 gün arası günlük 200 kredi
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedTopic || rentalDays < 1 || rentalDays > 30) return;
    if (featuredType === 'subcategory' && (!selectedSubCategory || !selectedPosition)) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      const totalCost = calculateCost(rentalDays);
      
      if (userCredits < totalCost) {
        alert('Yetersiz kredi! Lütfen daha sonra tekrar deneyin.');
        setSubmitting(false);
        return;
      }

      // 🔥 ÖNEMLİ: ÖNCE KREDİ DÜŞÜR, SONRA FORM YAYINLA!
      console.log('💳 Kredi düşürülüyor...', { user_id: user.id, amount: totalCost });
      const { error: creditError } = await supabase.rpc<any>('deduct_credits', {
        p_user_id: user.id,
        p_amount: totalCost
      });

      if (creditError) {
        console.error('❌ Kredi düşürme hatası:', creditError);
        alert('Kredi düşürülürken hata oluştu. Lütfen tekrar deneyin.');
        setSubmitting(false);
        return;
      }

      console.log('✅ Kredi başarıyla düşürüldü');

      const startTime = new Date();
      const endDate = new Date(startTime.getTime() + (rentalDays * 24 * 60 * 60 * 1000));
      const startDateStr = startTime.toISOString();
      const endDateStr = endDate.toISOString();

      if (featuredType === 'subcategory') {
        // Alt kategori öne çıkarma
        // Pozisyon müsaitlik kontrolü
        const { data: isAvailable, error: availabilityError } = await supabase.rpc<any>(
          'check_subcategory_position_availability',
          {
            p_sub_category_id: selectedSubCategory,
            p_position: selectedPosition,
            p_start_date: startDateStr,
            p_end_date: endDateStr
          }
        );

        if (availabilityError) throw availabilityError;

        if (!isAvailable) {
          alert('Seçilen pozisyon bu tarih aralığında müsait değil. Lütfen başka bir pozisyon veya tarih seçin.');
          setSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from('subcategory_featured_forms')
          .insert({
            topic_id: selectedTopic,
            sub_category_id: selectedSubCategory,
            user_id: user.id,
            position: selectedPosition,
            start_date: startDateStr,
            end_date: endDateStr,
            daily_cost: rentalDays <= 3 ? 150 : 100,
            total_cost: totalCost,
            is_paid: true
          });

        if (error) throw error;

        alert('Formunuz başarıyla alt kategoride öne çıkarıldı!');
      } else {
        // Ana sayfa öne çıkarma
        // Aktif öne çıkan form sayısını kontrol et (sistem geneli)
        const now = new Date().toISOString();
        const { data: activeFeatured, error: countError } = await supabase
          .from('featured_forms')
          .select('id')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now);

        if (countError) throw countError;

        if (activeFeatured && activeFeatured.length >= 10) {
          alert(`Maksimum 10 öne çıkan form olabilir. Şu anda ${activeFeatured.length}/10 form öne çıkarılmış. Lütfen mevcut öne çıkan formların süresi bitsin veya başka bir formu bekleyin.`);
          setSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from('featured_forms')
          .insert({
            topic_id: selectedTopic,
            user_id: user.id,
            start_date: startDateStr,
            end_date: endDateStr,
            daily_cost: rentalDays <= 3 ? 250 : 200,
            total_cost: totalCost,
            is_paid: true
          });

        if (error) throw error;

        alert('Formunuz başarıyla ana sayfada öne çıkarıldı!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Öne çıkarma hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTopicData = topics.find(t => t.id === selectedTopic);
  const selectedSubCategoryData = subCategories.find(sc => sc.id === selectedSubCategory);
  const totalCost = calculateCost(rentalDays);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto ${
        featuredType === 'subcategory' ? 'max-w-4xl' : 'max-w-2xl'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {featuredType === 'subcategory' ? (
              <>
                <button
                  onClick={() => setFeaturedType('homepage')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Alt Kategoride Öne Çıkar</h2>
                  <p className="text-sm text-gray-600">Formunuzu belirli bir alt kategoride ilk 5 sıraya yerleştirin</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Form Öne Çıkar</h2>
                  <p className="text-sm text-gray-600">Formunuzu öne çıkararak daha fazla görünürlük kazanın</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {featuredType === 'homepage' ? (
            <>
              {/* Öne Çıkarma Türü Seçimi */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Öne Çıkarma Türü Seçin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      featuredType === 'homepage'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFeaturedType('homepage')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex items-center justify-center">
                        <Home className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Ana Sayfa Öne Çıkarma</h4>
                        <p className="text-sm text-gray-600">Formunuzu ana sayfada öne çıkarın</p>
                        <p className="text-xs text-gray-500 mt-1">250-200 kredi/gün</p>
                      </div>
                      {featuredType === 'homepage' && (
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center ml-auto">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      featuredType === 'subcategory'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFeaturedType('subcategory')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Alt Kategori Öne Çıkarma</h4>
                        <p className="text-sm text-gray-600">Belirli alt kategoride ilk 5 sıraya yerleştirin</p>
                        <p className="text-xs text-gray-500 mt-1">150-100 kredi/gün</p>
                      </div>
                      {featuredType === 'subcategory' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-auto">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Ana Kategori Seçimi */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ana Kategori Seçin</h3>
                <div className="grid grid-cols-1 gap-3">
                  {mainCategories.map((mainCategory) => (
                    <div
                      key={mainCategory.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMainCategory === mainCategory.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedMainCategory(mainCategory.id);
                        setSelectedSubCategory(null);
                        setSelectedTopic(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: mainCategory.color }}
                        ></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{mainCategory.name}</h4>
                        </div>
                        {selectedMainCategory === mainCategory.id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-auto">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alt Kategori Seçimi */}
              {selectedMainCategory && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Alt Kategori Seçin</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {subCategories.map((subCategory) => (
                      <div
                        key={subCategory.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedSubCategory === subCategory.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedSubCategory(subCategory.id);
                          setSelectedTopic(null); // Alt kategori değiştiğinde form seçimini sıfırla
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subCategory.color }}
                          ></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{subCategory.name}</h4>
                          </div>
                          {selectedSubCategory === subCategory.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-auto">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Seçimi */}
              {selectedSubCategory && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Formunuzu Seçin
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({getFilteredTopics().length} form bulundu)
                    </span>
                  </h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : getFilteredTopics().length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Bu alt kategoride formunuz yok.</p>
                      <p className="text-sm text-gray-500">Önce bu alt kategoride bir form oluşturun.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getFilteredTopics().map((topic) => (
                        <div
                          key={topic.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTopic === topic.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTopic(topic.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{topic.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{topic.content}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded">{topic.sub_category.name}</span>
                                <span>•</span>
                                <span>{new Date(topic.created_at).toLocaleDateString('tr-TR')}</span>
                              </div>
                            </div>
                            {selectedTopic === topic.id && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pozisyon Seçimi */}
              {selectedSubCategory && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pozisyon Seçin (İlk 5 Sıra)</h3>
                  {loadingPositions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((position) => {
                        const status = positionStatuses[position - 1];
                        const isRented = status?.is_rented || false;
                        const isSelected = selectedPosition === position;
                        
                        return (
                          <div
                            key={position}
                            className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                              isRented
                                ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                                : isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => !isRented && setSelectedPosition(position)}
                          >
                            <div className="text-2xl font-bold text-gray-900 mb-1">#{position}</div>
                            <div className="text-xs text-gray-500">
                              {isRented ? (
                                <div>
                                  <div className="text-red-600 font-medium">Dolu</div>
                                  <div className="text-red-500">
                                    {status.renter_username}
                                  </div>
                                </div>
                              ) : (
                                'Müsait'
                              )}
                            </div>
                            {isSelected && !isRented && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mx-auto mt-2">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Kredi Durumu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Mevcut Krediniz</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{userCredits.toLocaleString()}</span>
            </div>
          </div>

          {/* Form Seçimi - Sadece ana sayfa öne çıkarma için */}
          {featuredType === 'homepage' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Formunuzu Seçin</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
                </div>
              ) : topics.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Henüz hiç formunuz yok.</p>
                  <p className="text-sm text-gray-500">Önce bir form oluşturun.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTopic === topic.id
                          ? 'border-[#9c6cfe] bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTopic(topic.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{topic.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{topic.content}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">{topic.sub_category.name}</span>
                            <span>•</span>
                            <span>{new Date(topic.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                        {selectedTopic === topic.id && (
                          <div className="w-5 h-5 bg-[#9c6cfe] rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Süre Seçimi */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Öne Çıkarma Süresi</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-center mb-4">
                <div className={`text-3xl font-bold ${
                  featuredType === 'subcategory' ? 'text-blue-500' : 'text-rose-500'
                }`}>{rentalDays}</div>
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
                    background: featuredType === 'subcategory' 
                      ? `linear-gradient(to right, #3b82f6 0%, #06b6d4 ${((rentalDays - 1) / 29) * 100}%, #e5e7eb ${((rentalDays - 1) / 29) * 100}%, #e5e7eb 100%)`
                      : `linear-gradient(to right, #f43f5e 0%, #ec4899 ${((rentalDays - 1) / 29) * 100}%, #e5e7eb ${((rentalDays - 1) / 29) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1 gün</span>
                  <span>30 gün</span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[1, 3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setRentalDays(days)}
                    className={`px-3 py-2 text-sm rounded-lg transition-all ${
                      rentalDays === days
                        ? featuredType === 'subcategory'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {days === 1 ? '1g' : `${days}g`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Maliyet Hesaplama */}
          {selectedTopic && (featuredType === 'homepage' || (featuredType === 'subcategory' && selectedSubCategory && selectedPosition)) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Maliyet Hesaplama</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Seçilen Form:</span>
                  <span className="font-medium">{selectedTopicData?.title}</span>
                </div>
                {featuredType === 'subcategory' && (
                  <>
                    <div className="flex justify-between">
                      <span>Alt Kategori:</span>
                      <span className="font-medium">{selectedSubCategoryData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pozisyon:</span>
                      <span className="font-medium">#{selectedPosition}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Süre:</span>
                  <span className="font-medium">{rentalDays} gün</span>
                </div>
                <div className="flex justify-between">
                  <span>Günlük Maliyet:</span>
                  <span className="font-medium">
                    {featuredType === 'subcategory' 
                      ? (rentalDays <= 3 ? '250 kredi' : '200 kredi')
                      : (rentalDays <= 3 ? '250 kredi' : '200 kredi')
                    }
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {featuredType === 'subcategory' 
                      ? 'İlk 3 gün: 150 kredi/gün'
                      : 'İlk 3 gün: 250 kredi/gün'
                    }
                  </span>
                  <span>
                    {featuredType === 'subcategory' 
                      ? '4-30 gün: 100 kredi/gün'
                      : '4-30 gün: 200 kredi/gün'
                    }
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Toplam:</span>
                  <span className={featuredType === 'subcategory' ? 'text-blue-500' : 'text-rose-500'}>
                    {totalCost.toLocaleString()} kredi
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Uyarı */}
          {totalCost > userCredits && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Yetersiz Kredi</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Bu işlem için {totalCost.toLocaleString()} kredi gerekli, 
                ancak sadece {userCredits.toLocaleString()} krediniz var.
              </p>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            İptal
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={
                !selectedTopic || 
                totalCost > userCredits || 
                submitting ||
                (featuredType === 'subcategory' && (!selectedSubCategory || !selectedPosition))
              }
              className={`px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                featuredType === 'subcategory'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500'
              }`}
            >
              {submitting ? 'İşleniyor...' : 
                featuredType === 'subcategory' ? 'Öne Çıkar' : 'Ana Sayfada Öne Çıkar'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
