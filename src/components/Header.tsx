'use client';

import { Search, LogOut, Plus, Bell, Coins, X, Check, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LogoHeader } from './LogoHeader';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

interface HeaderProps {
  onMenuClick: () => void;
  onShowAuth: (mode: 'login' | 'register') => void;
  onShowNewTopic: () => void;
  onShowProfile: () => void;
  onGoHome: () => void;
  onTopicClick?: (topicId: string) => void;
  onShowMessages?: (conversationId?: string) => void;
}

interface CreditAccount {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface SearchResult {
  id: string;
  title: string;
  author: {
    display_name: string;
    username: string;
  };
  sub_category: {
    name: string;
    color: string;
  };
}

export function Header({ onMenuClick, onShowAuth, onShowNewTopic, onShowProfile, onGoHome, onTopicClick, onShowMessages }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Database['public']['Tables']['notifications']['Row'][]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCreditAccount();
      fetchProfileAvatar();
      loadNotifications();
    } else {
      setCreditAccount(null);
      setProfileAvatarUrl(null);
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    }
  }, [user]);

  // Bildirim container'ının dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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
        if (error.code === 'PGRST116') {
          setCreditAccount({ 
            id: user.id, 
            user_id: user.id, 
            balance: 0, 
            total_earned: 0, 
            total_spent: 0 
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
        id: user.id, 
        user_id: user.id, 
        balance: 0, 
        total_earned: 0, 
        total_spent: 0 
      });
    }
  };

  const searchTopics = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          author:profiles!topics_author_id_fkey(display_name, username),
          sub_category:sub_categories(name, color)
        `)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (error) throw error;
      
      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchProfileAvatar = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (error) return;
      setProfileAvatarUrl((data as any)?.avatar_url || null);
    } catch (e) {
      // ignore
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchTopics(query);
  };

  const handleTopicClick = (topicId: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (onTopicClick) {
      onTopicClick(topicId);
    }
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setNotifications((data as any) || []);

      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (!countError) setUnreadCount(count || 0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bildirimler yüklenemedi:', e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (id: string, link?: string | null) => {
    if (!user?.id) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)) as Database['public']['Tables']['notifications']['Row'][]);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Bildirim linkini işle
      if (link) {
        // Mesaj bildirimleri için özel işlem
        if (link.startsWith('/messages')) {
          if (onShowMessages) {
            // Konuşma ID'sini URL'den çıkar
            const conversationMatch = link.match(/conversation=([a-f0-9-]{36})/);
            const conversationId = conversationMatch ? conversationMatch[1] : undefined;
            onShowMessages(conversationId);
          }
          return;
        }
        
        // /topic/[topic_id] formatındaki linkleri yakala
        const topicMatch = link.match(/\/topic\/([a-f0-9-]{36})/);
        if (topicMatch && onTopicClick) {
          const topicId = topicMatch[1];
          onTopicClick(topicId);
        } else {
          // Diğer linkler için normal yönlendirme
          window.location.href = link;
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bildirim okundu işaretlenemedi:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })) as Database['public']['Tables']['notifications']['Row'][]);
      setUnreadCount(0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bildirimler okundu işaretlenemedi:', e);
    }
  };

  return (
    <>
      {/* Desktop Logo Header */}
      <div className="hidden lg:block">
        <LogoHeader onMenuClick={onMenuClick} onGoHome={onGoHome} />
      </div>
      
      {/* Ana Navbar */}
      <header className="bg-white border-b border-gray-300 fixed top-0 left-0 right-0 z-50 lg:ml-64">
        {/* Mobil: Logo + Menü Butonu + Kullanıcı */}
        <div className="flex lg:hidden items-center justify-between h-16 px-3">
          {/* Sol: Hamburger Menü */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Orta: Logo */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
            }}
            className="flex-1 flex items-center justify-center mx-2"
          >
            <img 
              src="/logo.svg" 
              alt="DevForum Logo" 
              className="h-10 object-contain"
            />
          </a>

          {/* Anasayfa Linki */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
            }}
            className="px-3 py-2 text-gray-700 hover:text-[#9c6cfe] font-medium text-xs transition-colors"
          >
            Anasayfa
          </a>

          {/* Sağ: Kullanıcı Menüsü */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <button
                  onClick={onShowNewTopic}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm h-10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Konu</span>
                </button>

                <button
                  onClick={onShowProfile}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold ring-2 ring-white border border-gray-200">
                      {(user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email || 'U')
                        .toString()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5 text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onShowAuth('login')}
                  className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Giriş
                </button>
                <button
                  onClick={() => onShowAuth('register')}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                >
                  Kayıt
                </button>
              </>
            )}
          </div>
        </div>

        {/* Desktop: Arama + Kullanıcı Menüsü */}
        <div className="hidden lg:flex h-20 items-center">
          {/* Anasayfa Linki */}
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onGoHome();
            }}
            className="px-4 py-2 text-gray-700 hover:text-[#9c6cfe] font-medium text-sm transition-colors"
          >
            Anasayfa
          </a>
          
          {/* Desktop arama çubuğu */}
          <div className="flex-1 max-w-2xl mx-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Forumlarda ara..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9c6cfe] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Arama Sonuçları */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9c6cfe]"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleTopicClick(result.id)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {result.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">
                                  {result.author.display_name || result.author.username}
                                </span>
                                <span 
                                  className="text-xs px-2 py-1 rounded-full text-white"
                                  style={{ backgroundColor: result.sub_category.color }}
                                >
                                  {result.sub_category.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      Arama sonucu bulunamadı
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Kullanıcı menüsü */}
          <div className="flex items-center gap-2 px-4">
            {user ? (
              <>
                {/* Kredi Bakiyesi */}
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold text-sm">
                    {creditAccount?.balance || 0}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      if (!showNotifications) loadNotifications();
                      setShowNotifications(v => !v);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                    title="Bildirimler"
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] leading-[18px] rounded-full text-center font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div ref={notificationRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">Bildirimler</span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Hepsini okundu yap
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#9c6cfe]"></div>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-gray-500 text-center">Bildirim yok</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => markNotificationRead(n.id, n.link)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${n.is_read ? 'bg-white' : 'bg-indigo-50/50'}`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.is_read && <span className="mt-1 w-2 h-2 bg-[#9c6cfe] rounded-full"></span>}
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</div>
                                  {n.body && <div className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.body}</div>}
                                  <div className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={onShowNewTopic}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Konu</span>
                </button>

                <button
                  onClick={onShowProfile}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Profilim"
                >
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold ring-2 ring-white border border-gray-200">
                      {(user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email || 'U')
                        .toString()
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-5 h-5 text-gray-700" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onShowAuth('login')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Giriş
                </button>
                <button
                  onClick={() => onShowAuth('register')}
                  className="px-4 py-2 bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white rounded-lg hover:shadow-lg transition-all font-medium"
                >
                  Kayıt Ol
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
