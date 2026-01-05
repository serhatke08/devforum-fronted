'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
  onViewProfile?: (userId: string) => void;
}

interface FollowerUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
  followed_at: string;
}

export function FollowersModal({ isOpen, onClose, userId, type, title, onViewProfile }: FollowersModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadUsers();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, userId, type]);

  // Modal dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const functionName = type === 'followers' ? 'get_user_followers' : 'get_user_following';
      const { data, error } = await (supabase as any).rpc<any>(functionName, {
        p_user_id: userId,
        p_limit: 50,
        p_offset: 0
      });

      if (error) throw error;

      setUsers(data || []);

      // Eğer giriş yapmış kullanıcı varsa, takip durumlarını kontrol et
      if (currentUser && data) {
        const statusPromises = data.map(async (user: FollowerUser) => {
          if (user.id === currentUser.id) return { id: user.id, isFollowing: false };
          
          try {
            const { data: isFollowing } = await (supabase as any).rpc<any>('is_following', {
              p_follower_id: currentUser.id,
              p_following_id: user.id
            });
            
            return { id: user.id, isFollowing: isFollowing || false };
          } catch {
            return { id: user.id, isFollowing: false };
          }
        });

        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, { id, isFollowing }) => {
          acc[id] = isFollowing;
          return acc;
        }, {} as Record<string, boolean>);

        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Kullanıcı listesi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser || targetUserId === currentUser.id) return;
    
    setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const isFollowing = followingStatus[targetUserId];
      
      if (isFollowing) {
        // Takibi bırak
        const { error } = await (supabase as any).rpc<any>('unfollow_user', {
          p_follower_id: currentUser.id,
          p_following_id: targetUserId
        });

        if (error) throw error;
        
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
        
        // Kullanıcının takipçi sayısını güncelle
        setUsers(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, follower_count: Math.max(0, user.follower_count - 1) }
            : user
        ));
      } else {
        // Takip et
        const { error } = await (supabase as any).rpc<any>('follow_user', {
          p_follower_id: currentUser.id,
          p_following_id: targetUserId
        });

        if (error) throw error;
        
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
        
        // Kullanıcının takipçi sayısını güncelle
        setUsers(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, follower_count: user.follower_count + 1 }
            : user
        ));
      }
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6cfe]"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
                {type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimseyi takip etmiyor'}
              </p>
            </div>
          ) : (
            <div className="p-2 sm:p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {users.map((user) => {
                  const handleProfileClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (onViewProfile) {
                      onViewProfile(user.id);
                      setTimeout(() => {
                        onClose();
                      }, 100);
                    }
                  };

                  return (
                    <div 
                      key={user.id} 
                      className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-[#9c6cfe] hover:shadow-md transition-all cursor-pointer group"
                      onClick={handleProfileClick}
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <button
                          onClick={handleProfileClick}
                          className="flex-shrink-0 hover:opacity-80 transition-opacity mb-2"
                        >
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="Avatar" 
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#9c6cfe] transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#9c6cfe] to-[#0ad2dd] rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-[#9c6cfe] transition-colors">
                              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                          )}
                        </button>

                        {/* Kullanıcı bilgileri */}
                        <div className="w-full mb-2">
                          <button
                            onClick={handleProfileClick}
                            className="font-semibold text-xs sm:text-sm text-gray-900 hover:text-[#9c6cfe] transition-colors cursor-pointer block truncate w-full"
                          >
                            {user.display_name || user.username}
                          </button>
                          <button
                            onClick={handleProfileClick}
                            className="text-[10px] sm:text-xs text-gray-500 hover:text-[#9c6cfe] transition-colors cursor-pointer block truncate w-full mt-0.5"
                          >
                            @{user.username}
                          </button>
                        </div>

                        {/* İstatistikler */}
                        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-600 mb-2 w-full">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-gray-900">{user.follower_count}</span>
                            <span className="text-gray-500">takipçi</span>
                          </div>
                          <div className="w-px h-6 bg-gray-300"></div>
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-gray-900">{user.following_count}</span>
                            <span className="text-gray-500">takip</span>
                          </div>
                        </div>

                        {/* Takip butonu */}
                        {currentUser && currentUser.id !== user.id && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFollow(user.id);
                            }}
                            disabled={followLoading[user.id]}
                            className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md font-medium transition-all text-[10px] sm:text-xs ${
                              followingStatus[user.id]
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-gradient-to-r from-[#9c6cfe] to-[#0ad2dd] text-white hover:shadow-lg'
                            } ${followLoading[user.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {followLoading[user.id] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            ) : followingStatus[user.id] ? (
                              <>
                                <UserMinus className="w-3 h-3" />
                                <span className="hidden sm:inline">Bırak</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                <span className="hidden sm:inline">Takip</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            {users.length} {type === 'followers' ? 'takipçi' : 'takip edilen'}
          </p>
        </div>
      </div>
    </div>
  );
}
