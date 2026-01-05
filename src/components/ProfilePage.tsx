'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FollowersModal } from './FollowersModal';
import { UserProfile } from './UserProfile';
import Cropper from 'react-easy-crop';
import { 
  User, 
  Calendar, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  Trophy,
  MessageSquare,
  FileText,
  Edit3,
  Save,
  X,
  AlertCircle,
  Coins,
  Target,
  CheckCircle,
  Clock,
  Camera,
  Plus,
  ChevronDown,
  ChevronUp,
  Eye,
  ThumbsUp,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Briefcase
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  location?: string | null;
  avatar_url: string | null;
  header_media: string | null;
  avatar_bg_color?: string | null;
  reputation: number;
  total_posts: number;
  total_comments: number;
  joined_at: string;
  active_badge_key?: string | null;
  active_badge_icon?: string | null;
  follower_count?: number;
  following_count?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  category: string;
  earned_at: string;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  credit_reward: number;
  is_active: boolean;
  is_repeatable: boolean;
  cooldown_hours: number;
  icon: string;
  color: string;
  order_index: number;
}

interface TaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  progress_data: any;
  last_attempt_at: string;
}

interface UserTopic {
  id: string;
  title: string;
  content: string;
  slug: string;
  view_count: number;
  reply_count: number;
  useful_count: number;
  created_at: string;
  updated_at: string;
  sub_category: {
    id: string;
    name: string;
    slug: string;
    main_category: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

interface ProfilePageProps {
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
}

export function ProfilePage({ onBack, onViewProfile }: ProfilePageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);
  const [isBadgesExpanded, setIsBadgesExpanded] = useState(false);
  const [isInvitesExpanded, setIsInvitesExpanded] = useState(false);
  const [isTwoFactorExpanded, setIsTwoFactorExpanded] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [cooldownTimers, setCooldownTimers] = useState<{[key: string]: number}>({});
  const [headerMedia, setHeaderMedia] = useState<string | null>(null);
  const [uploadingHeaderMedia, setUploadingHeaderMedia] = useState(false);
  const [, setBadgeProgress] = useState<Record<string, { progress: number; target: number }>>({});
  const [urgentStats, setUrgentStats] = useState<{ answers: number; useful: number }>({ answers: 0, useful: 0 });
  const [allBadges, setAllBadges] = useState<Array<{ id: string; name: string; icon: string | null }>>([]);
  // const [showClaimB5, setShowClaimB5] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<Array<{
    id: string;
    code: string;
    created_at: string;
    expires_at: string;
    usage_count: number;
    is_active: boolean;
    is_expired: boolean;
  }>>([]);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [totalInvites, setTotalInvites] = useState(0);
  const [totalInviteCredits, setTotalInviteCredits] = useState(0);
  const [metricsReady, setMetricsReady] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingSocial, setEditingSocial] = useState<Record<string, boolean>>({
    github: false,
    linkedin: false,
    twitter: false,
    instagram: false,
    whatsapp: false
  });
  const [tempSocialValues, setTempSocialValues] = useState<Record<string, string>>({
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    whatsapp: ''
  });
  const [earnedBadge, setEarnedBadge] = useState<{ name: string; icon: string | null } | null>(null);
  // 2 Adımlı Doğrulama (Frontend placeholder)
  const emailVerified = !!user?.email_confirmed_at;
  const [phoneVerified, setPhoneVerified] = useState(false);
  const twoFactorEnabled = emailVerified && phoneVerified;
  
  // Header crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
    job_title: '',
    location: '',
    avatar_bg_color: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBadges();
      fetchAllBadges();
      fetchCreditAccount();
      fetchTasks();
      fetchTaskProgress();
      fetchUserTopics();
      fetchUserComments();
      fetchUserBadgeProgress();
      fetchInviteCodes(); // Davet kodlarını yükle
    } else {
      setLoading(false);
    }
  }, [user]);

  // Kredi hesabını periyodik olarak yenile (kredi yükleme işlemlerini takip etmek için)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchCreditAccount();
    }, 3000); // Her 3 saniyede bir yenile

    return () => clearInterval(interval);
  }, [user]);

  // Window focus olduğunda kredi hesabını yenile (kredi yükleme işlemlerini takip etmek için)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchCreditAccount();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Kredi güncelleme event'ini dinle
  useEffect(() => {
    const handleCreditUpdate = () => {
      if (user) {
        fetchCreditAccount();
      }
    };

    window.addEventListener('creditUpdated', handleCreditUpdate);
    return () => window.removeEventListener('creditUpdated', handleCreditUpdate);
  }, [user]);
  const fetchAllBadges = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('badges')
        .select('id, name, icon')
        .order('created_at', { ascending: true });
      if (error) return;
      setAllBadges(data || []);
    } catch (_) {
      // sessiz geç
    }
  };


  // Tüm metrikler yüklendi mi işaretle
  useEffect(() => {
    if (user && profile && creditAccount && userTopics) {
      setMetricsReady(true);
    }
  }, [user, profile, creditAccount, userTopics]);

  // B5 claim banner kullanılmadığı için geçici olarak devre dışı

  const upsertUserBadgeProgress = async (key: string, progress: number, target: number, metadata?: any) => {
    if (!user?.id) return;
    await (supabase as any)
      .from('user_badge_progress')
      .upsert({ user_id: user.id, badge_key: key, progress, target, metadata, updated_at: new Date().toISOString() }, { onConflict: 'user_id,badge_key' });
  };

  const fetchUserBadgeProgress = async () => {
    if (!user?.id) return;
    const { data } = await (supabase as any)
      .from('user_badge_progress')
      .select('*')
      .eq('user_id', user.id);
    if (data) {
      const map: Record<string, { progress: number; target: number }> = {};
      data.forEach((row: any) => {
        map[row.badge_key] = { progress: row.progress || 0, target: row.target || 0 };
      });
      setBadgeProgress(map);
    }
  };

  // Gerçek metrikleri hesapla ve Supabase'e yaz
  useEffect(() => {
    if (!metricsReady || !user?.id) return;

    (async () => {
      try {
        // Badge 1: Acil cevaplarda yazdığın cevapların toplam like (faydalı) sayısı
        // 1) Önce Acil Cevap ana kategorisindeki topic id'lerini al
        const { data: urgentTopics } = await (supabase as any)
          .from('topics')
          .select('id, sub_category:sub_categories(main_category:main_categories(name))')
          .eq('sub_category.main_category.name', 'Acil Cevap');
        const urgentTopicIds = (urgentTopics || []).map((t: any) => t.id);

        let urgentUseful = 0;
        if (urgentTopicIds.length > 0) {
          const { data: postsData } = await (supabase as any)
            .from('posts')
            .select('like_count, topic_id')
            .eq('author_id', user.id)
            .in('topic_id', urgentTopicIds);
          const list = postsData || [];
          urgentUseful = list.reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
          setUrgentStats({ answers: list.length, useful: urgentUseful });
        }
        // Badge 1 hedefleri: 100 cevap, 200 faydalı
        await upsertUserBadgeProgress('badge_1', urgentUseful, 200, { scope: 'urgent', answers: urgentStats.answers, useful: urgentUseful, answersTarget: 100, usefulTarget: 200 });

        // Badge 2: 100 konu + toplam 200 faydalı (konular üzerindeki useful_count)
        const totalTopicUseful = userTopics.reduce((sum, t) => sum + (t.useful_count || 0), 0);
        const topicsCountForB2 = userTopics.length;
        // İki koşul için ayrı metrik sakla (progress: konu sayısı)
        await upsertUserBadgeProgress('badge_2', Math.min(topicsCountForB2, 100), 100, { useful: totalTopicUseful, usefulTarget: 200 });

        // Badge 3: Toplam satın alınan kredi (purchase)
        let totalPurchased = 0;
        const { data: purchases } = await (supabase as any)
          .from('credit_transactions')
          .select('amount, transaction_type, source_type')
          .eq('user_id', user.id)
          .eq('transaction_type', 'earn')
          .eq('source_type', 'purchase');
        totalPurchased = (purchases || []).reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
        const b3Target = 25000;
        await upsertUserBadgeProgress('badge_3', totalPurchased, b3Target, { source: 'purchase' });

        // Badge 5: Herhangi bir kategoride en az 27 konu aç
        const topicsCountForB5 = userTopics.length;
        await upsertUserBadgeProgress('badge_5', Math.min(27, topicsCountForB5), 27, { source: 'topics' });

        // Lokal state'i tazele
        await fetchUserBadgeProgress();
      } catch (e) {
        console.error('Rozet metrikleri hesaplanamadı:', e);
      }
    })();
  }, [metricsReady]);

  const claimBadgeGeneric = async (opts: { name: string; icon?: string; description?: string; category?: string }) => {
    if (!user?.id || claiming) return;
    const { name, icon } = opts;
    try {
      setClaiming(true);
      // 1) Rozeti bul (oluşturma yok)
      let badgeId: string | null = null;
      // Önce önbellekten (allBadges) case-insensitive ad eşleşmesi
      if (allBadges && allBadges.length > 0) {
        const byName = allBadges.find(b => (b.name || '').toLowerCase() === name.toLowerCase());
        if (byName) badgeId = byName.id;
        if (!badgeId && icon) {
          const normalized = icon.toLowerCase();
          const byIconCached = allBadges.find(b => (b.icon || '').toLowerCase() === normalized || (b.icon || '').toLowerCase().endsWith(normalized));
          if (byIconCached) badgeId = byIconCached.id;
        }
      }
      // Hâlâ yoksa esnek sorgu: name ILIKE veya icon eşleşmesi
      if (!badgeId) {
        const { data: byNameDb } = await (supabase as any)
          .from('badges')
          .select('id, name, icon')
          .ilike('name', `%${name}%`)
          .limit(1);
        if (byNameDb && byNameDb.length > 0) {
          badgeId = byNameDb[0].id;
        }
      }
      if (!badgeId && icon) {
        const iconName = icon.split('/').pop() || icon;
        // 1) Tam ikon yolu
        const { data: byIconExact } = await (supabase as any)
          .from('badges')
          .select('id')
          .eq('icon', icon)
          .limit(1);
        if (byIconExact && byIconExact.length > 0) {
          badgeId = byIconExact[0].id;
        }
        // 2) Dosya adına göre ILIKE (ör. rozet/5.svg)
        if (!badgeId && iconName) {
          const { data: byIconLike } = await (supabase as any)
            .from('badges')
            .select('id')
            .ilike('icon', `%${iconName}`)
            .limit(1);
          if (byIconLike && byIconLike.length > 0) {
            badgeId = byIconLike[0].id;
          }
        }
      }
      if (!badgeId) throw new Error('Rozet bulunamadı/oluşturulamadı');

      // 2) Kullanıcıya ver (tek seferlik)
      const { error: insertErr } = await (supabase as any)
        .from('user_badges')
        .insert({ user_id: user.id, badge_id: badgeId, earned_at: new Date().toISOString() });
      if (insertErr && insertErr.code !== '23505') throw insertErr; // unique ihlali hariç

      // 3) Aktif rozet olarak ayarla
      if (icon) {
        await (supabase as any)
          .from('profiles')
          .update({ active_badge_key: badgeId, active_badge_icon: icon })
          .eq('id', user.id);
      }

      // 4) Rozet bilgilerini al (modal için)
      const { data: badgeData } = await (supabase as any)
        .from('badges')
        .select('name, icon')
        .eq('id', badgeId)
        .single();

      // 5) UI güncelle
      await fetchBadges();
      await fetchProfile();
      
      // Rozet kazanma bildirimi göster (modal - site mesajı değil)
      setEarnedBadge({
        name: badgeData?.name || 'Rozet',
        icon: badgeData?.icon || null
      });
    } catch (e) {
      console.error('Rozet alma hatası:', e);
    } finally {
      setClaiming(false);
    }
  };

  const createProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Önce profil var mı kontrol et
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('Profil zaten var, yükleniyor...');
      setProfile(existingProfile as any);
      setHeaderMedia((existingProfile as any).header_media || null);
      setFormData({
        display_name: (existingProfile as any).display_name || '',
        bio: (existingProfile as any).bio || '',
        website: (existingProfile as any).website || '',
        github: (existingProfile as any).github || '',
        linkedin: (existingProfile as any).linkedin || '',
        twitter: (existingProfile as any).twitter || '',
        instagram: (existingProfile as any).instagram || '',
        whatsapp: (existingProfile as any).whatsapp || '',
        job_title: (existingProfile as any).job_title || '',
        location: (existingProfile as any).location || '',
        avatar_bg_color: (existingProfile as any).avatar_bg_color || '#9c6cfe'
      });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || `user_${user.id.substring(0, 8)}`,
          display_name: user.user_metadata?.display_name || 'Kullanıcı',
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data as any);
      setHeaderMedia((data as any).header_media || null);
      setFormData({
        display_name: (data as any).display_name || '',
        bio: (data as any).bio || '',
        website: (data as any).website || '',
        github: (data as any).github || '',
        linkedin: (data as any).linkedin || '',
        twitter: (data as any).twitter || '',
        instagram: (data as any).instagram || '',
        whatsapp: (data as any).whatsapp || '',
        job_title: (data as any).job_title || '',
        location: (data as any).location || '',
        avatar_bg_color: (data as any).avatar_bg_color || '#9c6cfe'
      });
    } catch (error) {
      console.error('Profil oluşturma hatası:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Eğer profil yoksa, otomatik oluştur
        if (error.code === 'PGRST116') {
          await createProfile();
          return;
        }
        throw error;
      }
      
      setProfile(data as any);
      setHeaderMedia((data as any).header_media || null);
      setFormData({
        display_name: (data as any).display_name || '',
        bio: (data as any).bio || '',
        website: (data as any).website || '',
        github: (data as any).github || '',
        linkedin: (data as any).linkedin || '',
        twitter: (data as any).twitter || '',
        instagram: (data as any).instagram || '',
        whatsapp: (data as any).whatsapp || '',
        job_title: (data as any).job_title || '',
        location: (data as any).location || '',
        avatar_bg_color: (data as any).avatar_bg_color || '#9c6cfe'
      });
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            color,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      
      const formattedBadges = data.map((item: any) => ({
        id: item.badges.id,
        name: item.badges.name,
        description: item.badges.description,
        icon: item.badges.icon,
        color: item.badges.color,
        category: item.badges.category,
        earned_at: item.earned_at
      }));
      
      setBadges(formattedBadges);
    } catch (error) {
      console.error('Rozet yükleme hatası:', error);
    }
  };

  // Kullanıcının belirli bir rozeti alıp almadığını kontrol et
  const hasBadge = (badgeName: string): boolean => {
    return badges.some(badge => badge.name === badgeName);
  };

  const fetchCreditAccount = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // 406 hatası veya tablo bulunamadı hatası için varsayılan değer
        if (error.code === 'PGRST116' || (error as any).status === 406) {
          setCreditAccount({ 
            id: '', 
            user_id: user.id, 
            balance: 0, 
            total_earned: 0, 
            total_spent: 0, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          });
          return;
        }
        throw error;
      }
      
      setCreditAccount(data);
    } catch (error) {
      console.error('Kredi hesabı yükleme hatası:', error);
      // Hata durumunda varsayılan değerler
      setCreditAccount({ 
        id: '', 
        user_id: user.id, 
        balance: 0, 
        total_earned: 0, 
        total_spent: 0, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      });
    }
  };

  // 5-6 haneli harf-sayı karışık kod üret
  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // I, O, 0, 1 harflerini çıkar
    const length = 5 + Math.floor(Math.random() * 2); // 5 veya 6
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const fetchInviteCodes = async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      // Supabase'den direkt çek
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Davet kodları yükleme hatası:', error);
        return;
      }
      
      if (data) {
        const formattedData = data.map((invite: any) => ({
          id: invite.id,
          code: invite.code,
          created_at: invite.created_at,
          expires_at: invite.expires_at,
          usage_count: invite.usage_count || 0,
          is_active: invite.is_active !== false,
          is_expired: new Date(invite.expires_at) < new Date()
        }));
        setInviteCodes(formattedData);
        
        // Toplam davet sayısını hesapla
        const totalInvitesCount = formattedData.reduce((sum, invite) => sum + (invite.usage_count || 0), 0);
        setTotalInvites(totalInvitesCount);
        
        // Toplam kazandığı krediyi hesapla (her davet 100 kredi)
        const totalCredits = totalInvitesCount * 100;
        setTotalInviteCredits(totalCredits);
      }
    } catch (error) {
      console.error('❌ Davet kodları yükleme hatası:', error);
    }
  };

  const createInviteCode = async () => {
    if (!user?.id) {
      setSaveMessage({ type: 'error', text: 'Kullanıcı bulunamadı' });
      return;
    }
    
    try {
      setCreatingInvite(true);
      
      // Bugün oluşturulmuş kod var mı kontrol et
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const { data: todayCodes, error: checkError } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('created_by', user.id)
        .gte('created_at', today.toISOString())
        .lte('created_at', todayEnd.toISOString());
      
      if (checkError) {
        console.error('❌ Kontrol hatası:', checkError);
      }
      
      if (todayCodes && todayCodes.length >= 1) {
        throw new Error('Günde en fazla 1 davet kodu oluşturabilirsiniz. Yarın tekrar deneyin.');
      }
      
      // Kod üret (benzersiz olana kadar dene)
      let code = generateInviteCode();
      let attempts = 0;
      
      // Kodun benzersiz olduğundan emin ol (max 10 deneme)
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('invite_codes')
          .select('id')
          .eq('code', code)
          .single();
        
        if (!existing) {
          break; // Kod benzersiz
        }
        
        code = generateInviteCode();
        attempts++;
      }
      
      if (attempts >= 10) {
        throw new Error('Benzersiz kod oluşturulamadı, lütfen tekrar deneyin');
      }
      
      // Supabase'e direkt INSERT yap
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 1 hafta (7 gün) sonra
      
      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          code: code,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          usage_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Davet kodu oluşturma hatası:', error);
        throw new Error(error.message || 'Davet kodu oluşturulamadı');
      }
      
      if (data) {
        // Yeni oluşturulan kodu listeye ekle
        const newInvite = {
          id: data.id,
          code: data.code,
          created_at: data.created_at,
          expires_at: data.expires_at,
          usage_count: data.usage_count || 0,
          is_active: data.is_active !== false,
          is_expired: false
        };
        setInviteCodes(prev => [newInvite, ...prev]);
        setSaveMessage({ type: 'success', text: 'Davet kodu başarıyla oluşturuldu!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('❌ Davet kodu oluşturma hatası:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Davet kodu oluşturulamadı' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `https://devforum.xyz/register?invite=${code}`;
    navigator.clipboard.writeText(link);
    setSaveMessage({ type: 'success', text: 'Davet bağlantısı kopyalandı!' });
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setTasks(data || []);
    } catch (error) {
      console.error('Görevler yükleme hatası:', error);
    }
  };

  const fetchTaskProgress = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_task_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTaskProgress(data || []);
    } catch (error) {
      console.error('Görev ilerlemesi yükleme hatası:', error);
    }
  };

  const fetchUserTopics = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          content,
          slug,
          view_count,
          reply_count,
          useful_count,
          created_at,
          updated_at,
          sub_category:sub_categories (
            id,
            name,
            slug,
            main_category:main_categories (
              id,
              name,
              slug
            )
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const topicsData = data || [];
      setUserTopics(topicsData);
      
      // Profil istatistiklerini güncelle
      await updateProfileStats(topicsData.length, userComments.length);
    } catch (error) {
      console.error('Kullanıcı konuları yükleme hatası:', error);
    }
  };

  const fetchUserComments = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          topic_id,
          topics (
            id,
            title,
            slug
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const commentsData = data || [];
      setUserComments(commentsData);
      
      // Profil istatistiklerini güncelle
      await updateProfileStats(userTopics.length, commentsData.length);
    } catch (error) {
      console.error('Kullanıcı yorumları yükleme hatası:', error);
    }
  };

  // Profil istatistiklerini güncelle
  const updateProfileStats = async (topicsCount: number, commentsCount: number) => {
    if (!user?.id) return;
    
    try {
      // Önce güncel reputation'ı al
      const { data: profileData, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('reputation')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await (supabase as any)
        .from('profiles')
        .update({ 
          total_posts: topicsCount,
          total_comments: commentsCount,
          reputation: profileData?.reputation || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Profil state'ini güncelle
      setProfile(prev => prev ? {
        ...prev,
        total_posts: topicsCount,
        total_comments: commentsCount,
        reputation: profileData?.reputation || 0
      } : null);
    } catch (error) {
      console.error('Profil istatistikleri güncelleme hatası:', error);
    }
  };

  // Bugün açılan konu sayısını kontrol et
  const getTodayTopicsCount = () => {
    if (!userTopics.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTopics = userTopics.filter(topic => {
      const topicDate = new Date(topic.created_at);
      topicDate.setHours(0, 0, 0, 0);
      return topicDate.getTime() === today.getTime();
    });
    
    return todayTopics.length;
  };

  // Bugün yapılan yorum sayısını kontrol et
  const getTodayCommentsCount = () => {
    if (!userComments.length) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayComments = userComments.filter(comment => {
      const commentDate = new Date(comment.created_at);
      commentDate.setHours(0, 0, 0, 0);
      return commentDate.getTime() === today.getTime();
    });
    
    return todayComments.length;
  };

  // Günlük konu açma görevi için durum kontrolü
  const getDailyTopicsTaskStatus = (task: Task) => {
    const isDailyTopicsTask = task.title === '2 Konu Aç';
    if (!isDailyTopicsTask) return null;
    
    const todayTopicsCount = getTodayTopicsCount();
    const isCompleted = todayTopicsCount >= 2;
    
    // Görev daha önce tamamlanmış mı kontrol et
    const progress = taskProgress.find(p => p.task_id === task.id);
    const wasCompletedToday = progress?.completed_at && 
      new Date(progress.completed_at).toDateString() === new Date().toDateString();
    
    return {
      isCompleted,
      todayTopicsCount,
      requiredCount: 2,
      canComplete: isCompleted && !wasCompletedToday
    };
  };

  // Günlük yorum yapma görevi için durum kontrolü
  const getDailyCommentsTaskStatus = (task: Task) => {
    const isDailyCommentsTask = task.title === '5 Yorum Yap';
    if (!isDailyCommentsTask) return null;
    
    const todayCommentsCount = getTodayCommentsCount();
    const isCompleted = todayCommentsCount >= 5;
    
    // Görev daha önce tamamlanmış mı kontrol et
    const progress = taskProgress.find(p => p.task_id === task.id);
    const wasCompletedToday = progress?.completed_at && 
      new Date(progress.completed_at).toDateString() === new Date().toDateString();
    
    return {
      isCompleted,
      todayCommentsCount,
      requiredCount: 5,
      canComplete: isCompleted && !wasCompletedToday
    };
  };


  // Cooldown hesaplama fonksiyonu
  const calculateCooldown = (completedAt: string, cooldownHours: number) => {
    const completedTime = new Date(completedAt).getTime();
    const currentTime = new Date().getTime();
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const remainingMs = cooldownMs - (currentTime - completedTime);
    return Math.max(0, Math.ceil(remainingMs / 1000)); // Saniye cinsinden
  };

  // Cooldown formatı (saat:dakika:saniye)
  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cooldown timer'ı güncelle
  const updateCooldownTimers = () => {
    const newTimers: {[key: string]: number} = {};
    
    tasks.forEach(task => {
      if (task.is_repeatable) {
        const progress = taskProgress.find(p => p.task_id === task.id);
        if (progress?.completed_at) {
          const remaining = calculateCooldown(progress.completed_at, task.cooldown_hours);
          if (remaining > 0) {
            newTimers[task.id] = remaining;
          }
        }
      }
    });
    
    setCooldownTimers(newTimers);
  };

  // Timer'ı başlat
  useEffect(() => {
    updateCooldownTimers();
    
    const interval = setInterval(() => {
      updateCooldownTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, taskProgress]);

  const completeTask = async (taskId: string) => {
    if (!user?.id) return;
    
    try {
      // Görev bilgilerini al (kredi miktarını öğrenmek için)
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        setSaveMessage({ type: 'error', text: 'Görev bulunamadı' });
        setTimeout(() => setSaveMessage(null), 3000);
        return;
      }

      const { error } = await (supabase as any).rpc<any>('complete_task', {
        p_user_id: user.id,
        p_task_id: taskId
      });

      if (error) throw error;
      
      // Kredi hesabını hemen güncelle (optimistic update)
      setCreditAccount(prev => {
        if (prev) {
          return {
            ...prev,
            balance: prev.balance + task.credit_reward,
            total_earned: prev.total_earned + task.credit_reward,
            updated_at: new Date().toISOString()
          };
        }
        return prev;
      });
      
      // Görev ilerlemesini güncelle
      setTaskProgress(prev => {
        const existing = prev.find(p => p.task_id === taskId);
        if (existing) {
          return prev.map(p => 
            p.task_id === taskId 
              ? { ...p, is_completed: true, completed_at: new Date().toISOString() }
              : p
          );
        } else {
          return [...prev, {
            id: `${user.id}-${taskId}`,
            user_id: user.id,
            task_id: taskId,
            is_completed: true,
            completed_at: new Date().toISOString(),
            progress_data: null,
            last_attempt_at: new Date().toISOString()
          }];
        }
      });
      
      // Cooldown timer'ını güncelle
      if (task.is_repeatable) {
        setCooldownTimers(prev => ({
          ...prev,
          [taskId]: task.cooldown_hours * 3600 // Saatleri saniyeye çevir
        }));
      }
      
      // Görev ilerlemesini yeniden yükle
      await fetchTaskProgress();
      
      setSaveMessage({ type: 'success', text: `Görev tamamlandı! +${task.credit_reward} kredi kazandınız!` });
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Arka planda verileri senkronize et
      fetchCreditAccount();
      fetchTaskProgress();
    } catch (error: any) {
      console.error('Görev tamamlama hatası:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Görev tamamlanamadı' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      // Form validasyonu
      if (formData.display_name && formData.display_name.length < 2) {
        setSaveMessage({ type: 'error', text: 'Görünen ad en az 2 karakter olmalıdır.' });
        setSaving(false);
        return;
      }

      if (formData.bio && formData.bio.length > 500) {
        setSaveMessage({ type: 'error', text: 'Biyografi en fazla 500 karakter olabilir.' });
        setSaving(false);
        return;
      }

      // URL validasyonu
      const urlPattern = /^https?:\/\/.+/;
      if (formData.website && !urlPattern.test(formData.website)) {
        setSaveMessage({ type: 'error', text: 'Website URL\'si geçerli bir format olmalıdır (http:// veya https:// ile başlamalı).' });
        setSaving(false);
        return;
      }

      // Hex renk doğrulama (#RGB, #RRGGBB)
      if (formData.avatar_bg_color) {
        const hexOk = /^#([0-9a-fA-F]{3}){1,2}$/.test(formData.avatar_bg_color.trim());
        if (!hexOk) {
          setSaveMessage({ type: 'error', text: 'Avatar arkaplan rengi geçerli bir hex kod olmalıdır (ör. #fff veya #ff00ff).' });
          setSaving(false);
          return;
        }
      }

      const { error } = await (supabase as any)
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi!' });
      
      // Başarı mesajını 3 saniye sonra kaldır
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      website: profile?.website || '',
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      twitter: profile?.twitter || '',
      instagram: profile?.instagram || '',
      whatsapp: profile?.whatsapp || '',
      job_title: profile?.job_title || '',
      location: profile?.location || '',
      avatar_bg_color: profile?.avatar_bg_color || '#9c6cfe'
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Dosya boyutu 5MB\'dan küçük olmalıdır.' });
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Sadece resim dosyaları yüklenebilir.' });
      return;
    }

    setUploadingAvatar(true);
    setSaveMessage(null);

    try {
      // Dosyayı Supabase Storage'a yükle
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Profil güncelle
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // State'i güncelle
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setSaveMessage({ type: 'success', text: 'Profil fotoğrafı başarıyla güncellendi!' });
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Avatar yükleme hatası:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.message || 'Fotoğraf yüklenirken bir hata oluştu.' 
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleHeaderMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Dosya boyutu kontrolü (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Dosya boyutu 10MB\'dan küçük olmalıdır.' });
      return;
    }

    // Dosya tipi kontrolü (resim veya video)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setSaveMessage({ type: 'error', text: 'Sadece resim veya video dosyaları yüklenebilir.' });
      return;
    }

    // Eğer resim ise crop modal'ı aç
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setOriginalFile(file);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Video için direkt yükle
    setUploadingHeaderMedia(true);
    setSaveMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profil-header')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profil-header')
        .getPublicUrl(fileName);

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ header_media: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setHeaderMedia(publicUrl);
      setProfile(prev => prev ? { ...prev, header_media: publicUrl } : null);
      setSaveMessage({ type: 'success', text: 'Header medyası başarıyla yüklendi!' });

    } catch (error) {
      console.error('Header medya yükleme hatası:', error);
      setSaveMessage({ type: 'error', text: 'Header medyası yüklenirken bir hata oluştu.' });
    } finally {
      setUploadingHeaderMedia(false);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels || !originalFile) return;

    try {
      const image = new Image();
      image.src = imageToCrop;
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, originalFile.type);
      });
    } catch (error) {
      console.error('Crop hatası:', error);
      return null;
    }
  };

  const handleCropSave = async () => {
    if (!user?.id || !originalFile) return;

    setUploadingHeaderMedia(true);
    setSaveMessage(null);

    try {
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) throw new Error('Kırpma işlemi başarısız oldu');

      const fileExt = originalFile.name.split('.').pop();
      const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profil-header')
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profil-header')
        .getPublicUrl(fileName);

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ header_media: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setHeaderMedia(publicUrl);
      setProfile(prev => prev ? { ...prev, header_media: publicUrl } : null);
      setSaveMessage({ type: 'success', text: 'Header fotoğrafı başarıyla yüklendi!' });
      
      setShowCropModal(false);
      setImageToCrop(null);
      setOriginalFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

    } catch (error) {
      console.error('Header medya yükleme hatası:', error);
      setSaveMessage({ type: 'error', text: 'Header medyası yüklenirken bir hata oluştu.' });
    } finally {
      setUploadingHeaderMedia(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe] mx-auto mb-4"></div>
          <p className="text-gray-600">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Giriş Yapın</h1>
          <p className="text-gray-600 mb-4">Profil sayfasını görüntülemek için giriş yapmanız gerekiyor.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil Bulunamadı</h1>
          <p className="text-gray-600 mb-4">Profil bilgileriniz yüklenemedi. Lütfen sayfayı yenileyin.</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          )}
        </div>
      </div>
    );
  }

  // Preview mode - Başkasının gözüyle görüntüleme
  if (isPreviewMode && profile && user) {
    return (
      <UserProfile
        userId={user.id}
        onBack={() => setIsPreviewMode(false)}
        onViewProfile={onViewProfile}
        onShowAuth={undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white py-1 sm:py-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#0ad2dd] to-[#9c6cfe] p-0.5 sm:p-1 rounded-lg sm:rounded-2xl shadow-xl mb-2 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-md sm:rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#9c6cfe] via-[#8b5cf6] to-[#0ad2dd] p-2 sm:p-6 lg:p-8 text-white relative min-h-[100px] sm:min-h-[180px] lg:min-h-[200px]">
            {/* Header Medya Arka Planı */}
            <div className="absolute inset-0 z-0">
              {headerMedia ? (
                headerMedia.includes('.mp4') || headerMedia.includes('.webm') || headerMedia.includes('.mov') ? (
                  <>
                    <video
                      src={headerMedia}
                      className="w-full h-full object-cover performance-optimized high-quality hidden sm:block"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{ 
                        transform: 'translateZ(0)',
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                        imageRendering: '-webkit-optimize-contrast'
                      }}
                    />
                    {/* Mobilde sadece poster göster */}
                    <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] via-[#8b5cf6] to-[#0ad2dd] flex items-center justify-center sm:hidden">
                    </div>
                  </>
                ) : (
                  <img
                    src={headerMedia}
                    alt="Header Background"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <>
                  {/* Varsayılan header videosu */}
                  <video
                    src="/header-video-2.mp4"
                    className="w-full h-full object-cover performance-optimized high-quality hidden sm:block"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    style={{ 
                      transform: 'translateZ(0)',
                      willChange: 'transform',
                      backfaceVisibility: 'hidden',
                      imageRendering: '-webkit-optimize-contrast'
                    }}
                  />
                  {/* Mobilde sadece poster göster */}
                  <div className="w-full h-full bg-gradient-to-r from-[#9c6cfe] via-[#8b5cf6] to-[#0ad2dd] flex items-center justify-center sm:hidden">
                  </div>
                </>
              )}
            </div>
            
            {/* Header Medya Yükleme Butonu - Mobilde sağ üst, Desktop'ta ortada */}
            {isEditing && (
              <>
                {/* Mobil - Sağ Üst */}
                <div className="absolute top-4 right-4 z-50 sm:hidden">
                  <label className="flex items-center space-x-1 px-2 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-lg cursor-pointer transition-all shadow-lg hover:shadow-xl border border-white border-opacity-30">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleHeaderMediaUpload}
                      className="hidden"
                      disabled={uploadingHeaderMedia}
                    />
                    {uploadingHeaderMedia ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">
                      {uploadingHeaderMedia ? 'Yükleniyor...' : 'Arka Plan'}
                    </span>
                  </label>
                </div>
                
                {/* Desktop - Ortada */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 hidden sm:block">
                  <label className="flex items-center space-x-3 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-xl cursor-pointer transition-all shadow-xl hover:shadow-2xl border-2 border-white border-opacity-30">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleHeaderMediaUpload}
                      className="hidden"
                      disabled={uploadingHeaderMedia}
                    />
                    {uploadingHeaderMedia ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    <span className="text-base font-semibold">
                      {uploadingHeaderMedia ? 'Yükleniyor...' : 'Arka Plan Ekle'}
                    </span>
                  </label>
                </div>
              </>
            )}
            

            <div className="relative z-30 mt-12 sm:mt-28 lg:mt-36">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div
                  className={`px-2 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-2xl shadow-lg flex items-center space-x-2 sm:space-x-4 w-fit sm:w-auto max-w-xs sm:max-w-full transition-all ${
                    isEditing ? 'scale-40 sm:scale-100' : ''
                  }`}
                  style={{ background: (isEditing ? formData.avatar_bg_color : profile?.avatar_bg_color) || '#6b21a8' }}
                >
                  <div className="relative group">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl ring-2 ring-white ring-opacity-80 border-2 border-white transition-all ${
                      isEditing ? 'ring-green-400 ring-opacity-60' : ''
                    }`}>
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Avatar" 
                          className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <User className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400" />
                      )}
                    </div>
                    {/* Online durumu */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1 h-1 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    </div>
                    
                    {/* Düzenleme Modunda Fotoğraf Yükleme Butonu */}
                    {isEditing && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 hover:bg-green-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-all cursor-pointer">
                        <label className="cursor-pointer w-full h-full flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                          {uploadingAvatar ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <Plus className="w-4 h-4 text-white" />
                          )}
                        </label>
                      </div>
                    )}
                    
                    {/* Normal Modda Hover Efekti */}
                    {!isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                          <div className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 transition-all">
                            {uploadingAvatar ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                            ) : (
                              <Camera className="w-4 h-4 text-gray-700" />
                            )}
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-sm sm:text-xl lg:text-2xl font-bold mb-1 truncate">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-xs sm:text-base opacity-90 mb-1 flex items-center">
                      @{profile.username}
                      {profile.active_badge_icon && (
                        profile.active_badge_icon.endsWith('.svg') ? (
                          <img src={profile.active_badge_icon} alt="rozet" className="w-10 h-10 sm:w-12 sm:h-12 ml-0.5" />
                        ) : (
                          <span className="text-2xl sm:text-3xl ml-0.5">{profile.active_badge_icon}</span>
                        )
                      )}
                    </p>

                    {/* Avatar altında takipçi sayıları - tıklanabilir */}
                    <div className="flex items-center gap-3 text-xs sm:text-sm opacity-75 mb-2">
                      <button 
                        onClick={() => setShowFollowersModal(true)}
                        className="flex items-center gap-1 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
                      >
                        <span className="font-semibold">{profile.follower_count || 0}</span>
                        <span>Takipçi</span>
                      </button>
                      <button 
                        onClick={() => setShowFollowingModal(true)}
                        className="flex items-center gap-1 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
                      >
                        <span className="font-semibold">{profile.following_count || 0}</span>
                        <span>Takip</span>
                      </button>
                    </div>

                    {isEditing && (
                      <div className="mt-2 flex items-center gap-1 sm:gap-2">
                        <input
                          type="text"
                          value={formData.avatar_bg_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, avatar_bg_color: e.target.value }))}
                          className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm text-gray-900 placeholder:text-gray-500 w-16 sm:w-auto"
                          placeholder="#9c6cfe"
                        />
                        <div
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-md border border-gray-200"
                          style={{ background: formData.avatar_bg_color || '#9c6cfe' }}
                          title={formData.avatar_bg_color || '#9c6cfe'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {/* Sol Kolon - Profil Bilgileri */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-6">
            {/* Profil Bilgileri Kartı - Kartvizit Tasarımı */}
            <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border-2 border-[#9c6cfe]">
              {/* Düzenle Butonu - Sağ Üst Köşe */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#0ad2dd] to-[#0bc4cf] hover:from-[#0bc4cf] hover:to-[#0ad2dd] rounded-lg sm:rounded-xl transition-all flex items-center space-x-1 sm:space-x-2 font-medium shadow-lg hover:shadow-xl text-xs sm:text-sm"
                    >
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Düzenle</span>
                      <span className="sm:hidden">Düzenle</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">İptal</span>
                        <span className="sm:hidden">İptal</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg sm:rounded-xl hover:from-[#8b5cf6] hover:to-[#0bc4cf] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 font-medium shadow-lg hover:shadow-xl text-xs sm:text-sm"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Kaydet</span>
                            <span className="sm:hidden">Kaydet</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="relative px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5 md:px-10">
                {/* Kartvizit İçeriği */}
                <div className="bg-white rounded-xl">
                  {/* Başlık */}
                  <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Kullanıcı Bilgileri
                    </h2>
                    <button
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="Profil önizlemesi"
                    >
                      <Eye className={`w-4 h-4 text-gray-500 group-hover:text-[#9c6cfe] transition-colors ${isPreviewMode ? 'text-[#9c6cfe]' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Görünen Ad */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex items-center justify-center shadow-md">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Görünen Ad
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-sm sm:text-base font-medium"
                            placeholder="Görünen adınızı girin..."
                          />
                        ) : (
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {profile.display_name || profile.username || 'Belirtilmemiş'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Biyografi */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0ad2dd] to-[#0bc4cf] rounded-lg flex items-center justify-center shadow-md">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Biyografi
                          {isEditing && (
                            <span className="text-xs text-gray-400 ml-1 sm:ml-2 normal-case">
                              ({formData.bio.length}/500)
                            </span>
                          )}
                        </p>
                        {isEditing ? (
                          <div>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                              rows={3}
                              maxLength={500}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white resize-none text-sm sm:text-base"
                              placeholder="Kendinizi tanıtın..."
                            />
                            {formData.bio.length > 450 && (
                              <p className="text-xs text-orange-500 mt-1 sm:mt-2">
                                {500 - formData.bio.length} karakter kaldı
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                            {profile.bio || '----'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lokasyon */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Lokasyon
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-sm sm:text-base"
                            placeholder="Örn: İstanbul, Türkiye"
                          />
                        ) : (
                          <p className="text-gray-700 text-sm sm:text-base">
                            {profile.location || '----'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Meslek/Ünvan */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Meslek/Ünvan
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.job_title}
                            onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-sm sm:text-base"
                            placeholder="Örn: Frontend Developer, Yazılım Mühendisi..."
                          />
                        ) : (
                          <p className="text-gray-700 text-sm sm:text-base">
                            {profile.job_title || '-----'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Website
                        </p>
                        {isEditing ? (
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-sm sm:text-base"
                            placeholder="https://example.com"
                          />
                        ) : (
                          <>
                            {profile.website ? (
                              <a 
                                href={profile.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors break-all inline-flex items-center gap-1 text-sm sm:text-base"
                              >
                                {profile.website}
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                              </a>
                            ) : (
                              <p className="text-gray-700 text-sm sm:text-base">-------</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sosyal Medya Linkleri */}
                    {(isEditing || profile.github || profile.linkedin || profile.twitter || profile.instagram || profile.whatsapp || editingSocial.github || editingSocial.linkedin || editingSocial.twitter || editingSocial.instagram || editingSocial.whatsapp) && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 sm:mb-4">
                          Sosyal Medya
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {/* GitHub */}
                        {(isEditing || editingSocial.github || profile.github) && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Github className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                              <span className="text-xs font-medium text-gray-600">GitHub</span>
                            </div>
                            {!isEditing && !editingSocial.github && (
                              <button
                                onClick={() => {
                                  setEditingSocial(prev => ({ ...prev, github: true }));
                                  setTempSocialValues(prev => ({ ...prev, github: profile.github || '' }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-3 h-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {(isEditing || editingSocial.github) ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={isEditing ? formData.github : tempSocialValues.github}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setFormData(prev => ({ ...prev, github: e.target.value }));
                                  } else {
                                    setTempSocialValues(prev => ({ ...prev, github: e.target.value }));
                                  }
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm"
                                placeholder="kullaniciadi"
                              />
                              {!isEditing && tempSocialValues.github.trim() && (
                                <button
                                  onClick={() => {
                                    const value = tempSocialValues.github.trim();
                                    setFormData(prev => ({ ...prev, github: value }));
                                    setEditingSocial(prev => ({ ...prev, github: false }));
                                    if (!value) {
                                      setProfile(prev => prev ? { ...prev, github: null } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 bg-[#9c6cfe] text-white rounded hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Onayla
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {profile.github ? (
                                <a 
                                  href={`https://github.com/${profile.github}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors text-xs sm:text-sm break-all inline-flex items-center gap-1"
                                >
                                  @{profile.github}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-gray-500 text-xs italic">Eklenmemiş</p>
                              )}
                            </div>
                          )}
                          </div>
                        )}

                        {/* LinkedIn */}
                        {(isEditing || editingSocial.linkedin || profile.linkedin) && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                              <span className="text-xs font-medium text-gray-600">LinkedIn</span>
                            </div>
                            {!isEditing && !editingSocial.linkedin && (
                              <button
                                onClick={() => {
                                  setEditingSocial(prev => ({ ...prev, linkedin: true }));
                                  setTempSocialValues(prev => ({ ...prev, linkedin: profile.linkedin || '' }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-3 h-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {(isEditing || editingSocial.linkedin) ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={isEditing ? formData.linkedin : tempSocialValues.linkedin}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setFormData(prev => ({ ...prev, linkedin: e.target.value }));
                                  } else {
                                    setTempSocialValues(prev => ({ ...prev, linkedin: e.target.value }));
                                  }
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm"
                                placeholder="kullaniciadi"
                              />
                              {!isEditing && tempSocialValues.linkedin.trim() && (
                                <button
                                  onClick={() => {
                                    const value = tempSocialValues.linkedin.trim();
                                    setFormData(prev => ({ ...prev, linkedin: value }));
                                    setEditingSocial(prev => ({ ...prev, linkedin: false }));
                                    if (!value) {
                                      setProfile(prev => prev ? { ...prev, linkedin: null } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 bg-[#9c6cfe] text-white rounded hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Onayla
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {profile.linkedin ? (
                                <a 
                                  href={`https://linkedin.com/in/${profile.linkedin}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors text-xs sm:text-sm break-all inline-flex items-center gap-1"
                                >
                                  @{profile.linkedin}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-gray-500 text-xs italic">Eklenmemiş</p>
                              )}
                            </div>
                          )}
                          </div>
                        )}

                        {/* Instagram */}
                        {(isEditing || editingSocial.instagram || profile.instagram) && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span className="text-xs font-medium text-gray-600">Instagram</span>
                            </div>
                            {!isEditing && !editingSocial.instagram && (
                              <button
                                onClick={() => {
                                  setEditingSocial(prev => ({ ...prev, instagram: true }));
                                  setTempSocialValues(prev => ({ ...prev, instagram: profile.instagram || '' }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-3 h-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {(isEditing || editingSocial.instagram) ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={isEditing ? formData.instagram : tempSocialValues.instagram}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setFormData(prev => ({ ...prev, instagram: e.target.value }));
                                  } else {
                                    setTempSocialValues(prev => ({ ...prev, instagram: e.target.value }));
                                  }
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm"
                                placeholder="kullaniciadi"
                              />
                              {!isEditing && tempSocialValues.instagram.trim() && (
                                <button
                                  onClick={() => {
                                    const value = tempSocialValues.instagram.trim();
                                    setFormData(prev => ({ ...prev, instagram: value }));
                                    setEditingSocial(prev => ({ ...prev, instagram: false }));
                                    if (!value) {
                                      setProfile(prev => prev ? { ...prev, instagram: null } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 bg-[#9c6cfe] text-white rounded hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Onayla
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {profile.instagram ? (
                                <a 
                                  href={`https://instagram.com/${profile.instagram}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors text-xs sm:text-sm break-all inline-flex items-center gap-1"
                                >
                                  @{profile.instagram}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-gray-500 text-xs italic">Eklenmemiş</p>
                              )}
                            </div>
                          )}
                          </div>
                        )}

                        {/* WhatsApp */}
                        {(isEditing || editingSocial.whatsapp || profile.whatsapp) && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                            </div>
                            {!isEditing && !editingSocial.whatsapp && (
                              <button
                                onClick={() => {
                                  setEditingSocial(prev => ({ ...prev, whatsapp: true }));
                                  setTempSocialValues(prev => ({ ...prev, whatsapp: profile.whatsapp || '' }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-3 h-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {(isEditing || editingSocial.whatsapp) ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={isEditing ? formData.whatsapp : tempSocialValues.whatsapp}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setFormData(prev => ({ ...prev, whatsapp: e.target.value }));
                                  } else {
                                    setTempSocialValues(prev => ({ ...prev, whatsapp: e.target.value }));
                                  }
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm"
                                placeholder="telefon numarası"
                              />
                              {!isEditing && tempSocialValues.whatsapp.trim() && (
                                <button
                                  onClick={() => {
                                    const value = tempSocialValues.whatsapp.trim();
                                    setFormData(prev => ({ ...prev, whatsapp: value }));
                                    setEditingSocial(prev => ({ ...prev, whatsapp: false }));
                                    if (!value) {
                                      setProfile(prev => prev ? { ...prev, whatsapp: null } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 bg-[#9c6cfe] text-white rounded hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Onayla
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {profile.whatsapp ? (
                                <a 
                                  href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors text-xs sm:text-sm break-all inline-flex items-center gap-1"
                                >
                                  {profile.whatsapp}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-gray-500 text-xs italic">Eklenmemiş</p>
                              )}
                            </div>
                          )}
                          </div>
                        )}

                        {/* X (Twitter) */}
                        {(isEditing || editingSocial.twitter || profile.twitter) && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                              <span className="text-xs font-medium text-gray-600">X (Twitter)</span>
                            </div>
                            {!isEditing && !editingSocial.twitter && (
                              <button
                                onClick={() => {
                                  setEditingSocial(prev => ({ ...prev, twitter: true }));
                                  setTempSocialValues(prev => ({ ...prev, twitter: profile.twitter || '' }));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title="Düzenle"
                              >
                                <Edit3 className="w-3 h-3 text-gray-500" />
                              </button>
                            )}
                          </div>
                          {(isEditing || editingSocial.twitter) ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={isEditing ? formData.twitter : tempSocialValues.twitter}
                                onChange={(e) => {
                                  if (isEditing) {
                                    setFormData(prev => ({ ...prev, twitter: e.target.value }));
                                  } else {
                                    setTempSocialValues(prev => ({ ...prev, twitter: e.target.value }));
                                  }
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all bg-white text-xs sm:text-sm"
                                placeholder="kullaniciadi"
                              />
                              {!isEditing && tempSocialValues.twitter.trim() && (
                                <button
                                  onClick={() => {
                                    const value = tempSocialValues.twitter.trim();
                                    setFormData(prev => ({ ...prev, twitter: value }));
                                    setEditingSocial(prev => ({ ...prev, twitter: false }));
                                    if (!value) {
                                      setProfile(prev => prev ? { ...prev, twitter: null } : null);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 bg-[#9c6cfe] text-white rounded hover:bg-[#8b5cf6] transition-colors flex items-center justify-center gap-1 text-xs sm:text-sm"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Onayla
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {profile.twitter ? (
                                <a 
                                  href={`https://twitter.com/${profile.twitter}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors text-xs sm:text-sm break-all inline-flex items-center gap-1"
                                >
                                  @{profile.twitter}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <p className="text-gray-500 text-xs italic">Eklenmemiş</p>
                              )}
                            </div>
                          )}
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Davet Bağlantıları - Kullanıcı Bilgilerinin Altı */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button
                onClick={() => setIsInvitesExpanded(!isInvitesExpanded)}
                className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#9c6cfe] rounded-lg flex items-center justify-center">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Davet Bağlantıları</h3>
                    <p className="text-xs text-gray-600">Her davet başına 100 kredi kazanın. Bağlantılar 1 hafta geçerlidir.</p>
                  </div>
                </div>
                {isInvitesExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isInvitesExpanded && (
                <>
                  <div className="flex items-center justify-end mb-4">
                    <button
                      onClick={createInviteCode}
                      disabled={creatingInvite}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      {creatingInvite ? 'Oluşturuluyor...' : 'Yeni Davet'}
                    </button>
                  </div>

                  {/* Davet İstatistikleri */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                      <div className="text-xs text-gray-600 mb-1">Toplam Davet</div>
                      <div className="text-xl font-bold text-[#9c6cfe]">{totalInvites} kişi</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-xs text-gray-600 mb-1">Kazanılan Kredi</div>
                      <div className="text-xl font-bold text-emerald-600">{totalInviteCredits} kredi</div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                {inviteCodes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Henüz davet bağlantınız yok. Yeni bir davet bağlantısı oluşturun!
                  </p>
                ) : (
                  inviteCodes.map((invite) => (
                    <div
                      key={invite.id}
                      className={`p-3 rounded-lg border ${
                        invite.is_expired
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono font-bold text-[#9c6cfe]">
                              {invite.code}
                            </code>
                            {invite.is_expired && (
                              <span className="text-xs text-red-500 font-medium">Süresi Dolmuş</span>
                            )}
                            {!invite.is_expired && (
                              <span className="text-xs text-green-600 font-medium">Aktif</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{invite.usage_count} kişi kaydoldu</span>
                            <span>•</span>
                            <span>
                              {new Date(invite.expires_at).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        {!invite.is_expired && (
                          <button
                            onClick={() => copyInviteLink(invite.code)}
                            className="ml-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            title="Bağlantıyı Kopyala"
                          >
                            Kopyala
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                  </div>
                </>
              )}
            </div>

            {/* Rozetler Kartı */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <button
                onClick={() => setIsBadgesExpanded(!isBadgesExpanded)}
                className="w-full flex items-center justify-between mb-4 sm:mb-6 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rozetler</h2>
                </div>
                {isBadgesExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {isBadgesExpanded && (
                <>
                  {/* Mevcut Rozetlerim */}
                  <div className="mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">Mevcut Rozetlerim</h3>
                {badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {badges.map((badge) => (
                      <div key={badge.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all border border-gray-200">
                        <div className="flex flex-col items-center gap-3">
                          {/* Sadece rozet ikonu */}
                          {badge.icon?.endsWith('.svg') ? (
                            <img 
                              src={badge.icon!} 
                              alt={badge.name} 
                              className="w-14 h-14 sm:w-18 sm:h-18 lg:w-20 lg:h-20" 
                            />
                          ) : (
                            <span className="text-4xl sm:text-5xl lg:text-6xl">{badge.icon}</span>
                          )}
                          {/* Kullan butonu */}
                          <button
                            onClick={async () => {
                              if (!user?.id) return;
                              await (supabase as any)
                                .from('profiles')
                                .update({ active_badge_key: badge.id, active_badge_icon: badge.icon })
                                .eq('id', user.id);
                              fetchProfile();
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border ${profile?.active_badge_key === badge.id ? 'bg-[#9c6cfe] text-white border-[#9c6cfe]' : 'text-gray-600 hover:bg-gray-100 border-gray-300'}`}
                            title={profile?.active_badge_key === badge.id ? 'Aktif' : 'Kullan'}
                          >
                            {profile?.active_badge_key === badge.id ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-base leading-none">+</span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-500">Henüz rozet kazanmadınız</div>
                )}
              </div>

              {/* Rozet görevleri - frontend hesaplama (backend sonra eklenecek) */}
              {(() => {
                const topicsCount = userTopics.length;
                const totalTopicUseful = userTopics.reduce((sum, t) => sum + (t.useful_count || 0), 0);
                // Badge 1: Acil cevaplardan 100 cevap + 200 faydalı
                const urgentAnswers = urgentStats.answers;
                const urgentAnswersUseful = urgentStats.useful;
                const b1AnswersTarget = 100;
                const b1UsefulTarget = 200;
                const b1AnswersPct = Math.min(100, Math.floor((urgentAnswers / b1AnswersTarget) * 100));
                const b1UsefulPct = Math.min(100, Math.floor((urgentAnswersUseful / b1UsefulTarget) * 100));
                const b1Unlocked = twoFactorEnabled && urgentAnswers >= b1AnswersTarget && urgentAnswersUseful >= b1UsefulTarget;

                // Badge 2: 100 konu + toplam 200 faydalı
                const b2TopicPct = Math.min(1, topicsCount / 100);
                const b2UsefulPct = Math.min(1, totalTopicUseful / 200);
                const b2Pct = Math.floor(Math.min(1, Math.min(b2TopicPct, b2UsefulPct)) * 100);
                const b2Unlocked = twoFactorEnabled && topicsCount >= 100 && totalTopicUseful >= 200;

                // Badge 3: Toplam yüklenen kredi 25.000
                const totalLoaded = creditAccount?.total_earned || 0;
                const b3Target = 25000;
                const b3Pct = Math.min(100, Math.floor((totalLoaded / b3Target) * 100));
                const b3Unlocked = totalLoaded >= b3Target;
                
                // Debug için konsola yazdır
                console.log('Destekçi rozeti debug:', {
                  totalLoaded,
                  b3Target,
                  b3Pct,
                  b3Unlocked,
                  twoFactorEnabled,
                  creditAccount
                });

                // BadgeRow kaldırıldı: her rozet bloğu kendi içinde render ediliyor

                return (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Acil Cevap Ustası - Çift ilerleme çubuğu */}
                    <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${b1Unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <img src="/LOGO/header/rozet/acilcevap.svg" alt="Acil Cevap Ustası" className="w-20 h-20 sm:w-24 sm:h-24 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Acil Cevap Ustası</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] sm:text-xs font-medium ${b1Unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>{b1Unlocked ? 'Kazanıldı' : `${Math.min(100, Math.floor((b1AnswersPct + b1UsefulPct)/2))}%`}</span>
                            {b1Unlocked && !hasBadge('Acil Cevap Ustası') && (
                              <button
                                onClick={() => claimBadgeGeneric({ name: 'Acil Cevap Ustası', icon: '/LOGO/header/rozet/acilcevap.svg', description: 'Acil cevapta 100 cevap ve 200 faydalı', category: 'basari' })}
                                className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Al
                              </button>
                            )}
                            {b1Unlocked && hasBadge('Acil Cevap Ustası') && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-green-100 text-green-800 font-medium">
                                ✓ Alındı
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 mb-2 line-clamp-2">Acil cevap bölümünde 100 cevap yaz ve cevapların toplamda 200 kez faydalı bulunsun</p>
                        {/* Cevap adedi çubuğu */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 mb-1">
                            <span>Cevap Sayısı</span>
                            <span>{urgentAnswers}/{b1AnswersTarget}</span>
                          </div>
                          <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                            <div className={`${b1Unlocked ? 'bg-emerald-500' : 'bg-[#9c6cfe]'} h-full`} style={{ width: `${b1AnswersPct}%` }}></div>
                          </div>
                        </div>
                        {/* Faydalı sayısı çubuğu */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 mb-1">
                            <span>Faydalı Sayısı</span>
                            <span>{urgentAnswersUseful}/{b1UsefulTarget}</span>
                          </div>
                          <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                            <div className={`${b1Unlocked ? 'bg-emerald-500' : 'bg-[#9c6cfe]'} h-full`} style={{ width: `${b1UsefulPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Üretken ve Faydalı - Çift ilerleme çubuğu */}
                    <div className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${b2Unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <img src="/LOGO/header/rozet/üretkenvefaydali.svg" alt="Üretken ve Faydalı" className="w-20 h-20 sm:w-24 sm:h-24 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Üretken ve Faydalı</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] sm:text-xs font-medium ${b2Unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>{b2Unlocked ? 'Kazanıldı' : `${b2Pct}%`}</span>
                            {b2Unlocked && !hasBadge('Üretken ve Faydalı') && (
                              <button
                                onClick={() => claimBadgeGeneric({ name: 'Üretken ve Faydalı', icon: '/LOGO/header/rozet/üretkenvefaydali.svg', description: '100 konu + 200 faydalı', category: 'basari' })}
                                className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Al
                              </button>
                            )}
                            {b2Unlocked && hasBadge('Üretken ve Faydalı') && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-green-100 text-green-800 font-medium">
                                ✓ Alındı
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 mb-2 line-clamp-2">100 konu aç ve içeriklerin toplamda 200 kez faydalı bulunsun</p>
                        {/* Konu sayısı çubuğu */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 mb-1">
                            <span>Konu Sayısı</span>
                            <span>{topicsCount}/100</span>
                          </div>
                          <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                            <div className={`${b2Unlocked ? 'bg-emerald-500' : 'bg-[#9c6cfe]'} h-full`} style={{ width: `${Math.min(100, Math.floor(b2TopicPct * 100))}%` }}></div>
                          </div>
                        </div>
                        {/* Faydalı sayısı çubuğu */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600 mb-1">
                            <span>Faydalı Sayısı</span>
                            <span>{totalTopicUseful}/200</span>
                          </div>
                          <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                            <div className={`${b2Unlocked ? 'bg-emerald-500' : 'bg-[#9c6cfe]'} h-full`} style={{ width: `${Math.min(100, Math.floor(b2UsefulPct * 100))}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border ${b3Unlocked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                      <img src="/LOGO/header/rozet/destekci.svg" alt="Destekçi" className="w-20 h-20 sm:w-24 sm:h-24 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">Destekçi</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] sm:text-xs font-medium ${b3Unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>{b3Unlocked ? 'Kazanıldı' : `${b3Pct}%`}</span>
                            {b3Unlocked && !hasBadge('Destekçi') && (
                              <button
                                onClick={() => claimBadgeGeneric({ name: 'Destekçi', icon: '/LOGO/header/rozet/destekci.svg', description: 'Toplamda 25.000 kredi yükle', category: 'destek' })}
                                className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Al
                              </button>
                            )}
                            {b3Unlocked && hasBadge('Destekçi') && (
                              <span className="px-2 py-0.5 text-[10px] sm:text-xs rounded bg-green-100 text-green-800 font-medium">
                                ✓ Alındı
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-gray-600 mb-2 line-clamp-2">Toplamda 25.000 kredi yükle</p>
                        <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                          <div className={`${b3Unlocked ? 'bg-emerald-500' : 'bg-[#9c6cfe]'} h-full`} style={{ width: `${b3Unlocked ? 100 : b3Pct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* kazanılan rozetler burada artık yukarıda listeleniyor */}
                  </div>
                );
              })()}
                </>
              )}
            </div>

            {/* Görevler Kartı */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div 
                className="flex items-center justify-between cursor-pointer mb-4 sm:mb-6"
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Görevler</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {tasks.length} görev
                  </span>
                  {isTasksExpanded ? (
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  )}
                </div>
              </div>
              
              {/* Açılır Kapanır İçerik */}
              <div className={`transition-all duration-300 overflow-hidden ${
                isTasksExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {tasks.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {tasks.map((task) => {
                      const progress = taskProgress.find(p => p.task_id === task.id);
                      const isCompleted = progress?.is_completed || false;
                      const remainingCooldown = cooldownTimers[task.id] || 0;
                      const isOnCooldown = remainingCooldown > 0;
                      
                      // Günlük görevler için özel durum
                      const dailyTopicsStatus = getDailyTopicsTaskStatus(task);
                      const isDailyTopicsTask = dailyTopicsStatus !== null;
                      const dailyCommentsStatus = getDailyCommentsTaskStatus(task);
                      const isDailyCommentsTask = dailyCommentsStatus !== null;
                      
                      // Normal görevler için canComplete
                      const canComplete = !isCompleted || (task.is_repeatable && !isOnCooldown);
                      
                      return (
                        <div key={task.id} className={`rounded-md p-3 border transition-all ${
                          isCompleted && !isOnCooldown
                            ? 'bg-green-50 border-green-200' 
                            : isOnCooldown
                            ? 'bg-orange-50 border-orange-200'
                            : (isDailyTopicsTask && dailyTopicsStatus?.isCompleted) || (isDailyCommentsTask && dailyCommentsStatus?.isCompleted)
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                isCompleted && !isOnCooldown
                                  ? 'bg-green-500' 
                                  : isOnCooldown
                                  ? 'bg-orange-500'
                                  : (isDailyTopicsTask && dailyTopicsStatus?.isCompleted) || (isDailyCommentsTask && dailyCommentsStatus?.isCompleted)
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}>
                                {isCompleted && !isOnCooldown ? (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                ) : isOnCooldown ? (
                                  <Clock className="w-3 h-3 text-white" />
                                ) : (isDailyTopicsTask && dailyTopicsStatus?.isCompleted) || (isDailyCommentsTask && dailyCommentsStatus?.isCompleted) ? (
                                  isDailyTopicsTask ? <FileText className="w-3 h-3 text-white" /> : <MessageSquare className="w-3 h-3 text-white" />
                                ) : (
                                  <span className="text-sm">{task.icon}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-xs truncate">{task.title}</h3>
                                {task.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                                )}
                                
                                {/* Günlük konu açma görevi için özel bilgi */}
                                {isDailyTopicsTask && (
                                  <div className="mt-1">
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        dailyTopicsStatus?.isCompleted
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {dailyTopicsStatus?.todayTopicsCount || 0}/2 konu bugün
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Günlük yorum yapma görevi için özel bilgi */}
                                {isDailyCommentsTask && (
                                  <div className="mt-1">
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        dailyCommentsStatus?.isCompleted
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {dailyCommentsStatus?.todayCommentsCount || 0}/5 yorum bugün
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className="text-xs font-medium text-emerald-600">
                                    +{task.credit_reward}
                                  </span>
                                  {task.is_repeatable && !isOnCooldown && (
                                    <span className="text-xs text-gray-400 flex items-center">
                                      <Clock className="w-2 h-2 mr-0.5" />
                                      Tekrar
                                    </span>
                                  )}
                                  {isOnCooldown && (
                                    <span className="text-xs text-orange-600 font-mono flex items-center">
                                      <Clock className="w-2 h-2 mr-0.5" />
                                      {formatCooldown(remainingCooldown)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-1">
                              {isCompleted && !isOnCooldown && (
                                <div className="text-right">
                                  <p className="text-xs text-green-600 font-medium">✓</p>
                                  {progress?.completed_at && (
                                    <p className="text-xs text-gray-400">
                                      {new Date(progress.completed_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              )}
                              {isOnCooldown && (
                                <div className="text-right">
                                  <p className="text-xs text-orange-600 font-medium">Bekle</p>
                                  <p className="text-xs text-orange-500 font-mono">
                                    {formatCooldown(remainingCooldown)}
                                  </p>
                                </div>
                              )}
                              {isDailyTopicsTask && dailyTopicsStatus?.isCompleted && !isCompleted && !isOnCooldown && (
                                <div className="text-right">
                                  <p className="text-xs text-blue-600 font-medium">Hazır</p>
                                  <p className="text-xs text-blue-500">2 konu açıldı</p>
                                </div>
                              )}
                              {isDailyTopicsTask && !dailyTopicsStatus?.isCompleted && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 font-medium">Bekle</p>
                                  <p className="text-xs text-gray-400">
                                    {2 - (dailyTopicsStatus?.todayTopicsCount || 0)} konu daha
                                  </p>
                                </div>
                              )}
                              {isDailyCommentsTask && dailyCommentsStatus?.isCompleted && !isCompleted && !isOnCooldown && (
                                <div className="text-right">
                                  <p className="text-xs text-blue-600 font-medium">Hazır</p>
                                  <p className="text-xs text-blue-500">5 yorum yapıldı</p>
                                </div>
                              )}
                              {isDailyCommentsTask && !dailyCommentsStatus?.isCompleted && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 font-medium">Bekle</p>
                                  <p className="text-xs text-gray-400">
                                    {5 - (dailyCommentsStatus?.todayCommentsCount || 0)} yorum daha
                                  </p>
                                </div>
                              )}
                              {canComplete && !isDailyTopicsTask && !isDailyCommentsTask && (
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="px-2 py-1 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded text-xs font-medium hover:from-[#8b5cf6] hover:to-[#0bc4cf] transition-all"
                                >
                                  {isCompleted ? 'Tekrar' : 'Tamamla'}
                                </button>
                              )}
                              {(isDailyTopicsTask && dailyTopicsStatus?.canComplete && !isOnCooldown) || (isDailyCommentsTask && dailyCommentsStatus?.canComplete && !isOnCooldown) ? (
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                                >
                                  Ödül Al
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Henüz görev bulunmuyor</p>
                    <p className="text-gray-400 text-sm mt-2">Yakında yeni görevler eklenecek!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Açılan Konular Kartı */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5">
              <div 
                className="flex items-center justify-between cursor-pointer mb-3 sm:mb-4"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Açtığım Konular</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {userTopics.length} konu
                  </span>
                  {isTopicsExpanded ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  )}
                </div>
              </div>
              
              {/* Açılır Kapanır İçerik */}
              <div className={`transition-all duration-300 overflow-hidden ${
                isTopicsExpanded ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {userTopics.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {userTopics.map((topic) => (
                      <div key={topic.id} className="bg-gray-50 rounded-lg p-2.5 sm:p-3 hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1.5 line-clamp-2">
                              {topic.title}
                            </h3>
                            <div className="flex items-center space-x-3 text-[10px] sm:text-xs text-gray-500 mb-1.5">
                              <span className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{topic.view_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{topic.reply_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <ThumbsUp className="w-3 h-3" />
                                <span>{topic.useful_count}</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-gray-400 flex-wrap gap-1">
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                {topic.sub_category.main_category.name}
                              </span>
                              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                                {topic.sub_category.name}
                              </span>
                              <span>
                                {new Date(topic.created_at).toLocaleDateString('tr-TR', { 
                                  day: '2-digit', 
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => window.open(`/topic/${topic.slug}`, '_blank')}
                            className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0"
                            title="Konuyu yeni sekmede aç"
                          >
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">Henüz konu açmadınız</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">İlk konunuzu açarak topluluğa katkıda bulunun!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - İstatistikler */}
          <div className="space-y-4 sm:space-y-6">
            {/* 2 Adımlı Doğrulama Kartı */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <button
                onClick={() => setIsTwoFactorExpanded(!isTwoFactorExpanded)}
                className="w-full flex items-center justify-between mb-3 sm:mb-4 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">2 Adımlı Doğrulama</h2>
                </div>
                {isTwoFactorExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {isTwoFactorExpanded && (
                <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${emailVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">E-posta Doğrulama</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                    <span className={`text-xs font-medium ${emailVerified ? 'text-emerald-700' : 'text-gray-500'}`}>{emailVerified ? 'Doğrulandı' : 'Bekliyor'}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${phoneVerified ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Telefon Doğrulama</p>
                      <p className="text-xs text-gray-600">(Yakında) SMS ile doğrula</p>
                    </div>
                    {phoneVerified ? (
                      <span className="text-xs font-medium text-emerald-700">Doğrulandı</span>
                    ) : (
                      <button
                        className="px-3 py-1.5 text-xs rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                        title="Yakında"
                        onClick={() => setPhoneVerified(true)}
                      >
                        Kod Gönder (yakında)
                      </button>
                    )}
                  </div>
                </div>
                <div className={`p-2 rounded-md text-center text-xs ${twoFactorEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-gray-600 bg-gray-50'}`}>
                  Durum: {twoFactorEnabled ? '2 adımlı doğrulama tamamlandı' : 'Rozetler için 2 adımlı doğrulama şart'}
                </div>
                </div>
              )}
            </div>

            {/* İstatistikler Kartı */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="w-full flex items-center justify-between mb-3 sm:mb-4 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">İstatistikler</h2>
                </div>
                {isStatsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {isStatsExpanded && (
                <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2.5 sm:p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Reputation</span>
                        <p className="text-xs text-gray-600">Topluluk puanınız</p>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-yellow-600">{profile.reputation}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Gönderiler</span>
                        <p className="text-xs text-gray-600">Açtığınız konular</p>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">{userTopics.length}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowFollowersModal(true)}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 sm:p-3 border border-purple-200 hover:shadow-md transition-all w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Takipçi</span>
                        <p className="text-xs text-gray-600">Sizi takip edenler</p>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">{profile.follower_count || 0}</span>
                  </div>
                </button>

                <button 
                  onClick={() => setShowFollowingModal(true)}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2.5 sm:p-3 border border-green-200 hover:shadow-md transition-all w-full"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Takip</span>
                        <p className="text-xs text-gray-600">Takip ettikleriniz</p>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{profile.following_count || 0}</span>
                  </div>
                </button>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2.5 sm:p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Yorumlar</span>
                        <p className="text-xs text-gray-600">Yazdığınız cevaplar</p>
                      </div>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">{userComments.length}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 sm:p-3 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Katılma Tarihi</span>
                        <p className="text-xs text-gray-600">Topluluğa katıldığınız tarih</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-purple-600">
                        {new Date(profile.joined_at).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(profile.joined_at).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kredi Bakiyesi */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2.5 sm:p-3 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">Kredi Bakiyesi</span>
                        <p className="text-xs text-gray-600">Mevcut kredileriniz</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                        {creditAccount?.balance || 0}
                      </span>
                      <p className="text-xs text-gray-500">
                        {creditAccount?.total_earned || 0} toplam kazanılan
                      </p>
                    </div>
                  </div>
                </div>

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mesaj Bildirimi */}
        {saveMessage && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
            saveMessage.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-3">
              {saveMessage.type === 'success' ? (
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <span className="font-medium">{saveMessage.text}</span>
              <button
                onClick={() => setSaveMessage(null)}
                className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        {/* Crop Modal */}
        {showCropModal && imageToCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Header Fotoğrafını Düzenle</h3>
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setImageToCrop(null);
                    setOriginalFile(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Crop Area */}
              <div className="relative h-96 bg-gray-100">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 6}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="p-4 space-y-4 border-t border-gray-200">
                {/* Zoom Slider */}
                <div className="flex items-center gap-4">
                  <ZoomOut className="w-5 h-5 text-gray-600" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-600" />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCropModal(false);
                      setImageToCrop(null);
                      setOriginalFile(null);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCropSave}
                    disabled={uploadingHeaderMedia}
                    className="px-6 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:from-[#8b5cf6] hover:to-[#0bc4cf] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingHeaderMedia ? 'Yükleniyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Takipçi Modal'ları */}
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={user?.id || ''}
          type="followers"
          title="Takipçilerim"
          onViewProfile={onViewProfile}
        />

        <FollowersModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          userId={user?.id || ''}
          type="following"
          title="Takip Ettiklerim"
          onViewProfile={onViewProfile}
        />

        {/* Rozet Kazanma Modalı */}
        {earnedBadge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEarnedBadge(null)}>
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                {earnedBadge.icon && (
                  <div className="mb-4">
                    {earnedBadge.icon.endsWith('.svg') ? (
                      <img src={earnedBadge.icon} alt={earnedBadge.name} className="w-32 h-32 mx-auto" />
                    ) : (
                      <span className="text-6xl">{earnedBadge.icon}</span>
                    )}
                  </div>
                )}
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tebrikler! 🎉</h2>
                <p className="text-xl text-gray-700 mb-1">{earnedBadge.name} rozetini kazandınız!</p>
                <p className="text-gray-600">Rozet profilinize eklendi.</p>
              </div>
              <button
                onClick={() => setEarnedBadge(null)}
                className="px-8 py-3 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:from-[#8b5cf6] hover:to-[#0bc4cf] transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Harika!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}