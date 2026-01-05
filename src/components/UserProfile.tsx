'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FollowersModal } from './FollowersModal';
import { useToast } from './Toast';
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
  ArrowLeft,
  AlertCircle,
  Coins,
  Send,
  X,
  ExternalLink,
  MapPin,
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
  follower_count?: number;
  following_count?: number;
  active_badge_icon?: string | null;
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

interface UserProfileProps {
  userId: string;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
  onShowAuth?: () => void;
}

export function UserProfile({ userId, onBack, onViewProfile, onShowAuth }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const { addToast, ToastContainer } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchBadges();
      fetchCreditAccount();
      if (currentUser) {
        checkFollowStatus();
      }
    }
  }, [userId, currentUser]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Kullanıcı profili bulunamadı');
        } else {
          throw error;
        }
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      setError('Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
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
        .eq('user_id', userId)
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

  const fetchCreditAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credit_accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // 406 hatası veya tablo bulunamadı hatası için varsayılan değer
        if (error.code === 'PGRST116' || (error as any).status === 406) {
          setCreditAccount({ 
            id: '', 
            user_id: userId, 
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
        user_id: userId, 
        balance: 0, 
        total_earned: 0, 
        total_spent: 0, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      });
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !userId || currentUser.id === userId) return;
    
    try {
      const { data, error } = await (supabase as any).rpc<any>('is_following', {
        p_follower_id: currentUser.id,
        p_following_id: userId
      });

      if (error) throw error;
      setIsFollowing(data || false);
    } catch (error) {
      console.error('Takip durumu kontrol edilirken hata:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Takibi bırak
        const { error } = await (supabase as any).rpc<any>('unfollow_user', {
          p_follower_id: currentUser.id,
          p_following_id: userId
        });

        if (error) throw error;
        setIsFollowing(false);
        
        // Profil sayaçlarını güncelle
        if (profile) {
          setProfile({
            ...profile,
            follower_count: Math.max(0, (profile.follower_count || 0) - 1)
          });
        }
      } else {
        // Takip et
        const { error } = await (supabase as any).rpc<any>('follow_user', {
          p_follower_id: currentUser.id,
          p_following_id: userId
        });

        if (error) throw error;
        setIsFollowing(true);
        
        // Profil sayaçlarını güncelle
        if (profile) {
          setProfile({
            ...profile,
            follower_count: (profile.follower_count || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !userId || !messageContent.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const { error } = await (supabase as any).rpc<any>('send_message', {
        p_sender_id: currentUser.id,
        p_receiver_id: userId,
        p_content: messageContent.trim()
      });

      if (error) throw error;
      
      setMessageContent('');
      setShowMessageModal(false);
      addToast({
        type: 'success',
        title: 'Mesaj Gönderildi',
        message: 'Mesajınız başarıyla gönderildi!'
      });
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      addToast({
        type: 'error',
        title: 'Mesaj Gönderilemedi',
        message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
      });
    } finally {
      setSendingMessage(false);
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profil Bulunamadı</h1>
          <p className="text-gray-600 mb-4">{error || 'Kullanıcı profili bulunamadı.'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <>
      <div className="min-h-screen bg-white py-1 sm:py-4">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Header Card */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl border border-gray-200 mb-2 sm:mb-8">
          <div className="bg-white rounded-md sm:rounded-xl overflow-hidden border border-gray-200">
          <div className={`${profile.header_media ? '' : 'bg-gradient-to-r from-[#9c6cfe] via-[#8b5cf6] to-[#0ad2dd]'} p-3 sm:p-8 text-white relative min-h-[180px] sm:min-h-[350px]`}>
            {/* Geri Tuşu - Header içinde */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30">
              <button
                onClick={onBack}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white rounded-md sm:rounded-lg transition-all duration-200 group shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm sm:text-base font-medium">Geri</span>
              </button>
            </div>
            {/* Header Medya Arka Planı */}
            <div className="absolute inset-0 z-0">
              {profile.header_media ? (
                profile.header_media.includes('.mp4') || profile.header_media.includes('.webm') || profile.header_media.includes('.mov') ? (
                  <video
                    src={profile.header_media}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={profile.header_media}
                    alt="Header Background"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                // Varsayılan header videosu
                <video
                  src="/header-video-2.mp4"
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
            </div>
            
            {/* Avatar ve bilgiler - Header içinde sol alt köşe */}
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-30">
              <div
                className="px-2 sm:px-3 py-0 sm:py-2 rounded-lg sm:rounded-xl shadow-lg flex items-center space-x-2 sm:space-x-2.5 max-w-[calc(100vw-4rem)] sm:max-w-full"
                style={{ background: profile.avatar_bg_color || '#6b21a8' }}
              >
                <div className="relative group flex-shrink-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl ring-2 ring-white ring-opacity-80 border-2 border-white transition-all">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400" />
                    )}
                  </div>
                  {/* Online durumu */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0 sm:gap-1 mt-1 sm:mt-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xs sm:text-base lg:text-lg font-bold truncate text-white">
                      {profile.display_name || profile.username}
                    </h1>
                    <p className="text-[10px] sm:text-xs opacity-90 flex items-center text-white">
                      @{profile.username}
                      {profile.active_badge_icon && (
                        profile.active_badge_icon.endsWith('.svg') ? (
                          <img src={profile.active_badge_icon} alt="rozet" className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5" />
                        ) : (
                          <span className="text-sm sm:text-base ml-0.5">{profile.active_badge_icon}</span>
                        )
                      )}
                    </p>
                  </div>
                  {/* Takipçi sayıları */}
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs opacity-75 mt-0.5 sm:mt-0">
                    <button 
                      onClick={() => setShowFollowersModal(true)}
                      className="flex items-center gap-1 hover:bg-white/10 rounded px-2 py-0 sm:py-0.5 transition-colors text-white"
                    >
                      <span className="font-bold">{profile.follower_count || 0}</span>
                      <span className="text-white/80">Takipçi</span>
                    </button>
                    <button 
                      onClick={() => setShowFollowingModal(true)}
                      className="flex items-center gap-1 hover:bg-white/10 rounded px-2 py-0 sm:py-0.5 transition-colors text-white"
                    >
                      <span className="font-bold">{profile.following_count || 0}</span>
                      <span className="text-white/80">Takip</span>
                    </button>
                  </div>

                  {/* Aksiyon butonları - Alt satırda */}
                  {currentUser && currentUser.id !== userId && (
                    <div className="flex items-center gap-1">
                      {/* Mesaj Butonu */}
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            onShowAuth?.();
                            return;
                          }
                          setShowMessageModal(true);
                        }}
                        className="flex flex-row items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 rounded font-medium transition-all text-xs sm:text-sm shadow-md bg-white text-[#9c6cfe] hover:bg-gray-50 border border-[#9c6cfe]/50 hover:border-[#9c6cfe]"
                        style={isMobile ? {
                          transform: 'scaleY(0.4)', 
                          transformOrigin: 'center', 
                          width: '70px', 
                          overflow: 'hidden'
                        } : {
                          minWidth: '90px'
                        }}
                      >
                        <span style={isMobile ? {
                          transform: 'scaleY(2.5)', 
                          display: 'inline-block', 
                          lineHeight: '1', 
                          whiteSpace: 'nowrap'
                        } : {
                          display: 'inline-block'
                        }}>Mesaj</span>
                      </button>

                      {/* Takip Butonu */}
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex flex-row items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 rounded font-medium transition-all text-xs sm:text-sm shadow-md border ${
                          isFollowing
                            ? 'bg-white text-[#9c6cfe] hover:bg-gray-50 border-[#9c6cfe]/50 hover:border-[#9c6cfe]'
                            : 'bg-white text-[#9c6cfe] hover:bg-gray-50 border-[#9c6cfe]/50 hover:border-[#9c6cfe]'
                        } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={isMobile ? {
                          transform: 'scaleY(0.4)', 
                          transformOrigin: 'center', 
                          minWidth: '70px', 
                          overflow: 'hidden'
                        } : {
                          minWidth: '110px'
                        }}
                      >
                        {followLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[#9c6cfe] flex-shrink-0" style={isMobile ? {
                            transform: 'scaleY(2.5)'
                          } : {}}></div>
                        ) : (
                          <span style={isMobile ? {
                            transform: 'scaleY(2.5)', 
                            display: 'inline-block', 
                            lineHeight: '1', 
                            whiteSpace: 'nowrap'
                          } : {
                            display: 'inline-block'
                          }}>{isFollowing ? '- Bırak' : '+ Takip Et'}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 py-8">
          {/* Sol Kolon - Profil Bilgileri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profil Bilgileri Kartı - Kartvizit Tasarımı */}
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#9c6cfe]">
              <div className="relative px-8 py-4 md:px-10 md:py-6">
                {/* Kartvizit İçeriği */}
                <div className="bg-white rounded-xl">
                  {/* Başlık */}
                  <div className="mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Kullanıcı Bilgileri
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Görünen Ad */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-lg flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Görünen Ad
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {profile.display_name || profile.username || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>

                    {/* Biyografi */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#0ad2dd] to-[#0bc4cf] rounded-lg flex items-center justify-center shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Biyografi
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          {profile.bio || '----'}
                        </p>
                      </div>
                    </div>

                    {/* Lokasyon */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Lokasyon
                        </p>
                        <p className="text-gray-700">
                          {profile.location || '----'}
                        </p>
                      </div>
                    </div>

                    {/* Meslek/Ünvan */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-md">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Meslek/Ünvan
                        </p>
                        <p className="text-gray-700">
                          {profile.job_title || '-----'}
                        </p>
                      </div>
                    </div>

                    {/* Website */}
                    {profile.website && (
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Website
                          </p>
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#9c6cfe] hover:text-[#8b5cf6] font-medium transition-colors break-all inline-flex items-center gap-1"
                          >
                            {profile.website}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Sosyal Medya Linkleri */}
                    {(profile.github || profile.linkedin || profile.twitter || profile.instagram || profile.whatsapp) && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                          Sosyal Medya
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* GitHub */}
                          {profile.github && (
                            <a 
                              href={`https://github.com/${profile.github}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                              <Github className="w-5 h-5 text-gray-700 group-hover:text-[#9c6cfe] transition-colors" />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-[#9c6cfe] transition-colors">
                                @{profile.github}
                              </span>
                            </a>
                          )}

                          {/* LinkedIn */}
                          {profile.linkedin && (
                            <a 
                              href={`https://linkedin.com/in/${profile.linkedin}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                              <Linkedin className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                @{profile.linkedin}
                              </span>
                            </a>
                          )}

                          {/* Instagram */}
                          {profile.instagram && (
                            <a 
                              href={`https://instagram.com/${profile.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                              <svg className="w-5 h-5 text-pink-600 group-hover:text-pink-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                                @{profile.instagram}
                              </span>
                            </a>
                          )}

                          {/* WhatsApp */}
                          {profile.whatsapp && (
                            <a 
                              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                              <svg className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                {profile.whatsapp}
                              </span>
                            </a>
                          )}

                          {/* X (Twitter) */}
                          {profile.twitter && (
                            <a 
                              href={`https://twitter.com/${profile.twitter}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                              <Twitter className="w-5 h-5 text-blue-400 group-hover:text-blue-500 transition-colors" />
                              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-400 transition-colors">
                                @{profile.twitter}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rozetler Kartı */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Rozetler</h2>
              </div>
              
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badges.map((badge) => (
                    <div key={badge.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all border border-gray-200">
                      <div className="text-3xl">
                        {badge.icon?.endsWith('.svg') ? (
                          <img 
                            src={badge.icon!} 
                            alt="rozet" 
                            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto" 
                          />
                        ) : (
                          <span className="text-4xl sm:text-5xl lg:text-6xl">{badge.icon}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Henüz rozet kazanmamış</p>
                  <p className="text-gray-400 text-sm mt-2">Aktif olun ve rozetler kazanmaya başlayın!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon - İstatistikler */}
          <div className="space-y-6">
            {/* İstatistikler Kartı */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">İstatistikler</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">Reputation</span>
                        <p className="text-xs text-gray-600">Topluluk puanı</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">{profile.reputation}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">Gönderiler</span>
                        <p className="text-xs text-gray-600">Açtığı konular</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{profile.total_posts}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">Yorumlar</span>
                        <p className="text-xs text-gray-600">Yazdığı cevaplar</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{profile.total_comments}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">Katılma Tarihi</span>
                        <p className="text-xs text-gray-600">Topluluğa katıldığı tarih</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-purple-600">
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

                {/* Kredi Bakiyesi - Sadece kendi profili için göster */}
                {isOwnProfile && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Coins className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">Kredi Bakiyesi</span>
                          <p className="text-xs text-gray-600">Mevcut kredileriniz</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-emerald-600">
                          {creditAccount?.balance || 0}
                        </span>
                        <p className="text-xs text-gray-500">
                          {creditAccount?.total_earned || 0} toplam kazanılan
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Takipçi Modal'ları */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
        type="followers"
        title={`${profile?.display_name || profile?.username || ''} - Takipçiler`}
        onViewProfile={onViewProfile}
      />

      <FollowersModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={userId}
        type="following"
        title={`${profile?.display_name || profile?.username || ''} - Takip Ettikleri`}
        onViewProfile={onViewProfile}
      />

      {/* Mesaj Gönderme Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.display_name || profile?.username} ile Mesajlaş
              </h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesajınız
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent resize-none"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {messageContent.length}/1000
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendingMessage}
                  className="flex-1 px-4 py-2 bg-[#9c6cfe] text-white rounded-lg hover:bg-[#8b5cf6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Gönder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
}