'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import { Helmet } from 'react-helmet-async';
import { 
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
  ArrowLeft,
  Star,
  History,
  TrendingUp,
  Edit,
  AlertCircle,
  Search,
  Coins,
  Gift,
  ShoppingBag,
  Music,
  Video,
  Camera,
  Theater,
  Home,
  Building,
  Store,
  Heart,
  GraduationCap,
  Wrench,
  Zap,
  Flame,
  Gem,
  Moon,
  Sun,
  Rainbow,
  PartyPopper,
  MessageSquare,
  Activity,
  Crown,
  PenTool,
  DollarSign,
  Bitcoin,
  Languages,
  CheckSquare,
  Layers,
  Gavel,
  Package,
  Clock,
  Calculator,
  Sparkles,
  Server,
  Database,
  Key,
  Settings,
  AlertTriangle,
  Tablet,
  Download,
  Apple,
  Play,
  TestTube,
  FileCode,
  Puzzle,
  Eye,
  HelpCircle,
  Type,
  Mail,
  MousePointer,
  Plus,
  Check,
  Minus
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TopicCard } from './components/TopicCard';
import { AuthModal } from './components/AuthModal';
import { NewTopicModal } from './components/NewTopicModal';
import { TopicView } from './components/TopicView';
import { UserProfile } from './components/UserProfile';
import { ProfilePage } from './components/ProfilePage';
import { CreditPurchase } from './components/CreditPurchase';
import { CategoryPage } from './components/CategoryPage';
import { MessagesPage } from './components/MessagesPage';
import { AdBanner } from './components/AdBanner';
import { BannerRental } from './components/BannerRental';
import { MyBanners } from './components/MyBanners';
import { BannerControl } from './components/BannerControl';
import { TrendingPage } from './components/TrendingPage';
import { SavedPage } from './components/SavedPage';
import { ToolsPage } from './components/ToolsPage';
import { FeaturedModal } from './components/FeaturedModal';
import { CVCreator } from './components/tools/CVCreator';
import { YouTubeDownloader } from './components/tools/YouTubeDownloader';
import { ImageDPIConverter } from './components/tools/ImageDPIConverter';
import { LockDownFiles } from './components/tools/LockDownFiles';
import { TikTokDownloader } from './components/tools/TikTokDownloader';
import { InstagramDownloader } from './components/tools/InstagramDownloader';
import { CleanWork } from './components/tools/CleanWork';
import { FenomenGPT } from './components/tools/FenomenGPT';
import { ImageDPIConverterPro } from './components/tools/ImageDPIConverterPro';
import { PDFEditorConverter } from './components/tools/PDFEditorConverter';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MySuccessPage from './components/MySuccessPage';
import MyFailPage from './components/MyFailPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { FAQPage } from './components/FAQPage';
import { SupportPage } from './components/SupportPage';
import { RequestInvitePage } from './components/RequestInvitePage';
import { supabase } from './lib/supabase';
import type { Database as DatabaseType } from './lib/database.types';

type Topic = DatabaseType['public']['Tables']['topics']['Row'];

interface TopicWithDetails extends Topic {
  author: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  sub_category: {
    name: string;
    color: string;
    main_category: {
      name: string;
    };
  };
}

function AppContent() {
  const { user } = useAuth();
  const navigate = useRouter();
  const location = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showRequestInvite, setShowRequestInvite] = useState(false);
  const [newTopicModalOpen, setNewTopicModalOpen] = useState(false);
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [topics, setTopics] = useState<TopicWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [allCategoriesWithSubs, setAllCategoriesWithSubs] = useState<any[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [selectedMenuTab, setSelectedMenuTab] = useState<string>('featured');
  const [showBannerRental, setShowBannerRental] = useState(false);
  const [showMyBanners, setShowMyBanners] = useState(false);
  const [showBannerControl, setShowBannerControl] = useState(false);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredTopics, setFeaturedTopics] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [preIncrementedFlag, setPreIncrementedFlag] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [favoriteSubCategoryIds, setFavoriteSubCategoryIds] = useState<string[]>(() => {
    // localStorage'dan favori alt kategorileri yükle
    try {
      const saved = localStorage.getItem('favoriteSubCategories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAddToFavoritesMode, setShowAddToFavoritesMode] = useState(false);
  const [showRemoveFromFavoritesMode, setShowRemoveFromFavoritesMode] = useState(false);
  const [justAddedFavorite, setJustAddedFavorite] = useState(false);
  const [selectedCategoriesToAdd, setSelectedCategoriesToAdd] = useState<string[]>([]);

  // Seçili kategorileri favorilere ekle
  const saveSelectedFavorites = () => {
    const newFavorites = [...favoriteSubCategoryIds, ...selectedCategoriesToAdd.filter(id => !favoriteSubCategoryIds.includes(id))];
    setFavoriteSubCategoryIds(newFavorites);
    localStorage.setItem('favoriteSubCategories', JSON.stringify(newFavorites));
    setSelectedCategoriesToAdd([]);
    setShowAddToFavoritesMode(false);
    setJustAddedFavorite(true);
    setTimeout(() => {
      setJustAddedFavorite(false);
    }, 2000);
  };

  // Favori alt kategori ekleme fonksiyonu (seçim modunda)
  const toggleCategorySelection = (subCategoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Kategori butonuna tıklamayı engelle
    if (selectedCategoriesToAdd.includes(subCategoryId)) {
      setSelectedCategoriesToAdd(selectedCategoriesToAdd.filter(id => id !== subCategoryId));
    } else {
      setSelectedCategoriesToAdd([...selectedCategoriesToAdd, subCategoryId]);
    }
  };

  // Favori alt kategori kaldırma fonksiyonu
  const removeFromFavorites = (subCategoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Kategori butonuna tıklamayı engelle
    const newFavorites = favoriteSubCategoryIds.filter(id => id !== subCategoryId);
    setFavoriteSubCategoryIds(newFavorites);
    localStorage.setItem('favoriteSubCategories', JSON.stringify(newFavorites));
    // Kaldırma modunu kapat
    setShowRemoveFromFavoritesMode(false);
  };

  // Favori alt kategorileri getir
  const getFavoriteSubCategories = () => {
    const favorites: any[] = [];
    allCategoriesWithSubs.forEach(category => {
      if (category.sub_categories) {
        category.sub_categories.forEach((subCat: any) => {
          if (favoriteSubCategoryIds.includes(subCat.id)) {
            favorites.push({
              ...subCat,
              main_category: {
                name: category.name,
                icon: category.icon
              }
            });
          }
        });
      }
    });
    return favorites;
  };
  
  // URL kontrolü - Success ve Fail sayfaları için
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [historyStack, setHistoryStack] = useState<Array<{type: string, data: any}>>([]);
  
  // Browser history entegrasyonu - telefon geri tuşu için
  useEffect(() => {
    const handlePopState = (_e: PopStateEvent) => {
      setHistoryStack(prev => {
        if (prev.length > 0) {
          const previousState = prev[prev.length - 1];
          
          // Önceki state'e göre sayfayı geri yükle
          if (previousState.type === 'topic') {
            setSelectedTopicId(null);
            setPreIncrementedFlag(false);
          } else if (previousState.type === 'category') {
            setSelectedCategory(null);
            setSelectedSubCategory(null);
          } else if (previousState.type === 'user') {
            setSelectedUserId(null);
            setShowProfile(false);
          } else if (previousState.type === 'profile') {
            setShowProfile(false);
          } else if (previousState.type === 'messages') {
            setSelectedCategory(null);
            setSelectedConversationId(null);
          } else if (previousState.type === 'trending') {
            setSelectedCategory(null);
          } else if (previousState.type === 'saved') {
            setSelectedCategory(null);
          } else if (previousState.type === 'tools') {
            setSelectedCategory(null);
          } else if (previousState.type === 'home') {
            // Önceki state'ten geri yükle
            if (previousState.data) {
              setSelectedCategory(previousState.data.selectedCategory);
              setSelectedTopicId(previousState.data.selectedTopicId);
              setSelectedUserId(previousState.data.selectedUserId);
              setShowProfile(previousState.data.showProfile);
              setSelectedConversationId(previousState.data.selectedConversationId);
            }
          }
          
          return prev.slice(0, -1);
        } else {
          // History boşsa ana sayfaya dön
          setSelectedCategory(null);
          setSelectedTopicId(null);
          setSelectedTopicSlug(null);
          setSelectedUserId(null);
          setShowProfile(false);
          setSelectedConversationId(null);
          return [];
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // URL değişimlerini dinle
  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  // URL hash kontrolü - Ödeme sayfası için
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#payment' || hash === '#credit-purchase' || hash === '#odeme') {
        setShowCreditPurchase(true);
      }
    };

    // İlk yüklemede kontrol et
    checkHash();

    // Hash değişikliklerini dinle
    const handleHashChange = () => {
      checkHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modal kapatıldığında hash'i temizle
  useEffect(() => {
    if (!showCreditPurchase) {
      const hash = window.location.hash;
      if (hash === '#payment' || hash === '#credit-purchase' || hash === '#odeme') {
        // Hash'i temizle ama sayfayı yenileme
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [showCreditPurchase]);
  
  // Önbellekleme için state'ler
  const [categoriesCache, setCategoriesCache] = useState<any>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika


  useEffect(() => {
    loadCategories();
    if (user) {
      loadCreditBalance();
      loadUnreadMessageCount();
    }
  }, [user]);

  // URL'den state'i oku - sayfa yüklendiğinde veya URL değiştiğinde
  useEffect(() => {
    if (isInitialLoad) {
      const path = location.pathname;
      
      // Success/Fail sayfaları
      if (path === '/success' || path === '/fail') {
        setIsInitialLoad(false);
        return;
      }

      // Statik sayfalar
      if (path === '/about') {
        setSelectedCategory('about');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/contact') {
        setSelectedCategory('contact');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/privacy') {
        setSelectedCategory('privacy');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/terms') {
        setSelectedCategory('terms');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/faq') {
        setSelectedCategory('faq');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/support') {
        setSelectedCategory('support');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/trending') {
        setSelectedCategory('trending');
        setIsInitialLoad(false);
        return;
      }
      if (path === '/tools') {
        setSelectedCategory('tools');
        setIsInitialLoad(false);
        return;
      }

      // Tools alt sayfaları
      if (path.startsWith('/tools/')) {
        const toolSlug = path.replace('/tools/', '');
        setSelectedCategory(toolSlug);
        setIsInitialLoad(false);
        return;
      }

      // Kategori sayfaları - URL'den kategori okuma KALDIRILDI
      // Alt kategori seçildiğinde URL değişmemeli, bu yüzden URL'den kategori okuma da kaldırıldı
      // if (path.startsWith('/kategori/')) {
      //   ...
      // }

      // Topic sayfaları
      if (path.startsWith('/topic/')) {
        const topicSlug = path.replace('/topic/', '');
        // Slug'dan topic ID'sini bul
        const topic = topics.find((t: any) => t.slug === topicSlug);
        if (topic) {
          setSelectedTopicId(topic.id);
          setSelectedTopicSlug(topicSlug);
        } else {
          // Topic henüz yüklenmemiş, slug'dan ID'yi bulmak için sorgu yap
          supabase
            .from('topics')
            .select('id')
            .eq('slug', topicSlug)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                const topicData = data as { id: string };
                if (topicData.id) {
                  setSelectedTopicId(topicData.id);
                  setSelectedTopicSlug(topicSlug);
                }
              }
            });
        }
        setIsInitialLoad(false);
        return;
      }

      // User profile sayfaları
      if (path.startsWith('/user/')) {
        const userId = path.replace('/user/', '');
        setSelectedUserId(userId);
        setIsInitialLoad(false);
        return;
      }

      // Ana sayfa
      if (path === '/' || path === '' || path === '/anasayfa') {
        setSelectedCategory(null);
        setSelectedTopicId(null);
        setSelectedTopicSlug(null);
        setSelectedUserId(null);
        setShowProfile(false);
        setIsInitialLoad(false);
        return;
      }

      setIsInitialLoad(false);
    }
  }, [location.pathname, allCategoriesWithSubs, topics, isInitialLoad]);

  // Kategoriler yüklendikten sonra URL'den kategori okuma KALDIRILDI
  // Alt kategori seçildiğinde URL değişmemeli, bu yüzden URL'den kategori okuma da kaldırıldı
  // useEffect(() => {
  //   ...
  // }, [allCategoriesWithSubs, location.pathname, isInitialLoad, selectedCategory]);

  // State değişikliklerinde URL'i güncelle
  useEffect(() => {
    if (isInitialLoad) return; // İlk yüklemede URL'den state okunuyor, URL'i güncelleme

    // Success/Fail sayfaları için özel işlem yok
    if (currentPath === '/success' || currentPath === '/fail') {
      return;
    }

    // ÖNCE: Eğer tüm state'ler temizlenmişse (anasayfa), KESINLIKLE '/' yap ve çık
    if (!selectedCategory && !selectedTopicId && !selectedUserId && !showProfile) {
      if (location.pathname !== '/' && location.pathname !== '/anasayfa') {
        navigate('/', { replace: true });
        setCurrentPath('/');
      }
      return; // Anasayfadayken diğer kontrollere girmesin
    }

    let newPath: string | null = null;

    // Diğer sayfalar için URL belirleme
    if (selectedCategory === 'about') {
      newPath = '/about';
    } else if (selectedCategory === 'contact') {
      newPath = '/contact';
    } else if (selectedCategory === 'privacy') {
      newPath = '/privacy';
    } else if (selectedCategory === 'terms') {
      newPath = '/terms';
    } else if (selectedCategory === 'faq') {
      newPath = '/faq';
    } else if (selectedCategory === 'support') {
      newPath = '/support';
    } else if (selectedCategory === 'trending') {
      newPath = '/trending';
    } else if (selectedCategory === 'tools') {
      newPath = '/tools';
    } else if (selectedCategory === 'cv-creator') {
      newPath = '/tools/cv-creator';
    } else if (selectedCategory === 'youtube-downloader') {
      newPath = '/tools/youtube-downloader';
    } else if (selectedCategory === 'tiktok-downloader') {
      newPath = '/tools/tiktok-downloader';
    } else if (selectedCategory === 'instagram-downloader') {
      newPath = '/tools/instagram-downloader';
    } else if (selectedCategory === 'image-dpi-converter') {
      newPath = '/tools/image-dpi-converter';
    } else if (selectedCategory === 'clean-work') {
      newPath = '/tools/clean-work';
    } else if (selectedCategory === 'fenomen-gpt') {
      newPath = '/tools/fenomen-gpt';
    } else if (selectedCategory === 'lock-down-files') {
      newPath = '/tools/lock-down-files';
    } else if (selectedCategory === 'pdf-editor-converter') {
      newPath = '/tools/pdf-editor-converter';
    } else if (selectedTopicId && selectedTopicSlug) {
      // Topic sayfası
      newPath = `/topic/${selectedTopicSlug}`;
    } else if (selectedUserId) {
      // User profile sayfası
      newPath = `/user/${selectedUserId}`;
    }
    // Kategori sayfası için URL güncelleme YOK - kategori seçildiğinde URL değişmemeli
    // Kategori seçildiğinde newPath null kalır, URL güncellenmez

    // URL'i güncelle (sadece newPath set edildiyse)
    if (newPath && newPath !== location.pathname) {
      navigate(newPath, { replace: true });
      setCurrentPath(newPath);
    }
  }, [selectedCategory, selectedTopicId, selectedTopicSlug, selectedUserId, showProfile, allCategoriesWithSubs, isInitialLoad, navigate, location.pathname]);

  // Auth modal event listener
  useEffect(() => {
    const handleShowAuthModal = () => {
      setAuthModalOpen(true);
    };

    window.addEventListener('showAuthModal', handleShowAuthModal);
    return () => window.removeEventListener('showAuthModal', handleShowAuthModal);
  }, []);

  const loadUnreadMessageCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadMessageCount(count || 0);
    } catch (error) {
      console.error('Okunmamış mesaj sayısı yüklenirken hata:', error);
    }
  };

  // Cache'i temizleme fonksiyonu
  const clearCategoriesCache = () => {
    setCategoriesCache(null);
    setCacheTimestamp(0);
  };

  // History yönetimi için helper fonksiyon - önce tanımlanmalı
  const pushToHistory = (type: string, data: any) => {
    const currentState = {
      type: selectedTopicId ? 'topic' : selectedCategory ? 'category' : selectedUserId ? 'user' : showProfile ? 'profile' : 'home',
      data: {
        selectedCategory,
        selectedTopicId,
        selectedUserId,
        showProfile,
        selectedConversationId
      }
    };
    
    setHistoryStack(prev => [...prev, currentState]);
    window.history.pushState({ type, data }, '', window.location.pathname);
  };

  // Topic seçimi için helper fonksiyon - slug'ı otomatik bulur
  const setTopicWithSlug = async (topicId: string) => {
    setSelectedTopicId(topicId);
    
    // Topic slug'ını bul
    const topic = topics.find((t: any) => t.id === topicId);
    if (topic?.slug) {
      setSelectedTopicSlug(topic.slug);
    } else {
      // Topic henüz yüklenmemişse, slug'ı veritabanından al
      try {
        const { data } = await supabase
          .from('topics')
          .select('slug')
          .eq('id', topicId)
          .single();
        if (data) {
          const topicData = data as { slug: string | null };
          if (topicData.slug) {
            setSelectedTopicSlug(topicData.slug);
          }
        }
      } catch (error) {
        console.error('Topic slug bulunamadı:', error);
      }
    }
  };

  // Profil ziyareti için merkezi fonksiyon
  const handleViewProfile = (userId: string) => {
    // Mevcut state'i history'ye ekle
    pushToHistory('user', { userId });
    // Diğer seçimleri sıfırla
    setSelectedTopicId(null);
    setSelectedTopicSlug(null);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    // Profil sayfasını aç
    setSelectedUserId(userId);
  };

  useEffect(() => {
    loadFeaturedTopics().then(setFeaturedTopics);
  }, []);

  // Render backend'ini uyanık tutmak için otomatik ping mekanizması
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
        const apiBaseUrl = isDevelopment 
          ? `http://${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '192.168.0.6' : window.location.hostname}:3001`
          : 'https://devforum-backend-102j.onrender.com';
        
        // Backend'e health check ping gönder
        await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        console.log('✅ Backend ping başarılı');
      } catch (error) {
        // Hata olsa bile sessizce devam et (backend uyuyor olabilir)
        console.log('ℹ️ Backend ping hatası (normal olabilir):', error);
      }
    };

    // İlk ping - sayfa yüklendiğinde
    pingBackend();

    // Her 10 dakikada bir ping gönder (Render 15 dakikada uyuyor)
    const pingInterval = setInterval(() => {
      pingBackend();
    }, 10 * 60 * 1000); // 10 dakika

    // Sayfa görünür olduğunda da ping gönder (Page Visibility API)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pingBackend();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const loadCreditBalance = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || (error as any).status === 406) {
          setCreditBalance(0);
          return;
        }
        throw error;
      }
      
      setCreditBalance((data as any)?.balance || 0);
    } catch (error) {
      console.error('Kredi bakiyesi yükleme hatası:', error);
      setCreditBalance(0);
    }
  };


  const loadCategories = async () => {
    try {
      // Önbellek kontrolü - 5 dakika içindeyse cache'den yükle
      const now = Date.now();
      if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('📦 Kategoriler önbellekten yüklendi');
        setSubCategories(categoriesCache.subCategories);
        setAllCategoriesWithSubs(categoriesCache.allCategories);
        return;
      }

      console.log('🔄 Kategoriler veritabanından yükleniyor...');
      
      // OPTIMIZE EDİLMİŞ VERSİYON - Paralel sorgular ile hızlı yükleme
      const [categoriesResult, topicCountsResult, postCountsResult] = await Promise.all([
        // Ana kategorileri ve alt kategorileri çek
        supabase
          .from('main_categories')
          .select(`
            *,
            sub_categories (*)
          `)
          .order('order_index', { ascending: true }),
        
        // Tüm alt kategoriler için konu sayılarını tek sorguda çek
        supabase
          .from('topics')
          .select('sub_category_id')
          .not('sub_category_id', 'is', null),
        
        // Tüm konular için yorum sayılarını tek sorguda çek
        supabase
          .from('posts')
          .select(`
            topic_id,
            topics!inner(sub_category_id)
          `)
      ]);

      if (categoriesResult.error) {
        console.error('Kategoriler yüklenirken hata:', categoriesResult.error);
        return;
      }

      const categoriesData = categoriesResult.data;
      const topicCounts = topicCountsResult.data || [];
      const postCounts = postCountsResult.data || [];

      if (categoriesData && categoriesData.length > 0) {
        // Konu sayılarını hesapla
        const topicCountMap = topicCounts.reduce((acc: any, topic: any) => {
          acc[topic.sub_category_id] = (acc[topic.sub_category_id] || 0) + 1;
          return acc;
        }, {});

        // Yorum sayılarını hesapla
        const postCountMap = postCounts.reduce((acc: any, post: any) => {
          const subCategoryId = post.topics?.sub_category_id;
          if (subCategoryId) {
            acc[subCategoryId] = (acc[subCategoryId] || 0) + 1;
          }
          return acc;
        }, {});

        // Yazılım Dünyası kategorisini bul ve subCategories state'ini güncelle
        const yazilimDunyasi = categoriesData.find((cat: any) => 
          cat.slug === 'yazilim-dunyasi'
        );

        let processedSubCats: any[] = [];
        if (yazilimDunyasi && (yazilimDunyasi as any).sub_categories) {
          processedSubCats = (yazilimDunyasi as any).sub_categories.map((sub: any) => ({
            ...sub,
            topic_count: topicCountMap[sub.id] || 0,
            post_count: postCountMap[sub.id] || 0
          }));
        } else if (categoriesData.length > 0) {
          // Fallback: İlk kategorinin alt kategorilerini kullan
          const firstCategory = categoriesData[0];
          if ((firstCategory as any).sub_categories) {
            processedSubCats = (firstCategory as any).sub_categories.map((sub: any) => ({
              ...sub,
              topic_count: topicCountMap[sub.id] || 0,
              post_count: postCountMap[sub.id] || 0
            }));
          }
        }

        // Tüm kategorileri işle ve allCategoriesWithSubs state'ini güncelle
        const processedCategories = categoriesData.map((cat: any) => ({
          ...cat,
          sub_categories: cat.sub_categories ? cat.sub_categories.map((sub: any) => ({
            ...sub,
            topic_count: topicCountMap[sub.id] || 0,
            post_count: postCountMap[sub.id] || 0
          })) : []
        }));

        // State'leri güncelle
        setSubCategories(processedSubCats);
        setAllCategoriesWithSubs(processedCategories);

        // Önbelleğe kaydet
        setCategoriesCache({
          subCategories: processedSubCats,
          allCategories: processedCategories
        });
        setCacheTimestamp(now);
        
        console.log('✅ Kategoriler başarıyla yüklendi ve önbelleğe kaydedildi');
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken genel hata:', error);
    }
  };


  useEffect(() => {
    // Sadece ana sayfa ve özel sayfalar için loadTopics çağır
    if (selectedCategory === null || 
        selectedCategory === 'trending' || 
        selectedCategory === 'saved' ||
        selectedCategory === 'tools' ||
        selectedCategory?.startsWith('youtube-') ||
        selectedCategory?.startsWith('image-') ||
        selectedCategory?.startsWith('lock-') ||
        selectedCategory?.startsWith('tiktok-') ||
        selectedCategory?.startsWith('clean-') ||
        selectedCategory?.startsWith('fenomen-') ||
        selectedCategory === 'cv-creator' ||
        selectedCategory === 'pdf-editor-converter') {
      loadTopics();
    }
  }, [selectedCategory, selectedMenuTab]);


  const loadTopics = async () => {
    setLoading(true);
    let query = supabase
      .from('topics')
      .select(`
        *,
        author:profiles!topics_author_id_fkey(display_name, username, avatar_url, reputation, active_badge_icon),
        sub_category:sub_categories(
          name, 
          color,
          main_category:main_categories(name)
        )
      `);

    // Eğer alt kategori seçilmişse, o kategorinin konularını getir
    if (selectedCategory && subCategories.some(sub => sub.id === selectedCategory)) {
      query = query.eq('sub_category_id', selectedCategory);
    } else if (selectedCategory === null) {
      // Ana sayfa - tüm konuları getir
      
      // Sıralama mantığı
      switch (selectedMenuTab) {
        case 'featured':
          // Öne çıkan: Sabitlenmiş konular + yüksek etkileşimli konular
          query = query.order('is_pinned', { ascending: false }).order('useful_count', { ascending: false }).order('reply_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('is_pinned', { ascending: false }).order('last_post_at', { ascending: false });
          break;
        case 'popular':
          // Popülerlik skoru: (yorum_sayısı * 3) + (görüntüleme_sayısı / 2)
          // Bu hesaplama veritabanında yapılamayacağı için tüm konuları çekip frontend'de sıralayacağız
          break;
        case 'urgent':
          // Acil tabında sıralama: sabitlenmiş + en son oluşturulan
          query = query
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'blog':
          // Blog: En son oluşturulan konular
          query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_pinned', { ascending: false }).order('last_post_at', { ascending: false });
      }
    }

    const { data } = await query;

    if (data) {
      let sortedTopics = data as any;
      
      // Popülerlik sıralaması için özel hesaplama
      if (selectedMenuTab === 'popular') {
        sortedTopics = sortedTopics.sort((a: any, b: any) => {
          // Popülerlik skoru: (yorum_sayısı * 3) + (görüntüleme_sayısı / 2)
          const scoreA = (a.reply_count * 3) + (a.view_count / 2);
          const scoreB = (b.reply_count * 3) + (b.view_count / 2);
          
          // Önce sabitlenmiş konular, sonra skora göre sırala
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          return scoreB - scoreA; // Yüksek skor önce
        });
      } else if (selectedMenuTab === 'urgent') {
        // Yalnızca "Acil Cevap" ana kategorisine ait konuları göster
        sortedTopics = sortedTopics.filter(
          (t: any) => t?.sub_category?.main_category?.name === 'Acil Cevap'
        );
      }
      
      setTopics(sortedTopics);
    }
    setLoading(false);
  };

  const loadFeaturedTopics = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('featured_forms')
        .select(`
          *,
          topic:topics(
            id,
            title,
            content,
            created_at,
            reply_count,
            view_count,
            is_pinned,
            is_locked,
            last_post_at,
            author:profiles!topics_author_id_fkey(display_name, username, avatar_url, reputation, active_badge_icon),
            sub_category:sub_categories(
              name, 
              color,
              main_category:main_categories(name)
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (error) throw error;
      // Maksimum 10 öne çıkan form göster
      return (data || []).slice(0, 10);
    } catch (error) {
      console.error('❌ Öne çıkan formlar yüklenirken hata:', error);
      return [];
    }
  };

  const handleShowNewTopic = () => {
    setNewTopicModalOpen(true);
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };


  const handleBannerRentalSuccess = () => {
    loadCreditBalance(); // Kredi bakiyesini yenile
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
      'MessageSquare': MessageSquare,
      'Activity': Activity,
      'Crown': Crown,
      'PenTool': PenTool,
      'DollarSign': DollarSign,
      'Bitcoin': Bitcoin,
      'Languages': Languages,
      'CheckSquare': CheckSquare,
      'Layers': Layers,
      'Gavel': Gavel,
      'Package': Package,
      'Clock': Clock,
      'Calculator': Calculator,
      'Sparkles': Sparkles,
      'Server': Server,
      'Database': Database,
      'Key': Key,
      'Settings': Settings,
      'AlertTriangle': AlertTriangle,
      'Tablet': Tablet,
      'Download': Download,
      'Apple': Apple,
      'Play': Play,
      'TestTube': TestTube,
      'FileCode': FileCode,
      'Puzzle': Puzzle,
      'Eye': Eye,
      'HelpCircle': HelpCircle,
      'Type': Type,
      'Mail': Mail,
      'MousePointer': MousePointer,
      'AlertCircle': AlertCircle,
      // Emoji ikonları için mapping
      '🔍': Search,
      '📱': Smartphone,
      '💰': Coins,
      '✍️': Edit,
      '🌐': Globe,
      '🎨': Palette,
      '🖥️': Monitor,
      '🚨': AlertCircle,
      '📲': Smartphone,
      '💻': Laptop,
      '🎁': Gift,
      '🛍️': ShoppingBag,
      '📊': BarChart3,
      '💼': Briefcase,
      '💬': MessageCircle,
      '🎮': Gamepad2,
      '🎯': Target,
      '🚀': Rocket,
      '🧠': Brain,
      '🔒': Shield,
      '📝': FileText,
      '📈': TrendingUp,
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
      '🌍': Globe,
      '🎵': Music,
      '🎬': Video,
      '📷': Camera,
      '🎭': Theater,
      '🏠': Home,
      '🏢': Building,
      '🏪': Store,
      '🏥': Heart,
      '🎓': GraduationCap,
      '🔧': Wrench,
      '⚡': Zap,
      '🔥': Flame,
      '💎': Gem,
      '🌟': Star,
      '🌙': Moon,
      '☀️': Sun,
      '🌈': Rainbow,
      '🎊': PartyPopper,
      '🎉': PartyPopper,
      '❤️': Heart,
      '💚': Heart,
      '💙': Heart,
      '💜': Heart,
      '🖤': Heart,
      '🤍': Heart,
      '💛': Heart,
      '🧡': Heart,
      '💔': Heart,
      '💕': Heart,
      '💖': Heart,
      '💗': Heart,
      '💘': Heart,
    };

    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    
    // Fallback için varsayılan ikon
    return <Monitor className={className} />;
  };

  // E-posta doğrulama kontrolü geçici olarak devre dışı
  // if (user && !user.email_confirmed_at) {
  //   return <EmailVerification email={user.email || ''} />;
  // }

  // Success/Fail sayfaları kontrolü
  if (currentPath === '/success') {
    return <MySuccessPage />; // KENDİ SAYFANIZI BURAYA GÖSTER
  }

  if (currentPath === '/fail') {
    return <MyFailPage />; // KENDİ FAIL SAYFANIZI BURAYA GÖSTER
  }

  const handleOpenTopic = async (topicId: string) => {
    try {
      // Mevcut state'i history'ye ekle
      pushToHistory('topic', { topicId });
      
      // Topic slug'ını bul
      const topic = topics.find((t: any) => t.id === topicId);
      const topicSlug = topic?.slug;
      
      // Eğer topic henüz yüklenmemişse, slug'ı veritabanından al
      if (!topicSlug) {
        const { data } = await supabase
          .from('topics')
          .select('slug')
          .eq('id', topicId)
          .single();
        if (data) {
          const topicData = data as { slug: string | null };
          if (topicData.slug) {
            setSelectedTopicSlug(topicData.slug);
          }
        }
      } else {
        setSelectedTopicSlug(topicSlug);
      }
      
      // DB'ye anında +1 yap (RPC ile atomik artırım)
      await (supabase as any).rpc('increment_topic_view', {
        p_topic_id: topicId
      });
      // UI'da hemen +1 göster (optimistic update)
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, view_count: (t.view_count || 0) + 1 } : t));
      setFeaturedTopics(prev => prev.map((ft: any) =>
        ft.topic?.id === topicId
          ? { ...ft, topic: { ...ft.topic, view_count: (ft.topic.view_count || 0) + 1 } }
          : ft
      ));
      setPreIncrementedFlag(true); // TopicView'da tekrar artırma
    } catch (error) {
      console.error('View artırma hatası:', error);
      // Hata olsa bile optimistic update yap
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, view_count: (t.view_count || 0) + 1 } : t));
      setFeaturedTopics(prev => prev.map((ft: any) =>
        ft.topic?.id === topicId
          ? { ...ft, topic: { ...ft.topic, view_count: (ft.topic.view_count || 0) + 1 } }
          : ft
      ));
      setPreIncrementedFlag(false); // Hata durumunda TopicView'da artır
    } finally {
      setSelectedTopicId(topicId);
    }
  };

  // Dinamik meta tag'ler için sayfa bilgileri
  const getPageMeta = () => {
    const baseUrl = 'https://devforum.xyz';
    const path = location.pathname;
    
    const pageMeta: Record<string, { title: string; description: string; canonical: string }> = {
      '/': {
        title: 'DevForum - Türkiye\'nin En Büyük Yazılım ve Teknoloji Forumu',
        description: 'Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye\'nin en aktif forum platformu',
        canonical: `${baseUrl}/`
      },
      '/about': {
        title: 'Hakkımızda - DevForum',
        description: 'DevForum hakkında bilgiler, misyonumuz ve vizyonumuz',
        canonical: `${baseUrl}/about`
      },
      '/contact': {
        title: 'İletişim - DevForum',
        description: 'DevForum ile iletişime geçin, sorularınızı sorun',
        canonical: `${baseUrl}/contact`
      },
      '/privacy': {
        title: 'Gizlilik Politikası - DevForum',
        description: 'DevForum gizlilik politikası ve kişisel verilerin korunması',
        canonical: `${baseUrl}/privacy`
      },
      '/terms': {
        title: 'Kullanım Şartları - DevForum',
        description: 'DevForum kullanım şartları ve kuralları',
        canonical: `${baseUrl}/terms`
      },
      '/faq': {
        title: 'Sık Sorulan Sorular - DevForum',
        description: 'DevForum hakkında sık sorulan sorular ve cevapları',
        canonical: `${baseUrl}/faq`
      },
      '/support': {
        title: 'Destek - DevForum',
        description: 'DevForum destek sayfası, yardım ve teknik destek',
        canonical: `${baseUrl}/support`
      },
      '/trending': {
        title: 'Trend Konular - DevForum',
        description: 'DevForum\'da en popüler ve trend konular',
        canonical: `${baseUrl}/trending`
      },
      '/tools': {
        title: 'Araçlar - DevForum',
        description: 'DevForum ücretsiz online araçlar: CV oluşturucu, video indirici, DPI dönüştürücü ve daha fazlası',
        canonical: `${baseUrl}/tools`
      }
    };

    // Tools alt sayfaları
    if (path.startsWith('/tools/')) {
      const toolName = path.replace('/tools/', '').replace(/-/g, ' ');
      return {
        title: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} - DevForum Araçlar`,
        description: `DevForum ${toolName} aracı - Ücretsiz online araç`,
        canonical: `${baseUrl}${path}`
      };
    }

    // Kategori sayfaları
    if (path.startsWith('/kategori/')) {
      const categoryName = path.replace('/kategori/', '').replace(/-/g, ' ');
      return {
        title: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} - DevForum`,
        description: `DevForum ${categoryName} kategorisi - Konular, tartışmalar ve daha fazlası`,
        canonical: `${baseUrl}${path}`
      };
    }

    // Topic sayfaları
    if (path.startsWith('/topic/')) {
      return {
        title: 'Konu - DevForum',
        description: 'DevForum konu detay sayfası',
        canonical: `${baseUrl}${path}`
      };
    }

    // /anasayfa için canonical'ı / olarak ayarla (duplicate content önleme)
    if (path === '/anasayfa') {
      return {
        title: 'DevForum - Türkiye\'nin En Büyük Yazılım ve Teknoloji Forumu',
        description: 'Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye\'nin en aktif forum platformu',
        canonical: `${baseUrl}/`
      };
    }

    return pageMeta[path] || {
      title: 'DevForum - Türkiye\'nin En Büyük Yazılım ve Teknoloji Forumu',
      description: 'Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye\'nin en aktif forum platformu',
      canonical: `${baseUrl}${path}`
    };
  };

  const meta = getPageMeta();

  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.canonical} />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
      </Helmet>
      <div className="min-h-screen bg-white max-w-full overflow-x-auto">
        <Header
        onMenuClick={() => setIsSidebarOpen(true)}
        onShowAuth={(mode) => {
          if (showRequestInvite) {
            setShowRequestInvite(false);
          }
          setAuthModalOpen(true);
          setAuthMode(mode);
        }}
        onShowNewTopic={handleShowNewTopic}
        onShowProfile={handleShowProfile}
        onGoHome={() => {
          // Eğer davet kodu sayfası açıksa, onu kapat
          if (showRequestInvite) {
            setShowRequestInvite(false);
            return;
          }
          // ÖNCE URL'yi kesinlikle anasayfaya yönlendir
          navigate('/', { replace: true });
          setCurrentPath('/');
          // SONRA state'leri temizle - böylece useEffect kategori set edemez
          setHistoryStack([]);
          setSelectedCategory(null);
          setSelectedSubCategory(null);
          setSelectedTopicId(null);
          setSelectedTopicSlug(null);
          setSelectedUserId(null);
          setShowProfile(false);
          setSelectedConversationId(null);
        }}
        onTopicClick={(topicId) => setTopicWithSlug(topicId)}
        onShowMessages={(conversationId) => {
          setSelectedCategory('messages');
          setSelectedConversationId(conversationId || null);
        }}
      />

      <div className="flex max-w-full">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            // Eğer anasayfa seçildiyse (null), history stack'i temizle ve direkt anasayfaya git
            if (cat === null) {
              // ÖNCE URL'yi kesinlikle anasayfaya yönlendir
              navigate('/', { replace: true });
              setCurrentPath('/');
              // SONRA state'leri temizle
              setHistoryStack([]);
              setSelectedCategory(null);
              setSelectedSubCategory(null);
              setSelectedTopicId(null);
              setSelectedTopicSlug(null);
              setSelectedUserId(null);
              setShowProfile(false);
              setSelectedConversationId(null);
              return;
            }
            
            // Mevcut state'i history'ye ekle
            if (selectedCategory || selectedTopicId || selectedUserId || showProfile) {
              pushToHistory(cat === 'profile' ? 'profile' : cat === 'tools' ? 'tools' : cat === 'trending' ? 'trending' : cat === 'saved' ? 'saved' : cat === 'messages' ? 'messages' : 'category', { category: cat });
            }
            
            setSelectedCategory(cat);
            setSelectedTopicId(null);
            setSelectedSubCategory(null); // Alt kategori seçimini sıfırla
            setSelectedUserId(null); // Kullanıcı profil görünümünü sıfırla
            
            if (cat === 'profile') {
              setShowProfile(true);
            } else if (cat === 'tools') {
              setSelectedCategory('tools'); // Tools sayfasına yönlendir
              setShowProfile(false);
            } else {
              setShowProfile(false);
            }
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          creditBalance={creditBalance}
          onBannerRental={() => setShowBannerRental(true)}
          onBannerControl={() => setShowBannerControl(true)}
          onFeaturedClick={() => setShowFeaturedModal(true)}
          onCreditPurchase={() => setShowCreditPurchase(true)}
          user={user}
          unreadMessageCount={unreadMessageCount}
          onShowAuth={() => setAuthModalOpen(true)}
        />

        <main className={`flex-1 min-h-screen bg-gray-50 transition-all duration-500 ease-in-out max-w-full overflow-x-hidden pt-16 lg:pt-20 ${isSidebarCollapsed ? 'lg:ml-16 sm:lg:ml-20' : 'lg:ml-64'}`}>
          {/* Davet Kodu Talep Sayfası */}
          {showRequestInvite ? (
            <RequestInvitePage
              onBack={() => {
                setShowRequestInvite(false);
                // Eğer localStorage'da invite code varsa modal'ı aç
                if (localStorage.getItem('pendingInviteCode')) {
                  setAuthModalOpen(true);
                  setAuthMode('register');
                }
              }}
            />
          ) : selectedUserId ? (
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-full">
              <UserProfile
                userId={selectedUserId}
                onBack={() => {
                  if (historyStack.length > 0) {
                    window.history.back();
                  } else {
                    setSelectedUserId(null);
                    setSelectedCategory(null);
                    setShowProfile(false);
                  }
                }}
                onViewProfile={handleViewProfile}
                onShowAuth={() => setAuthModalOpen(true)}
              />
            </div>
          ) : selectedTopicId ? (
            /* Konu detay sayfası */
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-full overflow-x-hidden">
              <TopicView
                topicId={selectedTopicId}
                onBack={() => {
                  if (historyStack.length > 0) {
                    window.history.back();
                  } else {
                    setSelectedTopicId(null);
                    setPreIncrementedFlag(false);
                    // Konu listesini yenile
                    loadTopics();
                    // Eğer alt kategorideyse, alt kategori sayfasına dön
                    if (selectedCategory && subCategories.some(sub => sub.id === selectedCategory)) {
                      // Alt kategori sayfasında kal
                    } else {
                      // Ana sayfaya dön
                      setSelectedCategory(null);
                    }
                  }
                }}
                onViewProfile={handleViewProfile}
                onReplyCountUpdate={() => {
                  loadTopics();
                }}
                onUsefulCountUpdate={() => {
                  loadTopics();
                }}
                onSaveToggle={() => {
                  if (selectedCategory === 'saved') {
                    loadTopics();
                  }
                }}
                preIncremented={preIncrementedFlag}
              />
            </div>
          ) : selectedCategory && subCategories.some(sub => sub.id === selectedCategory) ? (
              <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
              {/* Geri Tuşu - Mobilde Header'ın altında tam genişlik */}
              <button
                onClick={() => {
                  if (historyStack.length > 0) {
                    window.history.back();
                  } else {
                    setSelectedCategory(null);
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors md:static fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm md:border-0 md:shadow-none md:px-0 md:py-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium md:inline">Geri Dön</span>
              </button>
              
              {/* Mobilde geri tuşu için padding */}
              <div className="md:hidden h-[60px]"></div>
              
              {/* Geri tuşu ve başlık */}
              <div className="mb-6">

                {(() => {
                  const selectedSubCategory = subCategories.find(sub => sub.id === selectedCategory);
                  return selectedSubCategory ? (
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: selectedSubCategory.color + '20' }}
                      >
                        {renderIcon(selectedSubCategory.icon, "w-8 h-8")}
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{selectedSubCategory.name}</h1>
                        <p className="text-gray-600 mt-1">{selectedSubCategory.description}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Banner 1 - Üst - Sadece Desktop */}
              <div className="hidden md:block">
                <AdBanner position={1} className="mb-6 flex-1" />
              </div>

              {/* Konular listesi */}
              <div className="bg-white rounded-lg border border-gray-200">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <span className="text-3xl">📝</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Henüz konu yok
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Bu kategoride henüz hiç konu açılmamış. İlk konuyu sen aç!
                    </p>
                    <button
                      onClick={handleShowNewTopic}
                      className="px-6 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      Yeni Konu Oluştur
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    {topics.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        onClick={() => handleOpenTopic(topic.id)}
                        onViewProfile={handleViewProfile}
                        onTopicDeleted={() => {
                          loadTopics();
                        }}
                        showSubcategory={false}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Banner 2 - Alt - Sadece Desktop */}
              <div className="hidden md:block">
                <AdBanner position={2} className="mt-6 flex-1" />
              </div>

              {/* Banner 3 - En Alt - Sadece Desktop */}
              <div className="hidden md:block">
                <AdBanner position={3} className="mt-6 flex-1" />
              </div>
            </div>
          ) : showProfile ? (
            <ProfilePage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setShowProfile(false);
                }
              }} 
              onViewProfile={handleViewProfile}
            />
          ) : selectedCategory === 'trending' ? (
            <TrendingPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }} 
              onTopicClick={(topicId) => {
                handleOpenTopic(topicId);
              }}
              onViewProfile={handleViewProfile}
            />
          ) : selectedCategory === 'saved' ? (
            <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
              <SavedPage 
                onBack={() => {
                  if (historyStack.length > 0) {
                    window.history.back();
                  } else {
                    setSelectedCategory(null);
                  }
                }} 
                onTopicClick={(topicId) => {
                  pushToHistory('topic', { topicId });
                  setSelectedTopicId(topicId);
                }}
                onViewProfile={handleViewProfile}
              />
            </div>
          ) : selectedCategory === 'messages' ? (
            <MessagesPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                  setSelectedConversationId(null);
                }
              }} 
              onUnreadCountUpdate={loadUnreadMessageCount}
              onViewProfile={handleViewProfile}
              initialConversationId={selectedConversationId}
            />
          ) : selectedCategory === 'tools' ? (
            <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
              <ToolsPage 
                onBack={() => {
                  if (historyStack.length > 0) {
                    window.history.back();
                  } else {
                    setSelectedCategory(null);
                  }
                }} 
                onSelectTool={(toolId) => {
                  pushToHistory('tools', { toolId });
                  setSelectedCategory(toolId);
                }}
              />
            </div>
          ) : selectedCategory === 'about' ? (
            <AboutPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedCategory === 'contact' ? (
            <ContactPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedCategory === 'privacy' ? (
            <PrivacyPolicyPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedCategory === 'terms' ? (
            <TermsOfServicePage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedCategory === 'faq' ? (
            <FAQPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedCategory === 'support' ? (
            <SupportPage 
              onBack={() => {
                if (historyStack.length > 0) {
                  window.history.back();
                } else {
                  setSelectedCategory(null);
                }
              }}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ) : selectedTopicId ? (
            /* Konu detay sayfası */
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-full overflow-x-hidden">
              <TopicView
                topicId={selectedTopicId}
                onBack={() => { setSelectedTopicId(null); setPreIncrementedFlag(false); }}
                onViewProfile={handleViewProfile}
                onReplyCountUpdate={() => {}}
                onUsefulCountUpdate={() => {}}
                onSaveToggle={(topicId, isSaved) => {
                  console.log('Save toggle for topic:', topicId, isSaved);
                  // Kaydedilenler listesini yenile
                  if (selectedCategory === 'saved') {
                    loadTopics();
                  }
                }}
                preIncremented={preIncrementedFlag}
              />
            </div>
          ) : selectedCategory === 'tiktok-downloader' ? (
            <TikTokDownloader onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory === 'instagram-downloader' ? (
            <InstagramDownloader onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory === 'clean-work' ? (
            <CleanWork onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory === 'fenomen-gpt' ? (
            <FenomenGPT onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory === 'image-dpi-converter-pro' ? (
            <ImageDPIConverterPro onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory === 'pdf-editor-converter' ? (
            <PDFEditorConverter onBack={() => setSelectedCategory(null)} />
          ) : selectedCategory && selectedCategory !== 'trending' && selectedCategory !== 'saved' && selectedCategory !== 'profile' && selectedCategory !== 'tools' && selectedCategory !== 'about' && selectedCategory !== 'contact' && selectedCategory !== 'privacy' && selectedCategory !== 'terms' && selectedCategory !== 'faq' && selectedCategory !== 'support' && !selectedCategory.startsWith('youtube-') && !selectedCategory.startsWith('image-') && !selectedCategory.startsWith('lock-') && !selectedCategory.startsWith('tiktok-') && !selectedCategory.startsWith('clean-') && !selectedCategory.startsWith('fenomen-') && selectedCategory !== 'cv-creator' && selectedCategory !== 'pdf-editor-converter' ? (
            /* Kategori sayfası */
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 max-w-full overflow-x-hidden">
              <CategoryPage
                key={refreshKey}
                categoryId={selectedCategory}
                initialSubCategory={selectedSubCategory || undefined}
                onBack={() => {
                  // ÖNCE URL'yi kesinlikle anasayfaya yönlendir
                  navigate('/', { replace: true });
                  setCurrentPath('/');
                  // SONRA state'leri temizle
                  setHistoryStack([]);
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                onTopicClick={(topicId) => {
                  pushToHistory('topic', { topicId });
                  setSelectedTopicId(topicId);
                }}
                onViewProfile={handleViewProfile}
                onViewCountUpdate={() => {}}
                onReplyCountUpdate={() => {}}
                onUsefulCountUpdate={() => {}}
              />
            </div>
          ) : (
            /* Ana sayfa - Boş */
            <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 overflow-x-hidden">
              {selectedCategory !== null && selectedCategory !== 'tools' && selectedCategory !== 'trending' && selectedCategory !== 'saved' && selectedCategory !== 'about' && selectedCategory !== 'contact' && selectedCategory !== 'privacy' && selectedCategory !== 'terms' && selectedCategory !== 'faq' && selectedCategory !== 'support' && (
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {selectedCategory === 'profile' && 'Profilim'}
                    {selectedCategory === 'cv-creator' && 'CV Creator'}
                    {selectedCategory === 'youtube-downloader' && 'YouTube Video Downloader'}
                    {selectedCategory === 'image-dpi-converter' && 'Image DPI Converter'}
                    {selectedCategory === 'lock-down-files' && 'Lock Down Files'}
                    {selectedCategory === 'tiktok-downloader' && 'TikTok Video Downloader'}
                    {selectedCategory === 'clean-work' && 'Clean Work'}
                    {selectedCategory === 'fenomen-gpt' && 'Fenomen GPT'}
                    {selectedCategory === 'image-dpi-converter-pro' && 'Image DPI Converter Pro'}
                    {selectedCategory === 'pdf-editor-converter' && 'Format Dönüştürücü'}
                  </h2>
                  <p className="text-gray-600">
                    {selectedCategory === 'profile' && 'Profil bilgileriniz'}
                    {selectedCategory === 'cv-creator' && 'Profesyonel CV oluşturun'}
                    {selectedCategory === 'youtube-downloader' && 'YouTube videolarını indirin'}
                    {selectedCategory === 'image-dpi-converter' && 'Görsellerinizin DPI değerini değiştirin'}
                    {selectedCategory === 'lock-down-files' && 'Dosyalarınızı güvenli hale getirin'}
                    {selectedCategory === 'tiktok-downloader' && 'TikTok videolarını indirin'}
                    {selectedCategory === 'clean-work' && 'Temiz ve düzenli çalışma ortamı'}
                    {selectedCategory === 'fenomen-gpt' && 'Yapay zeka destekli GPT aracı'}
                    {selectedCategory === 'image-dpi-converter-pro' && 'Gelişmiş DPI dönüştürme aracı'}
                    {selectedCategory === 'pdf-editor-converter' && 'Tüm dosya formatlarınızı kolayca dönüştürün'}
                  </p>
                </div>
              )}

              {selectedCategory === null ? (
                /* Ana sayfa - Araçlar */
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
                  {/* Reklam Bannerları - Sadece Desktop */}
                  <div className="hidden md:flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <AdBanner position={1} className="flex-1" />
                    <AdBanner position={2} className="flex-1" />
                    <AdBanner position={3} className="flex-1" />
                  </div>

                  {/* Yatay Menü */}
                  <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-1 sm:p-2.5 mb-3 sm:mb-6">
                    <div className="flex flex-wrap gap-0.5 sm:gap-2">
                      {[
                        { id: 'featured', label: 'Öne Çıkan', icon: Star, shortLabel: 'Öne Çıkan' },
                        { id: 'recent', label: 'Son Konular', icon: History, shortLabel: 'Son' },
                        { id: 'popular', label: 'Popüler', icon: TrendingUp, shortLabel: 'Popüler' },
                        { id: 'blog', label: 'Blog', icon: Edit, shortLabel: 'Blog' },
                        { id: 'urgent', label: 'Acil Cevap', icon: AlertCircle, shortLabel: 'Acil' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedMenuTab(tab.id)}
                          className={`px-1.5 sm:px-4 py-0.5 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-all flex items-center gap-0.5 sm:gap-2 ${
                            selectedMenuTab === tab.id
                              ? 'bg-[#9c6cfe] text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <tab.icon className="w-2.5 h-2.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden text-xs">{tab.shortLabel}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dinamik Konular Bölümü */}
                  <div className="bg-white rounded-md border border-gray-200 mb-8 overflow-hidden">
                    {selectedMenuTab === 'blog' ? (
                      /* Blog Yakında Mesajı */
                      <div className="text-center py-16 p-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] mb-4">
                          <Edit className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          Blog Yakında!
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Blog bölümü yakında hizmetinizde olacak. Yazılarınızı paylaşabilecek ve okuyabileceksiniz.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-[#9c6cfe] rounded-full animate-pulse"></div>
                          <span>Geliştirme aşamasında</span>
                        </div>
                      </div>
                    ) : selectedMenuTab === 'featured' ? (
                      /* Öne Çıkan Formlar */
                      <div>
                        {featuredTopics.length === 0 ? (
                          <div className="text-center py-16 p-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] mb-4">
                              <Star className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                              Henüz Öne Çıkan Form Yok
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                              Öne çıkan formlar burada görünecek. Formunuzu öne çıkarmak için sol alt köşedeki butonu kullanın.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 bg-[#9c6cfe] rounded-full animate-pulse"></div>
                              <span>Form öne çıkarma sistemi aktif</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {featuredTopics.map((featured, index) => (
                              <div key={featured.id} className="relative">
                                <TopicCard
                                  topic={{
                                    ...featured.topic,
                                    is_featured: true,
                                    featured_position: index + 1
                                  }}
                                  onClick={() => handleOpenTopic(featured.topic.id)}
                                  onViewProfile={handleViewProfile}
                                  onTopicDeleted={() => {
                                    loadTopics();
                                    loadFeaturedTopics().then(setFeaturedTopics);
                                  }}
                                  compact={true}
                                  showSubcategory={false}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : loading ? (
                      <div className="flex items-center justify-center h-32 p-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
                      </div>
                    ) : topics.length === 0 ? (
                      <div className="text-center py-4 sm:py-6 p-4 sm:p-6">
                        <div className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-100 mb-2 sm:mb-3">
                          <span className="text-lg sm:text-2xl">📝</span>
                        </div>
                        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                          Henüz konu yok
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                          İlk konuyu siz oluşturun ve tartışmayı başlatın!
                        </p>
                        <button
                          onClick={handleShowNewTopic}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
                        >
                          Yeni Konu Oluştur
                        </button>
                      </div>
                    ) : (
                      <div>
                        {topics.slice(0, 10).map((topic) => (
                          <TopicCard
                            key={topic.id}
                            topic={topic}
                            onClick={() => setTopicWithSlug(topic.id)}
                            onViewProfile={handleViewProfile}
                            onTopicDeleted={() => {
                              loadTopics();
                            }}
                            compact={true}
                            showSubcategory={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FAVORİ KATEGORİLER KUTUSU - En Üstte */}
                  {user && (
                  <div className={`bg-white rounded-lg sm:rounded-xl border-2 p-4 sm:p-6 mb-6 sm:mb-8 min-h-[120px] sm:min-h-[150px] flex items-center justify-center ${
                    showAddToFavoritesMode 
                      ? 'border-[#9c6cfe] border-solid' 
                      : 'border-dashed border-gray-300'
                  }`}>
                    {getFavoriteSubCategories().length === 0 ? (
                      // Boş durum - + butonu
                      <button
                        onClick={() => setShowAddToFavoritesMode(true)}
                        className="flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-[#9c6cfe] transition-colors"
                      >
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                          showAddToFavoritesMode
                            ? 'border-[#9c6cfe] border-solid bg-[#9c6cfe]/10'
                            : 'border-dashed border-gray-300 hover:border-[#9c6cfe]'
                        }`}>
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {showAddToFavoritesMode ? 'Alt kategorilerden seçin' : 'Favori Kategori Ekle'}
                        </span>
                        {showAddToFavoritesMode && (
                          <div className="mt-2 flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAddToFavoritesMode(false);
                                setSelectedCategoriesToAdd([]);
                              }}
                              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              İptal
                            </button>
                            {selectedCategoriesToAdd.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveSelectedFavorites();
                                }}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all font-medium"
                              >
                                Kaydet ({selectedCategoriesToAdd.length})
                              </button>
                            )}
                          </div>
                        )}
                      </button>
                    ) : (
                      // Favori kategoriler listesi
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-[#9c6cfe] fill-[#9c6cfe]" />
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Favori Kategorilerim</h2>
                            {showAddToFavoritesMode && (
                              <span className="text-xs text-[#9c6cfe] font-medium">(Ekleme modu aktif)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {showAddToFavoritesMode && (
                              <>
                                <button
                                  onClick={() => {
                                    setShowAddToFavoritesMode(false);
                                    setSelectedCategoriesToAdd([]);
                                  }}
                                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  İptal
                                </button>
                                <button
                                  onClick={saveSelectedFavorites}
                                  disabled={selectedCategoriesToAdd.length === 0}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                  Kaydet ({selectedCategoriesToAdd.length})
                                </button>
                              </>
                            )}
                            {showRemoveFromFavoritesMode && (
                              <button
                                onClick={() => {
                                  setShowRemoveFromFavoritesMode(false);
                                }}
                                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                İptal
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (showAddToFavoritesMode) {
                                  setShowAddToFavoritesMode(false);
                                  setSelectedCategoriesToAdd([]);
                                } else {
                                  setShowAddToFavoritesMode(true);
                                  setSelectedCategoriesToAdd([]);
                                }
                                if (showRemoveFromFavoritesMode) setShowRemoveFromFavoritesMode(false);
                              }}
                              className={`p-2 rounded-full transition-colors ${
                                justAddedFavorite
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : showAddToFavoritesMode
                                  ? 'bg-[#9c6cfe] text-white hover:bg-[#8a5cf0]'
                                  : 'hover:bg-gray-100'
                              }`}
                              title={showAddToFavoritesMode ? "Ekleme Modunu Kapat" : "Favori Ekle"}
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            {getFavoriteSubCategories().length > 0 && (
                              <button
                                onClick={() => {
                                  setShowRemoveFromFavoritesMode(!showRemoveFromFavoritesMode);
                                  if (showAddToFavoritesMode) setShowAddToFavoritesMode(false);
                                }}
                                className={`p-2 rounded-full transition-colors ${
                                  showRemoveFromFavoritesMode
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'hover:bg-gray-100'
                                }`}
                                title={showRemoveFromFavoritesMode ? "Kaldırma Modunu Kapat" : "Favoriden Kaldır"}
                              >
                                <Minus className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          {getFavoriteSubCategories().map((favSubCat: any) => {
                            // Ana kategoriyi bul
                            const mainCat = allCategoriesWithSubs.find(cat => 
                              cat.sub_categories?.some((sc: any) => sc.id === favSubCat.id)
                            );
                            return (
                              <button
                                key={favSubCat.id}
                                onClick={() => {
                                  if (mainCat) {
                                    setSelectedCategory(mainCat.id);
                                    setSelectedSubCategory(favSubCat.id);
                                  }
                                }}
                                className="group w-full p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-[#9c6cfe] hover:bg-gray-50 transition-all duration-200 text-left relative"
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-gray-100">
                                    {renderIcon(favSubCat.icon, "w-3 h-3 sm:w-4 sm:h-4 text-gray-700")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 group-hover:text-[#9c6cfe] transition-colors mb-0.5">
                                      {favSubCat.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 line-clamp-1 hidden sm:block">
                                      {favSubCat.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 flex-shrink-0">
                                    <span className="hidden sm:inline">{favSubCat.topic_count || 0} konu</span>
                                    <span className="hidden sm:inline">{favSubCat.post_count || 0} yorum</span>
                                    <span className="sm:hidden text-xs">{favSubCat.topic_count || 0}</span>
                                  </div>
                                  {/* Kaldırma butonu - Sadece kaldırma modunda görünür */}
                                  {showRemoveFromFavoritesMode && (
                                    <button
                                      onClick={(e) => removeFromFavorites(favSubCat.id, e)}
                                      className="ml-2 p-1.5 sm:p-2 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors flex-shrink-0"
                                      title="Favorilerden Kaldır"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* TÜM KATEGORİLERİ DİNAMİK OLARAK GÖSTER */}
                  {allCategoriesWithSubs.map((category, index) => (
                    <div key={category.id}>
                      {category.sub_categories && category.sub_categories.length > 0 && (
                        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-2 sm:p-4 mb-4 sm:mb-6">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100">
                              {renderIcon(category.icon, "w-4 h-4 sm:w-6 sm:h-6 text-gray-700")}
                            </div>
                            <div>
                              <h2 className="text-base sm:text-xl font-bold text-gray-900">{category.name}</h2>
                              <p className="text-xs sm:text-sm text-gray-600">{category.description}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1 sm:space-y-2">
                            {category.sub_categories.map((subCategory: any) => (
                              <button
                                key={subCategory.id}
                                onClick={() => {
                                  setSelectedCategory(category.id);
                                  setSelectedSubCategory(subCategory.id);
                                }}
                                className="group w-full p-2 sm:p-3 rounded-lg border border-gray-200 hover:border-[#9c6cfe] hover:bg-gray-50 transition-all duration-200 text-left relative"
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0 bg-gray-100">
                                    {renderIcon(subCategory.icon, "w-3 h-3 sm:w-4 sm:h-4 text-gray-700")}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900 group-hover:text-[#9c6cfe] transition-colors mb-0.5">
                                      {subCategory.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 line-clamp-1 hidden sm:block">
                                      {subCategory.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500 flex-shrink-0">
                                    <span className="hidden sm:inline">{subCategory.topic_count || 0} konu</span>
                                    <span className="hidden sm:inline">{subCategory.post_count || 0} yorum</span>
                                    <span className="sm:hidden text-xs">{subCategory.topic_count || 0}</span>
                                  </div>
                                  {/* Seçim Butonu - Sadece ekleme modunda görünür */}
                                  {showAddToFavoritesMode && !favoriteSubCategoryIds.includes(subCategory.id) && (
                                    <button
                                      onClick={(e) => {
                                        toggleCategorySelection(subCategory.id, e);
                                      }}
                                      className={`ml-2 p-1.5 sm:p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                                        selectedCategoriesToAdd.includes(subCategory.id)
                                          ? 'bg-[#9c6cfe] text-white hover:bg-[#8a5cf0]'
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      title={selectedCategoriesToAdd.includes(subCategory.id) ? "Seçimi Kaldır" : "Seç"}
                                    >
                                      {selectedCategoriesToAdd.includes(subCategory.id) ? (
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                      ) : (
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      
                      {/* Banner 4 - Her 3 kategoriden sonra */}
                      {index === 2 && <AdBanner position={4} className="mb-6" />}
                      
                      {/* Banner 5 - Google ve Arama Motorları kategorisinden sonra */}
                      {category.name === 'Google ve Arama Motorları' && <AdBanner position={5} className="mb-6" />}
                      
                      {/* Banner 6 - Sosyal Medya kategorisinden sonra */}
                      {category.name === 'Sosyal Medya' && <AdBanner position={6} className="mb-6" />}
                      
                      {/* Banner 7 - İçerik & Makale Hizmetleri kategorisinden sonra */}
                      {category.name === 'İçerik & Makale Hizmetleri' && <AdBanner position={7} className="mb-6" />}
                      
                      {/* Banner 8 - Grafik Hizmetleri kategorisinden sonra */}
                      {category.name === 'Grafik Hizmetleri' && <AdBanner position={8} className="mb-6" />}
                      
                      {/* Banner 9 - Mobil Dünyası kategorisinden sonra */}
                      {category.name === 'Mobil Dünyası' && <AdBanner position={9} className="mb-6" />}
                      
                      {/* Banner 10 - Dijital Ürün Pazarı kategorisinden sonra */}
                      {category.name === 'Dijital Ürün Pazarı' && <AdBanner position={10} className="mb-6" />}
                      
                      {/* Banner 11 - Dijital Pazarlama kategorisinden sonra */}
                      {category.name === 'Dijital Pazarlama' && <AdBanner position={11} className="mb-6" />}
                    </div>
                  ))}
                  
                  {/* ESKİ HARDCODED KATEGORİLER - YEDEKLEMİŞTİR */}
                  {/* {subCategories.length > 0 && (
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="p-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] rounded-lg">
                          <Code className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {selectedMainCategory?.name || 'Yazılım Dünyası'}
                          </h2>
                          <p className="text-sm sm:text-base text-gray-600">
                            {selectedMainCategory?.description || 'Yazılım geliştirme ile ilgili tüm konular'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {subCategories.map((subCategory) => (
                          <button
                            key={subCategory.id}
                            onClick={() => {
                              setSelectedCategory(selectedMainCategory?.id || null);
                              setSelectedSubCategory(subCategory.id);
                            }}
                            className="group w-full p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-[#9c6cfe] hover:bg-gray-50 transition-all duration-200 text-left"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div 
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: subCategory.color + '20' }}
                              >
                                {renderIcon(subCategory.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-[#9c6cfe] transition-colors mb-1">
                                  {subCategory.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                  {subCategory.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                <span className="hidden sm:inline">{subCategory.topic_count || 0} konu</span>
                                <span className="hidden sm:inline">{subCategory.post_count || 0} yorum</span>
                                <span className="sm:hidden">{subCategory.topic_count || 0}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subCategory.color }}></div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Banner 4 artık dinamik kategoriler arasında gösteriliyor */}

                  {/* ESKİ - Tasarım & UI/UX Kategorileri */}
                  {/* {designSubCategories.length > 0 && (
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="p-2 bg-gradient-to-r from-[#f59e0b] to-[#ef4444] rounded-lg">
                          <span className="text-white text-lg sm:text-xl">🎨</span>
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {selectedDesignCategory?.name || 'Tasarım & UI/UX'}
                          </h2>
                          <p className="text-sm sm:text-base text-gray-600">
                            {selectedDesignCategory?.description || 'Tasarım, kullanıcı deneyimi ve arayüz geliştirme'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {designSubCategories.map((subCategory) => (
                          <button
                            key={subCategory.id}
                            onClick={() => {
                              setSelectedCategory(selectedDesignCategory?.id || null);
                              setSelectedSubCategory(subCategory.id);
                            }}
                            className="group w-full p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-[#f59e0b] hover:bg-gray-50 transition-all duration-200 text-left"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div 
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: subCategory.color + '20' }}
                              >
                                {renderIcon(subCategory.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-[#f59e0b] transition-colors mb-1">
                                  {subCategory.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                  {subCategory.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                <span className="hidden sm:inline">{subCategory.topic_count || 0} konu</span>
                                <span className="hidden sm:inline">{subCategory.post_count || 0} yorum</span>
                                <span className="sm:hidden">{subCategory.topic_count || 0}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subCategory.color }}></div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )} */}

                  {/* Banner 5 - Tasarım sonrası (eski) */}
                  {/* <AdBanner position={5} className="mb-6" /> */}

                  {/* ESKİ - Freelancer Kategorileri */}
                  {/* {freelancerSubCategories.length > 0 && (
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="p-2 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-lg">
                          <span className="text-white text-lg sm:text-xl">🤝</span>
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {selectedFreelancerCategory?.name || 'Freelancer'}
                          </h2>
                          <p className="text-sm sm:text-base text-gray-600">
                            {selectedFreelancerCategory?.description || 'Freelancerların birbirini bulduğu, iş paylaştığı ve ortaklık kurduğu platform'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {freelancerSubCategories.map((subCategory) => (
                          <button
                            key={subCategory.id}
                            onClick={() => {
                              setSelectedCategory(selectedFreelancerCategory?.id || null);
                              setSelectedSubCategory(subCategory.id);
                            }}
                            className="group w-full p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-[#10b981] hover:bg-gray-50 transition-all duration-200 text-left"
                          >
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div 
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: subCategory.color + '20' }}
                              >
                                {renderIcon(subCategory.icon, "w-4 h-4 sm:w-5 sm:h-5")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-[#10b981] transition-colors mb-1">
                                  {subCategory.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                  {subCategory.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                <span className="hidden sm:inline">{subCategory.topic_count || 0} konu</span>
                                <span className="hidden sm:inline">{subCategory.post_count || 0} yorum</span>
                                <span className="sm:hidden">{subCategory.topic_count || 0}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subCategory.color }}></div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )} */}

                  {/* Banner 6 artık Sosyal Medya kategorisinin altında gösteriliyor */}

                </div>
              ) : selectedCategory === 'youtube-downloader' ? (
                <YouTubeDownloader onBack={() => setSelectedCategory(null)} />
              ) : selectedCategory === 'cv-creator' ? (
                <CVCreator onBack={() => setSelectedCategory(null)} />
              ) : selectedCategory === 'image-dpi-converter' ? (
                <ImageDPIConverter onBack={() => setSelectedCategory(null)} />
              ) : selectedCategory === 'lock-down-files' ? (
                <LockDownFiles onBack={() => setSelectedCategory(null)} />
              ) : selectedCategory === 'pdf-editor-converter' ? (
                <PDFEditorConverter onBack={() => setSelectedCategory(null)} />
              ) : (
                /* Diğer sayfalar için konu listesi */
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#9c6cfe] border-t-transparent"></div>
                    </div>
                  ) : topics.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <span className="text-3xl">📝</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Henüz konu yok
                      </h3>
                      <p className="text-gray-600 mb-6">
                        İlk konuyu siz oluşturun ve tartışmayı başlatın!
                      </p>
                      <button
                        onClick={handleShowNewTopic}
                        className="px-6 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        Yeni Konu Oluştur
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topics.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          onClick={() => setSelectedTopicId(topic.id)}
                          onViewProfile={handleViewProfile}
                          onTopicDeleted={() => {
                            loadTopics();
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Ana sayfada alt Footer */}
      {selectedCategory === null && !selectedTopicId && !selectedUserId && !showProfile && !showRequestInvite && (
        <Footer 
          isSidebarCollapsed={isSidebarCollapsed}
          onNavigate={(page) => {
            pushToHistory(page as any, {});
            setSelectedCategory(page);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen && !showRequestInvite}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={setAuthMode}
        onRegisterSuccess={() => {
          setAuthModalOpen(false);
          // E-posta onay sayfası otomatik olarak gösterilecek
        }}
        onRequestInvite={() => {
          setAuthModalOpen(false);
          setShowRequestInvite(true);
        }}
      />

      <NewTopicModal
        isOpen={newTopicModalOpen}
        onClose={() => setNewTopicModalOpen(false)}
        onTopicCreated={() => {
          // Konuları yenile
          loadTopics();
          // Kategori cache'ini temizle (yeni konu eklendiği için sayılar değişti)
          clearCategoriesCache();
          // Sayfayı yenilemek için refresh key'i değiştir
          setRefreshKey(prev => prev + 1);
        }}
      />

      <BannerRental
        isOpen={showBannerRental}
        onClose={() => setShowBannerRental(false)}
        onSuccess={handleBannerRentalSuccess}
        userCredits={creditBalance}
      />

      <MyBanners
        isOpen={showMyBanners}
        onClose={() => setShowMyBanners(false)}
      />

      <BannerControl
        isOpen={showBannerControl}
        onClose={() => setShowBannerControl(false)}
      />

      <FeaturedModal
        isOpen={showFeaturedModal}
        onClose={() => setShowFeaturedModal(false)}
        onSuccess={() => {
          // Kredi bakiyesini yenile
          loadCreditBalance();
        }}
        userCredits={creditBalance}
      />

      <CreditPurchase
        isOpen={showCreditPurchase}
        onClose={() => {
          setShowCreditPurchase(false);
          // Hash'i temizle
          if (window.location.hash === '#payment' || window.location.hash === '#credit-purchase' || window.location.hash === '#odeme') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        onSuccess={() => {
          // Kredi bakiyesini yenile
          loadCreditBalance();
        }}
      />


      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
