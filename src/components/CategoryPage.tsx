'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { TopicView } from './TopicView';
import { TopicCard } from './TopicCard';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MessageSquare, 
  Eye, 
  Clock,
  Monitor,
  Palette,
  Newspaper,
  Briefcase,
  BookOpen,
  MessageCircle,
  Users,
  Gamepad2,
  Smartphone,
  Globe,
  Shield,
  Brain,
  BarChart3,
  Cloud,
  Link,
  Layout,
  Image,
  Box,
  Code,
  Cpu,
  Rocket,
  Microscope,
  FileText,
  Target,
  Laptop,
  Award,
  UserCheck,
  Hand,
  Calendar,
  Lightbulb,
  Trophy,
  Handshake,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';

type MainCategory = Database['public']['Tables']['main_categories']['Row'];
type SubCategory = Database['public']['Tables']['sub_categories']['Row'];
type Topic = Database['public']['Tables']['topics']['Row'];

interface CategoryPageProps {
  categoryId: string;
  onBack: () => void;
  onTopicClick: (topicId: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewCountUpdate?: (topicId: string) => void;
  onReplyCountUpdate?: (topicId: string) => void;
  onUsefulCountUpdate?: (topicId: string, increment: boolean) => void;
  initialSubCategory?: string;
}

export function CategoryPage({ categoryId, onBack, onTopicClick, onViewProfile, onViewCountUpdate, onReplyCountUpdate, onUsefulCountUpdate, initialSubCategory }: CategoryPageProps) {
  const { user } = useAuth();
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [showMenuForTopic, setShowMenuForTopic] = useState<string | null>(null);

  // Topic sayılarını güncelleme fonksiyonları
  const updateTopicViewCount = (topicId: string) => {
    console.log('Updating view count for topic:', topicId);
    setTopics(prev => prev.map(topic => 
      topic.id === topicId 
        ? { ...topic, view_count: (topic.view_count || 0) + 1 }
        : topic
    ));
    onViewCountUpdate?.(topicId);
  };

  const updateTopicReplyCount = (topicId: string) => {
    console.log('Updating reply count for topic:', topicId);
    setTopics(prev => prev.map(topic => 
      topic.id === topicId 
        ? { ...topic, reply_count: (topic.reply_count || 0) + 1 }
        : topic
    ));
    onReplyCountUpdate?.(topicId);
  };

  const updateTopicUsefulCount = (topicId: string, increment: boolean) => {
    console.log('Updating useful count for topic:', topicId, increment);
    setTopics(prev => prev.map(topic => 
      topic.id === topicId 
        ? { ...topic, useful_count: (topic.useful_count || 0) + (increment ? 1 : -1) }
        : topic
    ));
    onUsefulCountUpdate?.(topicId, increment);
  };

  const updateSubCategoryCounters = async (subCategoryId: string) => {
    try {
      console.log('Alt kategori sayaçları güncelleniyor:', subCategoryId);
      
      // Konu sayısını al
      const { count: topicCount, error: topicError } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('sub_category_id', subCategoryId);
      
      if (topicError) throw topicError;
      
      // Toplam yorum sayısını al (konu + yorumlar)
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('id')
        .eq('sub_category_id', subCategoryId);
      
      if (topicsError) throw topicsError;
      
      const topicIds = topics.map(t => t.id);
      let postCount = 0;
      
      if (topicIds.length > 0) {
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('topic_id', topicIds);
        
        if (postsError) throw postsError;
        postCount = postsCount || 0;
      }
      
      // Alt kategoriyi güncelle
      const { error: updateError } = await supabase
        .from('sub_categories')
        .update({
          topic_count: topicCount || 0,
          post_count: (topicCount || 0) + postCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', subCategoryId);
      
      if (updateError) throw updateError;
      
      console.log(`Alt kategori güncellendi: ${topicCount} konu, ${(topicCount || 0) + postCount} toplam`);
      
      // Ana kategori sayacını da güncelle (tüm alt kategorilerin toplamı)
      const currentSubCategory = subCategories.find(sc => sc.id === subCategoryId);
      if (currentSubCategory) {
        // Tüm alt kategorilerin toplamını hesapla
        const { data: allSubCategories, error: allSubError } = await supabase
          .from('sub_categories')
          .select('id')
          .eq('main_category_id', currentSubCategory.main_category_id);
        
        if (allSubError) {
          console.error('Alt kategoriler alınırken hata:', allSubError);
          return;
        }
        
        const allSubCategoryIds = allSubCategories.map(sc => sc.id);
        
        if (allSubCategoryIds.length > 0) {
          // Ana kategorinin toplam konu sayısı
          const { count: mainTopicCount, error: mainTopicError } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .in('sub_category_id', allSubCategoryIds);
          
          if (mainTopicError) {
            console.error('Ana kategori konu sayısı hatası:', mainTopicError);
            return;
          }
          
          // Ana kategorinin toplam yorum sayısı
          const { data: mainTopics, error: mainTopicsError } = await supabase
            .from('topics')
            .select('id')
            .in('sub_category_id', allSubCategoryIds);
          
          if (mainTopicsError) {
            console.error('Ana kategori konuları alınırken hata:', mainTopicsError);
            return;
          }
          
          const mainTopicIds = mainTopics.map(t => t.id);
          let mainPostCount = 0;
          
          if (mainTopicIds.length > 0) {
            const { count: mainPostsCount, error: mainPostsError } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .in('topic_id', mainTopicIds);
            
            if (mainPostsError) {
              console.error('Ana kategori yorum sayısı hatası:', mainPostsError);
              return;
            }
            mainPostCount = mainPostsCount || 0;
          }
          
          const { error: mainUpdateError } = await supabase
            .from('main_categories')
            .update({
              topic_count: mainTopicCount || 0,
              post_count: (mainTopicCount || 0) + mainPostCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSubCategory.main_category_id);
          
          if (mainUpdateError) {
            console.error('Ana kategori güncelleme hatası:', mainUpdateError);
          } else {
            console.log(`Ana kategori güncellendi: ${mainTopicCount} konu, ${(mainTopicCount || 0) + mainPostCount} toplam`);
          }
        }
      }
      
    } catch (error) {
      console.error('Sayaç güncelleme hatası:', error);
    }
  };

  const updateAllSubCategoryCounters = async (mainCategoryId: string) => {
    try {
      console.log('Tüm alt kategori sayaçları güncelleniyor...');
      
      // Tüm alt kategorileri al
      const { data: allSubCategories, error: subError } = await supabase
        .from('sub_categories')
        .select('id, name')
        .eq('main_category_id', mainCategoryId);
      
      if (subError) {
        console.error('Alt kategoriler alınırken hata:', subError);
        return;
      }
      
      if (allSubCategories) {
        for (const sub of allSubCategories) {
          // Gerçek konu sayısını al
          const { count: realTopicCount, error: topicError } = await supabase
            .from('topics')
            .select('*', { count: 'exact', head: true })
            .eq('sub_category_id', sub.id);
          
          if (topicError) {
            console.error(`${sub.name} konu sayısı alınırken hata:`, topicError);
            continue;
          }
          
          // Gerçek yorum sayısını al
          const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('id')
            .eq('sub_category_id', sub.id);
          
          if (topicsError) {
            console.error(`${sub.name} konuları alınırken hata:`, topicsError);
            continue;
          }
          
          let realPostCount = 0;
          if (topics && topics.length > 0) {
            const { count: postCount, error: postError } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .in('topic_id', topics.map(t => t.id));
            
            if (postError) {
              console.error(`${sub.name} yorum sayısı alınırken hata:`, postError);
            } else {
              realPostCount = postCount || 0;
            }
          }
          
          // Mevcut sayaç değerini kontrol et
          const { data: currentSubData } = await supabase
            .from('sub_categories')
            .select('topic_count, post_count')
            .eq('id', sub.id)
            .single();
          
          console.log(`🔍 ${sub.name} - Mevcut sayaç: ${currentSubData?.topic_count} konu, ${currentSubData?.post_count} toplam`);
          console.log(`🔍 ${sub.name} - Gerçek sayı: ${realTopicCount} konu, ${(realTopicCount || 0) + realPostCount} toplam`);
          
          // Alt kategoriyi güncelle
          console.log(`🔄 ${sub.name} güncelleniyor... (ID: ${sub.id})`);
          const { data: updateData, error: updateError } = await supabase
            .from('sub_categories')
            .update({
              topic_count: realTopicCount || 0,
              post_count: (realTopicCount || 0) + realPostCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', sub.id)
            .select();
          
          console.log(`🔄 ${sub.name} güncelleme sonucu:`, { updateData, updateError });
          
          if (updateError) {
            console.error(`❌ ${sub.name} güncellenirken hata:`, updateError);
          } else {
            console.log(`✅ ${sub.name}: ${realTopicCount} konu, ${(realTopicCount || 0) + realPostCount} toplam (güncellendi)`);
            
            // Güncelleme sonrası kontrol et
            const { data: updatedSubData } = await supabase
              .from('sub_categories')
              .select('topic_count, post_count')
              .eq('id', sub.id)
              .single();
            
            console.log(`✅ ${sub.name} - Güncelleme sonrası: ${updatedSubData?.topic_count} konu, ${updatedSubData?.post_count} toplam`);
          }
        }
      }
      
      // Ana kategori sayacını da güncelle
      const { data: allSubCategoriesForMain } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('main_category_id', mainCategoryId);
      
      if (allSubCategoriesForMain && allSubCategoriesForMain.length > 0) {
        const subCategoryIds = allSubCategoriesForMain.map(sc => sc.id);
        
        // Ana kategorinin toplam konu sayısı
        const { count: mainTopicCount, error: mainTopicError } = await supabase
          .from('topics')
          .select('*', { count: 'exact', head: true })
          .in('sub_category_id', subCategoryIds);
        
        if (mainTopicError) {
          console.error('Ana kategori konu sayısı hatası:', mainTopicError);
        } else {
          // Ana kategorinin toplam yorum sayısı
          const { data: mainTopics, error: mainTopicsError } = await supabase
            .from('topics')
            .select('id')
            .in('sub_category_id', subCategoryIds);
          
          let mainPostCount = 0;
          if (!mainTopicsError && mainTopics && mainTopics.length > 0) {
            const { count: postsCount, error: postsError } = await supabase
              .from('posts')
              .select('*', { count: 'exact', head: true })
              .in('topic_id', mainTopics.map(t => t.id));
            
            if (!postsError) {
              mainPostCount = postsCount || 0;
            }
          }
          
          // Ana kategoriyi güncelle
          const { error: mainUpdateError } = await supabase
            .from('main_categories')
            .update({
              topic_count: mainTopicCount || 0,
              post_count: (mainTopicCount || 0) + mainPostCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', mainCategoryId);
          
          if (mainUpdateError) {
            console.error('Ana kategori güncelleme hatası:', mainUpdateError);
          } else {
            console.log(`✅ Ana kategori: ${mainTopicCount} konu, ${(mainTopicCount || 0) + mainPostCount} toplam`);
          }
        }
      }
      
      console.log('Tüm sayaçlar güncellendi!');
      
    } catch (error) {
      console.error('Sayaç güncelleme hatası:', error);
    }
  };

  const decrementCounters = async (subCategoryId: string, mainCategoryId: string) => {
    try {
      console.log('Sayaçlar azaltılıyor...', { subCategoryId, mainCategoryId });
      
      // Alt kategori sayacını azalt - RPC fonksiyonu kullan
      const { data: subData, error: subError } = await supabase
        .rpc<any>('decrement', {
          table_name: 'sub_categories',
          column_name: 'topic_count',
          row_id: subCategoryId
        });

      console.log('Alt kategori güncelleme sonucu:', { subData, subError });

      // Ana kategori sayacını azalt - RPC fonksiyonu kullan
      const { data: mainData, error: mainError } = await supabase
        .rpc<any>('decrement', {
          table_name: 'main_categories',
          column_name: 'topic_count',
          row_id: mainCategoryId
        });

      console.log('Ana kategori güncelleme sonucu:', { mainData, mainError });
      
    } catch (error) {
      console.error('Sayaç azaltma hatası:', error);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    console.log('Silme işlemi başlatıldı, topicId:', topicId);
    console.log('Mevcut kullanıcı:', user?.id);
    
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm yorumlar da silinecektir.')) {
      console.log('Kullanıcı silme işlemini iptal etti');
      return;
    }

    try {
      console.log('Supabase silme işlemi başlatılıyor...');
      const { data, error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)
        .select();

      console.log('Silme işlemi sonucu:', { data, error });

      if (error) {
        console.error('Supabase hatası:', error);
        throw error;
      }

      console.log('Konu başarıyla silindi, sayaçlar otomatik olarak güncellenecek...');
      
      // Local state'ten kaldır
      setTopics(prev => prev.filter(topic => topic.id !== topicId));
      
      console.log('Silme işlemi tamamlandı');
    } catch (error) {
      console.error('Konu silinirken hata:', error);
      alert(`Konu silinirken bir hata oluştu: ${error.message || error}`);
    }
  };

  // İkon render fonksiyonu
  const renderIcon = (iconName: string, className: string = "w-6 h-6") => {
    const iconMap: { [key: string]: any } = {
      'Monitor': Monitor,
      'Palette': Palette,
      'Newspaper': Newspaper,
      'Briefcase': Briefcase,
      'BookOpen': BookOpen,
      'MessageCircle': MessageCircle,
      'Users': Users,
      'Gamepad2': Gamepad2,
      'Smartphone': Smartphone,
      'Globe': Globe,
      'Shield': Shield,
      'Brain': Brain,
      'BarChart3': BarChart3,
      'Cloud': Cloud,
      'Link': Link,
      'Layout': Layout,
      'Image': Image,
      'Box': Box,
      'Code': Code,
      'Cpu': Cpu,
      'Rocket': Rocket,
      'Microscope': Microscope,
      'FileText': FileText,
      'Target': Target,
      'Laptop': Laptop,
      'Award': Award,
      'UserCheck': UserCheck,
      'Hand': Hand,
      'Calendar': Calendar,
      'Lightbulb': Lightbulb,
      'Trophy': Trophy,
      'Handshake': Handshake,
      'AlertCircle': AlertCircle,
      // Emoji ikonları için mapping
      '🚨': AlertCircle,
      '💻': Monitor,
      '🎨': Palette,
      '📱': Smartphone,
      '🔍': Target,
      '💰': Award,
      '✍️': FileText,
      '🌐': Globe,
      '🖥️': Monitor,
      '📲': Smartphone,
      '🎁': Award,
      '🛍️': Briefcase,
      '📊': BarChart3,
      '💼': Briefcase,
      '💬': MessageCircle,
      '🎮': Gamepad2,
      '🎯': Target,
      '🚀': Rocket,
      '🧠': Brain,
      '🔒': Shield,
      '📝': FileText,
      '📈': BarChart3,
      '🎪': Trophy,
      '🤝': Handshake,
      '💡': Lightbulb,
      '📅': Calendar,
      '👥': Users,
      '📰': Newspaper,
      '☁️': Cloud,
      '🔗': Link,
      '📐': Layout,
      '🖼️': Image,
      '📦': Box,
      '⚙️': Cpu,
      '🔬': Microscope,
      '🏆': Award,
      '✅': UserCheck,
      '✋': Hand,
    };

    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    
    // Fallback için varsayılan ikon
    return <Monitor className={className} />;
  };

  useEffect(() => {
    // Kategori değiştiğinde önceki verileri temizle
    setMainCategory(null);
    setTopics([]);
    setSelectedTopicId(null);
    // Kategori değiştiğinde selectedSubCategory'yi her zaman null yap
    // initialSubCategory useEffect tarafından işlenecek
    setSelectedSubCategory(null);
    loadCategoryData();
  }, [categoryId]);

  // initialSubCategory değiştiğinde alt kategoriyi seç (alt kategoriler yüklendikten sonra)
  useEffect(() => {
    if (initialSubCategory && subCategories.length > 0) {
      // Alt kategoriler yüklendikten sonra initialSubCategory'yi kontrol et
      const subCategoryExists = subCategories.some(sc => sc.id === initialSubCategory);
      if (subCategoryExists) {
        console.log('🎯 initialSubCategory ile alt kategori seçiliyor:', initialSubCategory);
        setSelectedSubCategory(initialSubCategory);
      }
    } else if (!initialSubCategory) {
      // Eğer initialSubCategory yoksa, selectedSubCategory'yi null yap
      setSelectedSubCategory(null);
    }
  }, [initialSubCategory, subCategories]);

  // Real-time subscription for category counters
  useEffect(() => {
    if (!categoryId) return;

    // Ana kategori sayaçları için subscription
    const mainCategorySubscription = supabase
      .channel('main_category_counters')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'main_categories',
          filter: `id=eq.${categoryId}`
        }, 
        (payload) => {
          console.log('Ana kategori sayaçları güncellendi:', payload);
          if (payload.new) {
            setMainCategory(prev => prev ? { ...prev, ...payload.new } : null);
          }
        }
      )
      .subscribe();

    // Alt kategori sayaçları için subscription
    const subCategorySubscription = supabase
      .channel('sub_category_counters')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'sub_categories',
          filter: `main_category_id=eq.${categoryId}`
        }, 
        (payload) => {
          console.log('Alt kategori sayaçları güncellendi:', payload);
          if (payload.new) {
            setSubCategories(prev => 
              prev.map(sub => 
                sub.id === payload.new.id 
                  ? { ...sub, ...payload.new }
                  : sub
              )
            );
          }
        }
      )
      .subscribe();

    // Topics değişiklikleri için subscription - sayaçları güncelle
    const topicsSubscription = supabase
      .channel('topics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'topics'
        }, 
        async () => {
          console.log('Topics değişti, sayaçlar güncelleniyor...');
          // Sayaçları yeniden hesapla
          if (subCategories.length > 0) {
            const updatedSubCategories = await Promise.all(
              subCategories.map(async (subCategory: any) => {
                const { count: topicCount } = await supabase
                  .from('topics')
                  .select('*', { count: 'exact', head: true })
                  .eq('sub_category_id', subCategory.id);

                return {
                  ...subCategory,
                  topic_count: topicCount || 0
                };
              })
            );
            setSubCategories(updatedSubCategories);
          }
        }
      )
      .subscribe();

    return () => {
      mainCategorySubscription.unsubscribe();
      subCategorySubscription.unsubscribe();
      topicsSubscription.unsubscribe();
    };
  }, [categoryId]);

  useEffect(() => {
    if (selectedSubCategory) {
      loadTopics(selectedSubCategory);
    } else {
      setTopics([]);
    }
  }, [selectedSubCategory]);

  // Menü dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenuForTopic(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  const loadCategoryData = async () => {
    setLoading(true);
    try {
      // Ana kategoriyi yükle
      const { data: mainCategoryData } = await supabase
        .from('main_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (mainCategoryData) {
        setMainCategory(mainCategoryData);

        // Alt kategorileri yükle
        const { data: subCategoriesData } = await supabase
          .from('sub_categories')
          .select('*')
          .eq('main_category_id', categoryId)
          .order('order_index', { ascending: true });

        if (subCategoriesData) {
          // Her alt kategori için gerçek konu sayısını hesapla
          const updatedSubCategories = await Promise.all(
            subCategoriesData.map(async (subCategory: any) => {
              const { count: topicCount } = await supabase
                .from('topics')
                .select('*', { count: 'exact', head: true })
                .eq('sub_category_id', subCategory.id);

              return {
                ...subCategory,
                topic_count: topicCount || 0
              };
            })
          );

          setSubCategories(updatedSubCategories);
          
          // Alt kategoriler yüklendi, initialSubCategory useEffect tarafından işlenecek
          // Otomatik seçim yapma - kullanıcı manuel olarak seçmeli
        }
      }
    } catch (error) {
      console.error('Kategori verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (subCategoryId: string) => {
    try {
      // Önce öne çıkan formları yükle
      const { data: featuredData } = await supabase
        .from('subcategory_featured_forms')
        .select(`
          *,
          topics!inner (
            *,
            profiles!topics_author_id_fkey (
              username,
              display_name,
              avatar_url,
              active_badge_icon
            )
          )
        `)
        .eq('sub_category_id', subCategoryId)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString())
        .order('position', { ascending: true });

      // Sonra normal konuları yükle
      const { data: normalData } = await supabase
        .from('topics')
        .select(`
          *,
          profiles!topics_author_id_fkey (
            username,
            display_name,
            avatar_url,
            active_badge_icon
          )
        `)
        .eq('sub_category_id', subCategoryId)
        .order('is_pinned', { ascending: false })
        .order('last_post_at', { ascending: false });

      // Öne çıkan formları ve normal konuları birleştir
      const allTopics = [];
      
      // Öne çıkan formları ekle
      if (featuredData) {
        featuredData.forEach(featured => {
          if (featured.topics) {
            allTopics.push({
              ...featured.topics,
              is_featured: true,
              featured_position: featured.position,
              featured_end_date: featured.end_date
            });
          }
        });
      }

      // Normal konuları ekle (öne çıkan olmayanlar)
      if (normalData) {
        const featuredTopicIds = featuredData?.map(f => f.topic_id) || [];
        const nonFeaturedTopics = normalData.filter(topic => !featuredTopicIds.includes(topic.id));
        allTopics.push(...nonFeaturedTopics);
      }

      setTopics(allTopics);
    } catch (error) {
      console.error('Konular yüklenirken hata:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Az önce';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    if (diffInHours < 48) return 'Dün';
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
      </div>
    );
  }

  if (!mainCategory) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Kategori bulunamadı</h2>
        <p className="text-gray-600 mb-4">Aradığınız kategori mevcut değil.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  // Eğer topic seçilmişse TopicView göster
  if (selectedTopicId) {
    return (
      <TopicView
        topicId={selectedTopicId}
        onBack={() => setSelectedTopicId(null)}
        onViewProfile={onViewProfile}
        onViewCountUpdate={updateTopicViewCount}
        onReplyCountUpdate={updateTopicReplyCount}
        onUsefulCountUpdate={updateTopicUsefulCount}
        preIncremented={true}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Geri Tuşu - Mobilde Header'ın altında tam genişlik */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors md:static fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm md:border-0 md:shadow-none md:px-0 md:py-0"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium md:inline">Geri Dön</span>
      </button>
      
      {/* Mobilde geri tuşu için padding */}
      <div className="md:hidden h-[60px]"></div>
      
      {/* Header */}
      <div className="mb-4 sm:mb-6">

        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          {renderIcon(mainCategory.icon, "w-6 h-6 sm:w-8 sm:h-8")}
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{mainCategory.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{mainCategory.description}</p>
          </div>
        </div>

        {/* Alt kategori navigasyonu */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {subCategories.map((subCategory) => (
            <button
              key={subCategory.id}
              onClick={() => setSelectedSubCategory(subCategory.id)}
              className={`
                px-2 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all
                ${selectedSubCategory === subCategory.id
                  ? 'bg-[#9c6cfe] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-1 sm:mr-2">{renderIcon(subCategory.icon, "w-3 h-3 sm:w-4 sm:h-4")}</span>
              {subCategory.name}
              <span className="ml-1 sm:ml-2 text-xs opacity-75">
                ({subCategory.topic_count || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Konular listesi */}
      <div className="bg-white rounded-lg border border-gray-200">
        {!selectedSubCategory ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alt Kategori Seçin</h3>
            <p className="text-gray-600">
              Konuları görmek için yukarıdan bir alt kategori seçin.
            </p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz konu yok</h3>
            <p className="text-gray-600">
              Bu kategoride henüz hiç konu açılmamış. İlk konuyu sen aç!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={{
                  id: topic.id,
                  title: topic.title,
                  content: topic.content || '',
                  author_id: topic.author_id,
                  author: {
                    id: topic.author_id,
                    display_name: topic.profiles?.display_name,
                    username: topic.profiles?.username,
                    avatar_url: topic.profiles?.avatar_url,
                    active_badge_icon: topic.profiles?.active_badge_icon
                  },
                  sub_category: {
                    name: topic.sub_category?.name || '',
                    color: topic.sub_category?.color || '#6B7280',
                    main_category: {
                      name: topic.sub_category?.main_category?.name || ''
                    }
                  },
                  reply_count: topic.reply_count || 0,
                  view_count: topic.view_count || 0,
                  is_pinned: topic.is_pinned || false,
                  is_locked: topic.is_locked || false,
                  created_at: topic.created_at,
                  last_post_at: topic.last_post_at || topic.created_at,
                  is_featured: topic.is_featured || false,
                  featured_position: topic.featured_position,
                  featured_end_date: topic.featured_end_date
                }}
                onClick={async () => {
                  try {
                    // DB'ye anında +1 yap (RPC ile atomik artırım)
                    await (supabase as any).rpc<any>('increment_topic_view', {
                      p_topic_id: topic.id
                    });
                    // UI'da hemen +1 göster (optimistic update)
                    updateTopicViewCount(topic.id);
                  } catch (error) {
                    console.error('View artırma hatası:', error);
                    // Hata olsa bile optimistic update yap
                    updateTopicViewCount(topic.id);
                  }
                  setSelectedTopicId(topic.id);
                }}
                onViewProfile={(userId) => onViewProfile?.(userId)}
                onTopicDeleted={() => {
                  loadTopics(selectedSubCategory || '');
                }}
                compact={true}
                showSubcategory={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
